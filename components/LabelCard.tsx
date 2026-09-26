"use client";

// Renders label.sections[].text exactly as stored. Long sections are shortened
// with CSS line-clamp only, so the words in the DOM are always the label's words.
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { StandIn } from "@/components/StandIn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Drug, Label, LabelSection } from "@/components/data/types";
import { cn } from "@/lib/utils";

const BOXED_WARNING = "34066-1";
const CLAMP_OVER_CHARS = 280;

function Section({ section }: { section: LabelSection & { text: string } }) {
  const [open, setOpen] = useState(false);
  const boxed = section.loinc === BOXED_WARNING;
  const long = section.text.length > CLAMP_OVER_CHARS;

  return (
    <section
      className={cn("space-y-1", boxed && "rounded-md border-2 border-foreground p-3")}
    >
      <h3 className="text-xs font-semibold tracking-wide">{section.title}</h3>
      <p className={cn("text-sm whitespace-pre-line", long && !open && "line-clamp-4")}>
        {section.text}
      </p>
      {long && (
        <Button variant="link" size="xs" className="px-0" onClick={() => setOpen(!open)}>
          {open ? "Show less" : "Show full"}
        </Button>
      )}
    </section>
  );
}

/** Collapsed row for order time: title only until opened; opened text is verbatim. */
function CollapsedSection({ section }: { section: LabelSection & { text: string } }) {
  return (
    <details className="group rounded-md border px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold tracking-wide [&::-webkit-details-marker]:hidden">
        {section.title}
        <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" />
      </summary>
      <p className="mt-2 text-sm whitespace-pre-line">{section.text}</p>
    </details>
  );
}

/**
 * mode="order" is for the moment of prescribing: the boxed warning stays open
 * and every other section starts collapsed.
 */
export function LabelCard({
  label,
  drug,
  mode = "full",
}: {
  label: Label;
  drug: Drug;
  mode?: "full" | "order";
}) {
  const sections = [...label.sections]
    .filter((s): s is LabelSection & { text: string } => s.text !== null)
    .sort((a, b) => Number(b.loinc === BOXED_WARNING) - Number(a.loinc === BOXED_WARNING));

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>
          {drug.brand} ({drug.generic}) · DailyMed {label.setid}
        </CardTitle>
        {label.byte_exact ? (
          <StandIn kind="label" className="border-started text-started" />
        ) : (
          <Badge variant="destructive">PLACEHOLDER, not label text</Badge>
        )}
      </CardHeader>
      <CardContent className={cn(mode === "order" ? "space-y-2" : "space-y-4")}>
        {sections.map((s) =>
          mode === "order" && s.loinc !== BOXED_WARNING ? (
            <CollapsedSection key={s.loinc} section={s} />
          ) : (
            <Section key={s.loinc} section={s} />
          ),
        )}
      </CardContent>
    </Card>
  );
}
