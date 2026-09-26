# Notes for Vihn (things the frontend needs from your side)

Deem appends here instead of touching your code. Clear a line when it's done.

- [ ] RxCUIs for Otezla and Humira in `mock/patients.json` (currently `TODO_VIHN`)
- [ ] `mock/labels.json` filled from SPL with `byte_exact: true`
- [ ] Supabase tables match `mock/patients.json` (`rx_cases`) and `mock/events.json` (`fill_events`), same field names, so `useEvents()` is a one-line switch
- [ ] Realtime channel name: `fill_events` (insert only)
- [ ] `/api/sim/fire` endpoint: POST `{ event_id }` replays that event from `mock/events.json` into Supabase, so `/sim` works the same in both modes
- [ ] ntfy body ≤ 200 chars; use `templates.json → wrist`
- [ ] `/api/access/summary` returns `{ recovered, median_ttff_seconds, reason_tally: {REASON: n} }` from Tiger `daily_ttff`

## Supabase mode for `useEvents()` (needed for the 4 AM gate on more than one device)

Mock mode only syncs tabs on one laptop. For the iPad, the judge's phone and the big screen to update together, `useEvents()` needs a live source. The interface is `EventSource` in `components/data/types.ts`:

- [ ] `lib/realtime.ts` exporting an object that implements `EventSource`:
  - `load()`: rows already in `fill_events`, oldest first
  - `subscribe(onInsert)`: Realtime inserts on `fill_events`; returns an unsubscribe function
  - `fire(ids)`: `POST /api/sim/fire` for each id, in order
  - `reset()`: `POST /api/sim/reset` (clears `fill_events` for a fresh run)
  - `accessSummary()`: `GET /api/access/summary`
- [ ] Keep each row's `id` equal to the mock event id (`ev_01`...) so `/sim` can tick off fired beats
- [ ] `/api/sim/reset` endpoint
- [ ] (optional) `public/audio/started-maria.mp3` for the ElevenLabs line; the board plays it if present
