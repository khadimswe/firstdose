import { CheckCircle2, Circle, CircleDashed, CircleDot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clock } from "@/components/copy/fill";
import type { Beat } from "@/components/data/types";
import { cn } from "@/lib/utils";

import { ACTOR_LABEL, beatRange, beatSummary } from "./labels";

export type BeatState = "fired" | "partial" | "next" | "pending";

/** One beat in the run list: status, what it does, when, and a Fire button. */
export function BeatRow({
  beat,
  state,
  selected,
  flash,
  onSelect,
  onFire,
  disabled = false,
}: {
  beat: Beat;
  state: BeatState;
  selected: boolean;
  flash: boolean;
  onSelect: () => void;
  onFire: () => void;
  /** Live mode: this input isn't allowed yet (its prerequisite hasn't happened). */
  disabled?: boolean;
}) {
  const Icon =
    state === "fired" ? CheckCircle2 : state === "partial" ? CircleDashed : state === "next" ? CircleDot : Circle;
  const statusText = beat.events.find((e) => e.status_text)?.status_text;
  const reject = beat.events.find((e) => e.reject_code)?.reject_code;
  const actors = [...new Set(beat.events.map((e) => e.actor))];

  return (
    <li
      data-beat={beat.id}
      className={cn(
        "group flex items-start gap-3 border-l-2 border-transparent px-4 py-3 transition-colors duration-700",
        selected ? "border-l-foreground bg-muted" : "hover:bg-muted/60",
        flash && "bg-ascend/10",
      )}
    >
      <Icon
        aria-label={state}
        className={cn(
          "mt-0.5 size-4 shrink-0",
          state === "fired" && "text-foreground",
          state === "next" && "text-foreground",
          (state === "pending" || state === "partial") && "text-muted-foreground",
        )}
      />
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 space-y-1 text-left">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-xs text-muted-foreground">{beatRange(beat)}</span>
          <span className={cn("text-sm font-medium", state === "fired" && "text-muted-foreground")}>
            {beatSummary(beat)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {actors.map((a) => (
            <span key={a} className="rounded bg-muted px-1.5 py-0.5 group-hover:bg-background">
              {ACTOR_LABEL[a]}
            </span>
          ))}
          {statusText && <span className="font-mono">{statusText}</span>}
          {reject && <span className="font-mono text-stuck">Reject {reject}</span>}
        </div>
      </button>
      <span className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
        {clock(beat.events[0].at)}
      </span>
      <Button
        size="xs"
        variant={state === "next" ? "default" : "outline"}
        disabled={state === "fired" || disabled}
        onClick={onFire}
        className="w-14"
      >
        {state === "fired" ? "Fired" : "Fire"}
      </Button>
    </li>
  );
}
