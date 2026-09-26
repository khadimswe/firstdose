import { LabelCard } from "@/components/LabelCard";
import { StandIn } from "@/components/StandIn";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CaseView } from "@/components/data/types";

export function OrderPanel({
  c,
  canPrescribe,
  onPrescribe,
}: {
  c: CaseView;
  canPrescribe: boolean;
  onPrescribe: () => void;
}) {
  const labelShown = c.events.some((e) => e.type === "label_shown");
  const cardSent = c.events.some((e) => e.type === "copay_card_sent");
  const { patient, drug } = c;

  return (
    <section className="space-y-4 overflow-y-auto p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{patient.name}</h1>
        <p className="text-sm text-muted-foreground">
          {patient.age} · {patient.condition_label} · {patient.insurance.plan_label}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Order</CardTitle>
          <CardAction>
            <StatusPill c={c} />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            {drug.brand} ({drug.generic}) {drug.strength} · {drug.qty_label}
          </p>
          {c.ordered ? (
            <p className="text-sm text-muted-foreground">Signed by {c.rx.prescriber_label}</p>
          ) : (
            <Button size="lg" onClick={onPrescribe} disabled={!canPrescribe}>
              Prescribe {drug.brand} {drug.strength}
            </Button>
          )}
          {cardSent && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <StandIn kind="wallet" />
              <span>
                {drug.copay_program.name} · {drug.copay_program.patient_pays_label}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {labelShown && c.label && <LabelCard label={c.label} drug={drug} />}
    </section>
  );
}
