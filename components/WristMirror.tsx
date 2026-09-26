import { cn } from "@/lib/utils";

/** Notification text preview; device receipt is verified separately. */
export function WristMirror({ text, compact }: { text: string | null; compact?: boolean }) {
  return (
    <figure className="space-y-2">
      <div
        className={cn(
          "mx-auto flex aspect-square items-center justify-center rounded-full border-neutral-800 bg-black text-center leading-snug text-white",
          compact ? "w-32 border-[6px] p-4 text-[10px]" : "w-44 border-8 p-6 text-[13px]",
        )}
      >
        {text ?? <span className="text-neutral-500">No alerts</span>}
      </div>
      <figcaption className="text-center text-xs text-muted-foreground">
        Notification preview · Garmin via ntfy
      </figcaption>
    </figure>
  );
}
