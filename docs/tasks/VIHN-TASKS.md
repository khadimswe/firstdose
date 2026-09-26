# Vinh Tasks

Personal checklist. `PLAN.md` is the source of truth; steps for each task are in `docs/IMPLEMENTATION.md`. The backend contract is `docs/backend-core.md` (PR #9); routes and tables are in `docs/architecture.md`. Product: `docs/spec-v2-coordinator.md`.

## Current local foundation

Worktree: `C:/Users/Binep/firstdose-vinh-backend`, branch `backend/maria-core`; schema and API changes are consolidated here. Backend `21d0a0d` includes hosted persistence, browser sessions, polling and a claim-once notification worker. Hosted migrations/seed and the Maria API flow across two browser sessions passed; the user confirmed the workflow reason alert reached both iPhone and Garmin. The active hosted run is empty after reset. See [backend handoff](../backend-core.md) for the contract and `PLAN.md` for current status. The rendered-screen browser-context gate now passes in 43ca67b; physical-device verification and owner review remain open.

Use Node 22.12 or newer within the 22.x release line (matching CI), or Node 24.x. Vitest 5 requires a supported Node release; Node 20 is insufficient.

```powershell
npm install
npm test
npm run smoke:workflow
npm run smoke:watch
```

The watch command defaults to a dry run. After setting `NTFY_TOPIC` (and optionally `NTFY_SERVER`/`NTFY_TOKEN`) in this worktree's ignored `.env`, run `npm run smoke:watch -- --send` yourself and confirm both iPhone receipt and the actual Garmin buzz. An accepted HTTP request is not proof of receipt. Keep the topic private.

### Implemented module boundaries

- `lib/server/router.ts`: `routeFix` uses the existing rule table plus explicit eligibility evidence. Unknown reasons/coverage and missing evidence route to access support; card eligibility cannot establish bridge eligibility.
- `lib/server/workflow.ts`: `planCommand(history, command, now)` returns only new events for the current run. It validates screen actions, rejects unexpected fields, checks ordering and makes identical retries no-ops. Input history is trusted committed state, never browser-supplied state.
- `scripts/workflow-smoke.ts`: exercises Maria's local flow with no keys or services. It checks that the patient tap leaves dispensing pending until a separate simulator command.
- `lib/server/ntfy.ts` and `scripts/ntfy-smoke.ts`: isolated notification transport and an explicit-send hardware check. Workflow delivery runs after committed commands through `notification-worker.ts`; provider acceptance and user-confirmed device receipt are separate evidence.

### Next persistence and frontend handoff

**Integration review, September 26:** the user explicitly requested frontend wiring. Implementation `43ca67b` builds on selected files from Deem PR #6 and fixes the missing-alert, board-final-stop and access-count failures. Actual rendered screens pass the hosted Maria flow and remote reset across independent phone/tablet browser contexts. Deem was notified before the shared template and James ACCESS_SUPPORT fixture changes; affected-owner review remains pending.

| Remaining gate | Required behavior and owner |
|---|---|
| Owner integration review | Deem + Vinh review PR #9 and reconcile it with PR #6; preserve run-change/login/acknowledgment fixes. |
| Physical screen run/deployment | Verify on two actual devices using a live-mode build, including patient login/QR destination and reset. Browser contexts are not physical-device evidence. |
| Second wrist alert | Vinh + Deem review the prepared truthful pharmacy-confirmation template and implement its delivery. Existing reason-alert receipt is confirmed separately. |
| Cached labels | Minh + Deem verify and integrate the actual reviewed label artifact. |

`43ca67b` passes 252 tests, 14 PostgreSQL checks, workflow smoke, lint and production build. Production-mode phone/tablet browser login also passes. The complete rendered workflow distinguishes acknowledgment from pharmacy confirmation, reaches the final board stop and access total 1, survives reload and clears both contexts on reset. The active hosted run is empty afterward. Tiger is explicitly unavailable with practice event counts; no Tiger implementation claim. See [backend handoff](../backend-core.md) for live-mode configuration and the opt-in UI smoke script.

### Multiple coding tools

Codex owns this backend worktree. Claude can review it read-only. Cursor should own one named, non-overlapping module on a separate branch/worktree if used concurrently. Minh follows `MINH-TASKS.md` on his own branches; Deem retains frontend ownership. Never have multiple tools change branches or edit the same files in one checkout. Shared `package.json` changes need coordination; retain both dependency sets and regenerate the lockfile with npm install.

Legend: [ ] not started · [-] in progress · [x] done · [!] blocked

**Lane:** `lib/server/**`, `lib/realtime.ts`, `app/api/**`, `supabase/**`, `scripts/**`, `garmin/**`, and tests for your modules. Minh's label, classifier, analytics and NPPES modules are exceptions. Shared, tell Deem first: `mock/*.json`, `package.json`, `docs/architecture.md`. Never touch `app/(screens)/**` or `components/**`; ask Deem via `docs/for-vihn.md`.

---

## Keys to gather (you sign up yourself; values go in `.env`, never in git)

| Name | Where you get it | What it unblocks |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Project Connect dialog for URL; Settings → API Keys for publishable/secret keys. Store locally, never in chat. | 1.7, 1.9, 1.11, everything live |
| `TIGER_DATABASE_URL` | Tiger Data (MLH offer), new service, connection string | 2.3 |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key (MLH) | 2.5 |
| `XAI_API_KEY` | console.x.ai (SpaceXAI sponsor credits) | 4.1 |
| `NTFY_TOPIC` | pick a long random topic name, e.g. `firstdose-` + 12 random chars; subscribe to it in the ntfy iPhone app | 0.8, 1.12 |
| Garmin | Garmin Connect app on the iPhone, notifications on for ntfy | 0.8 |
| Connect IQ SDK + `fr55` device profile | developer.garmin.com (stretch only) | 4.6 |
| Vercel env vars | the same Supabase, Tiger, Gemini, xAI and ntfy values, set on the `firstdose-web` project | 2.6 |

Keys move to Deem by AirDrop of `.env`, never Discord or the repo.

---

## State (PR #9 merged Sat Sep 26)

- [x] 0.8 ntfy → iPhone → Garmin, confirmed by the user.
- [-] 1.7 schema and seed · 1.8 router · 1.9 live source (polling + ETags) · 1.11 guarded routes. All built and tested in #9 (252 tests, 14 DB checks, a two-browser Maria run). Merged into `main` with #9.
- [-] 1.12 ntfy: the reason alert is delivered and felt. The pharmacy-confirmation alert is still to do.
- [-] 1.13 live hook, integrated in #9 from Deem's #6 design.

## What the v2 screens need from you (PRs #11–#14, stacked on #9)

- [ ] Review #11–#14 after the fact (merged Sat 12:40 on Deem's call). They only touch screens and components, plus one new test file (`tests/coordinator-views.test.ts`).
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

- [x] Rebase #9 onto `main` (Deem merged `main` into it before merging, Sat 12:35).
  - `PLAN.md`: keep `main`'s v2 brief and Phase 6, and carry over your status rows (0.4–0.9, 1.7–1.12).
  - `docs/IMPLEMENTATION.md` and `docs/tasks/*`: take `main`'s versions and re-add facts that are only yours.
- [x] One vitest config (`vitest.config.mts`, Vitest 5) with #8's tests; lockfile regenerated with npm (298 tests pass).
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
