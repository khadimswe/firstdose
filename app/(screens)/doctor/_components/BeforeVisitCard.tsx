import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import { calendarDaysBetween } from "@/components/data/derive";
import type { Catalog, CaseView } from "@/components/data/types";

/** Fixed template only. Shown on follow-up day, so "days ago" counts to followup_at. */
export function BeforeVisitCard({ c, catalog }: { c: CaseView; catalog: Catalog }) {
  const t = templates.before_visit_card;
  return (
    <Card className="ring-2 ring-foreground">
      <CardHeader>
        <CardTitle>
          {fill(t.text, { patient_name: c.patient.name, drug: c.drug.brand })}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {fill(t.sub, {
          days_ago: calendarDaysBetween(c.rx.prescribed_at, c.rx.followup_at),
          reason_label: c.reason ? catalog.reasons[c.reason].label : "",
          fix_label: c.fix ? catalog.fixes[c.fix].label : "",
        })}
      </CardContent>
    </Card>
  );
}
