"use client";

import { useState } from "react";

import { StandIn } from "@/components/StandIn";
import { WristMirror } from "@/components/WristMirror";
import { useEvents } from "@/components/data/useEvents";

import { BeforeVisitCard } from "./BeforeVisitCard";
import { DoctorAlert } from "./DoctorAlert";
import { OrderPanel } from "./OrderPanel";
import { PatientRail } from "./PatientRail";

export function DoctorScreen() {
  const { cases, catalog, fired, act, canAct } = useEvents();
  const [selectedId, setSelectedId] = useState(cases[0].id);
  const selected = cases.find((c) => c.id === selectedId) ?? cases[0];

  // An alert stays up until the claim goes through.
  const alerts = cases.filter(
    (c) =>
      c.events.some((e) => e.type === "alert_sent") &&
      c.status !== "dispensed" &&
      c.status !== "started",
  );
  const beforeVisit = cases.filter((c) => c.beforeVisit);
  const wrist = fired.findLast((e) => e.wrist !== null)?.wrist ?? null;

  return (
    <div className="grid h-dvh grid-cols-[220px_minmax(0,1fr)_340px]">
      <PatientRail cases={cases} selectedId={selected.id} onSelect={setSelectedId} />

      <OrderPanel
        c={selected}
        canPrescribe={canAct("prescribe", selected.id)}
        onPrescribe={() => act("prescribe", selected.id)}
      />

      <aside className="flex flex-col gap-4 overflow-y-auto border-l p-4 *:shrink-0">
        <header className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Alerts</h2>
          <StandIn kind="ascend" />
        </header>
        {alerts.map((c) => (
          <DoctorAlert
            key={c.id}
            c={c}
            catalog={catalog}
            canHandoff={canAct("handoff", c.id)}
            onHandoff={() => act("handoff", c.id)}
          />
        ))}
        {beforeVisit.map((c) => (
          <BeforeVisitCard key={c.id} c={c} catalog={catalog} />
        ))}
        {alerts.length === 0 && beforeVisit.length === 0 && (
          <p className="text-sm text-muted-foreground">No stuck patients.</p>
        )}
        <div className="mt-auto pt-4">
          <WristMirror text={wrist} />
        </div>
      </aside>
    </div>
  );
}
