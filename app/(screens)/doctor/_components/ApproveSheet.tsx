"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { coordinatorLive, DEMO_PRESCRIBER, useCoordinator } from "@/components/data/coordinator";
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

function ApproveSheet({ open, withHandoff, onApprove, onClose, pending = false, disabled = false, error = null, loginPath = null, linked = false }: {
  open: boolean; withHandoff: boolean; onApprove: () => void; onClose: () => void;
  pending?: boolean; disabled?: boolean; error?: string | null; loginPath?: string | null; linked?: boolean;
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
        <p role="status" aria-atomic="true" className="mt-2 text-sm">{pending ? "Saving your approval…" : disabled ? "This prescription isn't ready to send yet." : ""}</p>
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
  const [chosen, setChosen] = useState<{ id: string; run: string | null } | null>(null);
  const caseId = chosen?.id ?? null;
  const selection = useRef(0);
  useEffect(() => {
    if (!coordinator.live) return;
    return coordinatorLive.subscribe(() => {
      const run = coordinatorLive.getSnapshot().snapshot?.run_id;
      setChosen(current => current && current.run !== run ? null : current);
    });
  }, [coordinator.live]);
  const linked = (id: string) => { const c = cases.find(row => row.id === id); return c ? coordinator.linked(c.rx.prescriber_label, cases, approved) : false; };

  async function send(choice: { id: string; run: string | null }) {
    const { id, run } = choice;
    const selected = selection.current;
    const c = cases.find(row => row.id === id);
    if (!c || !canAct("handoff", id)) return;
    if (coordinator.live) {
      if (!run || coordinatorLive.getSnapshot().snapshot?.run_id !== run || c.rx.prescriber_label !== DEMO_PRESCRIBER) return;
      const sent = await coordinator.handoff(c, run);
      if (selected === selection.current && coordinatorLive.getSnapshot().snapshot?.run_id === run) setChosen(sent ? null : choice);
    } else {
      local.approve(c.rx.prescriber_label);
      await act("handoff", id);
      if (selected === selection.current) setChosen(null);
    }
  }
  function request(id: string, expectedRun?: string): boolean {
    if (!canAct("handoff", id)) return false;
    const current = coordinatorLive.getSnapshot();
    if (coordinator.live && (!current.ready || !current.snapshot || (expectedRun && expectedRun !== current.snapshot.run_id)
      || cases.find(row => row.id === id)?.rx.prescriber_label !== DEMO_PRESCRIBER)) return false;
    const choice = { id, run: coordinator.live ? expectedRun ?? current.snapshot!.run_id : null };
    selection.current++;
    if (linked(id)) {
      if (coordinator.live) { setChosen(choice); void send(choice); }
      else void act("handoff", id);
    } else setChosen(choice);
    return true;
  }
  const sheet = <ApproveSheet open={caseId !== null} withHandoff onApprove={() => { if (chosen) void send(chosen); }} onClose={() => { selection.current++; setChosen(null); }}
    pending={coordinator.pending} disabled={coordinator.live && (!coordinator.ready || chosen?.run !== coordinator.snapshot?.run_id || caseId === null || !canAct("handoff", caseId))}
    linked={caseId !== null && linked(caseId)} error={coordinator.error} loginPath={coordinator.loginPath} />;
  return { request, sheet };
}

export function ProfileApprove({ prescriber, open, onClose }: { prescriber: string; open: boolean; onClose: () => void }) {
  const coordinator = useCoordinator();
  return <ApproveSheet open={open} withHandoff={false} pending={coordinator.pending}
    disabled={coordinator.live && (!coordinator.ready || prescriber !== DEMO_PRESCRIBER)} error={coordinator.error} loginPath={coordinator.loginPath}
    onApprove={async () => {
      if (coordinator.live) { if (prescriber === DEMO_PRESCRIBER && await coordinator.approve()) onClose(); }
      else { local.approve(prescriber); onClose(); }
    }} onClose={onClose} />;
}
