"use client";

import { useState } from "react";
import { BadgeCheck, Link2, Smartphone, UserRound } from "lucide-react";

import { StandIn } from "@/components/StandIn";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { prescribers } from "@/components/data/derive";
import { isLinked } from "@/components/data/links";
import { local, useLocal } from "@/components/data/local";
import { isValidNpi } from "@/components/data/npi";
import { useEvents } from "@/components/data/useEvents";
import { cn } from "@/lib/utils";

function time(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const STEPS = [
  { icon: Link2, title: "Enter the prescriber's NPI", text: "The same first step as CoverMyMeds." },
  {
    icon: Smartphone,
    title: "They approve you in DocUpdate",
    text: "CoverMyMeds faxes a code to the prescriber. Here the prescriber taps Approve in the app they already verified with.",
  },
  { icon: BadgeCheck, title: "Their stuck patients reach your queue", text: "You can send access fixes. You can't sign or change prescriptions." },
];

function StatusBadge({ linked }: { linked: boolean }) {
  return linked ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-started/15 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-started">
      <BadgeCheck className="size-3.5" /> Linked
    </span>
  ) : (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium whitespace-nowrap">Pending approval</span>
  );
}

/** Link a prescriber by NPI; the prescriber approves in DocUpdate (6.12, the CoverMyMeds model). */
export function PrescribersScreen() {
  const { cases } = useEvents();
  const { approved, requests } = useLocal();
  const [open, setOpen] = useState(false);
  const [npi, setNpi] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows = prescribers(cases).map((p) => {
    const linked = isLinked(p, cases, approved);
    const handoff = cases.find((c) => c.rx.prescriber_label === p && c.events.some((e) => e.type === "handoff"));
    return { p, linked, since: approved[p] ?? null, viaHandoff: !approved[p] && handoff !== undefined };
  });

  function submit() {
    const digits = npi.replace(/\D/g, "");
    if (!isValidNpi(digits)) {
      setError("That isn't a valid NPI. Check the 10 digits.");
      return;
    }
    local.request(digits.slice(-4));
    setNpi("");
    setError(null);
    setOpen(false);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Prescribers</h1>
          <p className="text-sm text-muted-foreground">
            The prescribers you work for. Their patients reach your queue once they approve you in DocUpdate.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Link2 /> Link a prescriber
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto rounded-xl border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Prescriber</th>
                <th className="p-3 font-medium">NPI record</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Since</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.p} className="border-t align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-medium">
                      <UserRound className="size-4 text-muted-foreground" /> {r.p}
                    </div>
                  </td>
                  <td className="p-3">
                    <StandIn kind="prescriber" />
                  </td>
                  <td className="p-3">
                    <StatusBadge linked={r.linked} />
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {r.since ? `Approved ${time(r.since)}` : r.viaHandoff ? "Approved with the first handoff" : "Requested, waiting in DocUpdate"}
                  </td>
                </tr>
              ))}
              {requests.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 text-muted-foreground">Prescriber (from NPI)</td>
                  <td className="p-3 font-mono">NPI ••••••{r.npiLast4}</td>
                  <td className="p-3">
                    <StatusBadge linked={false} />
                  </td>
                  <td className="p-3 text-muted-foreground">Requested {time(r.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4 rounded-xl border bg-background p-4">
          <h2 className="font-semibold">How linking works</h2>
          <ol className="space-y-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {i + 1}. {s.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Link a prescriber</SheetTitle>
            <SheetDescription>
              Enter their 10-digit NPI. They get an approval request in DocUpdate.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 px-4">
            <label htmlFor="npi" className="text-sm font-medium">
              NPI
            </label>
            <input
              id="npi"
              inputMode="numeric"
              autoComplete="off"
              value={npi}
              onChange={(e) => {
                setNpi(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="10 digits"
              className={cn(
                "h-10 w-full rounded-lg border px-3 font-mono tracking-wider outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                error && "border-stuck",
              )}
            />
            {error && <p className="text-sm text-stuck">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Only the last four digits are kept. A valid NPI shows the number exists; the prescriber&apos;s approval is
              what links you.
            </p>
          </div>
          <SheetFooter>
            <Button onClick={submit} disabled={npi.replace(/\D/g, "").length !== 10}>
              Request approval
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}
