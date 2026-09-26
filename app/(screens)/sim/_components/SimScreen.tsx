"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PatientQr, usePatientUrl } from "@/components/PatientQr";
import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { playBeats } from "@/components/data/replay";
import { useEvents } from "@/components/data/useEvents";

import { BeatRow } from "./BeatRow";

export function SimScreen() {
  const { mode, ready, busy, canFire, script, beats, fired, firedIds, cases, fire, reset } = useEvents();
  const { url: patientUrl, local } = usePatientUrl();

  const who = new Map(cases.map((c) => [c.id, `${c.patient.display_short} · ${c.drug.brand}`]));
  const remaining = beats.filter((b) => !b.events.every((e) => firedIds.has(e.id)));
  const next = remaining.find(b => canFire(b.events.map(e => e.id)));

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
    if (remaining.length === 0) return;
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

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Operator console</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "supabase" ? `${fired.length} committed events` : `${fired.length} of ${script.length} events fired`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StandIn kind="pharmacy" />
          <StandIn kind="hub" />
          <Button
            variant="outline"
            disabled={!ready || busy}
            onClick={() => {
              stopAuto();
              void reset();
            }}
          >
            Reset
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!next || autoSpeed !== null}
          onClick={() => next && fire(next.events.map((e) => e.id))}
        >
          Next beat
        </Button>
        {mode === "mock" && (autoSpeed === null ? (
          <>
            <Button variant="outline" disabled={!next} onClick={() => startAuto(1)}>
              Autoplay 1×
            </Button>
            <Button variant="outline" disabled={!next} onClick={() => startAuto(4)}>
              Autoplay 4×
            </Button>
          </>
        ) : (
          <Button variant="destructive" onClick={stopAuto}>
            Stop autoplay ({autoSpeed}×)
          </Button>
        ))}
        <p className="text-xs text-muted-foreground">
          {mode === "supabase" ? "Use the doctor, coordinator and patient screens for their actions. Pharmacy confirmation unlocks after patient acknowledgment." : <>
            Other tabs: <span className="font-mono">?upto=ev_06</span> freezes a tab,{" "}
            <span className="font-mono">?replay=1</span> loops the script in that tab alone.
          </>}
        </p>
      </div>

      <section className="flex flex-wrap items-center gap-4 rounded-xl border p-4">
        <PatientQr size={96} className="shrink-0" />
        <div className="space-y-1 text-sm">
          <p className="font-medium">Scan to become Maria.</p>
          <p className="font-mono text-xs break-all text-muted-foreground">{patientUrl}</p>
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

      <ol className="space-y-3">
        {beats.map((b, i) => (
          <li key={b.id}>
            <BeatRow
              beat={b}
              n={i + 1}
              who={who.get(b.case_id) ?? b.case_id}
              firedIds={firedIds}
              isNext={b === next}
              disabled={!canFire(b.events.map(e => e.id))}
              onFire={() => fire(b.events.map((e) => e.id))}
            />
          </li>
        ))}
      </ol>
    </main>
  );
}
