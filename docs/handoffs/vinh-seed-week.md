# Seed the week: Vinh backend and Deem wiring

Task 6.1, branch `backend/seed-week`, with main `4c80650` merged alongside the Phase 2 retained-run reader. This delivers the backend, catalog data and adapter method. The simulator button and catalog/store wiring remain Deem's work; the actual screen is not yet seeded by this branch. The PR adds no screen changes beyond those already merged into main.

## Fixed fixture and counts

`data/demo-week.json` contains the 13 names approved in PLAN C1, patient/case records using the existing shapes, and 38 simulated history events. It adds no drug and leaves Maria and James untouched. Background totals are **3 needing a fix, 2 waiting, 8 confirmed fills**. With the two interactive cases, the catalog has 15 cases. The older illustrative 3/2/11 line totals 16 and is not this fixture's count; display derived totals.

Every record is fictional. Show the C1 stand-in **Fictional test records · no PHI** alongside the seeded queue. This is prepared simulation history, not evidence of real prescriptions, provider activity or patient outcomes. No free-text patient narrative or verified-label event is generated. Medicare/Medicaid cases use access support; missing sample eligibility never produces a bridge sample.

## Backend setup and command

`scripts/seed.ts` now emits SQL for all 15 patient/case catalog rows. Run it to a reviewable file and apply through the existing reviewed database setup flow before using the seed endpoint. Running it again retains verified label rows and does not create run events. Existing database schema is sufficient; migration 003 is for analytics history reads, not required by the seed command.

`POST /api/sim/seed` accepts exactly `{}` with the existing private demo session (or server bearer) and `X-FirstDose-Run` header. It uses the same same-origin, body-size, run/revision and atomic-commit guards as the other commands. Clients cannot supply patients, events or timestamps. It returns the committed event array and run/revision headers.

- Empty run: insert the fixed week in one transaction.
- Complete week already present: return `[]`, including after a coordinator action or a Maria/James action. Do not regenerate stored timestamps on retry.
- Nonempty run without the complete seed: `409 invalid_transition`; explicitly reset before seeding.
- Stale run: `409 stale_run`; never move an old seed click into the new run.
- Seed records have no wrist text and the endpoint does not schedule notification delivery.

The seed spans the six days before the command. Its timestamps are synthetic event times; database `committed_at` remains the actual insertion time. Ordinary subsequent actions use the server clock. Reset retains old run history for replay and clears the active run normally. The same seed can then be inserted into the new run without identity collisions.

Existing prescribe/handoff/fix commands recognize the seeded catalog. The three needs-fix cases have a prepared simulated handoff and deterministic fix already selected, so the coordinator's fix action can advance them to waiting. Maria remains the patient QR/use-card demonstration; seeded records do not gain new patient acknowledgment or pharmacy simulator routes.

## Deem's integration seam

`lib/demo-week.ts` is safe for browser imports: no provider code, credentials, filesystem access or runtime-generated names. It exports `WEEK_PATIENTS`, `WEEK_CASES`, `WEEK_EVENTS`, `WEEK_ACTIONS`, `weekActionIds(caseId)` and `seedWeekEvents(anchorIso)`.

1. Extend the catalog in both modes with `WEEK_PATIENTS` and `WEEK_CASES`. Include the seed history plus action templates in the offline script lookup, deduplicated by event ID. Keep them out of ordinary Maria/James replay/autoplay; seed them only through the explicit button.
2. Mock mode: after reset, add the `WEEK_EVENTS` IDs to the mock store. Their numeric times are negative offsets before demo time zero, so Maria's existing nonnegative timeline can follow without moving the clock backward. Anchor the mock clock at zero when seeding. Do not show future action-template events until their corresponding action is taken.
3. For offline fix actions, use the seeded action IDs from `weekActionIds(caseId)`; do not reuse James's IDs for all non-Maria cases. Authoritative live routing remains server-side. Preserve explicit rejection of unsupported background patient/pharmacy actions.
4. Live mode: the default `lib/realtime.ts` source exposes `seedWeek(): Promise<void>`. It posts with the observed run and existing cookie session, then reloads committed history using the existing generation/reset handling. Wire it through the live store's pending/error wrapper and a `useEvents()` method; handle 401/409 visibly. Existing `PollingEventSource` consumers remain compatible; the new factory/default export has the additional method.
5. Verify reset → seed → fix → Maria on both sources. Background-only counts must be 3/2/8; fixing the Medicare case makes them 2/3/8. Maria's acknowledgment must still leave dispensing pending until the separate pharmacy confirmation.

The backend does not send raw seeded patient history to Tiger or a partner endpoint. Minh's projection still owns that allowlist, pseudonymization and summary semantics. If synthetic seed rows feed analytics, label the totals as demo data.

## Checks and remaining gate

September 26 publication verification: **361 unit tests, 14 PostgreSQL checks, lint and production build passed on the main-based branch**, including offline label verification. Gitleaks and configured private-value scans passed; read-only review found no blocking issues. Unit tests compare the existing coordinator derivation on numeric offline events with ISO persisted events, verify card blocking/fix behavior, strict HTTP guards, adapter transport and idempotence. The PostgreSQL smoke checks seed catalog repeatability, simultaneous seed commands, notification exclusion, coordinator fixes, Maria continuation and reset isolation. The retained-run reader assertions remain in the same database suite. Published as draft PR #17.

Owner review, hosted catalog apply and Deem's actual mock/live screen wiring are still required for task 6.1 completion. This branch has not performed hosted database writes or a production deployment.
