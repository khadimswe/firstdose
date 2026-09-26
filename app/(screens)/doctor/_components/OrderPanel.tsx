import { LabelCard } from "@/components/LabelCard";
import { SideBadge } from "@/components/SideBadge";
import { StandIn } from "@/components/StandIn";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CaseView } from "@/components/data/types";

/** The practice's EHR at the moment of prescribing. No EHR vendor is named. */
export function OrderPanel({
  cases,
  c,
  onSelect,
  canPrescribe,
  onPrescribe,
}: {
  cases: CaseView[];
  c: CaseView;
  onSelect: (id: string) => void;
  canPrescribe: boolean;
  onPrescribe: () => void;
}) {
  const labelShown = c.events.some((e) => e.type === "label_shown");
  const cardSent = c.events.some((e) => e.type === "copay_card_sent");
  const { patient, drug } = c;

  return (
    <section className="flex h-dvh min-h-0 flex-col">
      <header className="flex items-center justify-between gap-3 border-b px-6 py-3">
        <nav className="flex gap-1" aria-label="Patients">
          {cases.map((x) => (
            <Button
              key={x.id}
              variant={x.id === c.id ? "secondary" : "ghost"}
              aria-pressed={x.id === c.id}
              onClick={() => onSelect(x.id)}
              className="h-auto gap-2 py-1.5 text-base"
            >
              {x.patient.name}
              <StatusPill c={x} />
            </Button>
          ))}
        </nav>
        <SideBadge side="practice" />
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{patient.name}</h1>
          <p className="text-muted-foreground">
            {patient.age} · {patient.condition_label} · {patient.insurance.plan_label}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order</CardTitle>
            <CardAction>
              <StatusPill c={c} />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              {drug.brand} ({drug.generic}) {drug.strength} · {drug.qty_label}
            </p>
            {c.ordered ? (
              <p className="text-muted-foreground">Signed by {c.rx.prescriber_label}</p>
            ) : (
              <Button
                size="lg"
                className="h-12 px-6 text-base"
                onClick={onPrescribe}
                disabled={!canPrescribe}
              >
                Prescribe {drug.brand} {drug.strength}
              </Button>
            )}
            {cardSent && (
              <div className="flex flex-wrap items-center gap-2">
                <StandIn kind="wallet" />
                <span>
                  {drug.copay_program.name} · {drug.copay_program.patient_pays_label}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {labelShown && c.label && <LabelCard label={c.label} drug={drug} mode="order" />}
      </div>

      <footer className="border-t px-6 py-2">
        <StandIn kind="patients" />
      </footer>
    </section>
  );
}
