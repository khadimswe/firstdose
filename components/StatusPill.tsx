import { Badge } from "@/components/ui/badge";
import type { CaseView } from "@/components/data/types";
import { hasConfirmedFill } from "@/components/data/derive";
import { cn } from "@/lib/utils";

const LABEL: Record<CaseView["status"], string> = {
  prescribed: "Prescribed",
  stuck: "Stuck",
  handed_off: "With coordinator",
  fix_sent: "Fix sent",
  dispensed: "Fill pending",
  started: "Fill pending",
  never_started: "Fill pending",
};

/** Green requires the independent pharmacy confirmation. */
export function StatusPill({ c, className }: { c: CaseView; className?: string }) {
  const confirmed = hasConfirmedFill(c);
  if (!c.ordered) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        Not prescribed
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        c.status === "stuck" && "border-stuck bg-stuck text-white",
        confirmed && "border-started bg-started text-white",
        className,
      )}
    >
      {confirmed ? "Fill confirmed" : LABEL[c.status]}
    </Badge>
  );
}
