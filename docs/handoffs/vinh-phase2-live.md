# Phase 2 live integration

`integration/phase2-live` combines Minh's classifier and analytics with the backend wiring prepared in PRs #17 and #26. Merge `b9418dd` includes main's Tiger PR #37. Hosted Tiger and retained Supabase replay checks passed on September 26 after local credentials were configured. Deployed browser acceptance remains pending.

## Workflow and Gemini

Production command routes install `classify` through `liveCommandHandler`. For the two scripted classification beats, `executeCommand` first validates the entire batch, then classifies only the existing pharmacy/hub source note. Model output is passed to the synchronous planner as trusted server context, never accepted in an HTTP command. The deterministic router retains action authority.

The reason event contains the actual allowlisted result or null. Null, provider error or timeout never restores the scripted reason or sends a reason alert. Patient Details still exposes handoff and the router selects access support; null does not currently create a DoctorHome alert. A price reason without a recorded quote is also left unclassified. No free-form model text is saved as patient narrative.

The four-second deadline now bounds transports even if they ignore cancellation. Classifier results are reused across revision retries; already committed classifications are not called again. The atomic run/revision compare still fences resets and duplicate commands. An unknown result stays immutable; automatic command retries do not reinterpret an already committed event. Existing pure/offline planner calls retain explicit scripted simulation behavior.

Live model evidence, September 26:

- `gemini-3.8-flash`: price-refusal hit the deadline (4,029 ms) and returned null; the full smoke failed. This was not counted as successful live acceptance.
- `gemini-3.1-flash-lite`: the production classifier returned the expected values for price refusal (704 ms), unable-to-reach (3,838 ms), no documented reason (3,525 ms) and an injection-shaped fixture (866 ms). All four passed in this run. Null is deliberately ambiguous between UNKNOWN, rejected output and provider failure; these tests establish safe fallback, not a guarantee the provider answered UNKNOWN.

Use private `GEMINI_API_KEY` and pin `GEMINI_MODEL=gemini-3.1-flash-lite` for this tested configuration, then verify on the deployed runtime. The tested pin is now saved in the ignored local backend environment file. A subsequent smoke returned the expected price/unreachable enums in 2,052/1,889 ms; both null fixtures reached the deadline (4,045/4,008 ms), demonstrating safe timeout fallback. One passing run is not a latency guarantee; the failure path remains necessary.

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

Hosted evidence on September 26, using the integration code at `b9418dd`:

- Verified TLS connection, Timescale extension and the existing `firstdose.fill_events` hypertable. No schema migration was needed.
- Six Tiger smoke checks passed on a fresh synthetic run: initial write, identical replay, conflicting duplicate rejection, SQL/oracle parity (2 fills, median 90 seconds), run isolation and stable checksums.
- Production `replayCommittedRun` read a retained hosted Supabase run with 10 committed events and projected 3 allowlisted HMAC metrics into Tiger. SQL matched the pure oracle; two concurrent retries preserved row count, source history and timestamps.
- Production `readLiveAccessSummary` and authenticated summary handler passed against the active empty run, including exact summary, run/revision headers and no-store. Unauthenticated requests returned 401, stale revision 409 and missing HMAC configuration 503. The missing configuration was injected only into the test process and restored.
- The hosted workflow snapshot was unchanged. These checks called backend functions and the handler locally against hosted providers; they do not establish deployed Next `after` execution or browser acceptance.

Before declaring tasks 2.3/2.5 fully deployed:

1. Minh reviews the integration of his modules and shared `pg`, `@types/pg`, `@google/genai` dependencies. Deem reviews current/unavailable display behavior and the null-classification handoff path.
2. Configure the deployment with private `TIGER_DATABASE_URL`, the same stable `ANALYTICS_HMAC_KEY`, `GEMINI_API_KEY` and the tested model pin. Local configuration is complete. Preserve the HMAC key for existing runs; changing it correctly conflicts with immutable existing projections.
3. Deploy the reviewed integration and exercise authenticated two-client workflow/replay/reset and the live summary screen. The hosted retained-run reader and Tiger checks above pass; catalog completeness and deployed behavior still require acceptance. Keep physical watch receipt separate from provider acceptance.

Verification wrote synthetic smoke metrics and replayed retained metrics to Tiger. It did not change the hosted workflow, apply a database migration, change hosted environment settings or deploy production.
