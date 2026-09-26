# FIRSTDOSE: Plan & Coordination

> Living status doc for Vihn + Deem. Updated on every task change and pushed to `main`.
> Single source of truth for who is working on what.
> **Atomic commits. Never bundle a status change with code.**

**Project:** FirstDose, a skill for Impiricus Ascend that catches patients who never start a new prescription, tells the doctor why on their wrist, routes the one right fix to the coordinator in one tap, and proves recovery to Market Access.

**Team:**
- **Vihn:** backend + AI/data + hardware (Supabase schema and Realtime, simulator API, reason enum, Gemini classifier, fix router, RxNorm/DailyMed label pipeline, Tiger Data, Grok STT, ntfy → Garmin, Connect IQ stretch).
- **Deem:** frontend + product (all six screens, `useEvents()` hook, design pass, demo script and table performance, writeup, video, poster).

**Hackathon:** HackGT 13, Georgia Tech, Sep 25-27 2026.

**Deadline:** **Sunday Sep 27, 8:00 AM ET, hard.** Submit to **Devpost AND expo.hexlabs.org**. **Target submit: Sun 6:30 AM.** Expo Sun 9:30-11:00 AM.

**Repo:** `github.com/khadimswe/firstdose`. Private until submission, then public.

**Specs in the repo:** `docs/architecture.md` (flow, tables, API routes, external services), `docs/who-sees-what.md`, `mock/*.json` (data contract). If this file drifts from them, fix this file.

**Not in the repo:** demo script, facts sheet, prize strategy. They live in `notes/` (gitignored), shared by DM.

**Legend:** ✅ done · 🟡 in progress · ⬜ not started · ⛔ blocked · ✂️ cut

**Stale lock TTL: 3 hours.** A 🟡 task without a fresh timestamp in Notes is claimable.

**Coordination is manual.** Edit this file by hand, commit only `PLAN.md`, push. Commit message: `status: <task#> <emoji> <description>`.

---

## Context: why this exists

- **The problem:** 29% of new-to-brand prescriptions are never filled (IQVIA, *U.S. Medicine Use Trends 2026*). Abandonment is under 5% at $0 out of pocket and 60% over $500 (IQVIA, 2020). The practice finds out weeks later, and the doctor thinks the drug failed.
- **The doctor line:** "A patient who never started looks exactly like a drug that doesn't work."
- **Our answer:** per-patient reason, one compliant fix, proof of recovery, inside Impiricus Ascend. Surescripts and hubs say it didn't happen. We say why, fix it in one tap, and prove it worked.

---

## Judged surfaces

| What a judge must see | Surface | Owner |
|---|---|---|
| A prescription going dark, then recovering | `/board` Relay Board: red stop, price $410 → $0, chime | Deem (UI) + Vihn (events) |
| Physical wow | Garmin buzz on the doctor judge's wrist, twice | Vihn |
| A judge becomes the patient | QR → `/patient/rx_001` on their own phone | Deem |
| Real data, not a mock | Verbatim DailyMed label card with byte-exact badge | Vihn (data) + Deem (card) |
| The buyer | `/access`: recovered, time to first fill from Tiger Data, no names | Vihn (Tiger) + Deem (UI) |
| Trust | Who-sees-what panel; every stand-in labelled | Deem |

---

## Status Dashboard

### Phase 0: Setup (Fri 8 PM to Sat 12 AM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 0.1 | Repo, `.gitignore`, `.env.example`, README, ABOUT, LICENSE | root | **Deem** | ✅ | n/a | Vihn invited. |
| 0.2 | Next.js 16 scaffold (App Router, TS, Tailwind v4) | `app/**`, `package.json` | **Deem** | ✅ | 0.1 | No `src/`. Read `node_modules/next/dist/docs/` before route code. |
| 0.3 | CI: lint, build, `npm test --if-present`, gitleaks, tracked-file gate, mock JSON gate | `.github/workflows/ci.yml` | **Deem** | ✅ | 0.2 | Not required on `main` during the event. |
| 0.4 | Data contract | `mock/*.json` | **both** | 🟡 | 0.1 | Two fixes pending (see 0.7). Frozen after. |
| 0.5 | Architecture doc | `docs/architecture.md` | **Vihn** reviews | 🟡 | 0.4 | Deem drafted. Vihn corrects routes/tables to match his build. |
| 0.6 | Keys (each person signs up, keys move by AirDrop only) | local `.env` | **Vihn**: Supabase, Tiger Data, Gemini, xAI. **Deem**: ElevenLabs + .Tech (MLH), Vercel, HexLabs OpenAI | ⬜ | n/a | |
| 0.7 | Contract fixes: add `ev_21b` (James `fix_sent` BRIDGE_SAMPLE); `wrist.started` → `"{patient_short} started {drug}. $0 with copay card."` | `mock/events.json`, `mock/templates.json` | **Deem** | ✅ | 0.4 | ⚠️ CONTRACT commit. Tell Vihn first. |
| 0.8 | **Gate:** ntfy POST → iPhone → Garmin FR55 buzz with text | `scripts/ntfy-smoke.sh` | **Vihn** | ⬜ | 0.6 | Garmin Connect open. Body ≤ 200 chars. |
| 0.9 | Register team on HexLabs; ask #qna if Notability is a challenge or sponsor track | n/a | **Deem** | ⬜ | n/a | |

### Phase 1: Core loop (Sat 12 AM to 4 AM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 1.1 | Frontend foundation: catalog, `derive.ts`, `useEvents()` (mock source), `fill()`, `StandIn`, `LabelCard`, shadcn init | `components/data/**`, `components/copy/**`, `components/*.tsx` | **Deem** | ✅ | 0.4 | No `?replay` or Autoplay yet. Merge before any screen. |
| 1.2 | `EventSource` interface published to Vihn | `components/data/types.ts` | **Deem** | ✅ | 1.1 | ⚠️ CONTRACT. Vihn implements it in 1.9. |
| 1.3 | `/sim` bare: Reset + Fire per beat | `app/(screens)/sim/**` | **Deem** | ✅ | 1.1 | Drives every other screen in a second tab. |
| 1.4 | `/doctor`: prescribe → label card → alert → "Send to my coordinator" | `app/(screens)/doctor/**` | **Deem** | ✅ | 1.1 | iPad 1180×820. Never suggests a drug. |
| 1.5 | `/coordinator`: work queue, ONE fix button per case | `app/(screens)/coordinator/**` | **Deem** | ✅ | 1.1 | Desk-first table (md and up); cards + pinned fix button on a phone (390×844). |
| 1.6 | `/patient/[id]`: Wallet pass stand-in, "Use at pharmacy" | `app/(screens)/patient/[id]/**` | **Deem** | ✅ | 1.1 | No barcode, BIN/PCN or member number. |
| 1.7 | Supabase schema: `patients`, `drugs`, `rx_cases`, `fill_events`, `labels`; seed from `mock/` | `supabase/migrations/**`, `scripts/seed.ts` | **Vihn** | ⬜ | 0.4, 0.6 | Field names identical to `mock/`. |
| 1.8 | Router + table test (every reason × insurance; Medicare never gets a copay card) | `lib/server/router.ts`, `tests/router.test.ts` | **Vihn** | ⬜ | 0.4 | Pure function over `reasons.json → router.rows`. No AI. |
| 1.9 | `lib/realtime.ts` (implements 1.2) + `/api/sim/fire`, `/api/sim/reset` | `lib/realtime.ts`, `app/api/sim/**` | **Vihn** | ⬜ | 1.2, 1.7 | Realtime channel `fill_events`, insert only. |
| 1.10 | Label pipeline: RxNorm → DailyMed SPL → `labels` + byte-exact test | `lib/server/label.ts`, `tests/label.test.ts`, `mock/labels.json` | **Vihn** | ⬜ | 0.6 | Setids hardcoded. Fills RxCUIs + `labels.json`. |
| 1.11 | Action routes: `/api/rx`, `/api/handoff`, `/api/fix`, `/api/patient/use` | `app/api/**` | **Vihn** | ⬜ | 1.7, 1.8 | Guarded transitions so a double tap can't double-fire. |
| 1.12 | ntfy on `alert_sent` and `started` | `lib/server/ntfy.ts` | **Vihn** | ⬜ | 0.8, 1.9 | Action button → `/api/handoff`. |
| 1.13 | Wire `useEvents()` to `lib/realtime.ts`: live source, buttons enabled by case state | `components/data/**` | **Deem** | ⬜ | 1.9 | `mode.ts` runs mock until this lands, whatever the env var says. Needed for the checkpoint. |

**CHECKPOINT Sat 4 AM:** Maria's loop runs end to end across two devices in `supabase` mode: prescribe → stuck → wrist buzz → handoff → one fix → patient taps → re-run → started buzz. If not, stop and fix together before Phase 2.

### Phase 2: The wow + deploy (Sat 4 AM to 11 AM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 2.1 | `/board` Relay Board: lanes, red stop, price counter, WebAudio chime | `app/(screens)/board/**` | **Deem** | ✅ | 1.1 | 1920×1080 dark. Sound needs one click to enable. |
| 2.2 | James case on every screen + before-visit card with real boxed warning | `app/(screens)/doctor/**` | **Deem** | ✅ | 1.4, 1.10 | Template only, never free text. |
| 2.3 | Tiger Data: `fill_events` hypertable + `daily_ttff` + `/api/access/summary` | `lib/server/tiger.ts`, `app/api/access/**` | **Vihn** | ⬜ | 1.7 | Dual-write, no patient names. |
| 2.4 | `/access`: KPI tiles, reason bars, who-sees-what | `app/(screens)/access/**` | **Deem** | ✅ | 1.1, 2.3 | Type has no patient fields. |
| 2.5 | Gemini classifier: note → reason enum (`responseSchema`) | `lib/server/classify.ts` | **Vihn** | ⬜ | 0.6 | List models at startup. ≤ 140 chars in, enum out. |
| 2.6 | Vercel deploy (`firstdose-web`) | `.vercel/` | **Deem** | ⬜ | 1.9 | Check `.vercel/project.json` before every `--prod`. |
| 2.7 | `/sim` extras: `?upto=`, `?replay=1`, Autoplay | `app/(screens)/sim/**` | **Deem** | ⬜ | 1.3 | Offline fallback for the board. |

### Phase 3: Sponsor check (Sat 11 AM to 12 PM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 3.1 | Impiricus workshop, Klaus 1456 | n/a | **both** | ⬜ | n/a | Questions in `notes/`. Record answers under Open Questions. |

### Phase 4: Voice, polish, design (Sat 12 PM to 6 PM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 4.1 | Grok STT handoff with keyterms + `/api/voice` | `lib/server/voice.ts`, `app/api/voice/**` | **Vihn** | ⬜ | 1.11 | Record the no-keyterm miss for the video. |
| 4.2 | ElevenLabs "started" line on the board | `public/audio/**` | **Deem** | ⬜ | 2.1 | Pre-generate the mp3; no runtime call. |
| 4.3 | Design pass on all screens | `app/(screens)/**` | **Deem** | 🟡 | Phase 2 | doctor, patient, coordinator, board done 2026-09-26 00:07; access + sim left. |
| 4.4 | QR flow on a stranger's phone | n/a | **Deem** | ⬜ | 2.6 | |
| 4.5 | **Cut check Sat 2 PM** (see Decisions D5) | n/a | **both** | ⬜ | n/a | |
| 4.6 | Connect IQ widget (stretch) | `garmin/**` | **Vihn** | ⬜ | 1.12 | Go/no-go at 2 PM. |
| 4.7 | Dry run with 2 strangers as judges; raw footage at 6 PM | n/a | **both** | ⬜ | all | |

### Phase 5: Freeze + submit (Sat 9 PM to Sun 8 AM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 5.1 | Claims audit: every named product is really called in code; gitleaks full history | `docs/claims-audit.md` | **Vihn** | ⬜ | all | Sat 9 PM claims freeze. |
| 5.2 | Stills of every judge screen (desktop + phone) from the deployed origin | `docs/stills/` | **Deem** | ⬜ | 2.6 | Look at each one. |
| 5.3 | Video 2-3 min | `docs/video/` | **Deem** (Vihn edits once backend is frozen) | ⬜ | 5.2 | Done by Sun 5 AM. |
| 5.4 | Devpost writeup + poster | `docs/submission.md` | **Deem** | ⬜ | 5.1 | |
| 5.5 | Flip repo public; submit to **Devpost AND expo.hexlabs.org**; reload-verify both | n/a | **Deem** | ⬜ | 5.4 | By Sun 6:30 AM. |

---

## Shared Contracts

Full detail in `docs/architecture.md`. Summary:

| Contract | Owner | Consumers | Definition |
|---|---|---|---|
| `mock/*.json` shapes | both | everyone | Frozen. Changes are ⚠️ CONTRACT commits. |
| `useEvents()` | Deem | all screens | `{ mode, script, beats, fired, firedIds, cases, catalog, access, fire(ids), act(action, caseId), canAct(action, caseId), reset() }`; `action` is `prescribe \| handoff \| fix \| use_card` |
| `EventSource` | Deem defines, Vihn implements | `useEvents()` | `load() / subscribe(onInsert) / act(action, rx, fix) / fire(ids) / reset() / accessSummary()` in `components/data/types.ts` |
| `fill_events` row | Vihn | Deem | `mock/events.json → event_shape` |
| `router(reason, insurance)` | Vihn | everyone | returns a key of `reasons.json → fixes` |
| `GET /api/access/summary` | Vihn | Deem | `{ recovered, median_ttff_seconds, reason_tally }`, no patient fields |
| Label | Vihn | Deem | `mock/labels.json → label_shape`; `byte_exact: true` or the UI shows red PLACEHOLDER |

**Contract changes require telling the other person before committing.** Mark such commits `⚠️ CONTRACT`.

---

## Decisions

### D1: The frontend never decides anything
`reason` comes only from `reason_classified` events; `fix` only from `fix_chosen`. Screens display, they don't classify or route. **Locked 2026-09-25.**

### D2: No AI-written drug or patient text
Label text is a byte-exact substring of the DailyMed SPL. Every sentence about a patient comes from `mock/templates.json`. Gemini outputs only a reason enum. **Locked 2026-09-25.**

### D3: Every stand-in is labelled on screen
Ascend, Wallet, QPharma, Medvantx, pharmacy, hub and prices use `<StandIn>`. Patients are fictional; no PHI anywhere. **Locked 2026-09-25.**

### D4: Specialty drugs use status events, not a clock
Only retail uses the 48-hour rule. **Locked 2026-09-25.**

### D5: Cut order (Sat 2 PM, if behind)
1. Label-change highlighting (keep the verbatim label). 2. Connect IQ widget (keep ntfy). 3. Voice handoff (keep the tap). 4. `/access` screen (use a slide).
**Never cut:** doctor alert, handoff with one-tap fix, pharmacy re-run, real DailyMed label, who-sees-what. **Locked 2026-09-25.**

### D6: Claim only what is live
A sponsor tool is named in the writeup only if 5.1 finds it called in code. **Locked 2026-09-25.**

---

## Open Questions

- [ ] **Q1:** Does Medvantx or Spark already detect never-filled patients? Ask at the 11 AM workshop. Needs both.
- [ ] **Q2:** Which Gemini model ID is live? List models at H0 and pin it. Needs Vihn.
- [ ] **Q3:** Is Notability a challenge or a third sponsor track? Ask #qna. Needs Deem.
- [ ] **Q4:** Which `.tech` domain is free (`getfirstdose.tech`, `firstdose-rx.tech`)? Needs Deem.

---

## Hard Rules

1. Stage named paths only. Never `git add -A` (it will eventually pick up a key or a `notes/` file).
2. Commit format: `type(scope): description`, e.g. `feat(board): price counter`. Status updates: `status: <task#> <emoji> <description>`. Never bundle a status change with code.
3. One short-lived branch per screen or module, merged the same session. Parallel agents each get their own `git worktree`.
4. Secrets never in git: `.env` only, plus Vercel and GitHub secrets.
5. Every screen runs on `mock/` with zero network before it's merged.
6. Every number on screen, in the README, video or Devpost comes from the sourced facts sheet in `notes/`.

_Last updated: 2026-09-26 00:15 ET by Deem (Claude)._
