// The who-sees-what split, worded exactly as in docs/who-sees-what.md, laid out
// like a permissions list: what each side holds, what it sends, and what it
// never sends or receives.
import { ArrowLeftRight, ArrowUpRight, Database, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

type Row = { icon: typeof Database; title: string; text: string; locked?: boolean };

const PRACTICE: Row[] = [
  {
    icon: Database,
    title: "Holds",
    text: "The chart, patient names, insurance detail, fill status, the coordinator's queue, the before-visit card, the doctor's alerts",
  },
  {
    icon: ArrowUpRight,
    title: "Sends out",
    text: 'Drug, insurance type (commercial / government), state, and "started / recovered" counts with no names',
  },
  {
    icon: Lock,
    title: "Never sends",
    text: "The chart, names, dates of birth, prescription counts per doctor",
    locked: true,
  },
];

const ASCEND: Row[] = [
  {
    icon: Database,
    title: "Holds",
    text: "The Ascend channel the doctor already uses (the alert carries no chart), copay and sample program options, the Wallet link, the FDA's label text, aggregate recovery stats",
  },
  {
    icon: ArrowUpRight,
    title: "Sends out",
    text: "Program options and links, label text",
  },
  {
    icon: Lock,
    title: "Never receives",
    text: "Anything that identifies a patient, or how much any doctor prescribes",
    locked: true,
  },
];

const RULES = [
  "The doctor picks the drug. FirstDose never suggests one. It only acts after the order is signed.",
  "The FDA's words are shown exactly as written. No AI-written drug claims.",
  "Nobody is paid per prescription. Market Access pays per patient recovered, measured in aggregate.",
];

function Side({ title, tone, rows }: { title: string; tone: "practice" | "ascend"; rows: Row[] }) {
  return (
    <section className="rounded-2xl border bg-card">
      <h3
        className={cn(
          "border-b px-5 py-3 text-sm font-semibold",
          tone === "practice" ? "text-practice" : "text-ascend",
        )}
      >
        {title}
      </h3>
      <ul className="divide-y">
        {rows.map(({ icon: Icon, title: rowTitle, text, locked }) => (
          <li key={rowTitle} className="flex gap-3 px-5 py-4">
            <Icon
              aria-hidden
              className={cn("mt-0.5 size-4 shrink-0", locked ? "text-stuck" : "text-muted-foreground")}
            />
            <div className="space-y-0.5">
              <div className={cn("text-sm font-medium", locked && "text-stuck")}>{rowTitle}</div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WhoSeesWhat() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Who sees what</h2>
      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Side title="Practice side (the doctor's office)" tone="practice" rows={PRACTICE} />
        <ArrowLeftRight aria-hidden className="mx-auto size-5 text-muted-foreground max-md:rotate-90" />
        <Side title="Impiricus Ascend side (drug company)" tone="ascend" rows={ASCEND} />
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {RULES.map((rule, i) => (
          <li key={rule} className="flex gap-3 rounded-2xl border bg-card p-4 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {i + 1}
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
