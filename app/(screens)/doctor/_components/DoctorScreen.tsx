"use client";

import { useState } from "react";

import { useEvents } from "@/components/data/useEvents";

import { AscendThread } from "./AscendThread";
import { OrderPanel } from "./OrderPanel";
import { buildThread } from "./thread";

/** iPad: the practice EHR where the order is signed, beside the Ascend thread where FirstDose reaches the doctor. */
export function DoctorScreen() {
  const { cases, catalog, fired, act, canAct } = useEvents();
  const [selectedId, setSelectedId] = useState(cases[0].id);
  const selected = cases.find((c) => c.id === selectedId) ?? cases[0];
  const wrist = fired.findLast((e) => e.wrist !== null)?.wrist ?? null;

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)_400px]">
      <OrderPanel
        cases={cases}
        c={selected}
        onSelect={setSelectedId}
        canPrescribe={canAct("prescribe", selected.id)}
        onPrescribe={() => act("prescribe", selected.id)}
      />
      <AscendThread
        bubbles={buildThread(cases, fired, catalog)}
        catalog={catalog}
        wrist={wrist}
        canHandoff={(id) => canAct("handoff", id)}
        onHandoff={(id) => act("handoff", id)}
        onOpenCase={setSelectedId}
      />
    </div>
  );
}
