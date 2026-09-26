# FIRSTDOSE: Plan & Coordination

## v2 pivot brief (Sat Sep 26, 12:15)

FirstDose is **an Impiricus Ascend skill that shows up in DocUpdate**: the access coordinator's daily queue on the desktop, and the doctor's alert, fill status and approval on the phone. Spec: `docs/spec-v2-coordinator.md`. Evidence: `docs/research/docupdate-teardown.md` and `docs/research/public-sources-briefing.md` (the workshop answers from public sources). The engine, router and `mock/*.json` shapes are unchanged.

- **Workshop gate: answered from public research** (W1–W7 under Open Questions; confirm with the rep if you get the chance).
  - Product home (W3): an Ascend skill that shows up in DocUpdate. So the doctor's surface is the DocUpdate view, and the coordinator desktop says "an Impiricus Ascend skill".
  - HCP (W6): staff are the operators, and the prescriber stays the accountable HCP.
  - Staff accounts (W1): the coordinator works the queue, and the doctor approves them.

  D7 is locked.
- **The demo hardware:**
  - one laptop (`/coordinator`);
  - one iPhone running `/doctor` from the home screen (a TestFlight wrapper comes last, from Stephen);
  - one Apple Watch paired to that iPhone with ntfy. The watch buzzes only while the phone is locked.
  - The judge's own phone is Maria via QR. Vinh's laptop runs `/sim`. Setup page: `/demo`.
- **Built (Deem, Sat 12:10, stacked on #9):**
  - #11 coordinator shell, Queue and `/demo` (6.2);
  - #12 DocUpdate phone view (6.3);
  - #13 Prescribers (6.12);
  - #14 board "Waiting on" (6.11).

  Merge order: #8 → #9 → #11 → #12 → #13 → #14, then Deem rebases #4 and #7.
- **What the demo still needs from others:**
  - Vinh: 6.1 Seed the week (the opening shot shows an empty queue without it), C7 link events, and the second watch alert.
  - Minh: the Otezla label (#8 fixes) and the 6.7 rollup.
- **Copy (D8) and brand (D9):** fill wording, templates for every patient sentence, and structure never brand on DocUpdate screens.

## Execution brief (engine and gates; still valid under v2)

**Phase 1 closure candidate, September 26:** `integration/coordinator-pivot` at `c51b23f` adds reviewed label-verification corrections, publishes the full Otezla artifact/RxCUI, renders it in New Rx, fixes v2 login returns/default-patient selection, and queues the second wrist alert on separate pharmacy confirmation. Fresh evidence: 339 tests, lint, live-mode production build, 14 PostgreSQL checks, production login/label endpoint, and the complete v2 workflow in three independent browser contexts against hosted Supabase. Both notification rows were accepted once; the user confirmed the new pharmacy-fill alert on BOTH iPhone and Garmin. Independent code review found no blockers. **Phase 1 remains open only for affected-owner integration/deployment and the full physical two-device HTTPS checkpoint. Deem will deploy.** Handoff: `docs/handoffs/deem-phase1.md`. The final test left hosted state empty.

**Local integration checkpoint, September 26:** at the user's request, `integration/coordinator-pivot` combines Deem's screen stack through `63e24cf` (PRs #11-14) with pivot docs through `5ea44fb`, retaining the backend/frontend foundation from `8713fe1`. Documentation conflicts use the v2 brief, Phase 6 and current owner task guides; confirmed Phase 0/1 status rows from #9 are retained below. Local merge `eea83c2` passes 256 tests, lint and a live-mode production build. This local integration is not a merge of any GitHub PR. The earlier two-browser Maria check used the v1 screens; the rebuilt v2 flow still needs its own browser/device checkpoint. Prescriber approvals/contact marks remain local UI state pending C7/C2.

This dashboard is the execution source of truth. Keep presentation work in `docs/presentation/`; freeze the other planning/audit documents as reference snapshots. Do not maintain parallel schedules. This local revision responds to review and awaits team feedback; it does not change the shared mock contract or merge itself into main.

**Synced source:** main `560685a` now includes pivot docs (#10) and the original labels branch (#8). This integration candidate preserves the later public-source briefing and Phase 6 additions, plus the verified Phase 1 closure fixes. Open PRs:
- #15, this closure/integration candidate;
- #9, persisted backend (Vinh, draft). It carries the status for 0.4–0.9 and 1.7–1.12;
- #4, QR, and #7, access/sim design (Deem).

`/api/sim/fire` takes `{ ids: string[] }`.

**Immediate work:**
- Vinh: support the Phase 1 deployed-device checkpoint; start 6.1 only after the core gate closes.
- Minh: review the corrected label integration in `integration/coordinator-pivot`; original #8 is preserved for coordinated integration.
- Deem: review/integrate the Phase 1 candidate, configure the live HTTPS deployment, and run the physical two-device checkpoint; preserve the v2 screen stack.

- Phase 6 follow-ups retain Deem's seed/link work, Stephen's TestFlight wrapper (6.13), and Apple Watch check (C8). Garmin receipt is confirmed; it does not establish Apple Watch receipt.

**Thin backend:** reuse scripted rows and the existing EventSource seam. One shared command implementation can serve the agreed routes; a new `/api/act` is optional, not required to rename every API. Vinh's #9 carries the live wiring, built on the design from Deem's #6, so #6 closes. `main` runs mock mode until #9 merges. Keep basic database grants/RLS and guarded writes; a full production identity system is outside this demo. Privacy separation may be presented as proposed unless implemented and verified.

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

**Project:** FirstDose is the access coordinator's daily queue.
- It watches each new prescription and catches the ones that stall.
- It says why, and routes the one fix that matches.
- It tells the doctor only when it matters.

It's a proposed Impiricus workflow (inside DocUpdate or as an Ascend skill; decided at 11 AM), with fictional patients and simulated pharmacy and partner services.

**Team:**
- **Vinh:** authoritative workflow, Supabase/schema/Realtime, deterministic router, simulator/API, ntfy -> Garmin and optional Grok backend/custom widget.
- **Deem:** frontend + product. That covers:
  - all screens, including the v2 coordinator home and the DocUpdate phone view;
  - the design pass;
  - the demo script and table performance;
  - the writeup, video and poster.

  The hook's live wiring now lives in Vinh's #9.
- **Minh:** verified RxNorm/DailyMed labels, then Gemini classification, then Tiger projection/analytics. Agent implementation checklist: [Minh tasks](docs/tasks/MINH-TASKS.md).
- **Stephen:** the TestFlight wrapper for the doctor's phone view (6.13), after the web frontend is done.

**Hackathon:** HackGT 13, Georgia Tech, Sep 25-27 2026.

**Schedule:** Deem reports Sunday Sep 27, 8:00 AM ET as the cutoff and 9:30-11:00 AM expo. Keep the Sun 6:30 AM submission buffer. Exact current organizer cutoff/video cap still need source confirmation; see `docs/research/tracks-and-requirements.md`. Submit to Devpost AND expo.hexlabs.org.

**Repo:** `github.com/khadimswe/firstdose`. Public, and it stays public through submission (Deem, Sat Sep 26). The live demo link is in the README.

**Specs in the repo:** `docs/spec-v2-coordinator.md` (product), `docs/research/docupdate-teardown.md` (evidence), `docs/architecture.md` (flow, tables, API routes, external services), `docs/who-sees-what.md`, `mock/*.json` (data contract). If this file drifts from them, fix this file.

**In the repo:** `docs/presentation/` has the slide/poster copy, Q&A and the claims register (the demo script is the spec's 4-minute demo); `docs/research/` has the DocUpdate teardown and the prize/winner summaries. Personal research, credentials and private notes stay outside commits.

**Legend:** ✅ done · 🟡 in progress · ⬜ not started · ⛔ blocked · ✂️ cut

**Stale lock TTL: 3 hours.** A 🟡 task without a fresh timestamp in Notes is claimable.

**Coordination is manual.** Update task status on the owning branch, keep status-only commits separate from application code, and use reviewed PRs into main. Follow `docs/branch-workflow.md`.

---

## Context: why this exists

A stalled prescription needs a documented reason, an accountable next step and follow-up. The demo proves workflow behavior, not clinical recovery or causal effectiveness. Existing abandonment tools exist; validate the specific proposed contribution with Impiricus.

Current objective, scope and claim boundaries: [v2 spec](docs/spec-v2-coordinator.md), [DocUpdate teardown](docs/research/docupdate-teardown.md), [claims register](docs/presentation/claims-and-evidence.md).

---

## Judged surfaces

| What a judge must see | Surface | Owner |
|---|---|---|
| A coordinator's real Monday | `/coordinator` home on the desktop: summary strip, a queue sorted by time stuck, one-tap fix | Deem (UI) + Vinh (6.1 seed) |
| A staff account, done right | The doctor approves the coordinator on the phone; the desktop's Prescribers goes Pending → Linked (6.12) | Deem (UI) + Vinh (C7) |
| FirstDose inside DocUpdate | `/doctor` on a phone: the Rx Alerts card, New Rx with the label, fill status on past prescriptions (6.3), and the before/after slide (6.10) | Deem |
| A prescription going dark, then getting its fill | Price $410 → $0 and the chime; `/board` on a second screen if one is free | Deem (UI) + Vinh (events) |
| Physical wow | Apple Watch buzz on the doctor judge's wrist, twice (ntfy on the doctor's iPhone; the phone must be locked). The Garmin path was verified earlier | Vinh |
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
| 0.4 | Data contract | `mock/*.json` | **both** | ✅ | 0.1 | Sep 26: user confirms Deem/Minh agree with the plan. Runtime contract corrections and actual artifact verification remain Phase 1 implementation/review work. |
| 0.5 | Architecture doc | `docs/architecture.md` | **Vinh** reviews | ✅ | 0.4 | Sep 26: team-plan agreement confirmed by user; architecture review/proposals prepared. Concrete implementation/API additions still receive affected-owner review. |
| 0.6 | Required setup keys; later provider keys at their implementation phase | local `.env` | **Vinh + Deem + Minh** | ✅ | n/a | Phase 0 scope closed by user: Supabase/ntfy verified; Gemini model listing verified. Generation/quota and Tiger/xAI/ElevenLabs setup remain with their later tasks. MLH prize pursuit deferred, not a core blocker. |
| 0.7 | Contract fixes: add `ev_21b` (James `fix_sent` BRIDGE_SAMPLE); `wrist.started` → `"{patient_short} started {drug}. $0 with copay card."` | `mock/events.json`, `mock/templates.json` | **Deem** | ✅ | 0.4 | ⚠️ CONTRACT commit. Tell Vinh first. |
| 0.8 | **Gate:** ntfy POST → iPhone → Garmin FR55 buzz with text | `scripts/ntfy-smoke.ts` | **Vinh** | ✅ | 0.6 | September 26: ntfy accepted smoke request; user confirmed iPhone and Garmin FR55 receipt after enabling watch app notifications. Workflow-triggered alerts remain pending. |
| 0.9 | Register team on HexLabs; optional MLH category research | n/a | **Deem** | ✅ | n/a | Sep 26: user confirms registration complete; MLH/Notability prize questions deferred. |

### Phase 1: Maria core loop (Saturday morning target; recheck around 7 AM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 1.1 | Frontend foundation: catalog, `derive.ts`, `useEvents()` (mock source), `fill()`, `StandIn`, `LabelCard`, shadcn init | `components/data/**`, `components/copy/**`, `components/*.tsx` | **Deem** | ✅ | 0.4 | No `?replay` or Autoplay yet. Merge before any screen. |
| 1.2 | `EventSource` interface published to Vinh | `components/data/types.ts` | **Deem** | ✅ | 1.1 | ⚠️ CONTRACT. Vinh implements it in 1.9. |
| 1.3 | `/sim` bare: Reset + Fire per beat | `app/(screens)/sim/**` | **Deem** | ✅ | 1.1 | Drives every other screen in a second tab. |
| 1.4 | `/doctor`: prescribe → label card → alert → "Send to my coordinator" | `app/(screens)/doctor/**` | **Deem** | ✅ | 1.1 | v1 iPad 1180×820 EHR + Ascend thread; becomes the DocUpdate phone view in 6.3. Never suggests a drug. |
| 1.5 | `/coordinator`: work queue, ONE fix button per case | `app/(screens)/coordinator/**` | **Deem** | ✅ | 1.1 | Desk-first table (md and up); cards + pinned fix button on a phone (390×844). |
| 1.6 | `/patient/[id]`: Wallet pass stand-in, "Use at pharmacy" | `app/(screens)/patient/[id]/**` | **Deem** | ✅ | 1.1 | No barcode, BIN/PCN or member number. |
| 1.7 | Supabase schema: `patients`, `drugs`, `rx_cases`, `fill_events`, `labels`; seed from `mock/` | `supabase/migrations/**`, `scripts/seed.ts` | **Vinh** | 🟡 | 0.4, 0.6 | Sep 26: migrations 001/002 and seed applied to the intended hosted project over TLS; 8 RLS tables and fixture counts verified; 14 local DB checks pass. Affected-owner review/merge pending. |
| 1.8 | Router + table test (every reason × insurance; Medicare never gets a copay card) | `lib/server/router.ts`, `tests/router.test.ts` | **Vinh** | 🟡 | 0.4 | Sep 26 1:47 AM ET: local implementation reviewed, 86 tests pass; explicit card/bridge eligibility gates; owner review/merge pending. |
| 1.9 | `lib/realtime.ts` (implements 1.2) + `/api/sim/fire`, `/api/sim/reset` | `lib/realtime.ts`, `app/api/sim/**` | **Vinh** | 🟡 | 1.2, 1.7 | Sep 26: c51b23f verifies v2 live polling/session/reset in three independent browser contexts against hosted Supabase; production login passes at phone/tablet sizes. Reviewed deployment and physical two-device checkpoint remain. |
| 1.10 | Verified cached label pipeline and endpoint | `lib/server/label.ts`, `lib/server/labels/**`, `tests/labels/**` | **Minh** | 🟡 | 0.6 | Sep 26: c51b23f integrates #8 through 9241b61 with corrected identity/full-section/saved-artifact verification, exact-source hash, runtime receipt, and Otezla catalog/RxCUI publication. Label is visible before prescribing; 68 independent label/catalog tests pass. Affected-owner integration/deployment pending; Humira remains placeholder. |
| 1.11 | Action routes: `/api/rx`, `/api/handoff`, `/api/fix`, `/api/patient/use` | `app/api/**`, `lib/server/workflow.ts` | **Vinh** | 🟡 | 1.7, 1.8 | Sep 26: c51b23f passes 339 tests, lint/build and 14 DB checks. Actual v2 UI flow against hosted Supabase passes: acknowledgment remains pending; separate pharmacy signal updates counts; reload/reset pass. Deployment/physical-device checkpoint pending. |
| 1.12 | ntfy delivery for reviewed alerts and pharmacy confirmation | `lib/server/ntfy.ts` | **Vinh** | 🟡 | 0.8, 1.9 | Sep 26: c51b23f queues wrist.fill_confirmed on independent ev_11; duplicate commands cannot duplicate delivery. Both hosted reason/fill rows accepted once. User confirms BOTH iPhone and Garmin received the new pharmacy-confirmation alert; prior reason alert also physically confirmed. Reviewed deployed loop remains pending. |
| 1.13 | Wire `useEvents()` to `lib/realtime.ts`: live source, buttons enabled by case state | `components/data/**` | **Deem** | 🟡 | 1.9 | Sep 26: c51b23f passes full v2 doctor/coordinator/patient/board/access browser flow, exact verified label display and remote reset across three independent sessions. Login return/default-patient regressions fixed. Deem review/deployment and physical-device checkpoint pending. |

**CORE CHECKPOINT, Saturday morning:** Maria across two devices: prescribe -> barrier -> physical wrist alert -> reviewed coordinator handoff -> resource acknowledgment (still pending) -> separate simulated pharmacy confirmation -> first fill observed. If it fails, stop optional provider work and fix the loop.

### Phase 2: Evidence and integrations (after the Maria core gate)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 2.1 | `/board` Relay Board: lanes, red stop, price counter, WebAudio chime | `app/(screens)/board/**` | **Deem** | ✅ | 1.1 | 1920×1080 dark. Sound needs one click to enable. |
| 2.2 | James case on every screen + before-visit card with real boxed warning | `app/(screens)/doctor/**` | **Deem** | 🟡 | 1.4, 1.10 | Template only, never free text. Built; the real boxed warning appears when 1.10 fills `labels.json`. |
| 2.3 | Tiger event projection, deduplication and direct summary | `lib/server/tiger.ts`, `lib/server/analytics/**`, `app/api/access/**` | **Minh** | ⬜ | 1.7 | Handoff C1-C3; Vinh supplies committed run events; continuous aggregate deferred. |
| 2.4 | `/access`: KPI tiles, reason bars, who-sees-what | `app/(screens)/access/**` | **Deem** | ✅ | 1.1, 2.3 | Type has no patient fields. |
| 2.5 | Gemini note-to-reason classifier | `lib/server/classify.ts`, `lib/server/classifier/**` | **Minh** | ⬜ | 0.6 | Handoff B1-B2; explicit model smoke, <=140 code points, enum or null; no routing authority. |
| 2.6 | Vercel deploy (`firstdose-web`) | `.vercel/` | **Deem** | ✅ | 1.9 | Production deploys from `main` in mock mode; the link is in the README. Redeploy in `supabase` mode after #9. |
| 2.7 | `/sim` extras: `?upto=`, `?replay=1`, Autoplay | `app/(screens)/sim/**` | **Deem** | ✅ | 1.3 | Offline fallback for the board. `?replay=1&speed=N` loops one tab. |

### Phase 3: Sponsor check (Sat 11 AM to 12 PM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 3.1 | Impiricus workshop, Klaus 1456 | n/a | **both** | ⬜ | n/a | Deem + one more. Ask the spec's questions 1–7 in order (Q6 lead, Q3 header and doctor surface, Q1 pitch). Record the answers under Open Questions (W1–W7) and lock D7. |

### Phase 4: Voice, polish, design (Sat 12 PM to 6 PM)

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|---|
| 4.1 | Grok STT handoff with keyterms + `/api/voice` | `lib/server/voice.ts`, `app/api/voice/**` | **Vinh** | ⬜ | 1.11 | Record actual trials with and without keyterms; do not presume failure. |
| 4.2 | ElevenLabs "started" line on the board | `public/audio/**` | **Deem** | ✂️ | 2.1 | Replaced by 6.8 (the patient message). PR #3 closes; its `scripts/tts.mjs` is reused. |
| 4.3 | Design pass on all screens | `app/(screens)/**` | **Deem** | 🟡 | Phase 2 | doctor, patient, coordinator, board done 2026-09-26 00:07; access + sim left. |
| 4.4 | QR flow on a stranger's phone | n/a | **Deem** | 🟡 | 2.6 | QR built (PR #4). It must follow #9's login return path and never encode a token. Stranger-phone test on the deployed HTTPS origin is still to do. |
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
| 5.5 | Submit to **Devpost AND expo.hexlabs.org**; reload-verify both | n/a | **Deem** | ⬜ | 5.4 | By Sun 6:30 AM. The repo is already public. |

---


## Phase 6 — v2 pivot: the coordinator's daily queue (Sat, after the 11 AM workshop)

Spec: `docs/spec-v2-coordinator.md` ("the four surfaces"). Steps: `docs/IMPLEMENTATION.md`. Gate answered from public research (W1–W7; D7 locked). Screen PRs #11–#14 are stacked on #9 and merge after it. Engine, router and `mock/` shapes unchanged. Copy follows D8; DocUpdate screens follow D9.

| # | Task | Owner | Status | Deps | Notes |
|---|---|---|---|---|---|
| 6.0 | Integrate the open PRs: review and merge #8 (labels) and #9 (backend); Deem rebases #4 (QR + #9 login return) and #7 (access/sim design); close #2, #3 and #6 | Deem + Vinh + Minh | 🟡 | none | Order in the v2 brief. Sat 09:44: screens-side reviews posted on #8 (✅) and #9 (✅, with a QR sign-in question). #2, #3 and #6 closed. Rebases of #4 and #7 wait for #8 and #9 to merge. |
| 6.1 | `/sim` "Seed the week": pre-load 10–15 started/waiting patients | Vinh | ⬜ | none | Build now; helps either pitch |
| 6.2 | `/coordinator` = home screen: summary strip (stuck / waiting / fill confirmed, per D8), sort by time stuck, "Reached patient / Left message" marks, header per W3 | Deem | 🟡 | 11 AM | Medium. Sat 12:10: PR #11 (shell, Queue, case Sheet, `/demo`). An app shell with a sidebar (Queue · Prescribers) and a case Sheet. `/` opens it, and today's index becomes `/demo`, a setup launcher with a QR per device. Needs C1 and C2. Structure: `docs/frontend-plan.md`, "v2 structure". |
| 6.3 | `/doctor` becomes the DocUpdate phone view (phone-width): Rx Alerts card (a new alert type; the chip is the pharmacy status as it arrived), Past-Rx fill-status line (Sent → At pharmacy → Fill confirmed / Stuck + reason), Concierge "Help my patient start" checkbox (deep-links the handoff), Profile "My coordinator" invite. Structure not brand; "Concept: FirstDose inside DocUpdate · Not affiliated" on every styled screen. See spec: four surfaces | Deem | 🟡 | W3, 6.0 | Medium: rebuilds the `/doctor` shell (reuses `LabelCard`, the alert derivation, `boardStop`). Only if W3 = DocUpdate; otherwise the Ascend thread moves to phone width. Chip = pharmacy `status_text`; title, reason and button from templates (D8). One route per tab (`/doctor`, `/doctor/new`, `/doctor/patients/[id]`, `/doctor/concierge`, `/doctor/profile`). Sat 12:10: PR #12. |
| 6.4 | `coordinator_id` on cases + `coordinator_invited` event | Vinh | 🟡 | none | Local backend on `backend/coordinator-links`: run-scoped sidecar, invite/request/approve/assign API and migration 004. 320 unit tests, 20 PostgreSQL checks, lint/build pass; peer review has no blockers. [Handoff](docs/handoffs/vinh-coordinator-links.md). Affected-owner contract review, hosted apply, UI wiring and device proof remain. |
| 6.5 | RxFill-shaped `/sim` events + "raw message" toggle (`NotDispensed`, `RxFillIndicator`), labelled simulated | Vinh (events), Deem (`/sim` toggle) | 🟡 | none | Separate local `backend/rxfill-events` commit `0d9ab64` adds a pure projection and `docs/handoffs/vinh-rxfill.md`; 305 tests, lint/typecheck/build pass, peer review clear. Claims remain distinct from fill evidence; examples are explicitly simulated, not certified wire traffic. Deem's toggle/browser check and integration remain. |
| 6.6 | `/api/npi`: NPPES lookup + ZIP/taxonomy colleague search, cached; UI "Likely colleagues → Invite", names hidden, "public NPPES record, not users" | Minh (API, proposed; C6), Deem (UI) | ⬜ | 6.2 | Run from deployed app. Verify field names on a live call. |
| 6.7 | `/access` tiles: coordinators active this week, fixes per coordinator (Tiger rollup) | Minh (data), Deem (UI) | ⬜ | 2.3 | Retention proof |
| 6.8 | ElevenLabs: coordinator-approved patient message, templated, voiced in patient's language (Spanish for Maria) | Deem | ⬜ | 6.2 | Replaces the plain "started" mp3 job. Reuses PR #3's `tts.mjs`. Needs C3. |
| 6.9 | Rewrite `docs/presentation/*` around the coordinator; market-size slide; align README tagline with Q3 answer | Deem | ⬜ | 11 AM | Also: teardown facts into the claims register with sources, and the GitHub repo description (R1). |
| 6.10 | Before/after slide: DocUpdate's real App Store home screenshot beside our `/doctor` (credited, "Not affiliated") | Deem | ⬜ | 6.3 | The one-glance pitch |
| 6.11 | "Waiting on" (whose move): Doctor / Coordinator / Patient / Pharmacy, as a column in the coordinator queue and a label on `/board` lanes | Deem | 🟡 | 6.2 | Small. One derived function. Sat 12:10: PR #14 (board lanes); the queue column is in #11. |
| 6.12 | Prescribers, CoverMyMeds-style: the coordinator links a prescriber by NPI (`/coordinator/prescribers`), and the doctor approves on the phone (`/doctor/profile`, plus an approve sheet on the first "Send to my coordinator"). Pending → Linked. Demo record labelled "Demo prescriber record · not a real NPI" | Deem (UI), Vinh (C7 events) | 🟡 | 6.2, 6.3 | Small–medium. Mock overrides first; live needs C7. The approve sheet is the 0:55 demo beat. Sat 12:10: UI in PRs #12 (approve sheet) and #13 (Prescribers). In live mode the approval travels with the first handoff until C7. |
| 6.13 | TestFlight wrapper for `/doctor` (the doctor's phone as an installed app; ntfy stays the watch path) | Stephen | ⬜ | 6.3 merged | Last. Until then, `/doctor` runs from the iPhone home screen (Add to Home Screen). |

**v2 cut order (2 PM):** Grok voice → 6.6 NPPES invite → 6.7 tiles → 6.8 voice message → the 6.12 Prescribers page (keep the approve sheet) → 6.11 "Waiting on" → surfaces 3–4 (shown on the slide instead). **Never cut:** coordinator queue with one-tap fix, the doctor's Rx Alerts card, pharmacy re-run, real DailyMed label, who-sees-what.

## Shared Contracts

Full detail in `docs/architecture.md`. Summary:

| Contract | Owner | Consumers | Definition |
|---|---|---|---|
| `mock/*.json` shapes | both | everyone | Frozen. Changes are ⚠️ CONTRACT commits. |
| `useEvents()` | Deem | all screens | `{ mode, override, script, beats, fired, firedIds, cases, catalog, access, fire(ids), act(action, caseId), canAct(action, caseId), reset() }`; `action` is `prescribe \| handoff \| fix \| use_card` |
| `EventSource` | Deem defines, Vinh implements | `useEvents()` | `load() / subscribe(onInsert) / act(action, rx, fix) / fire(ids) / reset() / accessSummary()` in `components/data/types.ts`. #9 extends it to `subscribe(onInsert, onRunChange, onError, onSync)` |
| `fill_events` row | Vinh | Deem | `mock/events.json → event_shape` |
| `router(reason, insurance)` | Vinh | everyone | returns a key of `reasons.json → fixes` |
| `GET /api/access/summary` | Minh | Deem | `{ recovered, median_ttff_seconds, reason_tally }`, no patient fields. `recovered` now means first fills confirmed (#9) |
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
**Never cut:** doctor alert, handoff with one-tap fix, pharmacy re-run, real DailyMed label, who-sees-what. **Locked 2026-09-25.** For v2, the Phase 6 cut order supersedes this list.

### D6: Claim only what is live
A sponsor tool is named in the writeup only if 5.1 finds it called in code. **Locked 2026-09-25.**

### D7: v2 leads with the coordinator's queue; the doctor stays the accountable HCP
FirstDose is an Ascend skill that shows up in DocUpdate. The coordinator queue (desktop) is the home screen and opens the demo; the coordinator is the operator. The doctor is the HCP Impiricus engages: they get the DocUpdate phone view (Rx Alerts, fill status, before-visit card) and approve their coordinator. The public research supports this (`docs/research/public-sources-briefing.md` §1, §3, §6): staff accounts aren't live, the fix rails sit in Ascend, and leadership keeps the prescriber in the loop. **Locked 2026-09-26 12:15 (Deem, from public research; revisit only if the rep says otherwise).**

### D8: On-screen copy follows the templates' fill wording
Screens say "first fill pending" and "pharmacy fill confirmed" (the templates in PR #9). Nothing on screen, in the README or in the video claims a patient started or recovered. "A patient who never started looks exactly like a drug that doesn't work" is the spoken problem statement, not a claim. **Locked 2026-09-26.**

### D9: DocUpdate is structure, never brand, and sits on the practice side
The DocUpdate-styled screens copy structure: dark navy, a purple primary, the bottom tab bar, the card anatomy. They never use DocUpdate's logo, wordmark or screenshots. Every such screen carries `<StandIn>` "Concept: FirstDose inside DocUpdate · Not affiliated". Their real App Store screenshot appears only on the 6.10 slide, credited. The DocUpdate view is the prescriber's own tool, so it is practice side: patient names and fill status appear only there and in the coordinator's queue. **Locked 2026-09-26 (spec, "the four surfaces").**

---

## Open Questions

- [ ] **Q1:** Does Medvantx or Spark already detect never-filled patients? Ask at the 11 AM workshop. Needs both.
- [ ] **Q2:** Which Gemini model ID is live? List models at H0 and pin it. Needs Vinh.
- [x] **Q3:** Is Notability a challenge or a third sponsor track? **A challenge, not a sponsor track** (per our team sponsor book, p. 22 "The other challenges").
  - Prize: a year of Notability Pro each.
  - Entry: use Notability in the process (interviews, sketches), then add 2 screenshots and the "Notability" tag to the Devpost.
  - Still to confirm with the organizer (#qna): whether it stacks with our other entries.
- [ ] **Q4:** Which `.tech` domain is free (`getfirstdose.tech`, `firstdose-rx.tech`)? Needs Deem.

**Workshop answers: from public research** (`docs/research/public-sources-briefing.md`, Sat 12:15). Confirm with the rep if you can; the build follows these.
- [x] **W6 (HCP):** DocUpdate is prescriber-only, but Impiricus markets Wallet to "full care teams", and the PhRMA Code says to follow it with office staff too. Staff are the operators; the prescriber stays the accountable HCP. The coordinator leads the demo; the doctor approves (D7).
- [x] **W3 (product home):** QPharma and Medvantx were integrated "into Impiricus Ascend", and Spark already triggers on "First-Time Prescriptions". So FirstDose is an Ascend skill that shows up in DocUpdate: the doctor surface is the DocUpdate view (6.3), and the coordinator desktop says "an Impiricus Ascend skill".
- [x] **W1 (staff accounts first):** not live, with no public timeline. Comparable apps (iPrescribe, CoverMyMeds) start with a staff role that prepares and handles paperwork while only the prescriber signs. Pitch line: "FirstDose is what the first staff account does: the coordinator works the queue, the doctor approves."
- [x] **W2 (July articles):** a cluster on abandonment, prior auth and copay cards. The copay-card piece names Concierge for copay cards; no fill tracking is announced. "FirstDose is the product version of what they're already writing about."
- [x] **W4 (RxFill vs First-Fill Abandonment):** nothing public says DocUpdate supports RxFill, and RxFill has "no material adoption in ambulatory settings". First-Fill Abandonment is sold to health systems and EHR/analytics vendors, and Oracle's version is planned for 2027. Our stuck signal is an integration stand-in.
- [x] **W5 (v6.3.0 savings cards):** the mechanism isn't public (structured coverage or a pharmacy note, Wallet or manufacturer). Design for both.
- [x] **W7 (metric):** lead with patients recovered, i.e. incremental first fills (NRx), backed by time to first fill. On screen: "First fills confirmed" (D8).
- [ ] **K1:** Can we quote Keomaria by name in the demo? Needs Deem.

**Phase 6 contract questions.** `mock/` is frozen, so each of these needs Vinh + Deem.
- [x] **C1 (6.1): names decided (Deem, Sat 11:40).** The seeded week uses randomized, common American names, fictional and labelled "Fictional test records · no PHI". The list is fixed and committed, not generated at runtime, and uses no names of real public figures.
  - Proposed list for Vinh: Daniel Brooks, Angela Reyes, Kevin Nguyen, Brittany Hall, Marcus Bennett, Tanya Foster, Robert Kim, Jessica Morales, Anthony Price, Linda Walsh, Derek Coleman, Samantha Ortiz, Gregory Hayes.
  - Drugs: only the two in the catalog (Otezla, Humira).
  - Insurance: a mix, including at least one Medicare case, which routes to access support.
  - Maria and James stay the two live demo cases.
  - **Still Vinh's call:** where they live in mock mode. Proposal: a separate seed fixture that reuses the `patients.json → patients[]` and `events.json → event_shape` shapes, so the existing files' shapes don't change and mock mode shows the same week offline.
- [ ] **C2 (6.2):** Are "Reached patient / Left message" marks an event, or local-only this weekend?
- [ ] **C3 (6.8):** The coordinator-approved patient message (and its Spanish version) needs a template key (⚠️ CONTRACT), or an explicit exception to D2.
- [ ] **C4:** Can the DocUpdate stand-in label extend `<StandIn>` in code (`components/copy/`) rather than `templates.json`? Proposed text (spec, D9): "Concept: FirstDose inside DocUpdate · Not affiliated".
- [x] **C5 (4.4): Phase 1 uses option B.** Use a pre-signed spare phone with the existing demo session; on a judge's own phone, a team member enters the private code once. Replied on PR #9, September 26. A new per-run short code is not implemented. Deem's requested patient-only option A remains a separate Phase 6 follow-up.
  - **Option A (Deem's pick): a limited patient-only path.**
    - `/patient/rx_001` renders without the staff login.
    - Its one command, `POST /api/patient/use`, is accepted without a session only when all of these hold: that case, the active run, `fix_sent` with `RESEND_COPAY_CARD`, and the card not yet used.
    - It writes the acknowledgment only (`ev_10`), never the fill. It is rate-limited.
    - Every other screen and command keeps the demo login.
  - **Option B (fallback): the demo code.**
    - Keep #9's login, and a team member types the private demo code on the judge's phone once.
    - The code stays in `.env` and Vercel only: never in this file, a QR, a URL or a `NEXT_PUBLIC_*` variable.
  - Either way the QR encodes only `<origin>/patient/rx_001`.
- [ ] **C6 (6.6): Minh and Vinh decide by 1 PM.** Proposal: Minh builds `GET /api/npi` and Vinh reviews its route conventions (session check, cache, rate limit).
  - Why Minh: it's a read-only public-data client, like the label pipeline.
  - The API: NPPES v2.1, cached. Verify the field names against a live call. Return taxonomy and address line only, no names to the screen.
  - It also backs the coordinator's prescriber link (CoverMyMeds-style delegation; see the frontend plan).
  - If neither has time, 6.6 is cut; it's second in the cut order.
- [ ] **C7 (6.12):** Prescriber-link events for live mode, e.g. `coordinator_link_requested` and `coordinator_linked`, with the link state per prescriber. They extend 6.4, which gives Minh's 6.7 its coordinator ids. Additive; `mock/` shapes unchanged. Needs Vinh + Deem.
  - Vinh's implementation proposal: separate run-scoped coordinator events and case assignments, exposed through protected `/api/coordinator` reads and explicit invite/request/approve/assign commands. Events carry fixed fictional coordinator/prescriber IDs, server time and run identity. A request is pending until explicit approval; assignment requires approval. Reset clears the active view while retaining history. Existing fill-event and mock shapes stay unchanged; case `coordinator_id` is an additive sidecar projection. No real account, NPI verification, email invitation or role-separated login is claimed. Deem reviews UI wiring and Minh reviews analytics attribution before integration.
  - Local implementation verified on `backend/coordinator-links`: duplicate requests/approvals/assignments emit once; assignment requires a committed prescription; link revisions fence stale fill plans; reset clears active links/assignments and retains history. Separate polling endpoint is ready for Deem, but current screens still use their existing local state. This does not close 6.12 or imply owner approval.
- [x] **R1 (6.9):** The GitHub description ("A skill for Impiricus Ascend…") already matches W3. No change needed; optionally add "…that shows up in DocUpdate".
- [ ] **C8 (watch):** The demo watch is an Apple Watch paired to the doctor's iPhone. iOS mirrors ntfy notifications to the watch only while the iPhone is locked, so the demo locks the phone after Sign and send. Vinh: confirm both alerts on the Apple Watch with the phone locked. The ntfy action button needs the phone anyway.
- [ ] **C9 (seed week, 6.1):** Until the seed lands, the queue opens with no cases; Maria appears only after the doctor approves. The opening shot ("3 stuck, 2 waiting, 11 fills confirmed") depends on 6.1. The seeded cases belong to an already-linked prescriber, not Dr. Demo (judge 1), so Dr. Demo's approval stays the 0:55 beat.

---

## Hard Rules

1. Stage named paths only. Never `git add -A` (it will eventually pick up a key or a `notes/` file).
2. Commit format: `type(scope): description`, e.g. `feat(board): price counter`. Status updates: `status: <task#> <emoji> <description>`. Never bundle a status change with code.
3. One short-lived branch per screen or module, merged the same session. Parallel agents each get their own `git worktree`.
4. Secrets never in git: `.env` only, plus Vercel and GitHub secrets.
5. Every screen runs on `mock/` with zero network before it's merged.
6. Every number on screen, in the README, video or Devpost comes from the sourced facts sheet in `notes/`.

_Last updated: Sat Sep 26, 12:15 ET by Deem (workshop answers from public research; D7 locked; 6.2/6.3/6.11/6.12 built in #11–#14; 6.13 Stephen TestFlight; C8 Apple Watch, C9 seed week)._
