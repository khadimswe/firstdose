import { Badge } from "@/components/ui/badge";
import { standInLabel, type AnyStandInKind } from "@/components/copy/standins";
import { cn } from "@/lib/utils";

/** The on-screen label for anything simulated. Never hand-write these strings. */
export function StandIn({ kind, className }: { kind: AnyStandInKind; className?: string }) {
  return (
    <Badge
      variant="outline"
      data-standin={kind}
      className={cn("border-dashed font-normal text-muted-foreground", className)}
    >
      {standInLabel(kind)}
    </Badge>
  );
}

/** The same stand-in label as a full-width band, where a real card puts its "not insurance" line. */
export function StandInBand({ kind, className }: { kind: AnyStandInKind; className?: string }) {
  return (
    <div
      data-standin={kind}
      className={cn(
        "bg-foreground px-4 py-2.5 text-center text-sm font-semibold text-background",
        className,
      )}
    >
      {standInLabel(kind)}
    </div>
  );
}
