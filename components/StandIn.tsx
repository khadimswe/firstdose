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
