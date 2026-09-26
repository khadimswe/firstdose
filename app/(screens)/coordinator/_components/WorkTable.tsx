import { ReasonChip } from "@/components/ReasonChip";
import { StandIn } from "@/components/StandIn";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { clock } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import { atSeconds } from "@/components/data/derive";
import type { Catalog, CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

/** How long the case has been stuck: from classification until the claim goes through (or now). */
function waiting(c: CaseView, nowAt: number | string | undefined): string {
  const stuck = c.events.find((e) => e.type === "reason_classified");
  if (!stuck || nowAt === undefined) return "—";
  const cleared = c.events.find((e) => e.type === "claim_run" && e.status_text === "Dispensed");
  return clock(atSeconds(cleared?.at ?? nowAt) - atSeconds(stuck.at));
}

/** Desk view: the coordinator's work queue, one row per handed-off case, one fix per row. */
export function WorkTable({
  rows,
  catalog,
  nowAt,
  activeId,
  canFix,
  onFix,
}: {
  rows: CaseView[];
  catalog: Catalog;
  nowAt: number | string | undefined;
  activeId: string | undefined;
  canFix: (id: string) => boolean;
  onFix: (id: string) => void;
}) {
  const eligibility = templates.coordinator_card.eligibility;

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Patient</th>
            <th className="p-3 font-medium">Reason</th>
            <th className="p-3 font-medium">Pharmacy / hub status</th>
            <th className="p-3 font-medium">Plan</th>
            <th className="p-3 font-medium">
              <span className="inline-flex items-center gap-1.5">
                Waiting <StandIn kind="price" />
              </span>
            </th>
            <th className="p-3 font-medium">Fix</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const fix = c.fix ? catalog.fixes[c.fix] : null;
            const needsFix = canFix(c.id);
            return (
              <tr
                key={c.id}
                className={cn("border-t align-top", c.id === activeId && "bg-muted/40")}
              >
                <td className="p-3">
                  <div className="font-medium">{c.patient.name}</div>
                  <div className="text-muted-foreground">
                    {c.drug.brand} {c.drug.strength}
                  </div>
                </td>
                <td className="p-3 font-medium">
                  {c.reason ? catalog.reasons[c.reason].label : "—"}
                </td>
                <td className="p-3">
                  <ReasonChip statusText={c.statusText} rejectCode={c.rejectCode} catalog={catalog} />
                </td>
                <td className="p-3">
                  <div>{c.patient.insurance.plan_label}</div>
                  <div className="text-muted-foreground">
                    {c.patient.insurance.copay_card_eligible
                      ? eligibility.eligible
                      : eligibility.ineligible}
                  </div>
                </td>
                <td className="p-3 font-mono tabular-nums">{waiting(c, nowAt)}</td>
                <td className="w-56 p-3">
                  {needsFix && fix ? (
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
