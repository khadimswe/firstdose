# Notes for Vinh (things the frontend needs from your side)

Deem appends here instead of touching your code. Clear a line when it's done.

- [ ] RxCUIs for Otezla and Humira in `mock/patients.json` (currently `TODO_VIHN`)
- [ ] `mock/labels.json` filled from SPL with `byte_exact: true`
- [ ] Supabase tables match `mock/patients.json` (`rx_cases`) and `mock/events.json` (`fill_events`), same field names, so `useEvents()` is a one-line switch
- [ ] Realtime channel name: `fill_events` (insert only)
- [ ] `/api/sim/fire` endpoint: POST `{ ids: string[] }` replays those events in order from `mock/events.json` into Supabase, so `/sim` works the same in both modes
- [ ] ntfy body ≤ 200 chars; use `templates.json → wrist`
- [ ] `/api/access/summary` returns `{ recovered, median_ttff_seconds, reason_tally: {REASON: n} }` from Tiger `daily_ttff`

## Supabase mode for `useEvents()` (needed for the core gate on more than one device)

Mock mode only syncs tabs on one laptop. For the iPad, the judge's phone and the big screen to update together, `useEvents()` needs a live source. The interface is `EventSource` in `components/data/types.ts`:

- [ ] `lib/realtime.ts` exporting an object that implements `EventSource`:
  - `load()`: rows already in `fill_events`, oldest first
  - `subscribe(onInsert)`: Realtime inserts on `fill_events`; returns an unsubscribe function
  - `act(action, rx, fix)`: the screen buttons, one per route in `docs/architecture.md`: `prescribe` → `/api/rx`, `handoff` → `/api/handoff`, `fix` → `/api/fix`, `use_card` → `/api/patient/use`
  - `fire(ids)`: `/sim` only, one `POST /api/sim/fire` with `{ ids }`, in order
  - `reset()`: `POST /api/sim/reset`; agree new-run signal and hook reload before implementation (see architecture)
  - `accessSummary()`: `GET /api/access/summary`
- [ ] Keep each row's `id` equal to the mock event id (`ev_01`...) so `/sim` can tick off fired beats
- [ ] `/api/sim/reset` endpoint

## Before you push (Sat 2026-09-26)

- [ ] Pull `main` first. The shadcn install changed `package.json` and `package-lock.json`. Keep both dependency sets and run `npm install` to regenerate the lockfile; don't hand-merge it.
- [ ] Implement `EventSource` from `components/data/types.ts` as it is on `main` (it includes `act()`).
- [x] Documentation aligned on this planning branch: frontend contract points to `types.ts` / `useEvents.ts`; `/api/sim/fire` uses `{ ids: string[] }`. Vinh keeps the existing four command routes. This check marks documentation only, not implemented endpoints.

## Template change to agree on (from the design pass)

- [ ] `templates.json → coordinator_card.fix_line` renders as "Suggested fix: Re-send copay card (Impiricus Wallet (stand-in))", brackets inside brackets, because `fixes[].via` already ends in "(stand-in)". Proposal: `"Suggested fix: {fix_label} · {fix_via}"`. Frontend picks it up with no code change.

## Vinh's reply prepared for Deem — September 26

Reviewed PR #6 at `63ae988`; these are proposed answers to its PLAN Q5–Q10, not a record that Deem approved them. No message has been posted to the PR. The full proposal is in `docs/architecture.md`.

| Question | Vinh's proposed answer | Required frontend follow-through |
|---|---|---|
| Q5: module export | Default-export the existing `EventSource` object from `lib/realtime.ts`. | Existing importer matches. |
| Q6: reset | Extend `subscribe(onInsert, onRunChange?)`; callback receives active run identity. Adapter watches the active-run pointer, tags mutations with the observed run and rejects stale-run commands with 409. | Increment generation and clear events/access/pending buffers on remote reset, then reload. Reject stale loads/summary responses. The 15-second poll remains recovery, not the reset protocol. |
| Q7: patient tap | Acknowledgment only: `ev_10`. Independent simulator `ev_11` confirms pharmacy fill. | Change mock action grouping and simulator beats together; a patient tap cannot turn the board green or increment fill totals. |
| Q8: label delivery | For this fixed two-case demo, prefer reviewed generated fixtures bundled into the catalog in both modes; keep Minh's endpoint available for verification/future refresh. | Publish no green badge until fidelity and extraction scope are agreed and the actual cached artifact passes checks. Current label PR #8 needs corrections first. |
| Q9: wording/metrics | Final stop **Fill confirmed**; aggregate label **First fills confirmed**. Temporarily retain `recovered` as the response key with the new explicit meaning. | Update board timestamp/color, status pill, patient/doctor copy, chime and optional audio together. Count unique independently confirmed cases and latest reason once per case. Display Tiger unavailable/lagging rather than silently substituting local totals. |
| Q10: identity/order | Keep `rx_001`/`rx_002` and frontend `ev_01` IDs. Storage uniqueness uses run + script identity; add a monotonic per-run sequence for ordering. | Consume inserts/snapshots in server sequence order. A delayed earlier event must trigger ordered reconciliation, not rely on callback arrival order. Agree whether sequence travels in a storage envelope or additive event field before implementation. |

Also needed: template-backed practice doctor alerts when reasons arrive, a separate notification-delivery status, James ACCESS_SUPPORT without bridge-specific eligibility evidence, and practice-only case-linked records. The physical ntfy/iPhone/Garmin smoke passed; workflow-triggered alerts have not.

Reply checklist: agree or amend Q6–Q10; confirm team registration and current category limits; confirm the deployment project/origin and domain status. These outstanding responses keep Phase 0 open. Supabase/Gemini credentials are verified locally; that does not establish deployed configuration.
