import { StandIn } from "@/components/StandIn";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import type { CaseView } from "@/components/data/types";
import { cn } from "@/lib/utils";

export function PatientRail({
  cases,
  selectedId,
  onSelect,
}: {
  cases: CaseView[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-1 overflow-y-auto border-r p-3">
      <h2 className="px-2 pb-1 text-xs font-semibold text-muted-foreground">Patients</h2>
      {cases.map((c) => (
        <Button
          key={c.id}
          variant="ghost"
          aria-current={c.id === selectedId ? "true" : undefined}
          onClick={() => onSelect(c.id)}
          className={cn(
            "h-auto flex-col items-start gap-1 p-2 text-left whitespace-normal",
            c.id === selectedId && "bg-muted",
          )}
        >
          <span className="font-medium">{c.patient.name}</span>
          <span className="text-xs text-muted-foreground">
            {c.drug.brand} · {c.patient.condition_label}
          </span>
          <StatusPill c={c} />
        </Button>
      ))}
      <StandIn kind="patients" className="mt-auto h-auto whitespace-normal" />
    </nav>
  );
}
