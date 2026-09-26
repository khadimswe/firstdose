"use client";

import { PatientMessage } from "@/components/PatientMessage";
import { MessageDeliveryStatus } from "@/components/MessageDeliveryStatus";
import { Disclosure } from "@/components/Disclosure";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { templates } from "@/components/copy/templates";
import { usePatientMessage } from "@/components/data/usePatientMessage";
import { useEvents } from "@/components/data/useEvents";
import { hasConfirmedFill } from "@/components/data/derive";

import { WalletPass } from "./WalletPass";

export function PatientScreen({ caseId }: { caseId: string }) {
  const { cases, act, canAct } = useEvents();
  const c = cases.find((x) => x.id === caseId)!;
  const delivery = usePatientMessage(caseId);
  const message = delivery.message;

  const cardReady =
    c.fix === "RESEND_COPAY_CARD" && c.events.some((e) => e.type === "fix_sent");

  // No template exists for any other state: show the drug, status and disclosure.
  if (!cardReady) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-5">
        <h1 className="text-xl font-semibold">
          {c.drug.brand} {c.drug.strength}
        </h1>
        <StatusPill c={c} className="h-7 px-3 text-sm" />
        <Disclosure className="mt-auto" />
      </main>
    );
  }

  const canUse = canAct("use_card", c.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-5 pb-32">
      <WalletPass c={c} />

      {caseId === "rx_001" && <MessageDeliveryStatus {...delivery} />}
      {message && <section className="space-y-3" aria-label="Practice message">
        <PatientMessage c={c} lang={message.lang} />
        {message.acknowledged_at
          ? <p role="status" className="text-sm text-muted-foreground">Message acknowledged</p>
          : <Button variant="outline" disabled={delivery.pending || !delivery.ready} onClick={() => { void delivery.acknowledge(); }}>Acknowledge message</Button>}
      </section>}

      <p role="status" aria-atomic="true" className="text-sm text-muted-foreground">
        {hasConfirmedFill(c)
          ? templates.patient_card.filled
          : c.cardUsed ? templates.patient_card.acknowledged : ""}
      </p>

      {canUse && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background">
          <div className="mx-auto w-full max-w-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              size="lg"
              className="h-14 w-full text-lg"
              onClick={() => act("use_card", c.id)}
            >
              {templates.patient_card.action}
            </Button>
          </div>
        </div>
      )}
      <Disclosure />
    </main>
  );
}
