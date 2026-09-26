import { DemoPrice } from "@/components/DemoPrice";
import { StandInBand } from "@/components/StandIn";
import { StatusPill } from "@/components/StatusPill";
import { fill, money } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { CaseView } from "@/components/data/types";

/**
 * Savings card laid out like the pharmacy-card apps patients already use: drug,
 * big price line, the quote struck through, and the stand-in label as the band a
 * real card uses for its "not insurance" line. Deliberately no BIN/PCN, barcode or
 * member ID: the billing mechanics are unverified and it must not look usable.
 */
export function WalletPass({ c }: { c: CaseView }) {
  const t = templates.patient_card;
  const { drug } = c;
  const program = drug.copay_program;

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="space-y-5 p-5">
        <header className="space-y-1">
          <h1 className="text-lg font-semibold">{fill(t.title, { drug: drug.brand })}</h1>
          <p className="text-muted-foreground">
            {drug.brand} · {drug.strength} · {drug.qty_label}
          </p>
        </header>

        <div className="space-y-1">
          <p className="text-3xl leading-tight font-semibold">
            {fill(t.pays_line, { patient_pays_label: program.patient_pays_label })}
          </p>
          {c.quoteUsd !== null && drug.demo_quote_label && (
            <p className="text-muted-foreground">
              <s>{money(c.quoteUsd)}</s> {drug.demo_quote_label}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Program</dt>
          <dd>{program.name}</dd>
        </dl>

        {c.status === "started" && (
          <div className="flex items-center gap-3">
            <StatusPill c={c} className="h-7 px-3 text-sm" />
            {c.amountUsd !== null && <DemoPrice usd={c.amountUsd} className="text-lg font-semibold" />}
          </div>
        )}
      </div>
      <StandInBand kind="wallet" />
    </article>
  );
}
