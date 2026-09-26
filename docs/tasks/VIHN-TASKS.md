# Vihn Tasks

Personal task tracker. Source of truth is `PLAN.md`; this file is a convenience view only. Wiring details for each task are in `docs/architecture.md`.

Legend: [ ] not started · [-] in progress · [x] done · [!] blocked

---

## Keys to gather (you sign up yourself; values go in `.env`, never in git)

| Name | Where you get it | What it unblocks |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | supabase.com, new project, Settings → API. Invite Deem to the project | 1.7, 1.9, 1.11, everything live |
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

Files you own exclusively:
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
- [ ] **0.8** **GATE:** `curl -H "Title: FirstDose" -d "Maria: Otezla not started. Declined at price." ntfy.sh/$NTFY_TOPIC` → the Garmin FR55 buzzes with the text.
- [ ] List live Gemini models once; pin the ID (Q2).

## Phase 1: Core loop (Sat 12 AM to 4 AM)
- [ ] **1.7** Supabase schema (`patients`, `drugs`, `rx_cases`, `fill_events`, `labels`) + seed from `mock/`. Field names identical to `mock/`.
- [ ] **1.8** Router as a pure function over `reasons.json → router.rows` + table test. Medicare/Medicaid never gets a copay card.
- [ ] **1.9** `lib/realtime.ts` implementing `EventSource` + `/api/sim/fire` + `/api/sim/reset`. Realtime channel `fill_events`, insert only.
- [ ] **1.10** RxNorm → DailyMed SPL → `labels` + byte-exact test. Fill the two `TODO_VIHN` RxCUIs and `mock/labels.json`.
- [ ] **1.11** `/api/rx`, `/api/handoff`, `/api/fix`, `/api/patient/use`, with guarded transitions (a double tap can't double-fire).
- [ ] **1.12** ntfy on `alert_sent` and `started`; action button → `/api/handoff`.

**CHECKPOINT Sat 4 AM:** Maria's loop across two devices in `supabase` mode, with the watch buzzing twice.

## Phase 2: The wow + deploy (Sat 4 AM to 11 AM)
- [ ] **2.3** Tiger Data dual-write: `fill_events` hypertable + `daily_ttff` continuous aggregate + `GET /api/access/summary` (no patient fields).
- [ ] **2.5** Gemini classifier: note → reason enum with `responseSchema`. ≤ 140 chars in, enum out, nothing else.
- [ ] Help Deem with 2.6 Vercel env vars.

## Phase 3-4 (Sat 11 AM to 6 PM)
- [ ] **3.1** Impiricus workshop with Deem (Klaus 1456). Record answers under Open Questions.
- [ ] **4.1** Grok STT `/api/voice` with keyterms `[Maria, James, Otezla, Humira, coordinator]`. Record the no-keyterm miss for the video.
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
