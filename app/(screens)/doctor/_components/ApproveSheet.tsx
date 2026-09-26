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
import { useCoordinatorLinks } from "@/components/data/useCoordinatorLinks";
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
  busy = false,
  error = null,
}: {
  open: boolean;
  withHandoff: boolean;
  onApprove: () => void;
  onClose: () => void;
  /** A live approval write is in flight. */
  busy?: boolean;
  /** Why the last live approval write failed; the sheet stays open to retry. */
  error?: string | null;
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
          {error && (
            <p role="alert" className="pt-3 text-sm text-stuck">
              {error}
            </p>
          )}
        </div>
        <SheetFooter>
          <Button
            className="h-12 rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90"
            disabled={busy}
            onClick={onApprove}
          >
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
  const links = useCoordinatorLinks();
  const [caseId, setCaseId] = useState<string | null>(null);

  const linked = (id: string) => {
    const c = cases.find((x) => x.id === id);
    return c ? links.linked(c.rx.prescriber_label) : false;
  };

  // Live: attribute the case to the coordinator (idempotent, best effort; the
  // handoff doesn't depend on it), then hand off. Mock: just hand off.
  async function send(id: string) {
    await links.assign(id);
    void act("handoff", id);
  }

  function request(id: string) {
    if (!canAct("handoff", id)) return;
    if (linked(id)) void send(id);
    else setCaseId(id);
  }

  // Only after the explicit Approve tap: request (if needed) → approve → assign → handoff.
  // A failed write keeps the sheet open with the error; retrying is safe.
  async function approveAndSend() {
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    if (!(await links.approve())) return;
    setCaseId(null);
    await send(c.id);
  }

  const sheet = (
    <ApproveSheet
      open={caseId !== null}
      withHandoff
      busy={links.pending}
      error={links.error}
      onApprove={() => void approveAndSend()}
      onClose={() => setCaseId(null)}
    />
  );
  return { request, sheet };
}

/** The same approval from the Profile tab, without a case. */
export function ProfileApprove({ open, onClose }: { open: boolean; onClose: () => void }) {
  const links = useCoordinatorLinks();
  return (
    <ApproveSheet
      open={open}
      withHandoff={false}
      busy={links.pending}
      error={links.error}
      onApprove={() => {
        void links.approve().then((ok) => ok && onClose());
      }}
      onClose={onClose}
    />
  );
}
