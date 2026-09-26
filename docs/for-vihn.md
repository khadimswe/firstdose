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

Reviewed PR #6 at `63ae988`; these are proposed answers to its PLAN Q5–Q10, not a record that Deem approved them. The implemented browser contract is detailed below and in `docs/backend-core.md`.

| Question | Vinh's proposed answer | Required frontend follow-through |
|---|---|---|
| Q5: module export | Default-export the existing `EventSource` object from `lib/realtime.ts`. | Existing importer matches. |
| Q6: reset | Extend `subscribe(onInsert, onRunChange?)`; callback receives active run identity. Adapter watches the active-run pointer, tags mutations with the observed run and rejects stale-run commands with 409. | Increment generation and clear events/access/pending buffers on remote reset, then reload. Reject stale loads/summary responses. The 15-second poll remains recovery, not the reset protocol. |
| Q7: patient tap | Acknowledgment only: `ev_10`. Independent simulator `ev_11` confirms pharmacy fill. | Change mock action grouping and simulator beats together; a patient tap cannot turn the board green or increment fill totals. |
| Q8: label delivery | For this fixed two-case demo, prefer reviewed generated fixtures bundled into the catalog in both modes; keep Minh's endpoint available for verification/future refresh. | Publish no green badge until fidelity and extraction scope are agreed and the actual cached artifact passes checks. Current label PR #8 needs corrections first. |
| Q9: wording/metrics | Final stop **Fill confirmed**; aggregate label **First fills confirmed**. Temporarily retain `recovered` as the response key with the new explicit meaning. | Update board timestamp/color, status pill, patient/doctor copy, chime and optional audio together. Count unique independently confirmed cases and latest reason once per case. Display Tiger unavailable/lagging rather than silently substituting local totals. |
| Q10: identity/order | Keep `rx_001`/`rx_002` and frontend `ev_01` IDs. Storage uniqueness uses run + script identity; add a monotonic per-run sequence for ordering. | Consume inserts/snapshots in server sequence order. A delayed earlier event must trigger ordered reconciliation, not rely on callback arrival order. Agree whether sequence travels in a storage envelope or additive event field before implementation. |

The backend now creates template-backed practice doctor alerts when reasons arrive, records notification-delivery status separately, uses James ACCESS_SUPPORT without bridge-specific eligibility evidence, and retains practice-only case-linked records. See `PLAN.md` for hosted and physical-delivery evidence.

Reply checklist: review Q6–Q10 against the implementation; confirm the deployment project/origin and domain status. The user has confirmed team registration and plan agreement; Phase 0 is closed. Local credentials do not establish deployed application configuration.

### Implemented browser contract for PR #6

- Import the default source from `lib/realtime.ts`. It polls `/api/events` every 1.5 seconds while subscribed, uses run/revision ETags, and refreshes after commands and on visibility changes.
- Use `subscribe(onInsert, onRunChange, onError, onSync)`. The optional fourth callback confirms snapshot health, including 304. The initial/run-change callback precedes inserts. Clear events, insert logs, pending actions and access state; increment the hook generation and fence old loads/summaries. The existing 15-second fallback alone does not implement remote reset.
- On `RealtimeError` 401, show `/api/demo-login?next=<encoded-screen-path>`, including the QR destination. Staff enter the private demo code once per device; the server sets an HttpOnly session cookie. Never put the code in public environment variables, bundles or URLs.
- A stale-run 409 refreshes current state but never replays the previous click into a new run. Surface the conflict to the user.
- Simulator inputs are only `ev_04`, `ev_05`, `ev_11`, `ev_16`, `ev_17`, `ev_18`. The reason inputs generate `ev_06`/`ev_19` atomically; do not send those derived IDs. The patient tap generates only `ev_10`; `ev_11` is separate pharmacy confirmation.
- Pharmacy confirmation now drives **Fill confirmed**, distinct-case **First fills confirmed** totals, board timestamp/color, status pill, patient/doctor copy and chime. Shared templates are updated; the truthful second wrist-alert template is prepared, but delivery remains outstanding.
- Preserve errors from `accessSummary()`. Show unavailable/lagging analytics rather than labelling local fallback totals as Tiger. Reviewed label artifacts remain Minh's contract.

The user subsequently authorized frontend integration on this branch. Selected hook/store/banner files from PR #6 are now integrated and adapted to the concrete backend lifecycle. The board/access failures are fixed and the rendered Maria flow plus remote reset pass in independent phone/tablet browser contexts against hosted Supabase. Review these changes with Deem before integrating PR #6; do not overwrite the run-change, authentication or outcome fixes with the older hook. Reviewed labels, the second wrist alert and a physical two-device run remain Phase 1 gates. Set NEXT_PUBLIC_DATA_SOURCE=supabase before the deployment build to enable live mode; private credentials remain server-side.

Current review and remaining-work handoff: [Deem Phase 1 handoff](handoffs/deem-phase1.md).
## v2 screens (Deem, Sat 12:15): PRs #11–#14, stacked on #9

- [ ] **Seed the week (6.1, C1/C9).** The queue shows only prescribers who approved the coordinator. Put the seeded cases under an already-linked prescriber, not "Dr. Demo (judge 1)", so the demo opens on a full queue and Dr. Demo's approval stays the 0:55 beat. The names are in PLAN C1.
- [ ] **Link events (C7).** In live mode, "approved" is derived from the first handoff, so the demo works without new events. An Approve on the Profile tab (with no handoff) stays on that phone until `coordinator_link_requested` / `coordinator_linked` exist.
- [ ] **Contact marks (C2).** "Reached patient / Left message" are local to the coordinator's browser for now.
- [ ] **Apple Watch (C8).** The doctor's iPhone runs `/doctor` from the home screen and ntfy. iOS sends notifications to the Apple Watch only while the iPhone is locked, so please test both alerts that way.
- [ ] **Tests.** `tests/frontend-derive.test.ts` still imports `app/(screens)/doctor/_components/thread.ts`, so I kept that file. New pure tests are in `tests/coordinator-views.test.ts`.
