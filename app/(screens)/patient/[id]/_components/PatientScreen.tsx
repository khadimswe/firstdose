"use client";

import { StandIn } from "@/components/StandIn";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { templates } from "@/components/copy/templates";
import { useEvents } from "@/components/data/useEvents";

import { WalletPass } from "./WalletPass";

export function PatientScreen({ caseId }: { caseId: string }) {
  const { cases, act, canAct } = useEvents();
  const c = cases.find((x) => x.id === caseId)!;

  const cardReady =
    c.fix === "RESEND_COPAY_CARD" && c.events.some((e) => e.type === "fix_sent");

  // No template exists for any other state, so no sentences: drug, status, stand-in.
  if (!cardReady) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-5">
        <StandIn kind={c.fix === "BRIDGE_SAMPLE" ? "samples" : "wallet"} />
        <h1 className="text-xl font-semibold">
          {c.drug.brand} {c.drug.strength}
        </h1>
        <StatusPill c={c} className="h-7 px-3 text-sm" />
      </main>
    );
  }

  const canUse = canAct("use_card", c.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-5 pb-32">
      <WalletPass c={c} />

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
    </main>
  );
}
