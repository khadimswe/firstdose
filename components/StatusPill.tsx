import { Badge } from "@/components/ui/badge";
import type { CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

const LABEL: Record<CaseView["status"], string> = {
  prescribed: "Prescribed",
  stuck: "Stuck",
  handed_off: "With coordinator",
  fix_sent: "Fix sent",
  dispensed: "Dispensed",
  started: "Started",
  never_started: "Never started",
};

/** Red only for stuck, green only for started. */
export function StatusPill({ c, className }: { c: CaseView; className?: string }) {
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
        c.status === "started" && "border-started bg-started text-white",
        className,
      )}
    >
      {LABEL[c.status]}
    </Badge>
  );
}
