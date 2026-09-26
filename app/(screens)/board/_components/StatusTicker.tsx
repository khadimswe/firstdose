import { StandIn } from "@/components/StandIn";
import type { Catalog, FillEvent } from "@/components/data/types";

/** The latest pharmacy or hub status, exactly as it arrived. */
export function StatusTicker({ event, catalog }: { event?: FillEvent; catalog: Catalog }) {
  if (!event) return null;
  const c = catalog.cases.find((x) => x.id === event.case_id);
  const patient = catalog.patients.find((p) => p.id === c?.patient_id);

  return (
    <section className="space-y-3 rounded-xl border p-5">
      <StandIn kind={event.actor === "hub" ? "hub" : "pharmacy"} className="h-7 px-3 text-sm" />
      <div className="font-mono text-2xl">
        {patient?.display_short} · {event.status_text}
      </div>
      {event.reject_code && (
        <div className="font-mono text-xl text-stuck">
          Reject {event.reject_code} {catalog.rejectCodes[event.reject_code]}
        </div>
      )}
    </section>
  );
}
