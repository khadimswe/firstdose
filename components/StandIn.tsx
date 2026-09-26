import { Badge } from "@/components/ui/badge";
import { templates, type StandInKind } from "@/components/copy/templates";
import { cn } from "@/lib/utils";

/** The on-screen label for anything simulated. Never hand-write these strings. */
export function StandIn({ kind, className }: { kind: StandInKind; className?: string }) {
  return (
    <Badge
      variant="outline"
      data-standin={kind}
      className={cn("border-dashed font-normal text-muted-foreground", className)}
    >
      {templates.standin_labels[kind]}
    </Badge>
  );
}

/** The same stand-in label as a full-width band, where a real card puts its "not insurance" line. */
export function StandInBand({ kind, className }: { kind: StandInKind; className?: string }) {
  return (
    <div
      data-standin={kind}
      className={cn(
        "bg-foreground px-4 py-2.5 text-center text-sm font-semibold text-background",
        className,
      )}
    >
      {templates.standin_labels[kind]}
    </div>
  );
}
