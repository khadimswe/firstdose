# Deem Tasks

Personal task tracker. Source of truth is `PLAN.md`; this file is a convenience view only.

Legend: [ ] not started · [-] in progress · [x] done · [!] blocked

---

## Keys to gather (you sign up yourself; values go in `.env`, never in git)

| Name | Where you get it | What it unblocks |
|---|---|---|
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | elevenlabs.io with the MLH code | 4.2 |
| `.tech` domain | get.tech with the MLH code; try `getfirstdose.tech`, `firstdose-rx.tech` | Q4, submission |
| Vercel | vercel.com, project `firstdose-web`, invite Vinh | 2.6 |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL` | live.hexlabs.org (only if used) | none yet |

---

## Lane ownership

Files you own exclusively:
- `app/(screens)/**`
- `components/**`
- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
- Presentation publication and screen docs. Module owners maintain their reference docs; coordinate root README/PLAN changes. Submission draft: `docs/submission.md`.
- `.github/workflows/**`

Shared (⚠️ CONTRACT commits, tell Vinh first): `mock/*.json`, `package.json`.

---

## Phase 0: Setup
- [x] **0.1** Repo, README, ABOUT, LICENSE.
- [x] **0.2** Next.js 16 scaffold.
- [x] **0.3** CI.
- [x] **0.7** Contract fixes: `ev_21b` + `wrist.started`. ⚠️ CONTRACT.
- [ ] **0.9** HexLabs team registration; #qna Notability question.
- Repo stays public (decided Sat Sep 26).

## Phase 1: Core loop (Sat 12 AM to 4 AM)
- [x] **1.1** Foundation: catalog, `derive.ts`, `useEvents()` mock source, `fill()`, `StandIn`, `LabelCard`, shadcn init. Merge before any screen.
- [x] **1.2** Push `components/data/types.ts` (`EventSource`) and tell Vinh.
- [x] **1.3** `/sim` bare.
- [x] **1.4** `/doctor`.
- [x] **1.5** `/coordinator`.
- [x] **1.6** `/patient/[id]`.
- [x] ✂️ **1.13** Live wiring. Carried by Vinh's PR #9, which is built on my #6's design. Close #6.

**Checkpoint:** follow the current Maria core gate in PLAN.md; the original 4 AM target is superseded.

## Phase 2: The wow + deploy (Sat 4 AM to 11 AM)
- [x] **2.1** `/board`.
- [-] **2.2** James case + before-visit card (real boxed warning waits on 1.10).
- [x] **2.4** `/access`.
- [x] **2.6** Vercel deploy: production from `main`, in mock mode. Redeploy in `supabase` mode after #9.
- [x] **2.7** `/sim` extras (`?upto=`, `?replay=1`, Autoplay).

## Phase 3-4 (Sat 11 AM to 6 PM)
- [ ] **3.1** Impiricus workshop at 11 AM. Ask the spec's questions 1–7 in order. W1 decides the lead, W3 the header, W6 the pitch.
- [x] ✂️ **4.2** Replaced by 6.8. Close PR #3; reuse its `scripts/tts.mjs`.
- [-] **4.3** Design pass: four screens merged; `/access` and `/sim` in PR #7 (rebase onto #9).
- [-] **4.4** QR flow: built in PR #4. Rebase onto #9 and follow its login return path, without a token in the QR. Then test on a stranger's phone from the deployed HTTPS origin.
- [ ] **4.7** Dry run; drive `/coordinator` at the table.

## Phase 6: v2 pivot, the coordinator's daily queue (spec: `docs/spec-v2-coordinator.md`)

**Before 11 AM (no screen changes):**
- [-] **6.0** Integrate the open PRs.
  1. Review #8 (labels) and #9 (backend); they merge first.
  2. Rebase #4 (QR) and #7 (access/sim) onto `main`.
  3. Close #2 (folded into the v2 docs PR), #3 and #6.
- [-] v2 docs PR: PLAN.md brief, D7/D8 and the W/C questions; README; spec in fill wording; `docs/frontend-plan.md`; banners on doctor-first docs.
- [ ] Workshop prep: the spec's questions 1–7, and Keomaria's four (K1: quote permission).

**12–2 PM (after the workshop answers):**
- [ ] **6.2** `/coordinator` home, on branch `screen/coordinator-home`.
  - Summary strip.
  - Sort by time stuck.
  - Contact marks.
  - Header per W3.
  - `/` opens it.

  Needs C1 and C2.
- [ ] **6.3** `/doctor` alerts inbox + before-visit card, "Sent from DocUpdate (stand-in)" and "Invite your coordinator". Branch `screen/doctor-inbox`. Needs C4.
- [ ] **6.10** `/board` "whose move" labels. Branch `screen/board-whose-move`.
- [ ] **6.7 UI** `/access` coordinator tiles. Needs 6.4 and Minh's rollup.
- [ ] **6.6 UI** "Likely colleagues → Invite" (NPPES). Needs `/api/npi`.
- [ ] **6.8** Coordinator-approved patient message, voiced in Spanish for Maria. Reuses `tts.mjs`. Needs C3.
- [ ] **6.9** Rewrite `docs/presentation/*` around the coordinator, plus the market-size slide (use the spec's "about / our estimate" wording).

**Cut order at 2 PM:** Grok → 6.6 → 6.7 → 6.8 → 6.10.

## Phase 5 (Sat 9 PM to Sun 6:30 AM)
- [ ] **5.2** Stills of every screen.
- [ ] **5.3** Video.
- [ ] **5.4** Writeup + poster.
- [ ] **5.5** Submit to Devpost AND expo.hexlabs.org; reload-verify.

---

## Hard rules
1. Stage named paths only. Never `git add -A`.
2. Status commits are separate from code commits.
3. Never reword label text. Every patient sentence comes from `mock/templates.json`.
4. Every screen runs on `mock/` with zero network before merge.

Live wiring handoff: Vinh implements `EventSource`; Minh supplies labels/classifier/analytics. Deem owns optional microphone capture and confirmed-action UI. `POST /api/sim/fire` uses `{ ids: string[] }`; the adapter hides this HTTP detail from screens.
