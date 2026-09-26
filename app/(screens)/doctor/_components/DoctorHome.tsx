"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, CircleCheck, Clock, Plus, Search, TriangleAlert, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import { calendarDaysBetween, hasConfirmedFill } from "@/components/data/derive";
import { liveCases } from "@/components/data/links";
import { useEvents } from "@/components/data/useEvents";
import type { Catalog, CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

import { useHandoff } from "./ApproveSheet";
import { FillLine, sentDate } from "./FillLine";
import { NewTag } from "./NewTag";
import { VoiceHandoff } from "./VoiceHandoff";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

/** Surface 1: FirstDose's alert type in the Rx Alerts card anatomy (type · patient · action). */
function AlertCard({
  c,
  catalog,
  canSend,
  onSend,
}: {
  c: CaseView;
  catalog: Catalog;
  canSend: boolean;
  onSend: () => void;
}) {
  const t = templates.doctor_alert;
  const confirmed = hasConfirmedFill(c);
  const handedOff = c.events.some((e) => e.type === "handoff");
  const fix = c.fix ? catalog.fixes[c.fix] : null;
  const alert = c.events.findLast((e) => e.type === "alert_sent");
  const reason = alert?.reason ?? c.reason;

  const Icon = confirmed ? CircleCheck : handedOff ? Clock : TriangleAlert;

  return (
    <article className="space-y-3 rounded-2xl bg-white p-4 text-foreground shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
            confirmed ? "bg-started/15 text-started" : handedOff ? "bg-du-purple/15 text-du-purple" : "bg-stuck/10 text-stuck",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold" title={c.statusText ?? undefined}>
            {c.statusText ?? "Pharmacy update"}
          </div>
          <div className="text-sm text-muted-foreground">
            {c.patient.name} · {c.drug.brand}
          </div>
        </div>
        <NewTag className="mt-1" />
      </div>

      {confirmed ? (
        <p className="text-sm font-medium text-started">
          {fill(templates.doctor_confirmation.filled, { patient_name: c.patient.name, drug: c.drug.brand })}
        </p>
      ) : c.cardUsed ? (
        <p className="text-sm">
          {fill(templates.doctor_confirmation.acknowledged, { patient_name: c.patient.name, drug: c.drug.brand })}
        </p>
      ) : (
        <div className="space-y-0.5 text-sm">
          <p className="font-medium">{fill(t.title, { patient_name: c.patient.name, drug: c.drug.brand })}</p>
          <p className="text-muted-foreground">
            {fill(t.body, { reason_label: reason ? catalog.reasons[reason].label : "" })}
          </p>
        </div>
      )}

      {canSend ? (
        <Button
          className="h-11 w-full rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90"
          onClick={onSend}
        >
          {t.action}
        </Button>
      ) : (
        handedOff &&
        !confirmed && (
          <p className="rounded-xl bg-muted px-3 py-2 text-sm">
            With your coordinator{fix ? ` · ${fix.label}` : ""}
          </p>
        )
      )}
    </article>
  );
}

function BeforeVisitCard({ c, catalog }: { c: CaseView; catalog: Catalog }) {
  const t = templates.before_visit_card;
  return (
    <article className="space-y-2 rounded-2xl bg-white p-4 text-foreground shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CalendarClock className="size-4 text-du-purple" /> Before visit
        <NewTag className="ml-auto" />
      </div>
      <p className="font-medium">{fill(t.text, { patient_name: c.patient.name, drug: c.drug.brand })}</p>
      <p className="text-sm text-muted-foreground">
        {fill(t.sub, {
          days_ago: calendarDaysBetween(c.rx.prescribed_at, c.rx.followup_at),
          reason_label: c.reason ? catalog.reasons[c.reason].label : "",
          fix_label: c.fix ? catalog.fixes[c.fix].label : "",
        })}
      </p>
    </article>
  );
}

/** The Prescriber tab: Rx Alerts, before-visit notes, recent patients with fill status. */
export function DoctorHome() {
  const { cases: allCases, catalog, canAct, mode } = useEvents();
  const cases = liveCases(allCases);
  const { request, sheet } = useHandoff();
  const [query, setQuery] = useState("");

  const alerts = cases
    .filter((c) => c.events.some((e) => e.type === "alert_sent"))
    .sort((a, b) => Number(canAct("handoff", b.id)) - Number(canAct("handoff", a.id)));
  const visits = cases.filter((c) => c.beforeVisit);
  const patients = cases.filter((c) => c.patient.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="rx-alerts">
        <div className="flex items-center justify-between">
          <h1 id="rx-alerts" className="text-xl font-semibold">
            Rx Alerts
          </h1>
          <span className="rounded-full border border-white/30 px-3 py-0.5 text-xs text-white/80">
            {alerts.length + visits.length} {alerts.length + visits.length === 1 ? "alert" : "alerts"}
          </span>
        </div>
        {/* Voice needs the live server session; the offline build has none. */}
        {mode === "supabase" && alerts.some((c) => canAct("handoff", c.id)) && <VoiceHandoff onConfirm={request} />}
        {alerts.length === 0 && visits.length === 0 && (
          <p className="rounded-2xl border border-white/15 p-4 text-sm text-white/70">
            No alerts. FirstDose tells you only when a new prescription needs you.
          </p>
        )}
        {alerts.map((c) => (
          <AlertCard
            key={c.id}
            c={c}
            catalog={catalog}
            canSend={canAct("handoff", c.id)}
            onSend={() => request(c.id)}
          />
        ))}
        {visits.map((c) => (
          <BeforeVisitCard key={`visit-${c.id}`} c={c} catalog={catalog} />
        ))}
      </section>

      <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-foreground focus-within:ring-2 focus-within:ring-white focus-within:ring-offset-2 focus-within:ring-offset-du-navy">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search patients"
          placeholder="Search patients"
          className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <section className="space-y-3" aria-labelledby="recent-patients">
        <h2 id="recent-patients" className="text-xl font-semibold">
          Recent Patients
        </h2>
        <p role="status" aria-atomic="true" className="text-sm text-white/75">
          {query.trim() ? patients.length ? `${patients.length} matching ${patients.length === 1 ? "patient" : "patients"}.` : "No matching patients." : ""}
        </p>
        {patients.map((c) => (
          <Link
            key={c.id}
            href={`/doctor/patients/${c.patient.id}`}
            className="block rounded-2xl bg-white px-4 py-2 text-foreground shadow-sm"
          >
            <Row label="Patient">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <UserRound className="size-4 text-du-purple" />
                {c.patient.name}, {c.patient.age}
              </span>
            </Row>
            <Row label="Recent Rx">
              {c.ordered ? `${c.drug.brand} ${c.drug.strength}${sentDate(c) ? ` (${sentDate(c)})` : ""}` : "—"}
            </Row>
            <div className="py-2">
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                Fill status <NewTag />
              </div>
              <FillLine c={c} tagged={false} />
            </div>
          </Link>
        ))}
      </section>

      <Link
        href="/doctor/new"
        className="fixed bottom-24 left-1/2 z-30 flex h-12 w-[calc(min(430px,100vw)-2rem)] -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-du-purple text-base font-semibold text-white shadow-lg"
      >
        New Rx <Plus className="size-5" />
      </Link>
      {sheet}
    </div>
  );
}
