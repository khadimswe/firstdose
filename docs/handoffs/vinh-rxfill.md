# Vinh → Deem: simulated RxFill vocabulary (6.5)

September 26, 2026. Additive presentation module: `lib/rxfill.ts`. Deem owns the `/sim` raw-message toggle; this branch supplies its data projection. No mock contract, workflow, store, screen or package changes. No transport integration or certified NCPDP payload is claimed.

## Toggle wiring

Use the selected **existing event**, whether from the offline script or the guarded live `/api/events` snapshot:

```tsx
import { projectRxFill } from "@/lib/rxfill";
import { StandIn } from "@/components/StandIn";

const raw = selectedEvent ? projectRxFill(selectedEvent) : null;
// Inside the existing console's expanded raw-message panel:
// <StandIn kind="pharmacy" />
// <pre>{JSON.stringify(raw ?? selectedEvent, null, 2)}</pre>
```

The existing `StandIn` pharmacy kind renders "Simulated pharmacy · real RxFill vocabulary" from the copy contract. Keep its disclosure visible whenever the panel is expanded. Do not display `synthetic_example` alone or describe this JSON as an actual pharmacy wire message. All examples carry `simulated: true` and `wire_payload: false`. Non-pharmacy and non-practice events return `null`; show the original event without an RxFill interpretation.

| Field | Meaning |
| --- | --- |
| `source_event` | A fresh copy of every original field, including `id`, `case_id`, relative/ISO `at`, `status_text`, note, reject code and amount. Render the original pharmacy status verbatim. |
| `source_kind` | `claim`, `fill_status` or `other`; a claim remains a claim. |
| `request_context` | **Invented prescriber preference** for a NewRx, separately labelled simulated. `SCRIPT_reference: "2023011"`, `RxFillIndicator: ["All"]`. This was never sent, received or negotiated. |
| `RxFill` | Vocabulary fragment for an explicit simulated pharmacy `status` or `dispensed` event. At most one `FillStatus` child: `NotDispensed`, `Dispensed`, `PartiallyDispensed` or `Transferred`. |
| `dispensing_status` | Explicit simulation status for those dedicated events only; never a payment interpretation or evidence of real pickup/ingestion. |
| `synthetic_example` | Optional vocabulary illustration from a legacy claim's exact status text. Its `basis` is `legacy_status_text_only`; it supplies no dispensing outcome. |

The core fixture's `ev_04` produces a synthetic `NotDispensed` illustration using its unchanged note; `ev_11` produces a synthetic `Dispensed` illustration. Both keep `RxFill: null` and `dispensing_status: null` because their event type is `claim_run`. The existing workflow still treats the independent simulated pharmacy event `ev_11` with exact `status_text: "Dispensed"` as its confirmation. The projection has no routing or state authority and does not change that behavior. The eight seed-week pharmacy confirmations follow the same legacy presentation rule.

James's `ev_16` keeps reject code `75`, raw status and note, with no RxFill or synthetic illustration. A reject code, a paid claim, a dollar amount, a hub note or a patient card tap cannot establish pharmacy non-dispensing or dispensing. Unknown/case-altered status strings and contradictory dispensing/reject fields fail closed; their original fields remain visible. Application reason enums and claim reject codes never become SCRIPT `ReasonCode` values.

## Verified semantics and boundaries

NCPDP's August 2026 implementation recommendations distinguish prescriber opt-in from pharmacy fill reporting (§14.4.1–4). Dispensed notifications follow pickup/shipment, rather than preparing a prescription or adjudicating a claim. Return to stock may prompt a NotDispensed notification; timing depends on pharmacy policy. Known non-dispensing context may use `FillStatus/NotDispensed/Note` (§14.4.6). `RxFillIndicator` changes by SCRIPT version: 2017071 uses a single combined preference; 2023011 allows repeatable discrete values including `All` (§23.4.6). It must be supplied on each intended fillable transaction rather than assumed to carry forward (§4.4.58). [NCPDP SCRIPT implementation recommendations](https://www.ncpdp.org/NCPDP/media/pdf/SCRIPT-Implementation-Recommendations.pdf).

ASTP/ONC describes `RxFillIndicator` as the prescriber's notification intent and RxFill as pharmacy-to-prescriber fill status. Both systems must support/configure exchange, and prescription matching requires the original electronic prescription. [ASTP/ONC interoperability guidance](https://isp.healthit.gov/allows-a-pharmacy-notify-a-prescriber-prescription-fill-status).

This JSON omits SCRIPT envelopes, pharmacy/prescriber/patient identity, prescription matching, medication detail, quantities and destination pharmacy. Partial/transferred status fragments therefore illustrate vocabulary only. No XSD validation, wire serialization, network exchange, certification, participation or production availability is asserted. No `LastFillDate` is invented from the demo clock. This is a read-only projection, usable on the server or client without keys, I/O or an additional endpoint; it is not a parser for incoming untrusted SCRIPT traffic. Keep it on practice/simulator surfaces, never Market Access payloads.

## Validation and remaining integration

Focused tests cover raw preservation, request context, legacy versus dedicated event types, reject/payment ambiguity, unknown/contradictory status, pharmacy/practice boundaries, reason-code separation, offline/live seed parity, allocation safety and Maria's unchanged workflow confirmation. Verification: 305 tests (27 focused), lint, typecheck and production build pass. Next's generated route types must exist before standalone `tsc`; the fresh worktree's initial typecheck reported missing `PageProps`/`LayoutProps`, resolved by the normal build without changing source. A read-only review found no blockers and independently passed all 27 focused tests.

Deem's actual toggle implementation and browser validation remain. Owner review and branch integration remain; no hosted apply, send, deployment, push or merge is part of this handoff.
