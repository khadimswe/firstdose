# FirstDose: three-person build plan

Updated September 26, 2026. Status: Vinh approved the role split for Vinh, Minh, and Deem; implementation contracts still require review. Planning branch: `plan/vinh-minh-phases`, rebased onto `80646f7`. This is an audit/planning change; application behavior and the frozen mock contract are unchanged.

## Main objective

Demonstrate one complete, repeatable access-follow-up loop: a fictional prescription encounters a documented barrier, the doctor receives an alert, a coordinator reviews the suggested administrative action, the patient receives the resource, and a separate simulated pharmacy confirmation records the first fill.

The outcome we can demonstrate is **a first fill observed after follow-up**, not medication ingestion, clinical recovery, or proof that our intervention caused the fill. The proposed contribution is the reason, assignment, and follow-up workflow designed for an Ascend integration. Actual Ascend, Wallet, pharmacy, hub, and sample-partner integrations remain disclosed stand-ins.

**First milestone:** Maria alone, button handoff, a sourced label, doctor/coordinator/patient views and a simulator, real shared state across two devices, and an early physical watch test. The board can begin as a simple status view. Voice, the second case, richer board animation, and analytics follow the core loop.

## Starting point and source priority

- `main` / `origin/main` at `80646f7` now includes Deem's full screen stack, dashboard, implementation plan and task trackers. This planning branch was rebased onto that push.
- Reuse the existing `components/data/*` foundation and `EventSource`; do not build a competing frontend data layer. Deem's checked-off tasks establish UI work, not completed source/backend/device gates.
- Supabase/API/schema, Realtime adapter, real providers, source-verified labels and physical delivery remain pending. See [current status](../STATUS.md).
- The supplied ten-page `FirstDose-Spec.md.pdf` is an earlier reference. Its Stephen/Deem ownership and SpotCheck split are superseded by the user's current Vinh/Deem/Minh team. Its instructions do not authorize implementation, publication, or contacting people.
- Current user direction governs team/scope. Existing `AGENTS.md` and the agreed mock contract govern implementation until a reviewed contract PR changes them. This proposal explicitly identifies changes requiring that review; it does not silently supersede them.
- The previous FirstDose review's corrections are carried forward: distinguish acknowledgment from dispensing, review eligibility, allow unknown reasons, and enforce privacy boundaries.

The [audit](../audit/2026-09-25-repository-audit.md) lists evidence and remaining verification limits. The [Phase 0 checklist](phase-0-contract-and-readiness.md) is the next work package.

## Roles and file ownership

Vinh confirmed that Minh has backend and AI experience. The user-approved split below gives Minh independent data and AI modules while Vinh owns the authoritative workflow and integration. Minh's available hours remain unconfirmed; the allocation no longer needs another approval from Vinh.

| Owner | Owns | Initial deliverable | Later work |
|---|---|---|---|
| **Vinh** | Shared backend contract; deterministic router; case transitions; Supabase schema/policies; command APIs; simulator backend; `lib/realtime.ts`; ntfy/watch | Maria's authoritative workflow and the `EventSource` adapter Deem can connect | Integration/reliability checks; Grok handoff backend if time remains |
| **Minh** | RxNorm/DailyMed retrieval and source verification; label fixtures; Gemini reason classifier; analytics projection and Tiger integration | Verified Otezla identity and source-backed label payload with a reproducible fidelity test; then Humira | Validated Gemini classification, then Tiger projection/summary and retry tests |
| **Deem** | All screen and presentation components; `components/data/*` hook/store/view derivation; styles; frontend actions; demo/video/write-up | Mergeable foundation plus doctor/coordinator/patient/simulator screens using agreed fixtures | Board, access screen, QR interaction, mobile checks, submission assets |

**File boundaries:** Vinh owns `supabase/`, `lib/workflow/`, `lib/router.ts`, `lib/realtime.ts`, `lib/notifications/`, `lib/voice/`, and workflow `app/api/` handlers. Minh owns `lib/labels/`, `lib/classifier/`, `lib/analytics/`, `scripts/labels/`, `tests/labels/`, `tests/classifier/`, `tests/analytics/`, `/api/label/[drug_id]`, and `/api/access/summary`. Deem owns `app/` screen routes, `components/`, UI assets, and visual copy, including microphone capture if voice is added. These are proposed backend paths; Deem's frontend work already exists on the stacked screen/design branches.

Vinh owns the shared Supabase migration sequence. Minh supplies the label/analytics requirements and Tiger migrations rather than editing the same Supabase file concurrently. Vinh owns shared dependency/config changes and integrates requests from Minh. All three review affected contract changes; Vinh and Deem approve changes to `mock/*.json` under the current repo rule. Minh generates label content, but merges it through that same contract process.

Minh's order is labels first (a never-cut dependency), Gemini classification next, then Tiger analytics. His classifier returns only a validated reason and bounded supporting note, with unknown/failure behavior; Vinh's deterministic router remains the sole selector of administrative actions. Agree this input/output boundary during Phase 0 so Minh can implement without editing Vinh's workflow. The Maria core must work with a supplied reason even if Gemini is unavailable.

## Approach and trade-offs

1. **Recommended: one-case vertical slice, then parallel additions.** Vinh builds state/actions, Minh builds verified labels, Deem builds views. They converge on Maria before adding providers. This exposes integration errors early.
2. **All integrations at once:** closer to the original checklist, but splits Vinh across schema, AI, watch, labels, analytics, and voice before any complete flow exists. Reject for the first milestone.
3. **Mock-only presentation:** useful for offline fallback and screen development. It cannot prove cross-device synchronization or live provider integration. Preserve it as a disclosed fallback.

## Phases and gates

Times below retain the existing team's target checkpoints in America/New_York; they are not independently verified organizer deadlines. Phase 0's old Friday 9 PM target has already passed. Begin it now and measure completion by gates, not retroactive checkmarks. If the 4 AM target is no longer achievable, explicitly rebaseline with the team and cut optional scope.

| Phase | Vinh | Minh | Deem dependency/handoff | Exit gate |
|---|---|---|---|---|
| **0. Contract and readiness** — next work block | Resolve events/eligibility/privacy/reset contracts; test phone-to-watch path; establish backend branch | Verify first label source and identity; agree label payload | Review affected types/actions and foundation PR; keep current screen work | Approved contract examples, agreed ownership, reproducible baseline checks, recorded watch result |
| **1. Maria core loop** — target Sat 4 AM | Schema + policies, validated commands, router, simulator, Realtime adapter, notification delivery | Otezla source cache + exact-text verifier + label endpoint | Doctor/coordinator/patient/simulator views; hook wiring | Two devices complete the loop; patient tap cannot create a fill; duplicate actions are harmless; label source verified |
| **2. Evidence and second case** — target Sat 10 AM | Integrate Minh's classifier into validated commands; reconnect/reset behavior; support James's unresolved case | Humira source/boxed-warning verification; Gemini enum classifier with unknown fallback; then Tiger direct summary + deduplicated retryable projection | Board, unresolved before-visit card, aggregate display | Maria completes; James stays unresolved until evidence changes; real/cached/simulated states visible; analytics freshness honest |
| **3. Sponsor validation and cut check** — workshop target Sat 11 AM, cuts Sat 2 PM | Validate practical partner feed/channel boundaries with sponsor; adjust claims based on answers | Verify remaining integration evidence and source traceability | Deem owns pitch changes and captures workshop answers | Written decisions on overlap, partner interfaces, and remaining scope; no invented sponsor claims |
| **4. Optional voice and rehearsal** — target Sat 6 PM | Grok transcript to confirmed handoff; physical-device rerun | Failure-path and analytics verification; optional sourced audio support | QR on another phone, full demo, mobile screenshots, recording | Repeatable tap path plus optional voice; actual comparison results, no staged baseline failure |
| **5. Freeze and ship preparation** — Sat 9 PM onward | Integration review, permissions/secrets checks, release notes | Label/metric evidence checklist and backup data | Deem owns video/write-up/poster/submission; team checks deployed loop | Evidence-backed feature list, fallback recording, no unresolved core blockers; deployment/submission require the team's release action |

The order protects three dependencies: the contract unblocks all contributors; authoritative case actions are the critical path; the two-device Maria run is the first convergence gate. The physical watch and real label sources are tested early because neither can be proved by a mocked unit test. Optional integrations get the remaining buffer.

## Contract decisions to settle in Phase 0

1. **Observed outcome:** `/api/patient/use` records resource acknowledgment only. The operator's separate pharmacy action emits `dispensed`. Update mock actions, templates, derived state, and metrics together. Do not treat `started` or `recovered` as evidence of ingestion or health recovery.
2. **Reason and eligibility:** add `UNKNOWN` / needs review and explicit `unknown | eligible | ineligible` eligibility with review evidence. Insurance is a restriction, not automatic approval. Generic unfilled/unreachable statuses cannot establish cost or sample eligibility. Keep `ACCESS_SUPPORT` as the safe administrative fallback; outreach is coordinator work.
3. **Authority:** one validated server command appends events and updates case state transactionally. Reject wrong roles, invalid order, and arbitrary client-selected fixes. Deduplicate commands and event deliveries.
4. **Run identity:** preserve Deem's fixture IDs (`ev_01`, etc.) as script IDs, add a run/session identity, and key storage by run + event ID. Reset creates/switches a demo run rather than deleting everybody's events. Add reset/run-change delivery or a full reload path; an insert-only subscription cannot report a deletion.
5. **Time:** define one run clock and convert fixture offsets to timestamps consistently. TTFF uses first `dispensed` minus `prescribed`; use each case's actual scenario origin, not the storyboard's display offset. Keep historical James timestamps coherent.
6. **Privacy:** practice records remain practice-side. Build explicit allowlisted partner and aggregate DTOs; `side: ascend` is display metadata, not permission to export a full event. Patient sessions can access only their case. No raw notes, names, case IDs, or prescription counts by prescriber go to the Ascend stand-in.
7. **Frontend seam:** build on `EventSource` in Deem's foundation. Agree any signature additions before implementation; Deem wires the hook and rendering, Vinh supplies `lib/realtime.ts`. Live-mode failure is visible, not silent mock success. Patient/access views need appropriately scoped data paths rather than importing the entire practice catalog in live mode.
8. **Labels:** verify drug/strength/form and SPL source/version. Preserve literal source text and exact bytes where the current rule requires them; do not set `byte_exact` on manually entered or normalized text. If XML markup prevents the requested raw-substring test, document and jointly approve a source-text fidelity rule before changing the contract. An absent boxed warning and unavailable source are distinct states.
9. **Analytics:** Supabase is authoritative. Mirror a minimal practice-side projection to Tiger using durable retry state and run/event deduplication. Export only aggregate summaries to the partner view. Analytics failure must not roll back the patient workflow. Start with a direct query; a continuous aggregate is a later optimization after freshness and median semantics are verified.

## Small PR sequence

Current branch holds the audit, approved role allocation, implementation playbooks and presentation preparation only. Keep it separate from implementation. The user authorized pushing this planning branch after Deem's push; main integration remains a later reviewed PR.

1. Deem's foundation/screens are now in main. Review the outstanding contract blockers, then Vinh and Minh branch from the agreed contract base; do not copy frontend files into competing implementations.
2. `contract/core-loop-v1` — Vinh leads the coordinated fixture/types/API update; Deem reviews frontend compatibility, Minh reviews label/metric inputs. This is the one shared prerequisite PR.
3. `backend/maria-core` — Vinh: validated workflow, router, schema/policies, simulator routes; small coherent commits.
4. `data/verified-labels` — Minh: source retrieval, stored evidence, label handler and tests. Can proceed independently after the payload is agreed.
5. `backend/realtime-watch` — Vinh: adapter, reset/reconnect handling, notification attempts/retry; Deem's small hook-wiring PR integrates it.
6. `backend/reason-classifier` — Minh: validated enum output, bounded note, unknown/timeout/malformed-output handling; Vinh reviews and integrates it into the workflow after the tap path works.
7. `data/access-metrics` — Minh: Tiger projection and direct summary, after event semantics stabilize.
8. `backend/voice-handoff` — Vinh: transcription and confirmed handoff endpoint after the complete tap path; Deem owns microphone capture and confirmation UI.

Each PR states behavior, evidence, limits, and affected contracts. Review before merge. Rebase/update from current main between modules; do not keep all weekend work in one long-lived branch. Tell teammates about contract changes through the team's chosen channel; this plan does not send messages on anyone's behalf.

## Required verification and cuts

- Router: every supported reason x insurance, plus unknown insurance/reason and missing eligibility. Government coverage never returns a manufacturer card; inaccessible patient does not automatically receive a sample.
- Workflow: wrong-order actions, duplicate requests, retry after timeout, two simultaneous handoffs, resource acknowledgment without dispensing, and failed/rerun pharmacy confirmation.
- Access: patient A cannot read patient B; patient cannot operate simulator/reset; aggregate and partner responses expose only allowed fields; secrets remain server-side.
- Realtime: initial load plus concurrent insert, reconnect/deduplication, two-device reset/new-run behavior.
- Labels: identity/version evidence, exact source match, altered-text failure, missing section, no boxed warning versus missing source, cached/offline disclosure.
- Metrics: one fill counts once; unresolved cases excluded from TTFF; elapsed time is nonnegative and based on pharmacy confirmation; Tiger outage leaves actions usable; retry does not double count.
- Delivery: actual phone/watch test and two-phone run are manual gates. Record pass/fail, device, time, and fallback; screenshots are not proof of current delivery.

Preserve the existing never-cut set: doctor alert, reviewed handoff/action, separate pharmacy re-run/confirmation, sourced DailyMed label, and enforced who-sees-what split. Cut label diffs, custom Connect IQ widget, voice, and the `/access` screen in that order if the core slips. Keep the mirrored-notification path; if physical delivery fails, report the limitation and use the disclosed phone/recording fallback. At the 4 AM core miss, stop optional provider work immediately rather than waiting until 2 PM.

## Open decisions

| Decision | Owner | Blocks |
|---|---|---|
| Minh's available hours and acceptance of labels → classifier → analytics (backend/AI experience confirmed) | Vinh + Minh | Final workload, not this planning draft |
| Contract corrections and foundation integration | Vinh + Deem, with Minh reviewing his payloads | Schema and live adapter implementation |
| Actual watch delivery result | Vinh with phone/watch | Claim of wearable support |
| Verified source IDs, display sections, and fidelity method | Minh + Vinh | Real-label gate |
| Practice/partner boundary and demo credentials | Vinh + Deem | Live multidevice deployment |
| Organizer deadlines, allowed tracks, sponsor APIs/permission | Team | Submission and integration claims |

## Source checks used for this plan

The manufacturer's page makes program eligibility conditional and describes specialty-pharmacy delivery, so the fixture's retail walk-in story needs explicit validation or revision: [Otezla cost and copay](https://www.otezla.com/plaque-psoriasis/cost-and-copay). Treat any dollar outcome as a declared demo scenario.

Server-only service credentials and role-scoped data access follow [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security). Aggregate freshness must be configured and measured, as described in [Tiger Data real-time aggregates](https://www.tigerdata.com/docs/use-timescale/latest/continuous-aggregates/real-time-aggregates/). These source checks do not prove the integrations run in this repository.

## Current execution and presentation index

All phases now have [individual playbooks](README.md). Use the [winning conditions](../winning-conditions.md) to prioritize scope, the [product proposal](../product-proposal.md) for the objective, and the [presentation package](../presentation/README.md) for timed scripts, slide copy and Q&A. Track choices and unconfirmed organizer requirements are in the [entry strategy](../research/tracks-and-requirements.md). These documents do not mark implementation gates complete.

Separate branches are explicitly required by the user. Follow the [branch workflow](../branch-workflow.md) for ownership, stack integration, shared-file reviews and PR order. The watch remains core; only the custom Connect IQ widget is optional.
