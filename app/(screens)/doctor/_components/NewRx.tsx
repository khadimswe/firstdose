"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, CircleCheck } from "lucide-react";

import { LabelCard } from "@/components/LabelCard";
import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { liveCases } from "@/components/data/links";
import { useEvents } from "@/components/data/useEvents";
import { cn } from "@/lib/utils";

import { FillLine, sentDate } from "./FillLine";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-2xl bg-white p-4 text-foreground shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-5 items-center justify-center rounded-full bg-du-purple text-[11px] text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * DocUpdate's New Rx flow: patient → medication → pharmacy → Sign and send.
 * The drug comes from the case; FirstDose never suggests one and shows no dosing.
 */
export function NewRx() {
  const { cases: allCases, act, canAct } = useEvents();
  const cases = liveCases(allCases);
  const [picked, setPicked] = useState<string | null>(null);
  const c = cases.find((x) => x.id === picked) ?? cases.find((x) => !x.ordered) ?? cases[0];
  const sent = c.events.find((e) => e.type === "prescribed");
  const cardSent = c.events.some((e) => e.type === "copay_card_sent");

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Link href="/doctor" aria-label="Back" className="-ml-2 rounded-full p-2 text-white/80 hover:bg-white/10">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">New Rx</h1>
      </header>

      <Step n={1} title="Patient">
        <div className="grid gap-2">
          {cases.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === c.id}
              onClick={() => setPicked(x.id)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left",
                x.id === c.id && "border-du-purple ring-1 ring-du-purple",
              )}
            >
              <span>
                <span className="block font-medium">
                  {x.patient.name}, {x.patient.age}
                </span>
                <span className="block text-xs text-muted-foreground">{x.patient.insurance.plan_label}</span>
              </span>
              {x.ordered && <span className="text-xs text-muted-foreground">Sent</span>}
            </button>
          ))}
        </div>
      </Step>

      <Step n={2} title="Medication">
        <p className="font-medium">
          {c.drug.brand} ({c.drug.generic})
        </p>
        <p className="text-sm text-muted-foreground">
          {c.drug.strength} · {c.drug.qty_label}
        </p>
      </Step>

      <Step n={3} title="Pharmacy">
        <StandIn kind="pharmacy" />
      </Step>

      <Step n={4} title="Savings card">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            {c.drug.copay_program.name} · {c.drug.copay_program.patient_pays_label}
          </span>
          <StandIn kind="wallet" />
        </div>
        {cardSent && <p className="text-xs text-muted-foreground">Sent with the prescription</p>}
      </Step>

      {sent ? (
        <section className="space-y-3 rounded-2xl bg-white p-4 text-foreground shadow-sm">
          <p className="flex items-center gap-2 font-semibold">
            <CircleCheck className="size-5 text-du-purple" /> Sent to pharmacy{sentDate(c) ? ` · ${sentDate(c)}` : ""}
          </p>
          <FillLine c={c} />
          <p className="text-xs text-muted-foreground">Signed by {c.rx.prescriber_label}</p>
        </section>
      ) : (
        <Button
          className="h-12 w-full rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90"
          disabled={!canAct("prescribe", c.id)}
          onClick={() => {
            setPicked(c.id);
            void act("prescribe", c.id);
          }}
        >
          Sign and send
        </Button>
      )}

      {c.label && (
        <div className="overflow-hidden rounded-2xl text-foreground">
          <LabelCard label={c.label} drug={c.drug} mode="order" />
        </div>
      )}
    </div>
  );
}
