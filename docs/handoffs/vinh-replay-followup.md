# Replay and summary freshness: Vinh's integration seam

Branch `backend/replay-followup`, based on main `3851e1d`. This prepares the workflow and polling adapter for Minh's C3 replay module. Tiger projection, storage, query and the summary route remain Minh's modules; none is replaced with simulated success.

## Committed command context

`commandHandler(kind, { onCommit })` now passes `{ kind, run_id, revision }` from the successful atomic result. It supplies the same checkpoint on an idempotent retry, allowing failed follow-up work to retry. Reset supplies the new run at revision zero. Failed validation, authorization and persistence never invoke the callback. A callback failure is sanitized and cannot turn a committed prescription into an HTTP failure.

The context contains no patient events or notes. Existing notification callbacks remain compatible. Notification scheduling is unchanged; the seed endpoint still creates no historical watch notifications. The callback is a scheduling hook: use Next's existing `after` pattern for post-response work, with analytics failure isolated from notification delivery. No Tiger callback is installed until the real module is available. Request-time replay below is the catch-up path for reconnects and missed scheduling; a durable new worker is not required by C3.

## Replay before returning a summary

`readReplayedSummary({ run_id, revision }, { replayRun, getSummary, store? })` in `lib/server/replay-followup.ts`:

1. Confirms the requested active workflow run/revision before reading history.
2. Reads a fixed copy of committed history using the existing restricted reader, then checks the checkpoint again before replay.
3. Invokes the injected replay function with a reader bound to that run and fixed history. Each read gets an independent copy with original IDs and event times.
4. Confirms the checkpoint after replay, queries the injected summary function, and checks again before returning `{ checkpoint, summary }`.

Reset or any new workflow revision causes `ReplayError("analytics_stale")`. Failed reads, projection, writes or queries cause sanitized `analytics_unavailable`. No summary is returned after a failed replay. An existing empty run still requires a successful replay and query before zeros are accepted. The helper writes no Supabase state and stores no process-local freshness flag. It does not prove attribution freshness for separate coordinator sidecar revisions (6.7).

Freshness assumes Minh's C2 contract: immutable, transactional, duplicate-safe inserts. Replays must not delete or replace a run's projection; overlapping older replays must never erase newer rows.

Minh's proposed four-argument function can be connected with a closure:

```ts
const result = await readReplayedSummary(checkpoint, {
  replayRun: (runId, read) => replayRun(runId, read, writeMetricBatch, hmacKey),
  getSummary: getAccessSummary,
});
return json(result.summary, 200, result.checkpoint);
```

This is integration guidance for the forthcoming modules, not currently executed Tiger code. Keep raw history in the practice server. Minh's projector alone selects/HMAC-projects fields for Tiger, and his query must return only the aggregate `AccessSummary` shape. Keys remain server-only and lazily configured.

## HTTP and adapter contract

The existing no-argument `source.accessSummary()` synchronizes first if needed, then requests `GET /api/access/summary?run_id=<UUID>&revision=<nonnegative integer>`. The route must validate both values, enforce the intended access policy, run the replay/query wrapper above and return:

- The unchanged `{ recovered, median_ttff_seconds, reason_tally }` JSON body.
- `Cache-Control: no-store`, `X-FirstDose-Run` and `X-FirstDose-Revision` for the verified checkpoint. The existing `json` helper supplies these.
- A non-success response on replay/query error: recommended 409 `{ error: "analytics_stale" }` or 503 `{ error: "analytics_unavailable" }`. Invalid input is 400; missing configuration must never become success-shaped mock totals.

The adapter rejects successful-looking responses without matching checkpoint headers. It also rejects a delayed response if local reset, a new observed run or a newer observed revision superseded its request. The checkpoint describes the returned snapshot; it is not a promise that no future command can occur. Existing live-store unavailable/retry behavior remains in place.

## Remaining integration

Minh's C3 module/endpoint has not landed at this checkpoint. Connect its replay/write/query functions, add route integration tests and run the real Tiger replay/duplicate/conflict smoke before claiming task 2.3 complete. Deem's summary body and EventSource method shape stay unchanged. The separate C9 seed-prescriber fixture fix is already committed in `fix/deem-fixture-requests`; this branch does not duplicate that session's work.

Verification: full unit suite, lint, offline label verification and production build pass; independent code review found no blockers. Regression tests cover committed checkpoint identity, synchronous/asynchronous follow-up failures, immutable history, empty runs, read/write/query errors, retry, reset and same-run revision races. No provider calls or hosted database changes were needed for these tests.
