"use client";

import Link from "next/link";
import { useState } from "react";

import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  atSeconds,
  hasConfirmedFill,
  prescribers,
  queueBucket,
  stuckEvent,
  type QueueBucket,
} from "@/components/data/derive";
import { inQueue, isLinked } from "@/components/data/links";
import { useLocal } from "@/components/data/local";
import { useEvents } from "@/components/data/useEvents";
import { useNowAt } from "@/components/data/useNowAt";
import type { CaseView } from "@/components/data/types";

import { CaseSheet } from "./CaseSheet";
import { QueueCard } from "./QueueCard";
import { QueueTable } from "./QueueTable";
import { SummaryStrip } from "./SummaryStrip";

const TABS: { value: QueueBucket; label: string; empty: string }[] = [
  { value: "needs_you", label: "Needs you", empty: "Nothing needs a fix right now." },
  { value: "waiting", label: "Waiting", empty: "Nothing is waiting on the doctor, patient or pharmacy." },
  { value: "confirmed", label: "Fill confirmed", empty: "No pharmacy-confirmed fills yet this week." },
];

// Oldest stuck first; cases that never got stuck sort after, oldest prescription first.
function byStuckAge(a: CaseView, b: CaseView) {
  const sa = stuckEvent(a);
  const sb = stuckEvent(b);
  if (sa && sb) return atSeconds(sa.at) - atSeconds(sb.at);
  if (sa) return -1;
  if (sb) return 1;
  return 0;
}

/** The coordinator's home: what's stuck, what's waiting, what got its fill. */
export function QueueScreen() {
  const { cases, catalog, fired, mode, act, canAct } = useEvents();
  const { approved, marks } = useLocal();
  const nowAt = useNowAt(fired, mode === "supabase");
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<QueueBucket>("needs_you");

  const all = prescribers(cases);
  const linked = all.filter((p) => isLinked(p, cases, approved));
  const pending = all.filter((p) => !linked.includes(p));
  const mine = cases.filter((c) => inQueue(c, new Set(linked)));

  const buckets: Record<QueueBucket, CaseView[]> = { needs_you: [], waiting: [], confirmed: [] };
  for (const c of [...mine].sort(byStuckAge)) buckets[queueBucket(c)].push(c);

  const stuck = mine.filter((c) => c.status === "stuck" || c.status === "handed_off").length;
  const waiting = mine.filter((c) => !hasConfirmedFill(c) && c.status !== "stuck" && c.status !== "handed_off").length;
  const confirmed = buckets.confirmed.length;

  const canFix = (id: string) => canAct("fix", id);
  const active = buckets.needs_you.find((c) => canFix(c.id));
  const activeFix = active?.fix ? catalog.fixes[active.fix] : null;
  const open = cases.find((c) => c.id === openId);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-40 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Access queue</h1>
          <p className="text-sm text-muted-foreground">
            New prescriptions from the prescribers you work with that haven&apos;t reached a confirmed fill.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StandIn kind="pharmacy" />
          {mode === "mock" && <StandIn kind="price" />}
        </div>
      </header>

      {pending.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed bg-background p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              Waiting for approval from {pending.join(", ")}
            </p>
            <p className="text-sm text-muted-foreground">
              Their patients show up here once they approve you in DocUpdate.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/coordinator/prescribers">Prescribers</Link>
          </Button>
        </div>
      )}

      <SummaryStrip
        stats={[
          { label: "Stuck", value: stuck, hint: "Reason reported, no fix sent yet", tone: "stuck" },
          { label: "Waiting", value: waiting, hint: "On the patient, pharmacy or access team" },
          { label: "Fill confirmed this week", value: confirmed, hint: "Confirmed by the pharmacy", tone: "done" },
        ]}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as QueueBucket)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <span className="ml-1.5 tabular-nums text-muted-foreground">{buckets[t.value].length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="pt-2">
            <div className="hidden md:block">
              <QueueTable
                rows={buckets[t.value]}
                catalog={catalog}
                nowAt={nowAt}
                marks={marks}
                canFix={canFix}
                onFix={(id) => act("fix", id)}
                onOpen={setOpenId}
                empty={t.empty}
              />
            </div>
            <div className="space-y-3 md:hidden">
              {buckets[t.value].length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">{t.empty}</p>
              )}
              {buckets[t.value].map((c) => (
                <button key={c.id} type="button" className="block w-full text-left" onClick={() => setOpenId(c.id)}>
                  <QueueCard c={c} catalog={catalog} active={c === active} />
                </button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {active && activeFix && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background md:hidden">
          <div className="mx-auto w-full max-w-md space-y-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="text-xs text-muted-foreground">
              {active.patient.name} · {active.drug.brand}
            </p>
            <Button size="lg" className="h-12 w-full text-base" onClick={() => act("fix", active.id)}>
              {activeFix.label}
            </Button>
          </div>
        </div>
      )}

      <CaseSheet
        c={open}
        catalog={catalog}
        mark={open ? marks[open.id] : undefined}
        canFix={open ? canFix(open.id) : false}
        onFix={() => open && act("fix", open.id)}
        onClose={() => setOpenId(null)}
      />
    </main>
  );
}
