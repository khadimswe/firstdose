"use client";

import { useEffect, useRef, useState } from "react";

import { Disclosure } from "@/components/Disclosure";
import { PatientQr, qrCaption } from "@/components/PatientQr";
import { WristMirror } from "@/components/WristMirror";
import { Button } from "@/components/ui/button";
import { isWeekCase } from "@/components/data/catalog";
import { liveCases } from "@/components/data/links";
import { useEvents } from "@/components/data/useEvents";
import type { CaseView } from "@/components/data/types";
import { hasConfirmedFill } from "@/components/data/derive";
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";

import { chime } from "./chime";
import { PriceCounter } from "./PriceCounter";
import { RelayLane } from "./RelayLane";
import { StatusTicker } from "./StatusTicker";

export function BoardScreen() {
  const { cases: allCases, catalog, fired } = useEvents();
  // The seeded week is the coordinator's background; the board follows the live demo cases.
  const cases = liveCases(allCases);

  const lanes = cases.filter((c) => c.ordered);
  const priced = lanes.find((c): c is CaseView & { quoteUsd: number } => c.quoteUsd !== null);
  const lastStatus = fired.findLast(
    (e) => !isWeekCase(e.case_id) && (e.actor === "pharmacy" || e.actor === "hub") && e.status_text !== null,
  );

  // Browsers block audio until someone clicks, so sound needs one tap before the demo.
  const audio = useRef<AudioContext | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const confirmedCount = lanes.filter(hasConfirmedFill).length;
  const previousConfirmed = useRef(confirmedCount);
  useEffect(() => {
    if (confirmedCount > previousConfirmed.current && audio.current) chime(audio.current);
    previousConfirmed.current = confirmedCount;
  }, [confirmedCount]);

  function enableSound() {
    audio.current ??= new AudioContext();
    void audio.current.resume();
    setSoundOn(true);
  }

  return (
    <div className="flex min-h-dvh flex-col gap-12 p-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">FirstDose Relay Board</h1>
        <div className="flex flex-wrap items-center gap-2">
          {!soundOn && (
            <Button variant="outline" onClick={enableSound}>
              Enable sound
            </Button>
          )}
        </div>
      </header>

      <p role="status" aria-atomic="true" className="sr-only">
        {fill(templates.board.confirmation_count, { count: confirmedCount })}
      </p>

      <div className="grid flex-1 gap-16 xl:grid-cols-[minmax(0,1fr)_480px]">
        <main className="space-y-16">
          {lanes.length > 0 ? lanes.map((c) => <RelayLane key={c.id} c={c} />) : <RelayLane />}
        </main>
        <aside className="space-y-10">
          {priced && <PriceCounter c={priced} />}
          <StatusTicker event={lastStatus} catalog={catalog} />
          <WristMirror text={fired.findLast((e) => e.wrist !== null)?.wrist ?? null} />
        </aside>
      </div>
      <Disclosure className="max-w-xl" />
      <PatientQr
        size={120}
        caption={qrCaption()}
        className="fixed right-8 bottom-8 text-sm text-muted-foreground"
      />
    </div>
  );
}
