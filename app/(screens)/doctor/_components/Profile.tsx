"use client";

import { useState } from "react";
import { BadgeCheck, UserRound } from "lucide-react";

import { maskedNpi, prescriberRecord } from "@/components/data/reference";
import { Button } from "@/components/ui/button";
import { useCoordinator } from "@/components/data/coordinator";
import { useLocal } from "@/components/data/local";
import { useEvents } from "@/components/data/useEvents";

import { CanList, ProfileApprove } from "./ApproveSheet";

/** Surface 4: "My coordinator", the staff account DocUpdate's FAQ says isn't live yet. */
export function Profile() {
  const { cases } = useEvents();
  const { approved } = useLocal();
  const coordinator = useCoordinator();
  const [open, setOpen] = useState(false);
  const me = cases[0]?.rx.prescriber_label ?? "";
  const linked = me !== "" && coordinator.linked(me, cases, approved);
  const pending = coordinator.snapshot?.links[0]?.status === "pending";

  return (
    <div className="space-y-4">
      <h1 className="pt-1 text-center text-xl font-semibold">Profile</h1>

      <section className="space-y-2 rounded-2xl bg-white p-4 text-foreground shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-du-purple/15 text-du-purple">
            <UserRound className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{me}</p>
            <p className="text-sm text-muted-foreground">
              {prescriberRecord(me)?.specialty ?? "Prescriber"}
              {prescriberRecord(me) && ` · NPI ${maskedNpi(prescriberRecord(me)!.npi)}`}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 text-foreground shadow-sm" aria-labelledby="my-coordinator">
        <div className="flex items-center justify-between gap-2">
          <h2 id="my-coordinator" className="font-semibold">
            My coordinator
          </h2>
          {linked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-started/15 px-2 py-0.5 text-xs font-medium text-started">
              <BadgeCheck className="size-3.5" /> Linked
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{coordinator.live ? !coordinator.ready ? "Checking link…" : pending ? "Request pending" : "Not linked" : "Request pending"}</span>
          )}
        </div>
        <p className="text-sm">
          {linked
            ? "Your practice's access coordinator works on your patients' access."
            : coordinator.live && !pending ? "Review access for your practice's coordinator." : "Your practice's access coordinator asked to help your patients get their first fill."}
        </p>
        <CanList />
        {coordinator.live && <>
          <p role="status" aria-atomic="true" className="text-sm">{coordinator.pending ? "Saving…" : !coordinator.ready ? "Checking…" : ""}</p>
          <p role="alert" className="text-sm text-stuck">{coordinator.error}</p>
          {coordinator.loginPath && <a href={coordinator.loginPath} className="text-sm underline">Sign in to continue</a>}
          {coordinator.error && <Button variant="outline" onClick={() => void coordinator.refresh()}>Reconnect</Button>}
        </>}
        {!linked && (
          <Button
            className="h-11 w-full rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90"
            onClick={() => setOpen(true)}
            disabled={coordinator.live && (!coordinator.ready || coordinator.pending)}
          >
            {coordinator.live && !pending ? "Review coordinator access" : "Review request"}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Staff access follows prescriber approval, as in CoverMyMeds delegation.
        </p>
      </section>

      <ProfileApprove prescriber={me} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
