# Notes for Vihn (things the frontend needs from your side)

Deem appends here instead of touching your code. Clear a line when it's done.

- [ ] RxCUIs for Otezla and Humira in `mock/patients.json` (currently `TODO_VIHN`)
- [ ] `mock/labels.json` filled from SPL with `byte_exact: true`
- [ ] Supabase tables match `mock/patients.json` (`rx_cases`) and `mock/events.json` (`fill_events`), same field names, so `useEvents()` is a one-line switch
- [ ] Realtime channel name: `fill_events` (insert only)
- [ ] `/api/sim/fire` endpoint: POST `{ event_id }` replays that event from `mock/events.json` into Supabase, so `/sim` works the same in both modes
- [ ] ntfy body ≤ 200 chars; use `templates.json → wrist`
- [ ] `/api/access/summary` returns `{ recovered, median_ttff_seconds, reason_tally: {REASON: n} }` from Tiger `daily_ttff`
