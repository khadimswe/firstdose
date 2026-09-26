# Maria persistence and command API

This is the first Phase 1 backend slice on `backend/maria-core`. `PLAN.md` remains the execution dashboard. The migration and routes are implemented locally; a hosted database migration, live frontend adapter, reviewed alerts and a two-device/watch run are still integration work.

## Database boundary

`supabase/migrations/202609260001_workflow.sql` creates the fixture catalog (`patients`, `drugs`, `rx_cases`, `labels`), immutable run/event history, one active-run pointer and a notification outbox. `rx_cases` contains catalog metadata, not a mutable cross-run status projection. Authoritative current workflow state is derived from the active run's committed events.

- `fd_snapshot()` reads identity, revision and ordered events in one database snapshot.
- `fd_commit(run, revision, events)` locks the active-run row and checks both identity and revision. It commits the whole batch and any outbox intents together. A competing writer causes a re-read and re-plan, bounded to three attempts. An ambiguous network failure is returned to the caller without an automatic transport retry.
- `fd_reset(run)` locks the same row, creates a new run and retains old history. Old clients get `stale_run`, including for commands that would otherwise be no-ops. A second reset carrying the old identity cannot reset the new run again.
- `(run_id, script_id)` and `(run_id, sequence)` are unique. Snapshots expose the script ID as `FillEvent.id` and return rows in sequence order. Event timestamps come from the server planner's clock and advance monotonically; `committed_at` separately records database insertion time.

All tables use RLS and deny `anon`/`authenticated` access. Only `service_role` can execute the three RPCs. HTTP access uses the server's modern Supabase secret in the `apikey` header, following the [Supabase API key guidance](https://supabase.com/docs/guides/getting-started/api-keys). No browser database grants or production identity system are introduced.

Outbox rows are unique per run/event and queued only for events with a wrist message. The existing planner intentionally emits no wrist messages pending reviewed alert/copy integration. There is no delivery worker in this slice; the outbox does not establish ntfy acceptance or watch receipt. Before adding delivery, handle old-run cancellation and ambiguous delivery explicitly; automatic resend after a timeout can duplicate a physical alert.

## HTTP contract

Every endpoint requires `Authorization: Bearer <FIRSTDOSE_DEMO_TOKEN>`. Configure a private random token of at least 32 characters, separate from Supabase credentials. An unset/short token fails closed with 503. Never put the token in a URL, `NEXT_PUBLIC_*`, committed code or a public bundle. This is a shared fictional-demo access boundary, not per-patient or per-role authorization. Browser session provisioning is not implemented yet and must be coordinated with Deem before wiring the adapter.

Read `GET /api/events` to obtain `{ run_id, revision, events }`. Every POST requires the observed run UUID in `X-FirstDose-Run` and `Content-Type: application/json`. JSON bodies are limited to 8 KiB and reject extra command fields. Cross-origin browser requests are rejected. Responses disable caching and successful responses include `X-FirstDose-Run` and `X-FirstDose-Revision`.

| Route | JSON body | Result |
|---|---|---|
| POST `/api/rx` | `{ patient_id, drug_id }` | Committed prescription events |
| POST `/api/handoff` | `{ case_id }` | Guarded handoff and server-selected fix |
| POST `/api/fix` | `{ case_id, fix }` | Validated resource-sent event |
| POST `/api/patient/use` | `{ case_id }` | `ev_10` acknowledgment only |
| POST `/api/sim/fire` | `{ ids: string[] }` | Ordered simulator-only batch; `ev_11` is separate pharmacy confirmation |
| POST `/api/sim/reset` | `{}` | New empty snapshot |

Action/fire responses are arrays of newly committed `FillEvent` rows; a repeated action returns `[]`. Reset returns the full new snapshot. Invalid input returns 400, unauthorized access 401, cross-origin access 403, stale runs/invalid transitions 409, oversized JSON 413, wrong media type 415, missing run identity 428, and unavailable/unconfigured services 503. Provider details and credentials are not returned. On 409 `stale_run`, clear old client state and reload; do not silently reapply the old click to the new run.

The existing four frontend action bodies are preserved. The token/run headers and snapshot endpoint are additive proposals for Deem's adapter integration. No component, shared fixture or package contract was edited. Realtime subscription authorization, run-change signaling and stale-load handling remain part of that integration.

## Local verification and deployment preparation

Use the repository's supported Node version and installed dependencies. Docker must be running for the database suite.

```powershell
npm test
node scripts/test-database.mjs
npm run lint
npm run build
node --import tsx scripts/seed.ts --output "$env:TEMP/firstdose-seed.sql"
```

The database suite creates a disposable PostgreSQL 16 container without networking or host ports, applies the migration, runs the seed twice, verifies role restrictions, rollback, concurrent writers/reset and the real Maria command planner, then removes the container. It does not read `.env`, send notifications or touch hosted Supabase. Docker PostgreSQL checks do not verify the hosted PostgREST gateway or Supabase Realtime.

The seed generator writes reviewable SQL only. It preserves existing label rows so rerunning it cannot overwrite Minh's reviewed cache with placeholders. Before a hosted apply, review the migration and generated seed against the target project and existing schema. Apply the migration, then seed through the team's database workflow. A project API key alone is not a database DDL connection. No hosted application is performed by these scripts.

After migration and frontend integration, verify two real clients, reset/reconnect, reviewed doctor alerts, independent pharmacy confirmation, cached labels and physical notification delivery before marking the Phase 1 gate complete.
