import { templates } from "@/components/copy/templates";
import { cn } from "@/lib/utils";

/** The one honest line per app shell: synthetic patients, partner names as a concept (PLAN D3, revised). */
export function Disclosure({ className }: { className?: string }) {
  return (
    <p data-disclosure className={cn("text-[11px] leading-snug text-muted-foreground", className)}>
      {templates.disclosure.footer}
    </p>
  );
}
