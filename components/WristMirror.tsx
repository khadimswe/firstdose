/** What the doctor's watch shows: event.wrist exactly as sent to ntfy. */
export function WristMirror({ text }: { text: string | null }) {
  return (
    <figure className="space-y-2">
      <div className="mx-auto flex aspect-square w-44 items-center justify-center rounded-full border-8 border-neutral-800 bg-black p-6 text-center text-[13px] leading-snug text-white">
        {text ?? <span className="text-neutral-500">No alerts</span>}
      </div>
      <figcaption className="text-center text-xs text-muted-foreground">
        Garmin Forerunner 55 · via ntfy
      </figcaption>
    </figure>
  );
}
