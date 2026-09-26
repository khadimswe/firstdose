"use client";

import { useEffect, useRef } from "react";

import { DemoPrice } from "@/components/DemoPrice";
import { ReasonChip } from "@/components/ReasonChip";
import { SideBadge } from "@/components/SideBadge";
import { StandIn } from "@/components/StandIn";
import { WristMirror } from "@/components/WristMirror";
import { Button } from "@/components/ui/button";
import { clock } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { Catalog } from "@/components/data/types";
import { cn } from "@/lib/utils";

import type { Bubble } from "./thread";

function Time({ at, right }: { at: number | string; right?: boolean }) {
  return (
    <div className={cn("mb-1 text-[11px] text-muted-foreground", right && "text-right")}>
      {clock(at)}
    </div>
  );
}

/** The doctor's Impiricus Ascend thread: where FirstDose reaches them, as on their phone. */
export function AscendThread({
  bubbles,
  catalog,
  wrist,
  canHandoff,
  onHandoff,
  onOpenCase,
}: {
  bubbles: Bubble[];
  catalog: Catalog;
  wrist: string | null;
  canHandoff: (caseId: string) => boolean;
  onHandoff: (caseId: string) => void;
  onOpenCase: (caseId: string) => void;
}) {
  // Keep the newest message in view. Scroll the list itself so the page never moves.
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = list.current;
    // Smooth scrolling never finishes in a hidden tab, so jump when not visible.
    const smooth = document.visibilityState === "visible";
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, [bubbles.length]);

  return (
    <aside className="flex h-dvh min-h-0 flex-col border-l bg-muted/50">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-3">
        <StandIn kind="ascend" />
        <SideBadge side="ascend" />
      </header>

      <p role="status" aria-atomic="true" className="sr-only">
        {bubbles.findLast((b): b is Extract<Bubble, { kind: "note" }> => b.kind === "note" && b.tone === "confirmed")?.text ?? ""}
      </p>

      <ol ref={list} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {bubbles.length === 0 && (
          <li className="pt-10 text-center text-sm text-muted-foreground">No messages.</li>
        )}
        {bubbles.map((b) => {
          if (b.kind === "reply") {
            return (
              <li key={b.id} className="flex flex-col items-end">
                <Time at={b.at} right />
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-ascend px-4 py-2 text-white">
                  {b.text}
                </div>
              </li>
            );
          }

          if (b.kind === "alert") {
            return (
              <li key={b.id} className="space-y-2">
                <Time at={b.at} />
                <button
                  type="button"
                  onClick={() => onOpenCase(b.caseId)}
                  className="block max-w-[90%] space-y-2 rounded-2xl rounded-tl-sm border-l-4 border-stuck bg-background p-4 text-left shadow-sm"
                >
                  <div className="text-lg leading-snug font-semibold">{b.title}</div>
                  <div>{b.body}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ReasonChip
                      statusText={b.statusText}
                      rejectCode={b.rejectCode}
                      catalog={catalog}
                    />
                    {b.quoteUsd !== null && <DemoPrice usd={b.quoteUsd} className="text-sm" />}
                  </div>
                </button>
                {!b.answered && (
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-ascend px-5 text-base text-ascend"
                    disabled={!canHandoff(b.caseId)}
                    onClick={() => onHandoff(b.caseId)}
                  >
                    {templates.doctor_alert.action}
                  </Button>
                )}
              </li>
            );
          }

          return (
            <li key={b.id}>
              <Time at={b.at} />
              <div
                className={cn(
                  "max-w-[90%] space-y-1 rounded-2xl rounded-tl-sm bg-background p-4 shadow-sm",
                  b.tone === "confirmed" && "border-l-4 border-started",
                  b.tone === "visit" && "border-l-4 border-foreground",
                )}
              >
                {b.title && <div className="text-lg leading-snug font-semibold">{b.title}</div>}
                <div className={cn(b.title && "text-sm text-muted-foreground")}>{b.text}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="border-t bg-background p-3">
        <WristMirror text={wrist} compact />
      </footer>
    </aside>
  );
}
