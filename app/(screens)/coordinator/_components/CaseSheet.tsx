"use client";

import { Phone, PhoneMissed } from "lucide-react";
import { useState } from "react";

import { PatientMessage } from "@/components/PatientMessage";
import { MessageDeliveryStatus } from "@/components/MessageDeliveryStatus";
import { Disclosure } from "@/components/Disclosure";
import { Price } from "@/components/Price";
import { ReasonChip } from "@/components/ReasonChip";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { clock, fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import { local, type ContactMark, type MessageLang } from "@/components/data/local";
import { usePatientMessage } from "@/components/data/usePatientMessage";
import type { Catalog, CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

import { markText, WaitingOnBadge } from "./QueueTable";
import { timeline } from "./timeline";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

/** Everything about one case: why it's stuck, the one fix, contact marks, and what happened. */
export function CaseSheet({
  c,
  catalog,
  mark,
  canFix,
  onFix,
  onClose,
}: {
  c: CaseView | undefined;
  catalog: Catalog;
  mark: ContactMark | undefined;
  canFix: boolean;
  onFix: () => void;
  onClose: () => void;
}) {
  const t = templates.coordinator_card;
  const fix = c?.fix ? catalog.fixes[c.fix] : null;
  const sent = c?.events.find((e) => e.type === "fix_sent");
  const delivery = usePatientMessage(c?.id);
  const [lang, setLang] = useState<MessageLang>("en");
  const message = delivery.message;
  const canMessage = delivery.eligible;

  return (
    <Sheet open={c !== undefined} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {c && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="text-lg">
                {fill(t.title, { patient_name: c.patient.name, drug: c.drug.brand, strength: c.drug.strength })}
              </SheetTitle>
              <SheetDescription>
                {fill(t.eligibility_line, {
                  insurance_plan_label: c.patient.insurance.plan_label,
                  eligibility: c.patient.insurance.copay_card_eligible ? t.eligibility.eligible : t.eligibility.ineligible,
                })}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <StatusPill c={c} />
                <span className="text-xs text-muted-foreground">Waiting on</span>
                <WaitingOnBadge c={c} />
              </div>
            </SheetHeader>

            <div className="space-y-6 p-4">
              <Section title="Why it's stuck">
                {c.reason ? (
                  <p className="font-medium">{fill(t.reason_line, { reason_label: catalog.reasons[c.reason].label })}</p>
                ) : (
                  <p className="text-muted-foreground">No barrier reported.</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <ReasonChip statusText={c.statusText} rejectCode={c.rejectCode} catalog={catalog} />
                  {c.quoteUsd !== null && <Price usd={c.quoteUsd} className="text-sm" />}
                </div>
              </Section>

              <Section title="The fix · picked by rule, not AI">
                {fix ? (
                  <>
                    <p>{fill(t.fix_line, { fix_label: fix.label, fix_via: fix.via })}</p>
                    {canFix ? (
                      <Button size="lg" className="h-11 w-full text-base" onClick={onFix}>
                        {fix.label}
                      </Button>
                    ) : sent ? (
                      <p className="text-sm text-muted-foreground">Sent at {clock(sent.at)}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The rule picks a fix when the doctor sends the case to you.
                  </p>
                )}
              </Section>

              {canMessage && c && (
                <Section title="Message on the patient's card page · ElevenLabs voice">
                  <MessageDeliveryStatus {...delivery} />
                  {message ? (
                    <>
                      <PatientMessage c={c} lang={message.lang} />
                      <p className="text-xs text-muted-foreground">
                        {templates.patient_message.sent} ·{" "}
                        {new Date(message.approved_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                      <p role="status" className="text-xs text-muted-foreground">{message.acknowledged_at ? "Message acknowledged" : "Awaiting message acknowledgment"}</p>
                    </>
                  ) : (
                    <>
                      <label className="flex items-center gap-3 text-sm">Language
                        <select className="rounded-md border bg-background p-2" value={lang} disabled={delivery.pending} onChange={e => setLang(e.target.value as MessageLang)}>
                          {(Object.keys(templates.patient_message.languages) as MessageLang[]).map(l => <option key={l} value={l}>{templates.patient_message.languages[l]}</option>)}
                        </select>
                      </label>
                      <PatientMessage c={c} lang={lang} />
                      <Button className="w-full" disabled={!delivery.ready || delivery.pending} onClick={() => { void delivery.approve(lang); }}>
                        {templates.patient_message.approve}
                      </Button>
                    </>
                  )}
                </Section>
              )}

              <Section title="Contact">
                <p className="text-xs text-muted-foreground">Only visible on this device</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className={cn(mark?.kind === "reached" && "border-foreground")}
                    onClick={() => local.mark(c.id, "reached")}
                  >
                    <Phone /> Reached patient
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(mark?.kind === "left_message" && "border-foreground")}
                    onClick={() => local.mark(c.id, "left_message")}
                  >
                    <PhoneMissed /> Left message
                  </Button>
                </div>
                {mark && <p className="text-xs text-muted-foreground">{markText(mark)}</p>}
              </Section>

              <Section title="What happened">
                <ol className="space-y-3 border-l pl-4">
                  {timeline(c, catalog).map((line) => (
                    <li key={line.id} className="relative">
                      <span
                        className={cn(
                          "absolute top-1.5 -left-[21px] size-2 rounded-full bg-muted-foreground/40",
                          line.tone === "stuck" && "bg-stuck",
                          line.tone === "done" && "bg-started",
                        )}
                      />
                      <div className="text-xs text-muted-foreground">
                        {clock(line.at)} · {line.who}
                      </div>
                      <div className="text-sm">{line.text}</div>
                    </li>
                  ))}
                </ol>
              </Section>
            </div>

            <SheetFooter className="border-t">
              <Disclosure />
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
