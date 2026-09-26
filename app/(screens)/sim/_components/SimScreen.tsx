"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

import { PatientQr, qrCaption, usePatientUrl } from "@/components/PatientQr";
import { StandIn } from "@/components/StandIn";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { playBeats } from "@/components/data/replay";
import { ModeBadge } from "@/components/ModeBadge";
import { WEEK_SUMMARY, isWeekCase } from "@/components/data/catalog";
import { useEvents } from "@/components/data/useEvents";
import type { Beat } from "@/components/data/types";

import { BeatDetail } from "./BeatDetail";
import { BeatRow, type BeatState } from "./BeatRow";
import { beatRange, beatSummary } from "./labels";

const FLASH_MS = 1500;
const RESET_CONFIRM_MS = 4000;

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {children}
    </kbd>
  );
}

/** Operator console: the scripted run on the left, controls and the selected beat on the right. */
export function SimScreen() {
  const { mode, ready, busy, canFire, canSeed, seedWeek, script, beats, fired, firedIds, cases, catalog, fire, reset } =
    useEvents();
  // The seeded week (6.1) is background history; the run counts Maria and James only.
  const scriptFired = fired.filter((e) => !isWeekCase(e.case_id)).length;
  const weekSeeded = fired.some((e) => isWeekCase(e.case_id));
  const { url: patientUrl, local } = usePatientUrl();

  const caseById = new Map(cases.map((c) => [c.id, c]));
  const who = (b: Beat) => {
    const c = caseById.get(b.case_id);
    return c ? `${c.patient.display_short} · ${c.drug.brand}` : b.case_id;
  };
  const remaining = beats.filter((b) => !b.events.every((e) => firedIds.has(e.id)));
  const ids = (b: Beat) => b.events.map((e) => e.id);
  // Live: only inputs whose prerequisite has happened can fire (#9).
  const next = remaining.find((b) => canFire(ids(b)));
  const stateOf = (b: Beat): BeatState => {
    const n = b.events.filter((e) => firedIds.has(e.id)).length;
    if (n === b.events.length) return "fired";
    if (b === next) return "next";
    return n > 0 ? "partial" : "pending";
  };

  // Selection: whatever the operator clicked, otherwise the next beat to fire.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const selected = beats.find((b) => b.id === pickedId) ?? next ?? beats[beats.length - 1];

  // Autoplay fires the remaining beats on their own clock into the shared store,
  // so every other tab follows along.
  const [autoSpeed, setAutoSpeed] = useState<number | null>(null);
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), []);

  function stopAuto() {
    cancel.current?.();
    cancel.current = null;
    setAutoSpeed(null);
  }

  function startAuto(speed: number) {
    stopAuto();
    // Autoplay is mock-only: live runs take their actions from the real screens.
    if (mode !== "mock" || remaining.length === 0) return;
    setAutoSpeed(speed);
    cancel.current = playBeats(
      remaining,
      speed,
      (b) => void fire(b.events.map((e) => e.id)),
      () => {
        cancel.current = null;
        setAutoSpeed(null);
      },
    );
  }

  function fireNext() {
    if (next) void fire(next.events.map((e) => e.id));
  }

  // Reset asks once more inline instead of opening a dialog.
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), RESET_CONFIRM_MS);
    return () => clearTimeout(t);
  }, [confirmReset]);

  // Beats that just fired flash briefly, wherever the fire came from.
  const [flash, setFlash] = useState<ReadonlySet<string>>(new Set());
  const seen = useRef<ReadonlySet<string> | null>(null);
  useEffect(() => {
    const prev = seen.current;
    seen.current = firedIds;
    if (!prev) return;
    const fresh = beats
      .filter((b) => b.events.some((e) => firedIds.has(e.id) && !prev.has(e.id)))
      .map((b) => b.id);
    if (fresh.length === 0) return;
    const on = setTimeout(() => setFlash(new Set(fresh)), 0);
    const off = setTimeout(() => setFlash(new Set()), FLASH_MS);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [firedIds, beats]);

  // Keep the next beat in view as the run advances.
  useEffect(() => {
    if (!next) return;
    document
      .querySelector(`[data-beat="${next.id}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [next]);

  // Keyboard: N next beat, A autoplay 1x, 4 autoplay 4x, Esc stop.
  const keys = useRef({ fireNext, startAuto, stopAuto, autoSpeed });
  useEffect(() => {
    keys.current = { fireNext, startAuto, stopAuto, autoSpeed };
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("input, textarea, select, [contenteditable=true]")) return;
      const k = keys.current;
      if (e.key === "n" || e.key === "N") k.fireNext();
      else if (e.key === "a" || e.key === "A") {
        if (k.autoSpeed === null) k.startAuto(1);
        else k.stopAuto();
      } else if (e.key === "4") k.startAuto(4);
      else if (e.key === "Escape") k.stopAuto();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Group consecutive beats by case for the list.
  const groups: { caseId: string; beats: Beat[] }[] = [];
  for (const b of beats) {
    const last = groups[groups.length - 1];
    if (last && last.caseId === b.case_id) last.beats.push(b);
    else groups.push({ caseId: b.case_id, beats: [b] });
  }

  const progress = script.length ? Math.min(1, scriptFired / script.length) : 0;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
      <ModeBadge />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Operator console</h1>
          <p className="text-sm text-muted-foreground">
            Fires the scripted pharmacy and hub events. Every other screen follows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StandIn kind="pharmacy" />
          <StandIn kind="hub" />
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="overflow-hidden rounded-2xl border bg-card">
          {groups.map((g) => {
            const c = caseById.get(g.caseId);
            return (
              <Fragment key={`${g.caseId}-${g.beats[0].id}`}>
                <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {c ? `${c.patient.display_short} · ${c.drug.brand}` : g.caseId}
                  </span>
                  {c && <StatusPill c={c} />}
                </div>
                <ol className="divide-y border-b last:border-b-0">
                  {g.beats.map((b) => (
                    <BeatRow
                      key={b.id}
                      beat={b}
                      state={stateOf(b)}
                      selected={b === selected}
                      flash={flash.has(b.id)}
                      onSelect={() => setPickedId(b.id === pickedId ? null : b.id)}
                      onFire={() => fire(ids(b))}
                      disabled={!canFire(ids(b))}
                    />
                  ))}
                </ol>
              </Fragment>
            );
          })}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">Run</span>
                <span className="text-muted-foreground tabular-nums">
                  {mode === "supabase" ? `${scriptFired} committed events` : `${scriptFired} / ${script.length} events`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-[width] duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="min-h-10 text-xs text-muted-foreground">
                {next ? (
                  <>
                    Next: <span className="font-mono">{beatRange(next)}</span> · {who(next)} ·{" "}
                    {beatSummary(next)}
                  </>
                ) : (
                  "Every scripted event has fired."
                )}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3">
              <div className="space-y-0.5 text-xs">
                <p className="font-medium text-foreground">Seed the week</p>
                <p className="text-muted-foreground">
                  {weekSeeded
                    ? `Seeded: ${WEEK_SUMMARY.cases} background cases are in the coordinator's queue.`
                    : `Adds ${WEEK_SUMMARY.cases} synthetic background cases to an empty run: ${WEEK_SUMMARY.needsYou} need a fix, ${WEEK_SUMMARY.waiting} waiting, ${WEEK_SUMMARY.confirmed} filled.`}
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={!canSeed} onClick={() => void seedWeek()}>
                {weekSeeded ? "Seeded" : "Seed"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button className="gap-2" disabled={!next || autoSpeed !== null} onClick={fireNext}>
                Next beat <Kbd>N</Kbd>
              </Button>
              {mode !== "mock" ? null : autoSpeed === null ? (
                <div className="inline-flex rounded-lg border p-0.5">
                  <Button size="sm" variant="ghost" disabled={!next} onClick={() => startAuto(1)}>
                    Autoplay 1× <Kbd>A</Kbd>
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!next} onClick={() => startAuto(4)}>
                    4× <Kbd>4</Kbd>
                  </Button>
                </div>
              ) : (
                <Button variant="destructive" className="gap-2" onClick={stopAuto}>
                  <span className="size-2 animate-pulse rounded-full bg-current" />
                  Stop {autoSpeed}× <Kbd>Esc</Kbd>
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-xs text-muted-foreground">Start the run over on every screen.</span>
              {confirmReset ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setConfirmReset(false);
                      setPickedId(null);
                      stopAuto();
                      void reset();
                    }}
                  >
                    Confirm reset
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" disabled={!ready || busy} onClick={() => setConfirmReset(true)}>
                  Reset
                </Button>
              )}
            </div>
          </section>

          {selected && (
            <BeatDetail beat={selected} who={who(selected)} firedIds={firedIds} catalog={catalog} />
          )}

          <section className="flex items-center gap-4 rounded-2xl border bg-card p-4">
            <PatientQr size={84} className="shrink-0" />
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-medium">{qrCaption()}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{patientUrl}</p>
              {local && (
                <p className="text-xs text-stuck">
                  This is localhost: phones can&apos;t open it. Use the deployed site or this
                  laptop&apos;s network address.
                </p>
              )}
              <Link href="/qr" className="text-xs underline">
                Print the big QR card
              </Link>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            {mode === "supabase" ? (
              "Use the doctor, coordinator and patient screens for their actions. Pharmacy confirmation unlocks after patient acknowledgment."
            ) : (
              <>
                <span className="font-mono">?upto=ev_06</span> freezes a tab ·{" "}
                <span className="font-mono">?replay=1</span> loops the script in one tab
              </>
            )}
          </p>
        </aside>
      </div>
    </main>
  );
}
