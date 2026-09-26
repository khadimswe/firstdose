import { DemoPrice } from "@/components/DemoPrice";
import { ReasonChip } from "@/components/ReasonChip";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { Catalog, CaseView } from "@/components/data/types";

export function DoctorAlert({
  c,
  catalog,
  canHandoff,
  onHandoff,
}: {
  c: CaseView;
  catalog: Catalog;
  canHandoff: boolean;
  onHandoff: () => void;
}) {
  const t = templates.doctor_alert;
  const reasonLabel = c.reason ? catalog.reasons[c.reason].label : "";
  const fix = c.fix ? catalog.fixes[c.fix] : null;
  const title = fill(t.title, { patient_name: c.patient.name, drug: c.drug.brand });

  // Once handed off, the doctor's part is done: keep it to one line and the fix.
  if (c.status !== "stuck") {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardAction>
            <StatusPill c={c} />
          </CardAction>
        </CardHeader>
        {fix && (
          <CardContent className="text-sm text-muted-foreground">
            {fill(templates.coordinator_card.fix_line, { fix_label: fix.label, fix_via: fix.via })}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="ring-2 ring-stuck">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <StatusPill c={c} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{fill(t.body, { reason_label: reasonLabel })}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ReasonChip c={c} catalog={catalog} />
          {c.quoteUsd !== null && <DemoPrice usd={c.quoteUsd} className="text-sm" />}
        </div>
        <Button size="lg" className="w-full" onClick={onHandoff} disabled={!canHandoff}>
          {t.action}
        </Button>
      </CardContent>
    </Card>
  );
}
