import { StandIn } from "@/components/StandIn";
import { StatusPill } from "@/components/StatusPill";
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { CaseView } from "@/components/data/types";

/**
 * Wallet-style savings card stand-in. Deliberately no barcode, BIN/PCN or
 * member number: the billing mechanics are unverified and it must not look usable.
 */
export function WalletPass({ c }: { c: CaseView }) {
  const t = templates.patient_card;
  const program = c.drug.copay_program;

  return (
    <article className="overflow-hidden rounded-2xl border shadow-sm">
      <header className="space-y-2 bg-foreground p-5 text-background">
        <h1 className="text-xl font-semibold">{fill(t.title, { drug: c.drug.brand })}</h1>
        <StandIn kind="wallet" className="border-background/40 text-background/80" />
      </header>
      <dl className="grid gap-4 p-5">
        <div>
          <dt className="text-xs text-muted-foreground uppercase">Program</dt>
          <dd>{program.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground uppercase">Name</dt>
          <dd>{c.patient.name}</dd>
        </div>
        <div className="text-2xl font-semibold">
          {fill(t.pays_line, { patient_pays_label: program.patient_pays_label })}
        </div>
        {c.status === "started" && <StatusPill c={c} className="h-7 px-3 text-sm" />}
      </dl>
    </article>
  );
}
