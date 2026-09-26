import { StandIn } from "@/components/StandIn";
import { money } from "@/components/copy/fill";
import { cn } from "@/lib/utils";

/** A simulated price. Always carries the `demo` StandIn. */
export function DemoPrice({ usd, className }: { usd: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="tabular-nums">{money(usd)}</span>
      <StandIn kind="price" />
    </span>
  );
}
