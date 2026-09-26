# Notes for Vinh (things the frontend needs from your side)

Deem appends here instead of touching your code. Clear a line when it's done.

**Done and cleared (Sat 13:00):** everything the Phase 1 frontend asked for is on `main` via #9 and #15. That covers the `EventSource` in `lib/realtime.ts` (polling, run change, login), `/api/sim/fire` and `/api/sim/reset`, the guarded action routes, the template-backed ntfy alerts, the verified Otezla label and RxCUI, and fixture ids kept as `ev_XX`. For the contract, see `docs/backend-core.md`; the history is in PRs #6 and #9.

## Template change to agree on (from the design pass)

- [ ] `templates.json → coordinator_card.fix_line` renders as "Suggested fix: Re-send copay card (Impiricus Wallet (stand-in))", brackets inside brackets, because `fixes[].via` already ends in "(stand-in)". Proposal: `"Suggested fix: {fix_label} · {fix_via}"`. Frontend picks it up with no code change.

## v2 screens (merged Sat 12:40–12:46 as #11–#14): still open

- [ ] **Seed the week (6.1, C1/C9).** The queue shows only prescribers who approved the coordinator. Put the seeded cases under an already-linked prescriber, not "Dr. Demo (judge 1)", so the demo opens on a full queue and Dr. Demo's approval stays the 0:55 beat. The names are in PLAN C1.
- [ ] **Link events (C7).** In live mode, "approved" is derived from the first handoff, so the demo works without new events. An Approve on the Profile tab (with no handoff) stays on that phone until `coordinator_link_requested` / `coordinator_linked` exist.
- [ ] **Contact marks (C2).** "Reached patient / Left message" are local to the coordinator's browser for now.
- [ ] **Apple Watch (C8).** The doctor's iPhone runs `/doctor` from the home screen and ntfy. iOS sends notifications to the Apple Watch only while the iPhone is locked, so please test both alerts that way.
- [ ] **Tests.** `tests/frontend-derive.test.ts` still imports `app/(screens)/doctor/_components/thread.ts`, so I kept that file. New pure tests are in `tests/coordinator-views.test.ts`.

## Synthetic data and relabel (Deem, Sat 13:50): what touches your side

- [ ] **Review the ⚠️ CONTRACT values in `feat/synthetic-data`.** Shapes are unchanged.
  - `mock/patients.json`, `data/demo-week.json`: "(demo)" suffixes are gone; prescribers are synthetic "Dr. Nadia Okafor" (live cases) and "Dr. Colin Mercer" (seeded week); `phone_label` is plain text; Humira `rxcui` is **1872980**.
  - `mock/reasons.json`: `fixes[].via` without "(stand-in)".
  - `mock/templates.json`: price and reason copy without "demo" (the watch now reads "Declined at price ($410)."); additive `disclosure`, `qr` and `market` keys.
  - I updated the two watch-text expectations in `tests/workflow.test.ts` and `tests/commands.test.ts`.
- [ ] **Hosted catalog:** re-run `scripts/seed.ts` so `rx_cases.prescriber_label` and the seeded rows match the new names.
- [ ] **Your sign-in page** (`lib/server/demo-login.ts`) still says "FirstDose demo access", "Open the FirstDose demo" and "Demo access code". Could it be "FirstDose sign-in", "Sign in to FirstDose" and "Access code"? The route path can stay.
- [ ] **Optional:** the server event notes "(stand-in)" in `lib/server/workflow.ts` show only in `/sim`, so there's no product-screen impact.
- [ ] **Otezla 30 mg NDC is 55513-0137-60** (0497 is the 20 mg), if anything server-side keys on NDC.
