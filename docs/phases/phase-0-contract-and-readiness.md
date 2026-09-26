# Phase 0: contract and readiness

Status: proposed next work block. Owners: Vinh (lead), Minh (label evidence), Deem (frontend compatibility). Read [team build plan](team-build-plan.md) and [audit](../audit/2026-09-25-repository-audit.md) first.

## Outcome

Give all three people a stable, truthful interface and an independently testable first task. No cloud schema or parallel screen/backend implementation should freeze the current contradictions into code.

## Task 1 — Vinh and Deem: settle the shared contract

Files to change in the implementation PR: `mock/events.json`, `mock/patients.json`, `mock/reasons.json`, `mock/templates.json`, `docs/architecture.md`, `docs/who-sees-what.md`, `PLAN.md`, `AGENTS.md`, and Deem's `components/data/types.ts`, `derive.ts`, `useEvents.ts`. This planning PR does not change those files.

- [ ] Review `screen/foundation` and establish the common branch base.
- [ ] Write concrete before/after fixture examples: patient acknowledgment leaves the case awaiting pharmacy confirmation; `dispensed` alone completes the fill loop; government or unreviewed eligibility never auto-sends a card; unknown note routes to follow-up.
- [ ] Agree `UNKNOWN`, eligibility review, run identity, timestamp semantics, aggregate output, partner payloads, and reset delivery. Preserve existing script IDs for Deem's beat display.
- [ ] Confirm the live `EventSource` contract and identify Deem's hook changes. A create/prescribe command must validate the chosen fictional patient/drug; a fix command must validate the server's allowed action.
- [ ] Vinh and Minh agree the classifier boundary: pharmacy-note input, validated reason plus at most 140 characters of supporting note, explicit unknown/failure handling. Minh owns Gemini; Vinh owns deterministic routing and workflow writes. A supplied reason must keep the core usable without Gemini.
- [ ] Specify action failures: invalid body returns 400, unauthorized session 401/403, missing case 404, invalid state 409. A duplicate idempotency key returns the prior result without repeated events or notifications.
- [ ] Add explicit fixtures for unknown, government coverage, ineligible commercial coverage, and a failed re-run. Keep the original evidence distinct from inferred reason.
- [ ] Add meaningful runtime contract checks and a required test command to CI; JSON syntax alone is insufficient. Tests must cover the examples above and fail against the old action semantics.
- [ ] Obtain Vinh/Deem review for the contract PR and Minh review of source/analytics inputs before merging.

Deliverable: one reviewed contract PR, not three competing schema definitions.

## Task 2 — Minh: prove the first real label

Proposed module files: `lib/labels/types.ts`, `lib/labels/source.ts`, `lib/labels/verify.ts`, `scripts/labels/fetch.ts`, `tests/labels/verify.test.ts`, and `tests/fixtures/labels/`. Shared output: `mock/labels.json` and drug identity fields in `mock/patients.json`, through the contract PR.

- [ ] Resolve Otezla's exact brand, ingredient, strength, and dose form through RxNorm; verify the intended DailyMed SPL identity rather than trusting the hardcoded set ID.
- [ ] Save the public source bytes with URL, retrieval time, version/effective date, and content hash. Keep personal PDFs and local memory outside the repository.
- [ ] Select the requested source sections and preserve their wording. Prove each displayed excerpt against the source; an edited character must fail verification.
- [ ] Distinguish an absent boxed warning, an unavailable section, and a failed fetch. Never replace an unknown section with AI-written text.
- [ ] Produce the existing label payload for Deem's `LabelCard`, with proposed provenance additions reviewed together. Set `byte_exact: true` only after the agreed verification passes.
- [ ] Show the source payload to Vinh/Deem; repeat for Humira only after the Otezla path works.

Deliverable: reproducible source-backed label evidence and payload, with network failure/cached behavior defined. Minh does not edit the card's presentation.

## Task 3 — Vinh: prove the watch path and backend baseline

Proposed files: `lib/notifications/ntfy.ts`, `lib/notifications/templates.ts`, `tests/notifications/ntfy.test.ts`; later `lib/realtime.ts` and workflow migrations. The physical experiment can happen before the backend exists.

- [ ] Check actual phone/ntfy/Garmin notification delivery with the owner's devices and a fictional generic message. Record the result; do not infer it from an HTTP 200.
- [ ] Define a practice-side notification payload and deep link. Do not send names/notes through the Ascend stand-in. Notification failure must not roll back a successful handoff.
- [ ] Keep the phone button as the primary handoff until the watch capabilities are physically verified.
- [ ] Install from the existing lockfile; run lint, typecheck, and build on the common integration base. Record real results separately from missing tests.
- [ ] Draft the first migration around the approved contract: demo runs, cases/events, unique run/event keys, command idempotency, role/session scope, and retryable side-effect records. Vinh owns this shared migration sequence.

Deliverable: actual device result, reproducible build baseline, and agreed backend inputs.

## Exit review

- [ ] Vinh owns core workflow/watch, Minh owns labels then Gemini classification then analytics, Deem owns screens and optional microphone capture; any adjustment is explicit. Minh's backend/AI experience is confirmed; available hours remain open.
- [ ] No patient acknowledgment can manufacture pharmacy confirmation.
- [ ] Unknown reasons and eligibility are representable.
- [ ] Role-scoped reads and operator-only reset are designed, including reset propagation.
- [ ] Run IDs and timestamps make replay and analytics repeatable.
- [ ] Otezla source verification and wearable smoke test have recorded results or named blockers.
- [ ] `PLAN.md` / `AGENTS.md` / architecture / mocks / frontend types agree in the reviewed contract PR.

Proceed to Phase 1 when the contract is approved. A failed watch experiment must be visible and tracked; it cannot silently become a completed wearable feature.
