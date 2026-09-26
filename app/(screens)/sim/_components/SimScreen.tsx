"use client";

import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/components/data/useEvents";

import { BeatRow } from "./BeatRow";

export function SimScreen() {
  const { script, beats, fired, firedIds, cases, fire, reset } = useEvents();

  const who = new Map(cases.map((c) => [c.id, `${c.patient.display_short} · ${c.drug.brand}`]));
  const next = beats.find((b) => !b.events.every((e) => firedIds.has(e.id)));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Operator console</h1>
          <p className="text-sm text-muted-foreground">
            {fired.length} of {script.length} events fired
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StandIn kind="pharmacy" />
          <StandIn kind="hub" />
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>
      </header>

      <ol className="space-y-3">
        {beats.map((b, i) => (
          <li key={b.id}>
            <BeatRow
              beat={b}
              n={i + 1}
              who={who.get(b.case_id) ?? b.case_id}
              firedIds={firedIds}
              isNext={b === next}
              onFire={() => fire(b.events.map((e) => e.id))}
            />
          </li>
        ))}
      </ol>
    </main>
  );
}
