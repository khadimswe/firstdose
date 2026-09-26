// Stand-in labels that live in code rather than mock/templates.json (PLAN C4, D9).
// Same rule as the template labels: render them with <StandIn>, never hand-write.
import { templates, type StandInKind } from "./templates";

export const CODE_STANDINS = {
  docupdate: "Concept: FirstDose inside DocUpdate · Not affiliated",
} as const;

export type AnyStandInKind = StandInKind | keyof typeof CODE_STANDINS;

export function standInLabel(kind: AnyStandInKind): string {
  return kind in CODE_STANDINS
    ? CODE_STANDINS[kind as keyof typeof CODE_STANDINS]
    : templates.standin_labels[kind as StandInKind];
}
