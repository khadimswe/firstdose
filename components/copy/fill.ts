// Fills {variables} in a templates.json string. A missing variable stays visible
// as {name} so it gets noticed on screen instead of silently disappearing.
import { atSeconds } from "@/components/data/derive";

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in vars) return String(vars[key]);
    if (process.env.NODE_ENV !== "production") {
      console.error(`fill(): missing {${key}} in "${template}"`);
    }
    return match;
  });
}

/** Demo clock: mock seconds → "1:21"; a live ISO timestamp → local "9:41 PM". */
export function clock(at: number | string): string {
  if (typeof at === "number") {
    // The seeded week sits before demo time zero.
    if (at < 0) return `${duration(-at)} before`;
    const s = Math.round(at);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  const seconds = atSeconds(at);
  return Number.isFinite(seconds)
    ? new Date(seconds * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "—";
}

/** $410, $0, $5,589.89. Shown next to a `demo` StandIn wherever it's a simulated price. */
export function money(usd: number): string {
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(usd) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** How long something has waited: "0:40" under an hour, then "3 h 5 m", then "2 d". */
export function duration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  const s = Math.max(0, Math.round(seconds));
  if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} m`;
  return `${Math.floor(s / 86_400)} d`;
}
