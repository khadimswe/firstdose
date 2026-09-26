"use client";

import { useState } from "react";
import { Check, CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { liveCases } from "@/components/data/links";
import { useEvents } from "@/components/data/useEvents";
import { cn } from "@/lib/utils";

import { useHandoff } from "./ApproveSheet";
import { reasonShort } from "./FillLine";
import { NewTag } from "./NewTag";

function Option({
  label,
  checked,
  disabled,
  onToggle,
  isNew = false,
  children,
}: {
  label: string;
  /** A request type FirstDose adds to DocUpdate's Concierge. */
  isNew?: boolean;
  checked: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl bg-white p-4 text-foreground shadow-sm",
        checked && "ring-2 ring-du-purple",
        disabled && "opacity-70",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-left"
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded border",
            checked && "border-du-purple bg-du-purple text-white",
          )}
        >
          {checked && <Check className="size-3.5" />}
        </span>
        <span className="font-medium">{label}</span>
        {isNew && <NewTag inControl className="ml-auto" />}
      </button>
      {children}
    </div>
  );
}

/**
 * Surface 3: Concierge gets one more request type. "Help my patient start"
 * sends a stuck case to the coordinator through the same handoff as the alert.
 */
export function Concierge() {
  const { cases: allCases, canAct } = useEvents();
  const cases = liveCases(allCases);
  const { request, sheet } = useHandoff();
  const [help, setHelp] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const stuck = cases.filter((c) => canAct("handoff", c.id));
  const chosen = stuck.find((c) => c.id === picked) ?? stuck[0];
  const sent = cases.find((c) => c.id === sentId && !canAct("handoff", c.id));

  return (
    <div className="space-y-4">
      <header className="space-y-1 pt-1 text-center">
        <h1 className="text-xl font-semibold">Concierge</h1>
        <p className="text-sm text-white/75">Ask for samples, a rep, or help getting a patient started.</p>
      </header>

      <Option label="Request free samples" checked={false} disabled />
      <Option label="Speak with a rep" checked={false} disabled />
      <Option label="Help my patient start" isNew checked={help} onToggle={() => setHelp((h) => !h)}>
        {help && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Sends the prescription to your access coordinator. A rule picks the fix; they reach the patient.
            </p>
            {stuck.length === 0 ? (
              <p className="rounded-xl bg-muted px-3 py-2 text-sm">No patients are waiting on a first fill.</p>
            ) : (
              <div className="grid gap-2">
                {stuck.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={c.id === chosen?.id}
                    onClick={() => setPicked(c.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left",
                      c.id === chosen?.id && "border-du-purple ring-1 ring-du-purple",
                    )}
                  >
                    <span className="block text-sm font-medium">
                      {c.patient.name} · {c.drug.brand}
                    </span>
                    <span className="block text-xs text-stuck">{reasonShort(c)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Option>

      {sent && (
        <p className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm">
          <CircleCheck className="size-4" /> Sent to your coordinator: {sent.patient.name} · {sent.drug.brand}
        </p>
      )}

      <Button
        className="h-12 w-full rounded-full bg-du-purple text-base text-white hover:bg-du-purple/90"
        disabled={!help || !chosen}
        onClick={() => {
          if (!chosen) return;
          setSentId(chosen.id);
          request(chosen.id);
        }}
      >
        Submit
      </Button>
      {sheet}
    </div>
  );
}
