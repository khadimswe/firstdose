# Phase 6 coordinator linkage: backend handoff

**Current checkpoint, September 26:** This module is merged. Hosted browser acceptance is recorded in [deployed acceptance](deployed-acceptance.md); it supersedes the implementation-time merge/deployment pending notes below. Physical-device acceptance remains separate. [PR #40](https://github.com/khadimswe/firstdose/pull/40) contains the subsequent frontend repairs and is awaiting review/merge. Original implementation evidence and setup instructions are retained below; do not repeat hosted setup merely because an older checklist says pending.

**September 26 web integration:** `components/data/coordinator-live.ts` and `coordinator.ts` now connect Profile, the approve sheet, Prescribers, the queue and sidebar to this API. Live mode ignores local approvals. Typed and voice-confirmed handoffs await persisted approval and assignment; partial retries resume from server state. Commands remain disabled until the coordinator snapshot and the fill adapter report the same run, including approval before any prescription. Tests cover endpoint lag in either direction, consecutive resets, duplicate taps and failed writes. C9's separate Dr. Rivera fixture is merged. See [the current integration/deployment handoff](phase6-integration.md); the original backend-only scope and historical validation below describe PR #19.

Tasks 6.4 and C7/6.12. Branch `backend/coordinator-links` is based on `main` at `4c80650`, after PRs #15 (corrected labels and second alert) and #7 (access/simulator) merged. It has no seed-week runtime dependency. Review this focused diff directly against `main`. No hosted migration, deployment or real staff invitation is part of this change.

## Reviewable contract for Deem and Minh

This implements the additive proposal in PLAN C7. Existing `mock/*.json`, `FillEvent`, `EventSource`, and screen/hook files are unchanged. The case `coordinator_id` lives in a run-scoped sidecar (`case_coordinators`), exposed with case IDs in a separate snapshot. This avoids carrying an assignment into a fresh run or widening the frozen fill-event payload. Deem and Minh must review this seam before adopting it; it is not an agreed change to their interfaces.

Only `coord_demo` and `prescriber_demo` are accepted. They represent the fictional coordinator and the existing `Dr. Demo (judge 1)` catalog prescriber. They are not real accounts or NPIs. The shared staff demo login permits both on-screen roles; `actor: doctor` records the simulated action, not authenticated professional identity. Approval must be presented as a demo action. Arbitrary NPPES results cannot be linked through this endpoint.

## API

`GET /api/coordinator` returns the active run's `run_id`, shared workflow `revision`, `events`, `links`, and `cases`. It requires the existing staff demo session or private server bearer and sends `Cache-Control: no-store`. Cases are `{ case_id, coordinator_id: "coord_demo" | null }`. Links are `{ coordinator_id, prescriber_id, status: "pending" | "linked" }`.

`POST /api/coordinator` requires the same credentials, JSON and `X-FirstDose-Run` observed from the snapshot. Session writes require a same-origin Origin header. Body:

```json
{ "action": "request", "coordinator_id": "coord_demo", "prescriber_id": "prescriber_demo" }
```

Actions:

- `invite`: doctor's simulated invite. Writes `coordinator_invited` and `coordinator_link_requested`; link stays pending. No email or notification is sent.
- `request`: coordinator's simulated request. Writes the same pair with coordinator as actor; link stays pending. Calling invite/request again is a no-op, preserving the original actor/time.
- `approve`: explicit doctor approval, allowed only after a request; writes `coordinator_linked`. Repeated approval is a no-op.
- `assign`: same body plus `case_id`. Requires an approved link, a matching demo prescriber and a committed `prescribed` event in the active run. Writes the case sidecar and `coordinator_assigned` atomically. Repeated assignment is a no-op. This does not prescribe, hand off, choose a fix, or confirm a fill.

POST returns the entire coordinator snapshot and run/revision headers. Events contain `id`, `type`, `coordinator_id`, `prescriber_id`, nullable `case_id`, `actor`, and server-generated ISO `at`. Run identity is on the containing snapshot. Clients cannot supply timestamps, event bodies, actors or arbitrary identities. Invalid input is 400, missing run 428, stale run/unavailable transition 409, provider/configuration failure 503. Provider details stay private.

## Deem: cross-device wiring

Use GET to hydrate and poll link state in live mode, including after reload/reconnect. Track the returned run identity and fence late responses exactly as the fill-event store does. A successful approval on the phone becomes visible in the desktop's next GET. Retain local mock behavior for offline demos; do not claim live linking until both surfaces call this API.

The first-time approve sheet should request/invite as needed, explicitly approve, then assign the selected prescribed case before the existing handoff. An approved link alone assigns no case. Retry a partially completed flow from the persisted state; each operation is idempotent. Disable assignment until the prescription exists. Existing handoff/fix APIs remain backward compatible and do not enforce assignment, so a case stays unattributed until assign succeeds.

No new `useEvents()` method or frontend adapter signature is imposed by this branch. Keep IDs in practice-side state only. Do not send case IDs, link events, prescriber labels or counts of prescriptions to Ascend. Display the existing demo/stand-in disclosures.

## Minh: attribution

Use `coordinator_assigned` and the case sidecar only as explicit assignment evidence. A link request is not activity by a verified account; an approval does not count as a case fix. Join a committed fix to the matching run/case assignment and its timestamp when defining the reviewed aggregate. Earlier unassigned fixes must not be retroactively credited. This branch adds no Tiger projection, active-coordinator metric, or aggregate export. Retained events are available to the private database role; a reviewed historical replay RPC can follow if needed.

## Database and reset

Apply `202609260004_coordinator_links.sql` after the existing `001`/`002` migrations using the established database setup after review. Number `003` is reserved for the separate retained fill-history reader; linkage does not require it. Seed the catalog with the existing `scripts/seed.ts`.

All coordinator writes lock `active_run`, the same row used by workflow writes/reset. Preconditions, events, assignment and revision increment happen in one transaction. There is no client revision precondition because the action is checked against locked current state; the run header prevents old-device writes from moving into a new run. Concurrent retries insert each event once. Link changes advance the shared revision, so old fill plans retry through their existing revision-conflict behavior.

Reset needs no new code: both tables are keyed by run. The active snapshot becomes empty/unassigned, while old events/assignments are retained. Browser database roles have neither table grants nor RPC execution; both tables enable RLS. Link commands never write fill events or the notification outbox.

## Verification and limits

Tests cover the API/auth boundary, strict inputs and provider errors, actual PostgreSQL transitions, concurrent request/approval double taps, stale writes after reset, retained history, and browser-role denial. Local verification is recorded in PLAN after the checks finish. This is backend readiness; owner review, hosted apply, Deem's wiring and two-device UI verification remain open. Task 6.1 has its own branch/handoff; 6.5 has a separate RxFill module/handoff. C3 patient-message templates and C6 NPI review remain coordination items, not implemented by this linkage endpoint.

The newer C9 requirement keeps background seed cases under a separate, already-linked prescriber, preserving Dr. Demo's live approval beat. This endpoint currently links only `prescriber_demo`; its fixed-identity guard must not be bypassed to imply that the background prescriber is approved. Reconcile C9 in the seed-week module and review the UI's two-prescriber interpretation before combining it with this module. The latest demo plan also calls for both alerts on an Apple Watch with the iPhone locked (C8); prior Garmin receipt is separate evidence.
