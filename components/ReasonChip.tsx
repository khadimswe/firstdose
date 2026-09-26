import type { Catalog, CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

/** The pharmacy or hub status exactly as it arrived, plus the reject code's NCPDP name. */
export function ReasonChip({
  c,
  catalog,
  className,
}: {
  c: CaseView;
  catalog: Catalog;
  className?: string;
}) {
  if (!c.statusText && !c.rejectCode) return null;
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 rounded-md bg-muted px-2 py-1 font-mono text-xs",
        className,
      )}
    >
      {c.statusText && <span>{c.statusText}</span>}
      {c.rejectCode && (
        <span>
          Reject {c.rejectCode} {catalog.rejectCodes[c.rejectCode]}
        </span>
      )}
    </div>
  );
}
