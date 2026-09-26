// Fills {variables} in a templates.json string. A missing variable stays visible
// as {name} so it gets noticed on screen instead of silently disappearing.
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in vars) return String(vars[key]);
    if (process.env.NODE_ENV !== "production") {
      console.error(`fill(): missing {${key}} in "${template}"`);
    }
    return match;
  });
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
