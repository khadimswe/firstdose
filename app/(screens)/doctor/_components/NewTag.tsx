import { cn } from "@/lib/utils";

/**
 * Marks what FirstDose adds to the DocUpdate-style view. Anything untagged is
 * DocUpdate's existing screen, so the demo shows new value layered on what
 * Impiricus already ships rather than a rebuild of it.
 */
export function NewTag({
  tone = "light",
  inControl = false,
  className,
}: {
  /** "dark" on the navy background, "light" on white cards. */
  tone?: "light" | "dark";
  /** Inside a button, the tag stays out of the button's accessible name. */
  inControl?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden={inControl || undefined}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold whitespace-nowrap",
        tone === "light" ? "bg-du-purple/10 text-du-purple" : "bg-white/15 text-white",
        className,
      )}
    >
      New · FirstDose
    </span>
  );
}
