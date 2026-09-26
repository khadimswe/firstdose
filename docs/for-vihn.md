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

## v2 screens (Deem, Sat 12:15): PRs #11–#14, stacked on #9

- [ ] **Seed the week (6.1, C1/C9).** The queue shows only prescribers who approved the coordinator. Put the seeded cases under an already-linked prescriber, not "Dr. Demo (judge 1)", so the demo opens on a full queue and Dr. Demo's approval stays the 0:55 beat. The names are in PLAN C1.
- [ ] **Link events (C7).** In live mode, "approved" is derived from the first handoff, so the demo works without new events. An Approve on the Profile tab (with no handoff) stays on that phone until `coordinator_link_requested` / `coordinator_linked` exist.
- [ ] **Contact marks (C2).** "Reached patient / Left message" are local to the coordinator's browser for now.
- [ ] **Apple Watch (C8).** The doctor's iPhone runs `/doctor` from the home screen and ntfy. iOS sends notifications to the Apple Watch only while the iPhone is locked, so please test both alerts that way.
- [ ] **Tests.** `tests/frontend-derive.test.ts` still imports `app/(screens)/doctor/_components/thread.ts`, so I kept that file. New pure tests are in `tests/coordinator-views.test.ts`.
