import { clock, fill, money } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import { boardStop } from "@/components/data/derive";
import type { CaseView, FillEvent } from "@/components/data/types";
import { cn } from "@/lib/utils";

const STOPS = templates.board.stops;

/** Stuck from the moment a reason is classified until the claim goes through. */
export function isStuck(c: CaseView) {
  return c.reason !== null && c.status !== "dispensed" && c.status !== "started";
}

export function stuckLabel(c: CaseView) {
  if (!c.reason) return "";
  const short = fill(templates.reason_short[c.reason], {
    quote: c.quoteUsd !== null ? money(c.quoteUsd) : "",
  });
  return fill(templates.board.stuck_label, { reason_short: short });
}

/** When the case reached each stop: prescribed, first pharmacy/hub event, dispensed, started. */
function stopTimes(c: CaseView) {
  const at = (p: (e: FillEvent) => boolean) => c.events.find(p)?.at;
  return [
    at((e) => e.type === "prescribed"),
    at((e) => e.actor === "pharmacy" || e.actor === "hub"),
    at((e) => e.type === "claim_run" && e.status_text === "Dispensed"),
    at((e) => e.type === "started"),
  ];
}

/** One prescription's route. With no case, draws the empty route. */
export function RelayLane({ c }: { c?: CaseView }) {
  const stop = c ? boardStop(c) : -1;
  const stuck = c ? isStuck(c) : false;
  const started = c?.status === "started";
  const times = c ? stopTimes(c) : [];
  const stuckAt = c?.events.find((e) => e.type === "reason_classified")?.at;

  return (
    <section className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-8">
      <div className="pt-1">
        {c && (
          <>
            <div className="text-4xl font-semibold">{c.patient.display_short}</div>
            <div className="text-xl text-muted-foreground">
              {c.drug.brand} {c.drug.strength}
            </div>
          </>
        )}
      </div>

      <div className="space-y-6">
        <div className="relative">
          <div className="absolute top-6 right-[12.5%] left-[12.5%] h-1.5 -translate-y-1/2 rounded bg-muted" />
          <div
            className={cn(
              "absolute top-6 left-[12.5%] h-1.5 -translate-y-1/2 rounded transition-[width] duration-1000",
              started ? "bg-started" : "bg-foreground",
            )}
            style={{ width: `${(Math.max(stop, 0) / (STOPS.length - 1)) * 75}%` }}
          />
          <ol className="relative grid grid-cols-4">
            {STOPS.map((label, i) => {
              const here = i === stop;
              return (
                <li key={label} className="flex flex-col items-center gap-3">
                  <span
                    className={cn(
                      "size-12 rounded-full border-4 border-muted bg-background transition-colors duration-700",
                      i < stop && "border-foreground bg-foreground",
                      here && "border-foreground bg-foreground",
                      here && stuck && "animate-pulse border-stuck bg-stuck",
                      here && started && "border-started bg-started",
                    )}
                  />
                  <span
                    className={cn(
                      "text-2xl",
                      i > stop && "text-muted-foreground",
                      here && stuck && "font-semibold text-stuck",
                      here && started && "font-semibold text-started",
                    )}
                  >
                    {label}
                  </span>
                  {times[i] !== undefined && (
                    <span className="font-mono text-lg text-muted-foreground">
                      {clock(times[i]!)}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        {c && stuck && (
          <p className="text-center text-3xl font-semibold text-stuck">
            {stuckLabel(c)}
            {stuckAt !== undefined && (
              <span className="font-mono font-normal text-muted-foreground">
                {" "}
                · since {clock(stuckAt)}
              </span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
