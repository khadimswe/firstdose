# FIRSTDOSE: Plan & Coordination

## Active execution brief

This dashboard is the execution source of truth. Keep presentation work in `docs/presentation/`; freeze the other planning/audit documents as reference snapshots. Do not maintain parallel schedules. This local revision responds to review and awaits team feedback; it does not change the shared mock contract or merge itself into main.

**Synced source:** main `b11a01e` includes state-based button guards and replay/autoplay; backend remains pending. `/api/sim/fire` is standardized as `{ ids: string[] }` in `docs/architecture.md`.

**Immediate work:** Vinh tests the physical ntfy -> iPhone -> Garmin path and leads the minimal contract/backend; Minh verifies and caches Otezla label content; Deem deploys the current mock build and wires the existing hook when the adapter is ready. No new screens are required for the first gate.

**Rebaseline:** retire the 4 AM promise. Target a Saturday morning core check around 7 AM, conditional on the initial watch/deployment/contract results; record actual progress rather than another guaranteed estimate. Maria alone is the first gate. Keep 2 PM scope review, 6 PM footage and 9 PM claim freeze as internal targets; confirm the official submission cutoff.

**Small contract review:** separate acknowledgment from simulator dispensing; add UNKNOWN and a government-coverage block; add run identity with an explicit run-change/reconnect path; enforce unique `(run_id, script_id)`. Time-box the review to 45 minutes. Preserve simple server-side validated, atomic transitions; a unique event constraint alone does not prevent races or duplicate external notifications. Use prepared fictional eligibility evidence rather than a full eligibility engine. Do not infer card eligibility from commercial insurance alone.

**Thin backend:** reuse scripted rows and the existing EventSource seam. One shared command implementation can serve the agreed routes; a new `/api/act` is optional, not required to rename every API. Deem reports live wiring ready on `feat/live-source`, waiting for Vinh's adapter. Main still runs mock mode; that unpushed branch has not been independently inspected here. Keep basic database grants/RLS and guarded writes; a full production identity system is outside this demo. Privacy separation may be presented as proposed unless implemented and verified.

**Labels:** Otezla first, cached before the demo. Proposed fidelity rule: literal text from a deterministically extracted SPL section, preserving section code, source/version and source hash; an altered character must fail verification. Coordinate that contract change before claiming `byte_exact`; a hash does not prove source authenticity by itself. Humira follows only after the core works.

**Review workflow:** short module branches, one affected-owner reviewer, aim for a 15-minute response. Vinh and Deem still jointly agree changes to the shared mock contract; this can be one author's PR plus the other's review. Minh reviews only the payloads he consumes. No direct pushes to main or silent scope cuts.

### Selected technology coverage

Every selected entry must have actual technology use and proof before submission. Core and supporting technologies are not all sponsor requirements. No unrelated sponsor stack additions are requested.

| Technology / entry | Owner | Completion evidence |
|---|---|---|
| Impiricus / proposed Ascend workflow | Vinh + Deem | Useful HCP handoff; disclose partner stand-ins; validate current challenge fit and overlap |
| Supabase / core shared state | Vinh | Atomic guarded actions, run reset/reconnect and a real two-device loop |
| RxNorm + DailyMed | Minh | Verified identity, cached source/version and literal-text test |
| ntfy + iPhone + Garmin | Vinh | Physical alert from the actual run; watch remains core |
| Gemini API | Minh, after labels | Real note-to-enum result and unknown/error behavior |
| Tiger Data | Minh, after stable events | Actual stored run/query feeding summary, freshness and duplicate checks |
| Grok + Cursor / SpaceXAI | Vinh backend, Deem capture; actual Cursor user documents work | Real confirmed voice handoff plus truthful Cursor development evidence; neither currently verified |
| ElevenLabs | Deem | Generated asset actually plays in the app; a WebAudio chime is insufficient |
| .Tech | Deem | Registered project domain resolves to the reviewed app on another device |
| Notability Pro / conditional entry | Deem | Actual process use and required screenshots/tag; confirm category-slot treatment |

A Marina's Mission is the selected social-good track; no Aramco API requirement was established. Gemini is listed on the [MLH event page](https://www.mlh.com/events/hackgt-13/prizes), though absent from the fetched [Devpost prize list](https://hackgt13.devpost.com/). Exact category limits remain unconfirmed. Keep Grok/Tiger in the selected-track build plan; if the core slips, explicitly decide whether to cut the corresponding entry. Do not quietly promise every prize while omitting its technology. Status today: frontend exists; live provider integrations remain pending.

---

> Living status doc for Vinh + Minh + Deem. Update on the owning branch and merge through a reviewed PR.
> Single source of truth for who is working on what.
> **Atomic commits. Never bundle a status change with code.**

**Project:** FirstDose turns a stuck first fill into a reviewed access task, then checks for a later pharmacy fill signal. A proposed Impiricus workflow with fictional patients and simulated pharmacy/partner services.

**Team:**
- **Vinh:** authoritative workflow, Supabase/schema/Realtime, deterministic router, simulator/API, ntfy -> Garmin and optional Grok backend/custom widget.
- **Deem:** frontend + product (all six screens, `useEvents()` hook, design pass, demo script and table performance, writeup, video, poster).
- **Minh:** verified RxNorm/DailyMed labels, then Gemini classification, then Tiger projection/analytics.

**Hackathon:** HackGT 13, Georgia Tech, Sep 25-27 2026.

**Schedule:** Deem reports Sunday Sep 27, 8:00 AM ET as the cutoff and 9:30-11:00 AM expo. Keep the Sun 6:30 AM submission buffer. Exact current organizer cutoff/video cap still need source confirmation; see `docs/research/tracks-and-requirements.md`. Submit to Devpost AND expo.hexlabs.org.

**Repo:** `github.com/khadimswe/firstdose`. No visibility change is performed by this plan; check actual settings before describing them.

**Specs in the repo:** `docs/architecture.md` (flow, tables, API routes, external services), `docs/who-sees-what.md`, `mock/*.json` (data contract). If this file drifts from them, fix this file.

**In the repo:** `docs/presentation/` contains demo scripts, slide/poster copy, Q&A and a submission draft; `docs/research/` contains sourced prize/winner summaries. Personal research, credentials and private notes stay outside commits.

**Legend:** ✅ done · 🟡 in progress · ⬜ not started · ⛔ blocked · ✂️ cut

**Stale lock TTL: 3 hours.** A 🟡 task without a fresh timestamp in Notes is claimable.

**Coordination is manual.** Update task status on the owning branch, keep status-only commits separate from application code, and use reviewed PRs into main. Follow `docs/branch-workflow.md`.

---

## Context: why this exists

A stalled prescription needs a documented reason, an accountable next step and follow-up. The demo proves workflow behavior, not clinical recovery or causal effectiveness. Existing abandonment tools exist; validate the specific proposed contribution with Impiricus.

Current objective, scope and claim boundaries: [product proposal](docs/product-proposal.md), [winning conditions](docs/winning-conditions.md), [claims register](docs/presentation/claims-and-evidence.md).

---

## Judged surfaces

| What a judge must see | Surface | Owner |
|---|---|---|
| A prescription going dark, then recovering | `/board` Relay Board: red stop, price $410 → $0, chime | Deem (UI) + Vinh (events) |
| Physical wow | Garmin buzz on the doctor judge's wrist, twice | Vinh |
| A judge becomes the patient | QR → `/patient/rx_001` on their own phone | Deem |
| Real data, not a mock | Verbatim DailyMed label card with byte-exact badge | Minh (data) + Deem (card) |
| The buyer | `/access`: subsequent fill signals and elapsed time; Tiger only when verified | Minh (Tiger) + Deem (UI) |
| Trust | Who-sees-what panel; every stand-in labelled | Deem |

---

## Status Dashboard

### Phase 0: Setup (Fri 8 PM to Sat 12 AM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 0.1 | Repo, `.gitignore`, `.env.example`, README, ABOUT, LICENSE | root | **Deem** | ✅ | n/a | Vinh invited. |
| 0.2 | Next.js 16 scaffold (App Router, TS, Tailwind v4) | `app/**`, `package.json` | **Deem** | ✅ | 0.1 | No `src/`. Read `node_modules/next/dist/docs/` before route code. |
| 0.3 | CI: lint, build, `npm test --if-present`, gitleaks, tracked-file gate, mock JSON gate | `.github/workflows/ci.yml` | **Deem** | ✅ | 0.2 | Not required on `main` during the event. |
| 0.4 | Data contract | `mock/*.json` | **both** | 🟡 | 0.1 | Two fixes pending (see 0.7). Frozen after. |
| 0.5 | Architecture doc | `docs/architecture.md` | **Vinh** reviews | 🟡 | 0.4 | Deem drafted. Vinh corrects routes/tables to match his build. |
| 0.6 | Keys (each person signs up, keys move by AirDrop only) | local `.env` | **Vinh**: Supabase, Tiger Data, Gemini, xAI. **Deem**: ElevenLabs + .Tech (MLH), Vercel, HexLabs OpenAI | ⬜ | n/a | |
| 0.7 | Contract fixes: add `ev_21b` (James `fix_sent` BRIDGE_SAMPLE); `wrist.started` → `"{patient_short} started {drug}. $0 with copay card."` | `mock/events.json`, `mock/templates.json` | **Deem** | ✅ | 0.4 | ⚠️ CONTRACT commit. Tell Vinh first. |
| 0.8 | **Gate:** ntfy POST → iPhone → Garmin FR55 buzz with text | `scripts/ntfy-smoke.sh` | **Vinh** | ⬜ | 0.6 | Garmin Connect open. Body ≤ 200 chars. |
| 0.9 | Register team on HexLabs; ask #qna if Notability is a challenge or sponsor track | n/a | **Deem** | ⬜ | n/a | |

### Phase 1: Maria core loop (Saturday morning target; recheck around 7 AM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 1.1 | Frontend foundation: catalog, `derive.ts`, `useEvents()` (mock source), `fill()`, `StandIn`, `LabelCard`, shadcn init | `components/data/**`, `components/copy/**`, `components/*.tsx` | **Deem** | ✅ | 0.4 | No `?replay` or Autoplay yet. Merge before any screen. |
| 1.2 | `EventSource` interface published to Vinh | `components/data/types.ts` | **Deem** | ✅ | 1.1 | ⚠️ CONTRACT. Vinh implements it in 1.9. |
| 1.3 | `/sim` bare: Reset + Fire per beat | `app/(screens)/sim/**` | **Deem** | ✅ | 1.1 | Drives every other screen in a second tab. |
| 1.4 | `/doctor`: prescribe → label card → alert → "Send to my coordinator" | `app/(screens)/doctor/**` | **Deem** | ✅ | 1.1 | iPad 1180×820. Never suggests a drug. |
| 1.5 | `/coordinator`: work queue, ONE fix button per case | `app/(screens)/coordinator/**` | **Deem** | ✅ | 1.1 | Desk-first table (md and up); cards + pinned fix button on a phone (390×844). |
| 1.6 | `/patient/[id]`: Wallet pass stand-in, "Use at pharmacy" | `app/(screens)/patient/[id]/**` | **Deem** | ✅ | 1.1 | No barcode, BIN/PCN or member number. |
| 1.7 | Supabase schema: `patients`, `drugs`, `rx_cases`, `fill_events`, `labels`; seed from `mock/` | `supabase/migrations/**`, `scripts/seed.ts` | **Vinh** | ⬜ | 0.4, 0.6 | Field names identical to `mock/`. |
| 1.8 | Router + table test (every reason × insurance; Medicare never gets a copay card) | `lib/server/router.ts`, `tests/router.test.ts` | **Vinh** | ⬜ | 0.4 | Pure function over `reasons.json → router.rows`. No AI. |
| 1.9 | `lib/realtime.ts` (implements 1.2) + `/api/sim/fire`, `/api/sim/reset` | `lib/realtime.ts`, `app/api/sim/**` | **Vinh** | ⬜ | 1.2, 1.7 | Realtime channel `fill_events`, insert only. |
| 1.10 | Label pipeline: RxNorm → DailyMed SPL → `labels` + byte-exact test | `lib/server/label.ts`, `tests/label.test.ts`, `mock/labels.json` | **Minh** | ⬜ | 0.6 | Setids hardcoded. Fills RxCUIs + `labels.json`. |
| 1.11 | Action routes: `/api/rx`, `/api/handoff`, `/api/fix`, `/api/patient/use` | `app/api/**` | **Vinh** | ⬜ | 1.7, 1.8 | Guarded transitions so a double tap can't double-fire. |
| 1.12 | ntfy on `alert_sent` and `started` | `lib/server/ntfy.ts` | **Vinh** | ⬜ | 0.8, 1.9 | Action button → `/api/handoff`. |
| 1.13 | Wire `useEvents()` to `lib/realtime.ts`: live source, buttons enabled by case state | `components/data/**` | **Deem** | 🟡 | 1.9 | Draft PR #6 (`feat/live-source`, rebased on `main`): live source, error banner, double-tap guard held until the event arrives. A code review found 4 issues (load/insert race, short-lived double-tap guard, no retry after import/subscribe failure, merged error slots), all fixed and re-tested against a stand-in `EventSource` (slow load, slow Realtime, failing subscribe/act). Builds green without `lib/realtime.ts` (a build-time fallback shows a clear banner in live mode and switches itself off once the file exists), so it no longer blocks `main`. Live behaviour still waits on 1.9 and Q5–Q7, Q10. |

**CORE CHECKPOINT, Saturday morning:** Maria across two devices: prescribe -> barrier -> physical wrist alert -> reviewed coordinator handoff -> resource acknowledgment (still pending) -> separate simulated pharmacy confirmation -> first fill observed. If it fails, stop optional provider work and fix the loop.

### Phase 2: Evidence and integrations (after the Maria core gate)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 2.1 | `/board` Relay Board: lanes, red stop, price counter, WebAudio chime | `app/(screens)/board/**` | **Deem** | ✅ | 1.1 | 1920×1080 dark. Sound needs one click to enable. |
| 2.2 | James case on every screen + before-visit card with real boxed warning | `app/(screens)/doctor/**` | **Deem** | 🟡 | 1.4, 1.10 | Template only, never free text. Built; the real boxed warning appears when 1.10 fills `labels.json`. |
| 2.3 | Tiger Data: `fill_events` hypertable + `daily_ttff` + `/api/access/summary` | `lib/server/tiger.ts`, `app/api/access/**` | **Minh** | ⬜ | 1.7 | Dual-write, no patient names. |
| 2.4 | `/access`: KPI tiles, reason bars, who-sees-what | `app/(screens)/access/**` | **Deem** | ✅ | 1.1, 2.3 | Type has no patient fields. |
| 2.5 | Gemini classifier: note → reason enum (`responseSchema`) | `lib/server/classify.ts` | **Minh** | ⬜ | 0.6 | List models at startup. ≤ 140 chars in, enum out. |
| 2.6 | Vercel deploy (`firstdose-web`) | `.vercel/` | **Deem** | ⬜ | 1.9 | Check `.vercel/project.json` before every `--prod`. |
| 2.7 | `/sim` extras: `?upto=`, `?replay=1`, Autoplay | `app/(screens)/sim/**` | **Deem** | ✅ | 1.3 | Offline fallback for the board. `?replay=1&speed=N` loops one tab. |

### Phase 3: Sponsor check (Sat 11 AM to 12 PM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 3.1 | Impiricus workshop, Klaus 1456 | n/a | **both** | ⬜ | n/a | Questions in `notes/`. Record answers under Open Questions. |

### Phase 4: Voice, polish, design (Sat 12 PM to 6 PM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 4.1 | Grok STT handoff with keyterms + `/api/voice` | `lib/server/voice.ts`, `app/api/voice/**` | **Vinh** | ⬜ | 1.11 | Record actual trials with and without keyterms; do not presume failure. |
| 4.2 | ElevenLabs "started" line on the board | `public/audio/**` | **Deem** | ⬜ | 2.1 | Pre-generate the mp3; no runtime call. |
| 4.3 | Design pass on all screens | `app/(screens)/**` | **Deem** | 🟡 | Phase 2 | doctor, patient, coordinator, board done 2026-09-26 00:07; access + sim left. |
| 4.4 | QR flow on a stranger's phone | n/a | **Deem** | ⬜ | 2.6 | |
| 4.5 | **Cut check Sat 2 PM** (see Decisions D5) | n/a | **both** | ⬜ | n/a | |
| 4.6 | Connect IQ widget (stretch) | `garmin/**` | **Vinh** | ⬜ | 1.12 | Go/no-go at 2 PM. |
| 4.7 | Dry run with 2 strangers as judges; raw footage at 6 PM | n/a | **both** | ⬜ | all | |

### Phase 5: Freeze + submit (Sat 9 PM to Sun 8 AM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 5.1 | Claims audit: every named product is really called in code; gitleaks full history | `docs/claims-audit.md` | **Vinh** | ⬜ | all | Sat 9 PM claims freeze. |
| 5.2 | Stills of every judge screen (desktop + phone) from the deployed origin | `docs/stills/` | **Deem** | ⬜ | 2.6 | Look at each one. |
| 5.3 | Video 2-3 min | `docs/video/` | **Deem** (Vinh edits once backend is frozen) | ⬜ | 5.2 | Done by Sun 5 AM. |
| 5.4 | Devpost writeup + poster | `docs/submission.md` | **Deem** | ⬜ | 5.1 | |
| 5.5 | Flip repo public; submit to **Devpost AND expo.hexlabs.org**; reload-verify both | n/a | **Deem** | ⬜ | 5.4 | By Sun 6:30 AM. |

---

## Shared Contracts

Full detail in `docs/architecture.md`. Summary:

| Contract | Owner | Consumers | Definition |
|---|---|---|---|
| `mock/*.json` shapes | both | everyone | Frozen. Changes are ⚠️ CONTRACT commits. |
| `useEvents()` | Deem | all screens | `{ mode, override, script, beats, fired, firedIds, cases, catalog, access, fire(ids), act(action, caseId), canAct(action, caseId), reset() }`; `action` is `prescribe \| handoff \| fix \| use_card` |
| `EventSource` | Deem defines, Vinh implements | `useEvents()` | `load() / subscribe(onInsert) / act(action, rx, fix) / fire(ids) / reset() / accessSummary()` in `components/data/types.ts` |
| `fill_events` row | Vinh | Deem | `mock/events.json → event_shape` |
| `router(reason, insurance)` | Vinh | everyone | returns a key of `reasons.json → fixes` |
| `GET /api/access/summary` | Minh | Deem | `{ recovered, median_ttff_seconds, reason_tally }`, no patient fields |
| Label | Minh | Deem | `mock/labels.json → label_shape`; `byte_exact: true` or the UI shows red PLACEHOLDER |

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
- [ ] **Q2:** Which Gemini model ID is live? List models at H0 and pin it. Needs Vinh.
- [ ] **Q3:** Is Notability a challenge or a third sponsor track? Ask #qna. Needs Deem.
- [ ] **Q4:** Which `.tech` domain is free (`getfirstdose.tech`, `firstdose-rx.tech`)? Needs Deem.
- [ ] **Q5:** Does `lib/realtime.ts` default-export the `EventSource`? That is what PR #6 imports. Needs Vinh.
- [ ] **Q6:** What is the run-change signal for reset/new runs? PR #6 re-syncs from `load()` on focus and every 15 s, so after another device resets, the new run's `ev_01…` can be dropped as duplicates for up to 15 s. The agreed signal changes `EventSource` (⚠️ CONTRACT). Needs Vinh + Deem.
- [ ] **Q7:** Is "Use at pharmacy" acknowledgment only (`copay_card_used`), with pharmacy confirmation fired separately? Mock mode on `main` still fires ev_10–13 in one tap; it's a one-line change once agreed. Needs Vinh + Deem.
- [ ] **Q8:** How do labels reach the screens in live mode? Either Minh writes verified text into `mock/labels.json`, or the hook fetches `GET /api/label/[drug_id]`. Needs Minh + Deem.
- [ ] **Q9:** What replaces the "started" / "recovered" wording (board stop, `wrist.started`, `/access`) so it doesn't claim more than a fill signal? Copy and metric names change together. Needs all three.
- [ ] **Q10:** Three live-data details from the PR #6 review:
  - Live `case_id` must equal the catalog ids (`rx_001`, `rx_002`).
  - `fill_events` needs a sequence column to break `at` ties within a transaction; right now ties keep load order.

  Needs Vinh.

---

## Hard Rules

1. Stage named paths only. Never `git add -A` (it will eventually pick up a key or a `notes/` file).
2. Commit format: `type(scope): description`, e.g. `feat(board): price counter`. Status updates: `status: <task#> <emoji> <description>`. Never bundle a status change with code.
3. One short-lived branch per screen or module, merged the same session. Parallel agents each get their own `git worktree`.
4. Secrets never in git: `.env` only, plus Vercel and GitHub secrets.
5. Every screen runs on `mock/` with zero network before it's merged.
6. Every number on screen, in the README, video or Devpost comes from the sourced facts sheet in `notes/`.

_Last updated: September 26, 2026; synchronized with main b11a01e._
