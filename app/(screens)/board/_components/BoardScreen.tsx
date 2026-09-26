"use client";

import { useEffect, useRef, useState } from "react";

import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/components/data/useEvents";
import type { CaseView } from "@/components/data/types";

import { chime } from "./chime";
import { PriceCounter } from "./PriceCounter";
import { RelayLane } from "./RelayLane";
import { StatusTicker } from "./StatusTicker";

/** Pre-generated ElevenLabs lines (scripts/tts.mjs), by case. Only Maria has one. */
const VOICE_LINES: Record<string, string> = {
  rx_001: "/audio/started-maria.mp3",
};
const CHIME_TO_VOICE_MS = 900;

export function BoardScreen() {
  const { cases, catalog, fired } = useEvents();

  const lanes = cases.filter((c) => c.ordered);
  const priced = lanes.find((c): c is CaseView & { quoteUsd: number } => c.quoteUsd !== null);
  const lastStatus = fired.findLast(
    (e) => (e.actor === "pharmacy" || e.actor === "hub") && e.status_text !== null,
  );

  // Browsers block audio until someone clicks, so sound needs one tap before the demo.
  // That same click unlocks the chime and the pre-generated ElevenLabs line.
  const audio = useRef<AudioContext | null>(null);
  const voice = useRef<HTMLAudioElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  // Play once per `started` event. Ids that disappear (a reset or a replay loop)
  // are forgotten, so the next run plays again. Anything already started when
  // the board loads is marked seen without playing.
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const started = fired.filter((e) => e.type === "started");
    const ids = new Set(started.map((e) => e.id));
    if (seen.current === null) {
      seen.current = ids;
      return;
    }
    for (const id of seen.current) if (!ids.has(id)) seen.current.delete(id);
    for (const e of started) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      if (!soundOn) continue;
      if (audio.current) chime(audio.current);
      const el = voice.current;
      if (el && VOICE_LINES[e.case_id]) {
        setTimeout(() => {
          el.currentTime = 0;
          void el.play().catch(() => {});
        }, CHIME_TO_VOICE_MS);
      }
    }
  }, [fired, soundOn]);

  function enableSound() {
    audio.current ??= new AudioContext();
    void audio.current.resume();
    chime(audio.current);
    // Unlock the <audio> element inside the click: play it silently, then rewind.
    const el = voice.current;
    if (el) {
      el.muted = true;
      void el
        .play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = false;
        })
        .catch(() => {
          el.muted = false;
        });
    }
    setSoundOn(true);
  }

  return (
    <div className="flex min-h-dvh flex-col gap-12 p-12">
      <audio ref={voice} src={VOICE_LINES.rx_001} preload="auto" className="hidden" />
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
    </div>
  );
}
