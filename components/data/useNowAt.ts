"use client";

import { useEffect, useState } from "react";

import { atSeconds } from "./derive";
import type { FillEvent } from "./types";

/**
 * "Now" in the same units as event `at` values, for "stuck for" timers.
 * Mock events count demo seconds, so now is the latest fired event.
 * Live events are timestamps, so now is the wall clock, ticking each second.
 */
export function useNowAt(fired: readonly FillEvent[], live: boolean): number | null {
  const [wall, setWall] = useState<number | null>(null);
  useEffect(() => {
    if (!live) return;
    const tick = () => setWall(Date.now() / 1000);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [live]);
  if (live) return wall;
  if (fired.length === 0) return null;
  // Seeded history and the script interleave in store order; "now" is the latest time.
  return Math.max(...fired.map((e) => atSeconds(e.at)));
}
