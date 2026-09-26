import { Price } from "@/components/Price";
import { ReasonChip } from "@/components/ReasonChip";
import { StatusPill } from "@/components/StatusPill";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { Catalog, CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

export function QueueCard({
  c,
  catalog,
  active,
}: {
  c: CaseView;
  catalog: Catalog;
  active: boolean;
}) {
  const t = templates.coordinator_card;
  const fix = c.fix ? catalog.fixes[c.fix] : null;
  const eligible = c.patient.insurance.copay_card_eligible;

  return (
    <Card className={cn(active && "ring-2 ring-foreground")}>
      <CardHeader>
        <CardTitle>
          {fill(t.title, {
            patient_name: c.patient.name,
            drug: c.drug.brand,
            strength: c.drug.strength,
          })}
        </CardTitle>
        <CardAction>
          <StatusPill c={c} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {c.reason && (
          <p className="font-medium">
            {fill(t.reason_line, { reason_label: catalog.reasons[c.reason].label })}
          </p>
        )}
        <ReasonChip statusText={c.statusText} rejectCode={c.rejectCode} catalog={catalog} />
        {c.quoteUsd !== null && (
          <div className="flex flex-wrap items-center gap-2">
            <Price usd={c.quoteUsd} />
            {c.amountUsd !== null && c.amountUsd !== c.quoteUsd && (
              <>
                <span aria-hidden>→</span>
                <Price usd={c.amountUsd} className="font-semibold text-started" />
              </>
            )}
          </div>
        )}
        {fix && (
          <p>{fill(t.fix_line, { fix_label: fix.label, fix_via: fix.via })}</p>
        )}
        <p className="text-muted-foreground">
          {fill(t.eligibility_line, {
            insurance_plan_label: c.patient.insurance.plan_label,
            eligibility: eligible ? t.eligibility.eligible : t.eligibility.ineligible,
          })}
        </p>
      </CardContent>
    </Card>
  );
}
