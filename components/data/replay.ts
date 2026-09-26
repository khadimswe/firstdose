// Plays beats on their own `at` clock, sped up by `speed`. The first beat fires
// straight away. Used by /sim Autoplay (shared) and ?replay=1 (one tab only).
import { atSeconds } from "./derive";
import type { Beat } from "./types";

const MIN_GAP_MS = 250;

export function playBeats(
  list: Beat[],
  speed: number,
  onBeat: (b: Beat) => void,
  onDone?: () => void,
): () => void {
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const step = () => {
    const b = list[i++];
    if (!b) return onDone?.();
    onBeat(b);
    const next = list[i];
    if (!next) return onDone?.();
    const gapMs = ((atSeconds(next.events[0].at) - atSeconds(b.events[0].at)) * 1000) / speed;
    timer = setTimeout(step, Math.max(gapMs, MIN_GAP_MS));
  };

  step();
  return () => clearTimeout(timer);
}
