"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { isLinked } from "@/components/data/links";
import { local, useLocal } from "@/components/data/local";
import { useEvents } from "@/components/data/useEvents";

export const COORDINATOR_CAN = [
  "See fill status for your patients",
  "Send access fixes: copay card, bridge sample, access support",
];
export const COORDINATOR_CANNOT = ["Sign, change or cancel prescriptions"];

export function CanList() {
  return (
    <ul className="space-y-1.5 text-sm">
      {COORDINATOR_CAN.map((line) => (
        <li key={line} className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-started" />
          {line}
        </li>
      ))}
      {COORDINATOR_CANNOT.map((line) => (
        <li key={line} className="flex items-start gap-2">
          <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {line}
        </li>
      ))}
    </ul>
  );
}

/**
 * The CoverMyMeds-style delegate approval (6.12), asked inside DocUpdate where
 * the prescriber is already verified. It opens on the first "Send to my
 * coordinator", so one tap approves the coordinator and hands the case off.
 */
function ApproveSheet({
  open,
  withHandoff,
  onApprove,
  onClose,
}: {
  open: boolean;
  withHandoff: boolean;
  onApprove: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-lg">Approve your access coordinator?</SheetTitle>
          <SheetDescription>
            Your practice&apos;s access coordinator asked to help your patients get their first fill.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <CanList />
        </div>
        <SheetFooter>
          <Button className="h-12 rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90" onClick={onApprove}>
            {withHandoff ? "Approve and send" : "Approve"}
          </Button>
          <Button variant="ghost" className="h-11 rounded-full" onClick={onClose}>
            Not now
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * "Send to my coordinator": hands the case off, first asking the doctor to
 * approve the coordinator if they haven't yet. Render `sheet` once per screen.
 */
export function useHandoff() {
  const { cases, act, canAct } = useEvents();
  const { approved } = useLocal();
  const [caseId, setCaseId] = useState<string | null>(null);

  const linked = (id: string) => {
    const c = cases.find((x) => x.id === id);
    return c ? isLinked(c.rx.prescriber_label, cases, approved) : false;
  };

  function request(id: string) {
    if (!canAct("handoff", id)) return;
    if (linked(id)) void act("handoff", id);
    else setCaseId(id);
  }

  function approveAndSend() {
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    local.approve(c.rx.prescriber_label);
    void act("handoff", c.id);
    setCaseId(null);
  }

  const sheet = (
    <ApproveSheet open={caseId !== null} withHandoff onApprove={approveAndSend} onClose={() => setCaseId(null)} />
  );
  return { request, sheet };
}

/** The same approval from the Profile tab, without a case. */
export function ProfileApprove({ prescriber, open, onClose }: { prescriber: string; open: boolean; onClose: () => void }) {
  return (
    <ApproveSheet
      open={open}
      withHandoff={false}
      onApprove={() => {
        local.approve(prescriber);
        onClose();
      }}
      onClose={onClose}
    />
  );
}
