# Maria persistence and command API

This is the Phase 1 backend on `backend/maria-core`. `PLAN.md` remains the execution dashboard. Persistence, protected routes, browser sessions, fast polling and template-backed app alerts are implemented. Frontend integration is now implemented using the hook/store seam from Deem PR #6. The full screen flow is tested in independent phone/tablet browser sessions against hosted Supabase. Affected-owner review, reviewed labels and the physical two-device checkpoint remain required before the phase closes.

## Database boundary

`supabase/migrations/202609260001_workflow.sql` creates the fixture catalog (`patients`, `drugs`, `rx_cases`, `labels`), immutable run/event history, one active-run pointer and a notification outbox. `rx_cases` contains catalog metadata, not a mutable cross-run status projection. Authoritative current workflow state is derived from the active run's committed events.

- `fd_snapshot()` reads identity, revision and ordered events in one database snapshot.
- `fd_commit(run, revision, events)` locks the active-run row and checks both identity and revision. It commits the whole batch and any outbox intents together. A competing writer causes a re-read and re-plan, bounded to three attempts. An ambiguous network failure is returned to the caller without an automatic transport retry.
- `fd_reset(run)` locks the same row, creates a new run and retains old history. Old clients get `stale_run`, including for commands that would otherwise be no-ops. A second reset carrying the old identity cannot reset the new run again.
- `(run_id, script_id)` and `(run_id, sequence)` are unique. Snapshots expose the script ID as `FillEvent.id` and return rows in sequence order. Event timestamps come from the server planner's clock and advance monotonically; `committed_at` separately records database insertion time.

All tables use RLS and deny `anon`/`authenticated` access. Only `service_role` can execute the workflow and notification RPCs. HTTP access uses the server's modern Supabase secret in the `apikey` header, following the [Supabase API key guidance](https://supabase.com/docs/guides/getting-started/api-keys). No browser database grants or production identity system are introduced.

Outbox rows are unique per run/event and queued only for events with a wrist message. `202609260002_notification_delivery.sql` adds atomic delivery claims. After a committed command, Next.js `after()` runs a bounded worker that claims at most two pending messages from the active run. Old-run pending messages are skipped. Claims carry a unique identity; only that claim can record `accepted` (ntfy HTTP acceptance) or `unknown` (a failed or ambiguous send). Claimed/unknown messages are never automatically reclaimed or resent. This avoids duplicate retries at the cost of requiring manual investigation of unresolved delivery. A send already in flight can finish after reset; its audit stays attached to its original run. No scheduled retry service is introduced.

The reason alert is template-backed; `alert_sent` records creation of the app alert, not device receipt. An accepted outbox row also does not establish physical receipt. A second pharmacy-confirmation wrist alert still requires reviewed truthful copy; the existing “started” template is not used to claim a patient started treatment.

## HTTP contract

Command and snapshot endpoints require a demo session cookie or `Authorization: Bearer <FIRSTDOSE_DEMO_TOKEN>` for CLI clients. Configure a private random token of at least 32 characters, separate from Supabase credentials. An unset/short token fails closed with 503. Never put the token in a URL, `NEXT_PUBLIC_*`, committed code or a public bundle. This is shared fictional-demo access, not per-patient or per-role authorization.

Browsers open `/api/demo-login?next=/patient/rx_001` (or another screen path). Staff enter the private code into the server-rendered password form once per device. POST exchanges it for a signed, 12-hour HttpOnly/SameSite=Strict cookie; HTTPS/production adds Secure and the `__Host-` prefix. The cookie contains an expiry/nonce/signature, not the master token. Rotation of `FIRSTDOSE_DEMO_TOKEN` invalidates issued sessions. The form returns to the QR destination without putting credentials in the QR or URL. Cookie mutations and login require an exact same-origin Origin header; the login form keeps `Referrer-Policy: same-origin` so browser POSTs retain that header. A bearer remains available for private CLI checks.

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

The existing four frontend action bodies are preserved. The integration changes frontend components, shared copy and the three James fixture fix fields (ACCESS_SUPPORT rather than an unsupported bridge decision); these changes were announced on Deem PR #6 before committing. Event IDs/shapes and package dependencies are unchanged in this follow-up.

## Browser adapter handoff to Deem

`lib/realtime.ts` default-exports the existing EventSource interface, implemented as server polling every 1.5 seconds while subscribed. It uses same-origin cookies, never Supabase browser grants or a public token. `/api/events` returns an ETag containing both run and revision and honors `If-None-Match` with 304 after authorization. Requests have a 10-second deadline including body reads, polls do not overlap, and commands refresh immediately after success. Visibility changes also refresh.

The additive signature is `subscribe(onInsert, onRunChange?, onError?, onSync?)`. `onRunChange(runId, previousRunId)` fires on initial load and reset **before** new-run inserts. The screen store clears events, pending commands and access state, advances its generation and rejects late summaries there. It consumes committed order directly without fixture-time sorting. `onSync()` follows successful snapshots, including 304, so an unchanged run clears transient connection errors. The store disables actions while synchronization is unavailable, unsubscribes when its last consumer leaves, and never retries a command automatically. An insert-only legacy subscriber remains load-only after reset.

On `RealtimeError` 401, the shared error banner links to `/api/demo-login` with the encoded current screen as `next`, including the patient destination. On stale-run 409, the adapter refreshes but never replays the old click. Ambiguous command errors say the action could not be confirmed, rather than claiming it failed to commit. `accessSummary()` failures explicitly label fallback totals as practice event counts and Tiger unavailable; summaries retry after 15 seconds even without new events. Late summaries from earlier client generations/revisions are discarded. A server-side run/revision freshness watermark remains a future Tiger contract requirement.

Reason simulator beats `ev_05` and `ev_18` now atomically produce derived app alerts `ev_06` and `ev_19` with text filled from shared templates. The simulator must send only its input beat IDs (`ev_04`, `ev_05`, `ev_11`, `ev_16`, `ev_17`, `ev_18`); screen commands and derived alert IDs remain rejected by `/api/sim/fire`. A patient tap emits `ev_10` only; separate `ev_11` is the simulated pharmacy confirmation. Deem's board/status/copy/audio should reach **Fill confirmed** on that signal, and local access totals should count distinct confirmed cases after prescription. Existing templates still contain legacy “not started” wording; revise shared copy through owner review rather than inventing patient text in code.

## Local verification and deployment preparation

Use the repository's supported Node version and installed dependencies. Docker must be running for the database suite.

```powershell
npm test
node scripts/test-database.mjs
npm run lint
npm run build
node --import tsx scripts/seed.ts --output "$env:TEMP/firstdose-seed.sql"
```

Set `NEXT_PUBLIC_DATA_SOURCE=supabase` before starting/building the live app; `mock` keeps an explicit offline preview. This public selector is not a credential. Deployment environment changes/rebuild remain with the deployment owner. Enter the private demo code through the login form once per browser.

For the real-browser login regression, start a test server with a private test token, set `FIRSTDOSE_TEST_TOKEN` and optionally `FIRSTDOSE_TEST_ORIGIN`, then run `python scripts/browser-login-smoke.py` with Python Playwright installed. It verifies the actual form POST, phone/tablet return path and JavaScript-inaccessible session cookie. It logs no credentials and does not exercise the workflow.

`python scripts/browser-workflow-smoke.py` runs the actual doctor, simulator, coordinator, patient, board and access screens in independent tablet/phone contexts. It requires `FIRSTDOSE_TEST_TOKEN` and explicit `FIRSTDOSE_TEST_ALLOW_RESET=1`: it resets the target demo, exercises the Maria flow (including one reason notification), verifies acknowledgment versus separate confirmation, reload and remote reset, and leaves a fresh empty run on success. Use only the intended fictional demo project. Python Playwright must be installed.

The database suite creates a disposable PostgreSQL 16 container without networking or host ports, applies the migration, runs the seed twice, verifies role restrictions, rollback, concurrent writers/reset and the real Maria command planner, then removes the container. It does not read `.env`, send notifications or touch hosted Supabase. Docker PostgreSQL checks do not verify the hosted PostgREST gateway or Supabase Realtime.

The seed generator writes reviewable SQL only. It preserves existing label rows so rerunning it cannot overwrite Minh's reviewed cache with placeholders. Before a hosted apply, review the migration and generated seed against the target project and existing schema. Apply the migration, then seed through the team's database workflow. A project API key alone is not a database DDL connection. No hosted application is performed by these scripts.

After migration and frontend integration, verify two real clients, reset/reconnect, reviewed doctor alerts, independent pharmacy confirmation, cached labels and physical notification delivery before marking the Phase 1 gate complete.

## Phase 2: committed-history handoff to Minh

The reader is included in `backend/seed-week`, rebased onto main `ca4da47` for owner review. It supplies the durable input for Minh's analytics replay; it does not implement Tiger projection, storage, summaries or Gemini classification.

Migration `202609260003_read_run.sql` adds `fd_read_run(run UUID)` after the merged Phase 1 notification-delivery migration `002`. It returns one database snapshot of the requested run's events, ordered by committed sequence. Reset retains this history, so retrying an old run cannot accidentally read the new active run. An existing empty run returns an empty array; an unknown run or failed read is an error at the TypeScript boundary. Only `service_role` can execute this read; existing table restrictions remain in force.

The server export `readCommittedEvents(runId)` in `lib/server/supabase-workflow.ts` returns `Promise<CommittedEvent[]>`:

```ts
type CommittedEvent = {
  run_id: string;
  script_id: string;
  event: FillEvent & { at: string };
};
```

This matches Minh's proposed C1/C3 input structurally. Pass the function to his `replayRun` when that module lands. The reader preserves event timestamps and script IDs, validates run identity and rejects malformed/duplicate history. It performs no writes and no provider retry; a caller can retry the entire replay using the same durable history. Reads include all event types; projection remains responsible for selecting metric evidence.

These events contain practice-side fields and must stay on the server. Send only Minh's explicitly allowlisted, HMAC-projected metric rows to Tiger, never this raw history. The reader does not establish analytics freshness, successful Tiger delivery or anonymous partner exports. A failed replay must not undo committed workflow actions or appear as a current successful summary.

Confirmed planner semantics for integration: Maria's `use_card` action emits only `ev_10` acknowledgment; `ev_11` is a separate simulator-only pharmacy `claim_run` with status `Dispensed`. That independent confirmation can feed the fill metric. `started`/`recovered` and acknowledgment alone do not establish dispensing. James remains routed to access support without bridge eligibility evidence.

Remaining dependencies: Minh's classifier/replay modules and real-provider checks; Vinh's replay trigger and freshness handling; Deem's adapter/UI integration; reviewed hosted migrations and the Maria two-device/watch gate. The reader itself adds no HTTP endpoint or shared fixture; this branch's separate seed-week feature adds a guarded simulator endpoint and prepared background data. Neither feature includes provider credentials or a production deployment.

Publication verification on September 26: the combined branch passed 320 unit tests, 14 PostgreSQL checks (including real empty/retained run reads and denied browser access), lint and production build. Gitleaks found no leaks in the branch history, and configured private-value scans passed. On Windows, the inherited label-source test required restoring exact Git XML bytes after automatic CRLF conversion; the committed artifact is unchanged. Read-only agent review found no blocking issues. An affected-owner review is still required before merging.

Publication base: main `ca4da47` includes the merged backend PR #9, coordinator shell #11 and doctor view #12. Rebase retained both notification-delivery and committed-reader database assertions plus main's v2 PLAN brief. Unmerged teammate screen/closure changes are outside this branch. The Phase 2 reader migration has not been applied to the hosted project.
