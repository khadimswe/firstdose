"use client";

import { useEffect, useRef, useState } from "react";

import { StandIn } from "@/components/StandIn";
import { fill, money } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

/** Counts from the last shown value to `target`. Jumps straight there with reduced motion. */
function useTween(target: number, ms = 1500) {
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

export function PriceCounter({ c }: { c: CaseView & { quoteUsd: number } }) {
  const target = c.amountUsd ?? c.quoteUsd;
  const shown = Math.round(useTween(target));
  const t = templates.board;

  return (
    <section className="space-y-3">
      <div className="text-xl text-muted-foreground">
        {c.patient.display_short} · {c.drug.brand}
      </div>
      <div className="flex items-baseline gap-4">
        <span
          className={cn(
            "text-8xl font-semibold tabular-nums",
            target === 0 && shown === 0 && "text-started",
          )}
        >
          {money(shown)}
        </span>
        <StandIn kind="price" className="h-7 px-3 text-base" />
      </div>
      <p className="text-2xl">
        {target === c.quoteUsd
          ? fill(t.price_from_label, { quote: money(c.quoteUsd) })
          : target === 0
            ? fill(t.price_to_label, { manufacturer: c.drug.manufacturer })
            : null}
      </p>
      <p className="text-lg text-muted-foreground">
        {fill(t.wac_context, { wac: money(c.drug.wac_usd), wac_source: c.drug.wac_source })}
      </p>
    </section>
  );
}
