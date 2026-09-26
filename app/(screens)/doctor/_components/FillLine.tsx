import { Check, TriangleAlert } from "lucide-react";

import { fill, money } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import { atSeconds, boardStop, hasConfirmedFill } from "@/components/data/derive";
import type { CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

import { NewTag } from "./NewTag";

/** When the Rx was sent: the live event time, or the demo case's date on mock ("09/27/2026"). */
export function sentDate(c: CaseView): string | null {
  const sent = c.events.find((e) => e.type === "prescribed");
  if (!sent) return null;
  // atSeconds normalizes Postgres-style strings that Safari can't parse.
  const d = new Date(typeof sent.at === "string" ? atSeconds(sent.at) * 1000 : Date.parse(c.rx.prescribed_at));
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

/** templates.reason_short for this case, e.g. "Declined at price ($410 demo)". */
export function reasonShort(c: CaseView): string | null {
  if (!c.reason) return null;
  return fill(templates.reason_short[c.reason], { quote: c.quoteUsd !== null ? money(c.quoteUsd) : "" });
}

const STEPS = ["Sent", "At pharmacy", templates.board.stops[3]] as const;

/**
 * Surface 2: the fill status DocUpdate doesn't have today.
 * Sent → At pharmacy → Fill confirmed, or the stuck reason in red.
 */
export function FillLine({ c, className, tagged = true }: { c: CaseView; className?: string; tagged?: boolean }) {
  if (!c.ordered) return <span className={cn("text-muted-foreground", className)}>Not sent yet</span>;
  const stop = boardStop(c);
  const done = [true, stop >= 1, stop === 3];
  const stuck = !hasConfirmedFill(c) ? reasonShort(c) : null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/60">→</span>}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                done[i] ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                i === 2 && done[i] && "bg-started text-white",
              )}
            >
              {done[i] && <Check className="size-3" />}
              {step}
            </span>
          </li>
        ))}
        {tagged && (
          <li>
            <NewTag />
          </li>
        )}
      </ol>
      {stuck && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-stuck">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          Stuck · {stuck}
        </p>
      )}
    </div>
  );
}
