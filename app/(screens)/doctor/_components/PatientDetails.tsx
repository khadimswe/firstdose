"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import { templates } from "@/components/copy/templates";
import { hasConfirmedFill } from "@/components/data/derive";
import { useEvents } from "@/components/data/useEvents";

import { useHandoff } from "./ApproveSheet";
import { FillLine, sentDate } from "./FillLine";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

/** Patient Details → Past Prescriptions, each with its fill status (surface 2). */
export function PatientDetails({ patientId }: { patientId: string }) {
  const { cases, catalog, canAct } = useEvents();
  const { request, sheet } = useHandoff();
  const mine = cases.filter((c) => c.patient.id === patientId);
  const patient = mine[0]?.patient;
  if (!patient) return null;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Link href="/doctor" aria-label="Back" className="-ml-2 rounded-full p-2 text-white/80 hover:bg-white/10">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">Patient Details</h1>
      </header>

      <section className="rounded-2xl bg-white px-4 py-2 text-foreground shadow-sm">
        <Row label="Patient">
          {patient.name}, {patient.age}
        </Row>
        <Row label="Condition">{patient.condition_label}</Row>
        <Row label="Plan">{patient.insurance.plan_label}</Row>
        <div className="py-2">
          <StandIn kind="patients" />
        </div>
      </section>

      <h2 className="text-lg font-semibold">Past Prescriptions</h2>
      {mine.map((c) => {
        const sent = c.events.find((e) => e.type === "prescribed");
        const fix = c.fix ? catalog.fixes[c.fix] : null;
        const handedOff = c.events.some((e) => e.type === "handoff");
        return (
          <section key={c.id} className="space-y-3 rounded-2xl bg-white p-4 text-foreground shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {c.drug.brand} {c.drug.strength}
                </p>
                <p className="text-xs text-muted-foreground">{c.drug.qty_label}</p>
              </div>
              <span className="text-xs text-muted-foreground">{sent ? `Sent ${sentDate(c) ?? ""}` : "Not sent"}</span>
            </div>
            <FillLine c={c} />
            {canAct("handoff", c.id) && (
              <Button
                className="h-11 w-full rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90"
                onClick={() => request(c.id)}
              >
                {templates.doctor_alert.action}
              </Button>
            )}
            {handedOff && !hasConfirmedFill(c) && (
              <p className="rounded-xl bg-muted px-3 py-2 text-sm">
                With your coordinator{fix ? ` · ${fix.label}` : ""}
              </p>
            )}
            {!c.ordered && (
              <Button asChild variant="outline" className="h-11 w-full rounded-full">
                <Link href="/doctor/new">Write this Rx</Link>
              </Button>
            )}
          </section>
        );
      })}
      {sheet}
    </div>
  );
}
