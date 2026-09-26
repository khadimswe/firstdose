# Workflow persistence

**September 26 acceptance:** The deployed workflow, coordinator links, messages, seeded catalog and Tiger replay passed the [hosted browser audit](../docs/handoffs/deployed-acceptance.md). PR #40 is frontend-only and needs no migration or environment change. Check actual migration history before applying anything; this note is not an instruction to reapply existing migrations.

Apply the SQL files in `migrations/` in timestamp order through the reviewed Supabase migration process, followed by the generated seed. The scripts here do not automatically apply hosted migrations; deployment evidence belongs in `PLAN.md`. The migrations expect Supabase's `anon`, `authenticated`, and `service_role` roles; service_role must retain its usual BYPASSRLS attribute.

Generate catalog SQL with `node --import tsx scripts/seed.ts --output supabase/seed.sql` (or omit `--output` for stdout). Review before applying. The generator reads only repository fixtures and does not connect to a database. Repeated seeds update catalog records but preserve existing label rows, including any verified label cache. It seeds no workflow events and makes no label-verification claims.

The server uses these service-role-only RPCs:

- `fd_snapshot()` returns `{ run_id, revision, events }`, with events in committed sequence order and original frontend IDs/fields.
- `fd_commit(p_run_id, p_revision, p_events)` locks the active pointer, checks both preconditions, and atomically writes the event batch and a pending outbox row for each non-null `wrist`. Nonempty batches increment revision once; empty batches still check both preconditions without incrementing revision. The server must validate transitions and plan from trusted committed history before calling this RPC.
- `fd_reset(p_run_id)` checks the expected run, creates a fresh empty run at revision zero, and keeps old events/outbox/history.
- `fd_claim_notification()` locks the active-run pointer and claims one pending current-run outbox row, assigning a unique claim ID and increasing attempts. Concurrent workers cannot claim the same message. Old-run pending rows are skipped.
- `fd_finish_notification(p_run_id, p_script_id, p_claim_id, p_status)` records `accepted` or `unknown` only for the matching outstanding claim. Accepted means HTTP provider acceptance, not device receipt. Claimed/unknown rows are never automatically resent, including after process death or ambiguous network failure. Already in-flight delivery cannot be recalled by reset.

Conflicts use PostgreSQL code `P0001` and exact messages `stale_run` or `revision_conflict`. Replan on a revision conflict; do not silently retarget a stale run. Duplicate IDs reject the entire batch (`23505`), including any preceding outbox insert. `(run_id, script_id)` and `(run_id, sequence)` are unique.

All tables enable RLS without browser policies; browser-role and PUBLIC grants are revoked. RPCs use SECURITY INVOKER with a fixed empty search path. This is a server-only practice-side store, not an Ascend projection or a browser Realtime subscription. `rx_cases` holds the fixture catalog; current workflow state is derived from active-run events.

Run `node scripts/test-database.mjs` with Docker and the repository's npm dependencies available. It creates and removes a disposable PostgreSQL 16 container with no network or host ports, applies the migration, generates the seed, and checks transactions, concurrent commits/resets, reset fencing, and permissions. Set `FIRSTDOSE_TEST_POSTGRES_IMAGE` to another local compatible PostgreSQL image to repeat against that version. The seed runs with the existing tsx dependency on supported Node 22/24 releases.

The implementation follows [PostgreSQL function security](https://www.postgresql.org/docs/current/sql-createfunction.html) and [Supabase RLS/service-role behavior](https://supabase.com/docs/guides/database/postgres/row-level-security). Local PostgreSQL checks do not verify hosted PostgREST, two-device synchronization, or physical notifications.
