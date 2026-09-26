"use client";

import { useEffect, useRef, useState } from "react";

import { PatientQr } from "@/components/PatientQr";
import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/components/data/useEvents";
import type { CaseView } from "@/components/data/types";

import { chime } from "./chime";
import { PriceCounter } from "./PriceCounter";
import { RelayLane } from "./RelayLane";
import { StatusTicker } from "./StatusTicker";

export function BoardScreen() {
  const { cases, catalog, fired } = useEvents();

  const lanes = cases.filter((c) => c.ordered);
  const priced = lanes.find((c): c is CaseView & { quoteUsd: number } => c.quoteUsd !== null);
  const lastStatus = fired.findLast(
    (e) => (e.actor === "pharmacy" || e.actor === "hub") && e.status_text !== null,
  );

  // Browsers block audio until someone clicks, so sound needs one tap before the demo.
  const audio = useRef<AudioContext | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const startedCount = fired.filter((e) => e.type === "started").length;
  const prevStarted = useRef(startedCount);
  useEffect(() => {
    if (startedCount > prevStarted.current && audio.current) chime(audio.current);
    prevStarted.current = startedCount;
  }, [startedCount]);

  function enableSound() {
    audio.current ??= new AudioContext();
    void audio.current.resume();
    chime(audio.current);
    setSoundOn(true);
  }

  return (
    <div className="flex min-h-dvh flex-col gap-12 p-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">FirstDose Relay Board</h1>
        <div className="flex flex-wrap items-center gap-2">
          <StandIn kind="pharmacy" />
          <StandIn kind="hub" />
          <StandIn kind="patients" />
          {!soundOn && (
            <Button variant="outline" onClick={enableSound}>
              Enable sound
            </Button>
          )}
        </div>
      </header>

      <div className="grid flex-1 gap-16 xl:grid-cols-[minmax(0,1fr)_480px]">
        <main className="space-y-16">
          {lanes.length > 0 ? lanes.map((c) => <RelayLane key={c.id} c={c} />) : <RelayLane />}
        </main>
        <aside className="space-y-10">
          {priced && <PriceCounter c={priced} />}
          <StatusTicker event={lastStatus} catalog={catalog} />
        </aside>
      </div>
      <PatientQr
        size={120}
        caption="Scan to become Maria."
        className="fixed right-8 bottom-8 text-sm text-muted-foreground"
      />
    </div>
  );
}
