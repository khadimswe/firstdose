"use client";

import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/components/data/useEvents";

import { QueueCard } from "./QueueCard";

export function CoordinatorScreen() {
  const { cases, catalog, act, canAct } = useEvents();

  const queue = cases.filter((c) => c.events.some((e) => e.type === "handoff"));
  const needsFix = (id: string) => canAct("fix", id);
  // One button on screen: the fix for the first handed-off case still waiting.
  const active = queue.find((c) => c.fix && needsFix(c.id));
  const sorted = [...queue].sort((a, b) => Number(needsFix(b.id)) - Number(needsFix(a.id)));
  const activeFix = active?.fix ? catalog.fixes[active.fix] : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center justify-between gap-2 p-4">
        <h1 className="text-lg font-semibold">Coordinator</h1>
        <StandIn kind="patients" />
      </header>

      <main className="flex-1 space-y-3 px-4 pb-40">
        {sorted.map((c) => (
          <QueueCard key={c.id} c={c} catalog={catalog} active={c === active} />
        ))}
        {queue.length === 0 && (
          <p className="pt-8 text-center text-sm text-muted-foreground">No handoffs yet.</p>
        )}
      </main>

      {active && activeFix && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background">
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
