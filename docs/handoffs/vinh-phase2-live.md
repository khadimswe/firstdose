# Phase 2 live integration

`integration/phase2-live` combines main `5444149`, Minh's `data/access-metrics` (`dfd360f`) and `backend/reason-classifier`, retaining their commits. This completes the backend wiring prepared in PRs #17 and #26. Hosted Tiger acceptance remains pending: its local URL is empty and the user requested local checks first.

## Workflow and Gemini

Production command routes install `classify` through `liveCommandHandler`. For the two scripted classification beats, `executeCommand` first validates the entire batch, then classifies only the existing pharmacy/hub source note. Model output is passed to the synchronous planner as trusted server context, never accepted in an HTTP command. The deterministic router retains action authority.

The reason event contains the actual allowlisted result or null. Null, provider error or timeout never restores the scripted reason or sends a reason alert. Patient Details still exposes handoff and the router selects access support; null does not currently create a DoctorHome alert. A price reason without a recorded quote is also left unclassified. No free-form model text is saved as patient narrative.

The four-second deadline now bounds transports even if they ignore cancellation. Classifier results are reused across revision retries; already committed classifications are not called again. The atomic run/revision compare still fences resets and duplicate commands. An unknown result stays immutable; automatic command retries do not reinterpret an already committed event. Existing pure/offline planner calls retain explicit scripted simulation behavior.

Live model evidence, September 26:

- `gemini-3.8-flash`: price-refusal hit the deadline (4,029 ms) and returned null; the full smoke failed. This was not counted as successful live acceptance.
- `gemini-3.1-flash-lite`: the production classifier returned the expected values for price refusal (704 ms), unable-to-reach (3,838 ms), no documented reason (3,525 ms) and an injection-shaped fixture (866 ms). All four passed in this run. Null is deliberately ambiguous between UNKNOWN, rejected output and provider failure; these tests establish safe fallback, not a guarantee the provider answered UNKNOWN.

Use private `GEMINI_API_KEY` and pin `GEMINI_MODEL=gemini-3.1-flash-lite` for this tested configuration, then verify on the deployed runtime. The pin was provided only to the test process; this branch did not change local or hosted secrets. One passing run is not a latency guarantee; the failure path remains necessary.

## Replay and summaries

Every successful live command schedules notification delivery and `replayCommittedRun` independently through Next's `after`. Analytics failure does not block notification delivery or undo the committed workflow. Seed commands replay analytics but never deliver historical watch alerts. Post-response work is best effort; the summary request also replays from retained history, so reconnect/retry can catch up without a new queue or daemon.

`GET /api/access/summary?run_id=<UUID>&revision=<integer>` now requires the existing demo session/bearer authorization. It calls the real replay/project/write/query functions through `readReplayedSummary`, and returns matching run/revision headers only after the freshness checks succeed. Invalid checkpoints are 400, stale checkpoints 409, and provider/configuration failures 503. A failed replay cannot become success-shaped zero totals. The existing polling adapter rejects delayed/stale responses.

The projector now recognizes the workflow's independent pharmacy `claim_run` with exact `Dispensed` status. Acknowledgment, started/recovered milestones and partner-side rows never establish a fill. Only run/script IDs, HMAC case hash, immutable time, metric kind and reason reach Tiger; patient IDs, labels, notes, drug, insurance, prices and wrist text stay practice-side. Seeded totals remain synthetic demonstration history.

Review corrections also cover impossible dates, empty identifiers, conflicting duplicate oracle inputs, equal-time dispensing, fractional medians, stable transaction lock order, rollback cleanup, verified TLS, bounded connection/query/statement times and a single lazy pool. Existing payload-checksum encoding is preserved for historical ledger compatibility. Scripts report sanitized errors and close connections. Separate coordinator rollups (6.7) remain outside this Phase 2 summary.

## Verification and remaining gate

Local checks include the full unit suite, lint, offline label verification, production build, independent module/integration review, the existing 20 PostgreSQL workflow/permission checks and seven new PostgreSQL integration checks:

```text
npm test
npm run lint
npm run build
node scripts/test-database.mjs
node scripts/test-phase2-database.mjs
```

The new database runner creates and removes a disposable loopback-only PostgreSQL container. It applies the workflow migrations and catalog, exercises the production reader against actual SQL, and uses the analytics ledger/table/query SQL with an injected local pool. It checks acknowledgment versus confirmation, duplicate/concurrent replay, privacy fields, conflict rollback, failure/retry, reset isolation and SQL/oracle parity. It deliberately omits Timescale hypertable creation and does not load `.env`, contact hosted Supabase/Tiger or send watch notifications.

Before declaring tasks 2.3/2.5 fully deployed:

1. Minh reviews the integration of his modules and shared `pg`, `@types/pg`, `@google/genai` dependencies. Deem reviews current/unavailable display behavior and the null-classification handoff path.
2. Configure private `TIGER_DATABASE_URL`, stable random 32+ character `ANALYTICS_HMAC_KEY`, `GEMINI_API_KEY` and the tested model pin. Preserve the HMAC key for existing runs; changing it correctly conflicts with immutable existing projections.
3. Review and apply `scripts/analytics/schema.sql` using `scripts/analytics/init.ts`, then run `scripts/analytics/smoke.ts` against Tiger. Scripts use fresh synthetic run IDs and do not delete other runs. Confirm actual hypertable creation, duplicate/conflict handling and SQL results. PostgreSQL-only tests are not this proof.
4. Confirm the hosted Supabase retained-run reader migration/catalog are applied, deploy the reviewed integration, and exercise authenticated two-client workflow/replay/reset and the live summary screen. Keep physical watch receipt separate from provider acceptance.

No hosted database migration, hosted environment change or production deployment was performed by this integration session.
