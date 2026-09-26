# Vihn Tasks

Personal task tracker. Source of truth is `PLAN.md`; this file is a convenience view only. Wiring details for each task are in `docs/architecture.md`.

## Current local foundation

Worktree: `C:/Users/Binep/firstdose-vinh-backend`, branch `backend/maria-core`, continuing the workflow foundation. The extra schema worktree/branch was removed at the user's request; schema and API changes are consolidated here. Supabase credentials and the standalone ntfy → iPhone → Garmin FR55 smoke were verified earlier. Migration, seed, atomic command persistence and guarded HTTP routes are now implemented locally in `fbfb6a6`; hosted application and live synchronization are not verified. See [backend API and persistence handoff](../backend-core.md) for exact headers, responses, verification commands and integration limits. `PLAN.md` records remaining work.

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
- `lib/server/ntfy.ts` and `scripts/ntfy-smoke.ts`: isolated notification transport and an explicit-send hardware check. Workflow delivery/outbox wiring is still pending.

### Next persistence and frontend handoff

**Integration review, September 26:** local module checks do not pass the end-to-end gate. A direct planner-to-frontend replay reproduces these three failures: zero `alert_sent` events/wrist messages, final board stop 2 instead of 3, and access count 0 despite one independent pharmacy confirmation. The supplied review's `scratchpad/gates/zz-integration-gates.test.ts` was not found in either checkout; these observations were reproduced independently, not by running that seven-test file. The fixes below remain required for the Phase 1 gate; persistence alone does not resolve them.

| Gap | Required Phase 1 behavior and owner |
|---|---|
| Doctor thread and watch have no alert | Vinh + Deem: a recorded reason must create a visible, template-backed doctor alert and queue a notification atomically. Agree whether legacy `alert_sent` means the app alert was created; keep provider acceptance/delivery status separate so a failed ntfy request cannot imply a wrist notification was delivered. Retries must not create duplicate alerts or notifications. |
| Board never reaches its final stop | Deem + Vinh contract review: use independent pharmacy confirmation as the final stop and label it **Fill confirmed**. Update derivation, `RelayLane` timestamps/colors, `StatusPill`, board chime/audio trigger and shared copy together. A fill does not establish treatment started. Updating `boardStop()` alone is insufficient. |
| Access remains zero after a confirmed fill | Deem + Minh: count unique cases with an independent pharmacy confirmation and a preceding prescription; calculate TTFF from those events. Deduplicate, exclude acknowledgment-only cases, and align local derivation with Minh's Tiger summary. No legacy `recovered` event is required as proof of a fill. |

These failures block the Phase 1 gate and live integration. The 131 passing module tests establish narrower behavior only. Promotion of the reviewer's gate tests into the repository awaits access to the actual file and alignment with the agreed outcome/alert contract.

1. Review and apply the prepared migration/seed to the intended Supabase project. The server reads a consistent snapshot, calls the planner, then locks/checks the same run and revision before committing events/outbox atomically; conflicts re-read and re-plan. Unique `(run_id, script_id)` maps to frontend `FillEvent.id`. The real PostgreSQL suite verifies concurrent commits/reset and the Maria planner; no in-memory production persistence is used.
2. Reject stale run IDs at the command boundary; reset creates a new run. Use an active-run generation in snapshot/reconnect handling so a late load cannot restore the previous run. Agree this with Deem before implementing `lib/realtime.ts`.
3. Preserve the four existing action routes and `/api/sim/fire { ids: string[] }`; the latter accepts only valid simulator beats, not screen actions. `/api/patient/use` emits `ev_10` only. `ev_11` is an independent simulated pharmacy confirmation. ISO timestamps come from commit time, not fixture offsets.
4. New planner intentionally withholds unverified label/watch/provider-success beats and legacy `started`/`recovered` claims. It currently accepts simulator IDs `ev_04`, `ev_05`, `ev_11`, `ev_16`, `ev_17`, `ev_18`. Deem must coordinate simulator beat grouping and fill-confirmation copy before live integration; unchanged mock mode still behaves differently. Label visibility needs a verified-label/UI acknowledgment; ntfy delivery needs a committed outbox consumer. A supplied demo reason is not evidence of Gemini use.
5. Deem's now-pushed `feat/live-source` imports a default `EventSource` from `lib/realtime.ts`, reloads every 15 seconds and on visibility changes. It currently substitutes local access totals on Tiger errors. Resolve reset races and display unavailable/lagging Tiger status before claiming live analytics. Minh supplies the real summary; Vinh supplies immutable committed events for replay.
6. Keep all detailed rows below as integration gates until actual service/device checks pass. Migration/API code is locally verified; hosted application, realtime adapter and Tiger/Gemini/Grok integration remain pending. The standalone physical watch smoke passed; workflow-triggered alerts remain pending. No notification is sent by the database tests.

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
