# Vinh Tasks

Personal checklist. `PLAN.md` is the source of truth; steps for each task are in `docs/IMPLEMENTATION.md`. The backend contract is `docs/backend-core.md` (PR #9); routes and tables are in `docs/architecture.md`. Product: `docs/spec-v2-coordinator.md`.

Legend: [ ] not started · [-] in progress · [x] done · [!] blocked

**Lane:** `lib/server/**`, `lib/realtime.ts`, `app/api/**`, `supabase/**`, `scripts/**`, `garmin/**`, and tests for your modules. Minh's label, classifier, analytics and NPPES modules are exceptions. Shared, tell Deem first: `mock/*.json`, `package.json`, `docs/architecture.md`. Never touch `app/(screens)/**` or `components/**`; ask Deem via `docs/for-vihn.md`.

---

## State (from PR #9, not yet merged)

- [x] 0.8 ntfy → iPhone → Garmin, confirmed by the user.
- [-] 1.7 schema and seed · 1.8 router · 1.9 live source (polling + ETags) · 1.11 guarded routes. All built and tested in #9 (252 tests, 14 DB checks, a two-browser Maria run). They wait on review and merge.
- [-] 1.12 ntfy: the reason alert is delivered and felt. The pharmacy-confirmation alert is still to do.
- [-] 1.13 live hook, integrated in #9 from Deem's #6 design.

## What the v2 screens need from you (PRs #11–#14, stacked on #9)

- [ ] Review #11–#14 as the affected owner. They only touch screens and components, plus one new test file (`tests/coordinator-views.test.ts`).
- [ ] **C9, urgent for the opening shot:** 6.1 Seed the week.
  - Use the names in PLAN C1, all under an already-linked prescriber, not "Dr. Demo (judge 1)".
  - Without the seed, the queue opens empty.
- [ ] **C7:** link events so the phone's Approve reaches the desktop in live mode. Until then, the approval travels with the first handoff, which is enough for the demo.
- [ ] **C8:** the demo watch is an Apple Watch paired to the doctor's iPhone. Confirm both alerts arrive on it with the phone locked.
- [ ] **C5:** decide between the patient-only path and the demo code.

## Now → 11 AM

- [ ] **6.1** Seed the week: 10–15 fictional cases so the queue reads "3 stuck, 2 waiting, 11 fills confirmed". Settle **C1** with Deem first: names, and where they live in mock mode. Don't change `mock/*.json` shapes.
- [ ] Fix whatever Deem's #9 review raised, including the QR sign-in friction: on the judge's phone, a team member types the private code. Decide whether a patient-scoped, read-and-acknowledge-only path is acceptable, or keep the login.

## 6.0 Integration

- [ ] Rebase #9 onto `main`.
  - `PLAN.md`: keep `main`'s v2 brief and Phase 6, and carry over your status rows (0.4–0.9, 1.7–1.12).
  - `docs/IMPLEMENTATION.md` and `docs/tasks/*`: take `main`'s versions and re-add facts that are only yours.
- [ ] Keep one vitest config (`vitest.config.mts`, Vitest 5) when #8 lands. Regenerate the lockfile with npm.
- [ ] Set the private Vercel env for live mode (Supabase secret, demo token, ntfy). Deem flips `NEXT_PUBLIC_DATA_SOURCE=supabase` and redeploys.

## Phase 1 gates (the core must pass before optional work)

- [ ] **1.12b** Second wrist alert on the separate pharmacy confirmation (`wrist.fill_confirmed`). Feel it on the Garmin.
- [ ] Two physical devices on the HTTPS origin, following `docs/handoffs/deem-phase1.md`. Record the result in PLAN.md.
- [ ] Agree the verified-label display path with Minh and Deem. Your proposal: reviewed fixtures bundled into the catalog in both modes.

## Phase 6 (parallel with Deem's screens)

- [ ] **6.4** `coordinator_id` on cases plus a `coordinator_invited` event. Additive; propose it in PLAN first (⚠️ CONTRACT if it touches mock shapes). Tell Deem (for 6.3's invite) and Minh (for 6.7's rollup) the payload.
- [ ] **C7 (6.12)** Prescriber-link events for live mode, e.g. `coordinator_link_requested` and `coordinator_linked`, with the link state per prescriber. The doctor approves on the phone, and the desktop must see it. Additive; propose it in PLAN first.
- [ ] **6.5** RxFill-shaped pharmacy events: `NotDispensed`, `RxFillIndicator`, status as sent, labelled simulated. Deem adds the "Raw message" toggle on `/sim`.
- [ ] **C3** A template key for the coordinator-approved patient message and its Spanish version (6.8), or an explicit exception to D2.
- [ ] Review Minh's `/api/npi` (6.6) if Minh takes it; otherwise build it.

## 2 PM onwards

- [ ] **4.1** Grok voice handoff (first in the cut order). Verify the current xAI endpoint and model first; confirm before handoff.
- [ ] **4.6** Connect IQ widget (stretch). Go/no-go at 2 PM.
- [ ] **4.7** Dry runs: run `/sim` and the pharmacy, and wear the watch when there is one judge.
- [ ] 6 PM footage: the watch close-up, twice.
- [ ] **5.1** Claims audit at the 9 PM freeze: every named product is called in code (file and line); `.env.example` parity; gitleaks on full history.
- [ ] **5.3** Video edit once the backend is frozen.

## Hard rules

1. Stage named paths only. Status commits (`status: <task#> <emoji> …`) are separate from code.
2. Gemini outputs a reason enum only; the router picks the fix. No AI-written drug or patient text.
3. Nothing that identifies a patient or counts prescriptions leaves the practice side.
4. Never a token in a URL, a QR code or a `NEXT_PUBLIC_*` variable.
5. A skipped test is a false green.
