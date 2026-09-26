# Vihn Tasks

Personal task tracker. Source of truth is `PLAN.md`; this file is a convenience view only. Wiring details for each task are in `docs/architecture.md`.

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

## Lane ownership

Vinh owns workflow/schema/router/Realtime/watch/voice files. Minh owns labels/classifier/analytics and their endpoints/tests, including any such files under the broad directories below. Coordinate shared config and migrations. See [Minh tasks](MINH-TASKS.md) and [branch workflow](../branch-workflow.md).

Workflow file areas:
- `lib/server/**`
- `lib/realtime.ts` (implements Deem's `EventSource` interface from `components/data/types.ts`)
- `app/api/**`
- `supabase/**`
- `scripts/**`
- `garmin/**`
- `tests/` for your modules

Shared (⚠️ CONTRACT commits, tell Deem first): `mock/*.json`, `package.json`, `docs/architecture.md`.

Never touch: `app/(screens)/**`, `components/**`. If a screen needs something, add it to `docs/for-vihn.md`'s reverse note or tell Deem.

---

## Phase 0: Setup (Fri 8 PM to Sat 12 AM)
- [ ] **0.5** Review `docs/architecture.md`; correct route names and tables to match what you'll build.
- [ ] **0.6** Your keys (table above).
- [x] **0.8** **GATE passed September 26:** ntfy accepted the explicit-send test; user confirmed iPhone receipt and Garmin FR55 alert after enabling watch app notifications. Workflow integration remains pending.
- [ ] List live Gemini models once; pin the ID (Q2).

## Phase 1: Core loop (Sat 12 AM to 4 AM)
- [ ] **1.7** Supabase schema (`patients`, `drugs`, `rx_cases`, `fill_events`, `labels`) + seed from `mock/`. Field names identical to `mock/`.
- [ ] **1.8** Router as a pure function over `reasons.json → router.rows` + table test. Medicare/Medicaid never gets a copay card.
- [ ] **1.9** `lib/realtime.ts` implementing `EventSource` + `/api/sim/fire` + `/api/sim/reset`. Realtime channel `fill_events`, insert only.
- [ ] **1.10 (Minh owns; Vinh integrates)** RxNorm → DailyMed SPL → `labels` + byte-exact test. Fill the two `TODO_VIHN` RxCUIs and `mock/labels.json`.
- [ ] **1.11** `/api/rx`, `/api/handoff`, `/api/fix`, `/api/patient/use`, with guarded transitions (a double tap can't double-fire).
- [ ] **1.12** ntfy on `alert_sent` and `started`; action button → `/api/handoff`.

**CHECKPOINT Sat 4 AM:** Maria's loop across two devices in `supabase` mode, with the watch buzzing twice.

## Phase 2: The wow + deploy (Sat 4 AM to 11 AM)
- [ ] **2.3 (Minh owns; Vinh integrates)** Tiger Data dual-write: `fill_events` hypertable + `daily_ttff` continuous aggregate + `GET /api/access/summary` (no patient fields).
- [ ] **2.5 (Minh owns; Vinh integrates)** Gemini classifier: note → reason enum with `responseSchema`. ≤ 140 chars in, enum out, nothing else.
- [ ] Help Deem with 2.6 Vercel env vars.

## Phase 3-4 (Sat 11 AM to 6 PM)
- [ ] **3.1** Impiricus workshop with Deem (Klaus 1456). Record answers under Open Questions.
- [ ] **4.1** Grok STT `/api/voice` with keyterms `[Maria, James, Otezla, Humira, coordinator]`. Record actual with/without-keyterm results; do not presume a miss.
- [ ] **4.6** Connect IQ widget (stretch). Go/no-go at the Sat 2 PM cut check.
- [ ] **4.7** Dry run with Deem; wear the watch for raw footage at 6 PM.

## Phase 5 (Sat 9 PM to Sun 6:30 AM)
- [ ] **5.1** Claims audit: grep the code for every named product (Supabase, Tiger Data, Gemini, Grok, ElevenLabs, ntfy); `.env.example` parity; gitleaks on full history.
- [ ] **5.3** Video edit once the backend is frozen.

---

## Hard rules
1. Stage named paths only. Never `git add -A`.
2. Status commits are separate from code commits: `status: <task#> <emoji> <description>`.
3. Gemini outputs a reason enum only. The router picks the fix. No AI-written drug or patient text anywhere.
4. Nothing that identifies a patient or counts prescriptions leaves the practice side (`docs/who-sees-what.md`).
5. A skipped test is a false green.
