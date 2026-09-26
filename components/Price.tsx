import { money } from "@/components/copy/fill";
import { cn } from "@/lib/utils";

/** A price from the case data, formatted. Its context comes from the surrounding copy. */
export function Price({ usd, className }: { usd: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{money(usd)}</span>;
}
