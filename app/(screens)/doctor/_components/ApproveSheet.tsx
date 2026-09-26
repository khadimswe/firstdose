"use client";

import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DEMO_PRESCRIBER, useCoordinator } from "@/components/data/coordinator";
import { local, useLocal } from "@/components/data/local";
import { useEvents } from "@/components/data/useEvents";

import { NewTag } from "./NewTag";

export const COORDINATOR_CAN = ["See fill status for your patients", "Send access fixes: copay card, bridge sample, access support"];
export const COORDINATOR_CANNOT = ["Sign, change or cancel prescriptions"];

export function CanList() {
  return <ul className="space-y-1.5 text-sm">
    {COORDINATOR_CAN.map(line => <li key={line} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-started" />{line}</li>)}
    {COORDINATOR_CANNOT.map(line => <li key={line} className="flex items-start gap-2"><X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{line}</li>)}
  </ul>;
}

function ApproveSheet({ open, withHandoff, onApprove, onClose, pending = false, disabled = false, error = null, loginPath = null, linked = false, live = false }: {
  open: boolean; withHandoff: boolean; onApprove: () => void; onClose: () => void;
  pending?: boolean; disabled?: boolean; error?: string | null; loginPath?: string | null; linked?: boolean; live?: boolean;
}) {
  return <Sheet open={open} onOpenChange={value => !value && onClose()}>
    <SheetContent side="bottom" className="mx-auto max-w-[430px] rounded-t-2xl">
      <SheetHeader>
        <NewTag className="w-fit" />
        <SheetTitle className="text-lg">{linked && withHandoff ? "Send to your access coordinator?" : "Approve your access coordinator?"}</SheetTitle>
        <SheetDescription>Review the access coordinator&apos;s permissions.</SheetDescription>
      </SheetHeader>
      <div className="px-4">
        <CanList />
        {live && <p className="mt-3 text-xs text-muted-foreground">Approval applies to this shared session. No account invitation is sent.</p>}
        <p role="status" aria-atomic="true" className="mt-2 text-sm">{pending ? "Saving coordinator approval and case access…" : disabled ? "Link state or case is not ready. Review the current run." : ""}</p>
        <p role="alert" className="text-sm text-stuck">{error}</p>
        {loginPath && <a href={loginPath} className="text-sm underline">Sign in to continue</a>}
      </div>
      <SheetFooter>
        <Button disabled={pending || disabled} className="h-12 rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90" onClick={onApprove}>
          {pending ? "Saving…" : withHandoff ? linked ? "Send to coordinator" : "Approve and send" : "Approve"}
        </Button>
        <Button variant="ghost" className="h-11 rounded-full" onClick={onClose}>Not now</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>;
}

/** Typed and voice-confirmed handoffs use this same persisted approval flow. */
export function useHandoff() {
  const { cases, act, canAct } = useEvents();
  const { approved } = useLocal();
  const coordinator = useCoordinator();
  const [caseId, setCaseId] = useState<string | null>(null);
  const selection = useRef(0);
  const linked = (id: string) => { const c = cases.find(row => row.id === id); return c ? coordinator.linked(c.rx.prescriber_label, cases, approved) : false; };

  async function send(id: string) {
    const selected = selection.current;
    const c = cases.find(row => row.id === id);
    if (!c || !canAct("handoff", id)) return;
    if (coordinator.live) {
      if (c.rx.prescriber_label !== DEMO_PRESCRIBER) return;
      const sent = await coordinator.handoff(c);
      if (selected === selection.current) setCaseId(sent ? null : id);
    } else {
      local.approve(c.rx.prescriber_label);
      await act("handoff", id);
      if (selected === selection.current) setCaseId(null);
    }
  }
  function request(id: string) {
    if (!canAct("handoff", id)) return;
    if (coordinator.live && cases.find(row => row.id === id)?.rx.prescriber_label !== DEMO_PRESCRIBER) return;
    selection.current++;
    if (linked(id)) {
      if (coordinator.live) { setCaseId(id); void send(id); }
      else void act("handoff", id);
    } else setCaseId(id);
  }
  const sheet = <ApproveSheet open={caseId !== null} withHandoff onApprove={() => { if (caseId) void send(caseId); }} onClose={() => { selection.current++; setCaseId(null); }}
    live={coordinator.live} pending={coordinator.pending} disabled={coordinator.live && (!coordinator.ready || caseId === null || !canAct("handoff", caseId))}
    linked={caseId !== null && linked(caseId)} error={coordinator.error} loginPath={coordinator.loginPath} />;
  return { request, sheet };
}

export function ProfileApprove({ prescriber, open, onClose }: { prescriber: string; open: boolean; onClose: () => void }) {
  const coordinator = useCoordinator();
  return <ApproveSheet open={open} withHandoff={false} live={coordinator.live} pending={coordinator.pending}
    disabled={coordinator.live && (!coordinator.ready || prescriber !== DEMO_PRESCRIBER)} error={coordinator.error} loginPath={coordinator.loginPath}
    onApprove={async () => {
      if (coordinator.live) { if (prescriber === DEMO_PRESCRIBER && await coordinator.approve()) onClose(); }
      else { local.approve(prescriber); onClose(); }
    }} onClose={onClose} />;
}
