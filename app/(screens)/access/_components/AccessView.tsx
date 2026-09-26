import { SideBadge } from "@/components/SideBadge";
import { StandIn } from "@/components/StandIn";
import { WhoSeesWhat } from "@/components/WhoSeesWhat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { templates } from "@/components/copy/templates";
import type { AccessSummary, Catalog, ReasonKey } from "@/components/data/types";

function duration(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 120) return `${Math.round(seconds)} s`;
  if (seconds < 7200) return `${Math.round(seconds / 60)} min`;
  if (seconds < 172_800) return `${(seconds / 3600).toFixed(1)} h`;
  return `${(seconds / 86_400).toFixed(1)} days`;
}

/**
 * Takes only the aggregate summary and the reason labels. There is no case,
 * patient or prescriber data in these props, so none can reach this screen.
 */
export function AccessView({
  summary,
  reasons,
}: {
  summary: AccessSummary;
  reasons: Catalog["reasons"];
}) {
  const t = templates.access_screen;
  const tally = (Object.entries(summary.reason_tally) as [ReasonKey, number][]).filter(
    ([, n]) => n > 0,
  );
  const max = Math.max(1, ...tally.map(([, n]) => n));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <div className="flex items-center gap-2">
          <SideBadge side="ascend" />
          <StandIn kind="ascend" />
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">{t.recovered}</CardTitle>
          </CardHeader>
          <CardContent className="text-6xl font-semibold tabular-nums">
            {summary.recovered}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">{t.ttff}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-3">
            <span className="text-6xl font-semibold tabular-nums">
              {duration(summary.median_ttff_seconds)}
            </span>
            {summary.median_ttff_seconds !== null && <StandIn kind="price" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">{t.reason_tally}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tally.length === 0 && <p className="text-4xl font-semibold">—</p>}
            {tally.map(([key, n]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span>{reasons[key].label}</span>
                  <span className="font-semibold tabular-nums">{n}</span>
                </div>
                <div className="h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-foreground"
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">{t.footer}</p>

      <WhoSeesWhat />
    </main>
  );
}
