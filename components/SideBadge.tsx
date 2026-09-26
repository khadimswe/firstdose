import { Badge } from "@/components/ui/badge";
import type { Side } from "@/components/data/types";
import { cn } from "@/lib/utils";

/** Which side of the who-sees-what line an event lives on (docs/who-sees-what.md). */
export function SideBadge({ side, className }: { side: Side; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        side === "practice" ? "border-practice text-practice" : "border-ascend text-ascend",
        className,
      )}
    >
      {side === "practice" ? "Practice side" : "Impiricus Ascend side"}
    </Badge>
  );
}
