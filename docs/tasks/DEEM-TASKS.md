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
- [ ] Repo private until submission (it's public now).

## Phase 1: Core loop (Sat 12 AM to 4 AM)
- [x] **1.1** Foundation: catalog, `derive.ts`, `useEvents()` mock source, `fill()`, `StandIn`, `LabelCard`, shadcn init. Merge before any screen.
- [x] **1.2** Push `components/data/types.ts` (`EventSource`) and tell Vinh.
- [x] **1.3** `/sim` bare.
- [x] **1.4** `/doctor`.
- [x] **1.5** `/coordinator`.
- [x] **1.6** `/patient/[id]`.
- [-] **1.13** Wire `useEvents()` to Vinh's `lib/realtime.ts` (live source; buttons enabled by case state). Needed for the checkpoint.

**Checkpoint:** follow the current Maria core gate in PLAN.md; the original 4 AM target is superseded.

## Phase 2: The wow + deploy (Sat 4 AM to 11 AM)
- [x] **2.1** `/board`.
- [-] **2.2** James case + before-visit card (real boxed warning waits on 1.10).
- [x] **2.4** `/access`.
- [ ] **2.6** Vercel deploy.
- [x] **2.7** `/sim` extras (`?upto=`, `?replay=1`, Autoplay).

## Phase 3-4 (Sat 11 AM to 6 PM)
- [ ] **3.1** Impiricus workshop with Vinh.
- [ ] **4.2** ElevenLabs "started" mp3.
- [x] **4.3** Design pass (all six screens).
- [-] **4.4** QR flow on a stranger's phone (QR built; phone test pending).
- [ ] **4.7** Dry run; drive `/coordinator` at the table.

## Phase 5 (Sat 9 PM to Sun 6:30 AM)
- [ ] **5.2** Stills of every screen.
- [ ] **5.3** Video.
- [ ] **5.4** Writeup + poster.
- [ ] **5.5** Flip public; submit to Devpost AND expo.hexlabs.org; reload-verify.

---

## Hard rules
1. Stage named paths only. Never `git add -A`.
2. Status commits are separate from code commits.
3. Never reword label text. Every patient sentence comes from `mock/templates.json`.
4. Every screen runs on `mock/` with zero network before merge.

Live wiring handoff: Vinh implements `EventSource`; Minh supplies labels/classifier/analytics. Deem owns optional microphone capture and confirmed-action UI. `POST /api/sim/fire` uses `{ ids: string[] }`; the adapter hides this HTTP detail from screens.
