import { cn } from "@/lib/utils";

type Stat = { label: string; value: number; hint: string; tone?: "stuck" | "done" };

/** The morning glance: stuck, waiting, and fills confirmed this week. */
export function SummaryStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border bg-background p-4">
          <dt className="text-sm text-muted-foreground">{s.label}</dt>
          <dd
            className={cn(
              "mt-1 text-3xl font-semibold tabular-nums",
              s.tone === "stuck" && s.value > 0 && "text-stuck",
              s.tone === "done" && s.value > 0 && "text-started",
            )}
          >
            {s.value}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground">{s.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
