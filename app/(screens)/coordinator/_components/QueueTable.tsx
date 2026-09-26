"use client";

import { ReasonChip } from "@/components/ReasonChip";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { duration } from "@/components/copy/fill";
import { atSeconds, stuckEvent, waitingOn } from "@/components/data/derive";
import type { ContactMark } from "@/components/data/local";
import type { Catalog, CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

export function stuckFor(c: CaseView, nowAt: number | null): number | null {
  const stuck = stuckEvent(c);
  if (!stuck || nowAt === null) return null;
  const cleared = c.events.find((e) => e.type === "claim_run" && e.status_text === "Dispensed");
  return (cleared ? atSeconds(cleared.at) : nowAt) - atSeconds(stuck.at);
}

export function markText(mark: ContactMark | undefined): string | null {
  if (!mark) return null;
  const when = new Date(mark.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${mark.kind === "reached" ? "Reached patient" : "Left message"} · ${when}`;
}

export function WaitingOnBadge({ c }: { c: CaseView }) {
  const who = waitingOn(c);
  if (!who) return <span className="text-muted-foreground">—</span>;
  const you = who === "Coordinator";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        you ? "border-foreground bg-foreground text-background" : "text-muted-foreground",
      )}
    >
      {you ? "You" : who}
    </span>
  );
}

/** Desk view: one row per case, the one fix on the row, the whole case one click away. */
export function QueueTable({
  rows,
  catalog,
  nowAt,
  marks,
  canFix,
  onFix,
  onOpen,
  empty,
}: {
  rows: CaseView[];
  catalog: Catalog;
  nowAt: number | null;
  marks: Record<string, ContactMark>;
  canFix: (id: string) => boolean;
  onFix: (id: string) => void;
  onOpen: (id: string) => void;
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-background p-10 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Patient</th>
            <th className="p-3 font-medium">Why it&apos;s stuck</th>
            <th className="p-3 font-medium">Stuck for</th>
            <th className="p-3 font-medium">Waiting on</th>
            <th className="p-3 font-medium">Contact</th>
            <th className="w-60 p-3 font-medium">Next step</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const fix = c.fix ? catalog.fixes[c.fix] : null;
            const needsFix = canFix(c.id) && fix;
            const seconds = stuckFor(c, nowAt);
            return (
              <tr
                key={c.id}
                onClick={() => onOpen(c.id)}
                className={cn("cursor-pointer border-t align-top hover:bg-muted/40", needsFix && "bg-stuck/5")}
              >
                <td className="p-3">
                  <button
                    type="button"
                    className="text-left font-medium hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(c.id);
                    }}
                  >
                    {c.patient.name}
                  </button>
                  <div className="text-muted-foreground">
                    {c.drug.brand} {c.drug.strength}
                  </div>
                  <div className="text-xs text-muted-foreground">{c.patient.insurance.plan_label}</div>
                </td>
                <td className="space-y-1 p-3">
                  <div className="font-medium">{c.reason ? catalog.reasons[c.reason].label : "—"}</div>
                  <ReasonChip statusText={c.statusText} rejectCode={c.rejectCode} catalog={catalog} />
                </td>
                <td className="p-3 font-mono tabular-nums">{seconds === null ? "—" : duration(seconds)}</td>
                <td className="p-3">
                  <WaitingOnBadge c={c} />
                </td>
                <td className="p-3 text-xs text-muted-foreground">{markText(marks[c.id]) ?? "—"}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  {needsFix ? (
                    <div className="space-y-1">
                      <Button className="w-full" onClick={() => onFix(c.id)}>
                        {fix.label}
                      </Button>
                      <div className="text-xs text-muted-foreground">{fix.via}</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <StatusPill c={c} />
                      {fix && <div className="text-xs text-muted-foreground">{fix.label}</div>}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
