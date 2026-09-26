import type { Catalog } from "@/components/data/types";
import { cn } from "@/lib/utils";

/** A pharmacy or hub status exactly as it arrived, plus the reject code's NCPDP name. */
export function ReasonChip({
  statusText,
  rejectCode,
  catalog,
  className,
}: {
  statusText: string | null;
  rejectCode: string | null;
  catalog: Catalog;
  className?: string;
}) {
  if (!statusText && !rejectCode) return null;
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 rounded-md bg-muted px-2 py-1 font-mono text-xs",
        className,
      )}
    >
      {statusText && <span>{statusText}</span>}
      {rejectCode && (
        <span>
          Reject {rejectCode} {catalog.rejectCodes[rejectCode]}
        </span>
      )}
    </div>
  );
}
