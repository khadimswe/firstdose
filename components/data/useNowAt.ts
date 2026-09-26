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
  const last = fired.at(-1);
  return last ? atSeconds(last.at) : null;
}
