// Who the coordinator works for (6.12), with the seeded week (6.1) in the catalog.
// A prescriber who has live demo cases (Dr. Demo) is linked only by a live
// approval: the approve-and-send tap, or Approve on the Profile tab. Seeded
// history never approves them, so the 0:55 beat stays. The seeded background
// cases are always in the coordinator's queue.
import { isWeekCase } from "./catalog";
import { prescriberLinked } from "./derive";
import type { CaseView } from "./types";

export function isLinked(
  prescriber: string,
  cases: CaseView[],
  approved: Readonly<Record<string, unknown>>,
): boolean {
  const live = cases.filter((c) => !isWeekCase(c.id));
  const hasLive = live.some((c) => c.rx.prescriber_label === prescriber);
  return prescriberLinked(prescriber, hasLive ? live : cases, approved);
}

/** Cases the coordinator sees: ordered, and from a linked prescriber or the seeded week. */
export function inQueue(c: CaseView, linked: ReadonlySet<string>): boolean {
  return c.ordered && (linked.has(c.rx.prescriber_label) || isWeekCase(c.id));
}

/** The doctor's phone and the board show only the live demo cases, not the seeded week. */
export function liveCases(cases: CaseView[]): CaseView[] {
  return cases.filter((c) => !isWeekCase(c.id));
}
