"use client";

import { useState } from "react";
import { BadgeCheck, UserRound } from "lucide-react";

import { maskedNpi, prescriberRecord } from "@/components/data/reference";
import { Button } from "@/components/ui/button";
import { useCoordinatorLinks } from "@/components/data/useCoordinatorLinks";
import { useEvents } from "@/components/data/useEvents";

import { CanList, ProfileApprove } from "./ApproveSheet";

/** Surface 4: "My coordinator", the staff account DocUpdate's FAQ says isn't live yet. */
export function Profile() {
  const { cases } = useEvents();
  const links = useCoordinatorLinks();
  const [open, setOpen] = useState(false);
  const me = cases[0]?.rx.prescriber_label ?? "";
  const linked = me !== "" && links.linked(me);

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
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Request pending</span>
          )}
        </div>
        <p className="text-sm">
          {linked
            ? "Your practice's access coordinator works on your patients' access."
            : "Your practice's access coordinator asked to help your patients get their first fill."}
        </p>
        <CanList />
        {!linked && (
          <Button
            className="h-11 w-full rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90"
            onClick={() => setOpen(true)}
          >
            Review request
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Staff access works like CoverMyMeds delegation: you approve it once, here, where you&apos;re already verified.
        </p>
      </section>

      <ProfileApprove open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
