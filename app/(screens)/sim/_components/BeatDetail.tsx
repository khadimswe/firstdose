"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { SideBadge } from "@/components/SideBadge";
import { Button } from "@/components/ui/button";
import { clock } from "@/components/copy/fill";
import type { Beat, Catalog } from "@/components/data/types";

import { ACTOR_LABEL, TYPE_LABEL, beatRange } from "./labels";

/** The selected beat's events, field by field, with the raw rows as JSON. */
export function BeatDetail({
  beat,
  who,
  firedIds,
  catalog,
}: {
  beat: Beat;
  who: string;
  firedIds: ReadonlySet<string>;
  catalog: Catalog;
}) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(beat.events, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: the JSON is still selectable below
    }
  }

  return (
    <section className="rounded-2xl border bg-card">
      <header className="flex items-baseline justify-between gap-3 border-b px-5 py-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-muted-foreground">{beatRange(beat)}</div>
          <div className="truncate text-sm font-semibold">{who}</div>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{clock(beat.events[0].at)}</span>
      </header>

      <ol className="divide-y">
        {beat.events.map((e) => (
          <li key={e.id} className="space-y-1.5 px-5 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{e.id}</span>
              <span className="font-medium">{TYPE_LABEL[e.type]}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{ACTOR_LABEL[e.actor]}</span>
              {firedIds.has(e.id) && (
                <span className="text-xs text-muted-foreground">fired</span>
              )}
              <SideBadge side={e.side} className="ml-auto" />
            </div>
            {e.status_text && <div className="font-mono text-xs">{e.status_text}</div>}
            {e.reject_code && (
              <div className="font-mono text-xs text-stuck">
                Reject {e.reject_code} {catalog.rejectCodes[e.reject_code]}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{e.note}</p>
          </li>
        ))}
      </ol>

      <details className="group border-t">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-xs font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
          Raw JSON
          <Button
            size="xs"
            variant="ghost"
            className="gap-1"
            onClick={(e) => {
              e.preventDefault(); // don't toggle the <details>
              void copy();
            }}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </summary>
        <pre className="max-h-72 overflow-auto bg-muted px-5 py-3 font-mono text-[11px] leading-relaxed">
          {json}
        </pre>
      </details>
    </section>
  );
}
