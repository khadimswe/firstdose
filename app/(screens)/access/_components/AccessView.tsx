"use client";

import { SideBadge } from "@/components/SideBadge";
import { Disclosure } from "@/components/Disclosure";
import { WhoSeesWhat } from "@/components/WhoSeesWhat";
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import { useIncrease, useTween } from "@/components/liveHooks";
import type { AccessSummary, Catalog, ReasonKey } from "@/components/data/types";
import { cn } from "@/lib/utils";

function duration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 120) return `${Math.round(seconds)} s`;
  if (seconds < 7200) return `${Math.round(seconds / 60)} min`;
  if (seconds < 172_800) return `${(seconds / 3600).toFixed(1)} h`;
  return `${(seconds / 86_400).toFixed(1)} days`;
}

function ago(seconds: number) {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

function Tile({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-2xl border bg-card p-6", className)}>
      <h2 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </h2>
      {children}
    </section>
  );
}

export type Market = {
  state: string;
  prescribing: { source: string; year: number; rows: { brand: string; drug_id: string; prescribers: number; claims: number }[] };
  formulary: { source: string; year: number; rows: { drug_id: string; covered_share: number; pa_share_of_covered: number }[] };
};

const count = (n: number) => n.toLocaleString("en-US");
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Real public context for the buyer: statewide Part D prescribing and formulary prior-auth rules. */
function MarketTile({ market }: { market: Market }) {
  const m = templates.market;
  return (
    <Tile label={m.title}>
      <ul className="grid gap-4 md:grid-cols-2">
        {market.prescribing.rows.map((r) => {
          const f = market.formulary.rows.find((x) => x.drug_id === r.drug_id);
          return (
            <li key={r.drug_id} className="space-y-1">
              <p className="font-medium">{r.brand}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {count(r.prescribers)} <span className="text-base font-normal text-muted-foreground">{m.prescribers}</span>{" "}
                · {count(r.claims)} <span className="text-base font-normal text-muted-foreground">{m.claims}</span>
              </p>
              {f && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{pct(f.pa_share_of_covered)}</span> {m.pa_share}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {fill(m.source_line, { source: market.prescribing.source, year: market.prescribing.year })} ·{" "}
        {fill(m.source_line, { source: market.formulary.source, year: market.formulary.year })}
      </p>
    </Tile>
  );
}

/**
 * Renders only aggregate props. The shared practice demo still loads case data;
 * this view is not an implemented authorization boundary for an external buyer.
 */
export function AccessView({
  summary,
  reasons,
  source,
  error,
  updatedAgo,
  market,
}: {
  summary: AccessSummary;
  reasons: Catalog["reasons"];
  /** Where the numbers come from (#9): mock script, practice event counts, or Tiger. */
  source: "mock" | "practice" | "tiger";
  error: string | null;
  /** Seconds since the summary last changed on this screen; null before the first render. */
  updatedAgo: number | null;
  /** Real public aggregates (CMS), with source and year. No practice data. */
  market?: Market;
}) {
  const t = templates.access_screen;

  const recovered = Math.round(useTween(summary.recovered, 900));
  const recoveredUp = useIncrease(summary.recovered);
  const ttff = summary.median_ttff_seconds;
  const ttffShown = useTween(ttff ?? 0, 900);

  const tally = (Object.entries(summary.reason_tally) as [ReasonKey, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = tally.reduce((sum, [, n]) => sum + n, 0);
  const max = Math.max(1, ...tally.map(([, n]) => n));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-8 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ascend opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-ascend" />
            </span>
            {source === "tiger" ? t.source_tiger : source === "practice" ? t.source_practice : t.source_mock}
            {updatedAgo !== null && <span>· Updated {ago(updatedAgo)}</span>}
          </p>
          {error && <p className="text-sm text-stuck">{t.tiger_unavailable}</p>}
        </div>
        <div className="flex items-center gap-2">
          <SideBadge side="ascend" />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
        <Tile label={t.recovered}>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-semibold tracking-tight tabular-nums">{recovered}</span>
            {recoveredUp !== null && (
              <span className="rounded-full bg-started/15 px-2 py-0.5 text-sm font-medium text-started">
                +{recoveredUp}
              </span>
            )}
          </div>
        </Tile>

        <Tile label={t.ttff}>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-semibold tracking-tight tabular-nums">
              {ttff === null ? "—" : duration(ttffShown)}
            </span>
          </div>
        </Tile>

        <Tile label={t.reason_tally}>
          {tally.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stuck reasons yet.</p>
          ) : (
            <ol className="space-y-4">
              {tally.map(([key, n]) => (
                <li key={key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{reasons[key].label}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      <span className="font-semibold text-foreground">{n}</span> ·{" "}
                      {Math.round((n / total) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-ascend transition-[width] duration-700 ease-out"
                      style={{ width: `${(n / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Tile>
      </div>

      <p className="text-sm text-muted-foreground">{t.footer}</p>

      {market && <MarketTile market={market} />}

      <WhoSeesWhat />
      <Disclosure />
    </main>
  );
}
