"use client";

// Small hooks that make a screen feel live: numbers that count to their new
// value, a ticking clock, and when a value last changed.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Counts from the last shown value to `target`. Jumps straight there with reduced motion. */
export function useTween(target: number, ms = 1500) {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = reduce ? 1 : Math.min(1, (now - t0) / ms);
      const v = start + (target - start) * (1 - (1 - p) ** 3);
      from.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}

// One shared 1-second clock for every "x s ago" on the page.
const tickListeners = new Set<() => void>();
let tickTimer: ReturnType<typeof setInterval> | undefined;
function subscribeTick(listener: () => void) {
  tickListeners.add(listener);
  tickTimer ??= setInterval(() => tickListeners.forEach((l) => l()), 1000);
  return () => {
    tickListeners.delete(listener);
    if (tickListeners.size === 0) {
      clearInterval(tickTimer);
      tickTimer = undefined;
    }
  };
}
const nowSeconds = () => Math.floor(Date.now() / 1000);
const serverNow = () => 0;

/** Wall-clock seconds, re-rendering once a second. 0 during server render. */
export function useNowSeconds() {
  return useSyncExternalStore(subscribeTick, nowSeconds, serverNow);
}

/** Wall-clock seconds when `key` last changed on this client (0 before mount). */
export function useChangedAt(key: string) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    // Deferred so the effect doesn't set state synchronously while committing.
    const t = setTimeout(() => setAt(Math.floor(Date.now() / 1000)), 0);
    return () => clearTimeout(t);
  }, [key]);
  return at;
}

/** A short-lived "+n" when a count goes up; null otherwise. */
export function useIncrease(value: number, showMs = 3000) {
  const [delta, setDelta] = useState<number | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    const d = value - prev.current;
    prev.current = value;
    if (d <= 0) return;
    const show = setTimeout(() => setDelta(d), 0);
    const hide = setTimeout(() => setDelta(null), showMs);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [value, showMs]);
  return delta;
}
