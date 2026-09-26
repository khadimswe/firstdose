# Deem Tasks

Personal task tracker. Source of truth is `PLAN.md`; this file is a convenience view only.

Legend: [ ] not started · [-] in progress · [x] done · [!] blocked

---

## Keys to gather (you sign up yourself; values go in `.env`, never in git)

| Name | Where you get it | What it unblocks |
|---|---|---|
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | elevenlabs.io with the MLH code | 4.2 |
| `.tech` domain | get.tech with the MLH code; try `getfirstdose.tech`, `firstdose-rx.tech` | Q4, submission |
| Vercel | vercel.com, project `firstdose-web`, invite Vihn | 2.6 |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL` | live.hexlabs.org (only if used) | none yet |

---

## Lane ownership

Files you own exclusively:
- `app/(screens)/**`
- `components/**`
- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`
- `docs/**` (except `docs/architecture.md`, which Vihn owns; the Devpost draft is `docs/submission.md`), `README.md`
- `.github/workflows/**`

Shared (⚠️ CONTRACT commits, tell Vihn first): `mock/*.json`, `package.json`.

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
- [x] **1.2** Push `components/data/types.ts` (`EventSource`) and tell Vihn.
- [x] **1.3** `/sim` bare.
- [x] **1.4** `/doctor`.
- [x] **1.5** `/coordinator`.
- [x] **1.6** `/patient/[id]`.
- [ ] **1.13** Wire `useEvents()` to Vihn's `lib/realtime.ts` (live source; buttons enabled by case state). Needed for the checkpoint.

**CHECKPOINT Sat 4 AM:** Maria's loop across two devices in `supabase` mode.

## Phase 2: The wow + deploy (Sat 4 AM to 11 AM)
- [x] **2.1** `/board`.
- [x] **2.2** James case + before-visit card.
- [x] **2.4** `/access`.
- [ ] **2.6** Vercel deploy.
- [ ] **2.7** `/sim` extras (`?upto=`, `?replay=1`, Autoplay).

## Phase 3-4 (Sat 11 AM to 6 PM)
- [ ] **3.1** Impiricus workshop with Vihn.
- [ ] **4.2** ElevenLabs "started" mp3.
- [-] **4.3** Design pass.
- [ ] **4.4** QR flow on a stranger's phone.
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
