"use client";

import { SideBadge } from "@/components/SideBadge";
import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/components/data/useEvents";

import { QueueCard } from "./QueueCard";
import { WorkTable } from "./WorkTable";

/** Desk first (a work queue, like the prior-auth queues coordinators use); cards on a phone. */
export function CoordinatorScreen() {
  const { cases, catalog, fired, act, canAct } = useEvents();

  const queue = cases.filter((c) => c.events.some((e) => e.type === "handoff"));
  const needsFix = (id: string) => canAct("fix", id);
  // One fix at a time: the first handed-off case still waiting.
  const active = queue.find((c) => c.fix && needsFix(c.id));
  const sorted = [...queue].sort((a, b) => Number(needsFix(b.id)) - Number(needsFix(a.id)));
  const activeFix = active?.fix ? catalog.fixes[active.fix] : null;
  const nowAt = fired.at(-1)?.at;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 p-4 md:px-8 md:pt-8">
        <h1 className="text-lg font-semibold md:text-2xl">Coordinator</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SideBadge side="practice" className="hidden md:inline-flex" />
          <StandIn kind="patients" />
        </div>
      </header>

      {queue.length === 0 && (
        <p className="pt-8 text-center text-sm text-muted-foreground">No handoffs yet.</p>
      )}

      {queue.length > 0 && (
        <div className="hidden px-8 md:block">
          <WorkTable
            rows={sorted}
            catalog={catalog}
            nowAt={nowAt}
            activeId={active?.id}
            canFix={needsFix}
            onFix={(id) => act("fix", id)}
          />
        </div>
      )}

      <main className="mx-auto w-full max-w-md flex-1 space-y-3 px-4 pb-40 md:hidden">
        {sorted.map((c) => (
          <QueueCard key={c.id} c={c} catalog={catalog} active={c === active} />
        ))}
      </main>

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
    </div>
  );
}
