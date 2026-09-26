# Deem Tasks

Personal checklist. `PLAN.md` is the source of truth; steps for each task are in `docs/IMPLEMENTATION.md`. Product: `docs/spec-v2-coordinator.md`.

Legend: [ ] not started · [-] in progress · [x] done · [!] blocked

**Lane:** `app/(screens)/**`, `components/**`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `.github/workflows/**`, and the docs (`docs/**` except `architecture.md`, `backend-core.md` and the other owners' trackers), `README.md`. Shared, tell Vinh first: `mock/*.json`, `package.json`.

---

## Done (Phases 0–2)

- [x] 0.1 repo · 0.2 Next.js 16 scaffold · 0.3 CI · 0.7 contract fixes · 0.9 HexLabs registration
- [x] 1.1 foundation · 1.2 `EventSource` · 1.3–1.6 sim, doctor, coordinator, patient
- [x] 2.1 board · 2.4 access · 2.6 Vercel (mock mode) · 2.7 `?upto`, `?replay`, Autoplay
- [x] ✂️ 1.13 live wiring (carried by Vinh's #9) · ✂️ 4.2 board mp3 (replaced by 6.8)
- [x] v2 docs PR #10: PLAN brief, D7/D8, spec in fill wording, the four surfaces, trackers, stale docs removed

## Now → 11 AM workshop

- [x] **3.1** Workshop answers taken from public research (`docs/research/public-sources-briefing.md`); PLAN W1–W7 filled and D7 locked. Still ask the rep in person if you can, plus Keomaria's four.
  - W6 (Q6) decides the lead.
  - W3 (Q3) decides the header, and whether `/doctor` becomes the DocUpdate view.
  - W1 (Q1) decides the pitch.

  Lock D7 in a status commit right after.
- [ ] Watch DocUpdate's YouTube Short and the two product videos on docupdate.io (the teardown couldn't). Note anything that changes the four surfaces.

## 6.0 Integration (first thing after the workshop)

- [-] Reviews posted on #8 and #9. #2, #3 and #6 closed.
- [ ] Merge #8, then #9, once their owners fix the review items. Tell Vinh to keep Phase 6 when he rebases #9 (his branch predates it).
- [ ] Rebase #4 (QR) onto `main`. It encodes `<origin>/patient/rx_001`, never a token, and a scan without a session goes through #9's login. Regenerate the lockfile with npm.
- [ ] Rebase #7 (access/sim) onto `main` and retarget it. Bring in #9's behaviour: practice counts when Tiger is unavailable; `/sim` offers only valid inputs live; Autoplay mock-only.
- [ ] 2.6: redeploy in `supabase` mode (Vinh sets the private env). Keep a mock deploy as the fallback.
- [ ] Reword `WhoSeesWhat` to match `docs/who-sees-what.md` (DocUpdate view on the practice side; "first fill confirmed").
- [ ] After #9 merges, clear the lines in `docs/for-vihn.md` that #9 completed (RxCUIs, Realtime channel, `EventSource`, reset). Keep open items only.

## 12–2 PM build (one branch per screen, mock first, then live)

- [-] **6.3** DocUpdate phone view: **PR #12** (W3 answered: an Ascend skill that shows up in DocUpdate). Otherwise move the Ascend thread to phone width. Priority order:
  1. Rx Alerts card;
  2. New Rx with the label;
  3. the fill-status line;
  4. Concierge and Profile.
- [ ] **6.10** Before/after slide: their App Store home screenshot beside our Home still, credited, "Not affiliated".
- [-] **6.2** Coordinator home: **PR #11**, plus the `/demo` launcher that replaces the index:
  - `/` opens it;
  - summary strip;
  - sorted by time stuck;
  - contact marks (C2);
  - header per W3.
- [-] **6.12** Prescribers: **PR #13** (approve sheet in #12): link a prescriber by NPI, and the doctor approves on the phone (the approve sheet also opens on the first handoff). Mock overrides first; live needs Vinh's C7 events.
- [-] **6.11** "Waiting on": the queue column is in #11, the board lanes in **PR #14**.
- [ ] Merge the stack after #9: #11 → #12 → #13 → #14. Each one retargets to `main` as the one below merges.
- [ ] After #9: rebase #4 and add the patient QR to `/demo`'s Maria card.
- [ ] **6.7 UI** Coordinator tiles on `/access` (needs 6.4 and Minh's rollup).
- [ ] **6.6 UI** "Likely colleagues → Invite", names hidden (needs `/api/npi`).
- [ ] **6.5 UI** "Raw message" toggle on `/sim` (needs Vinh's RxFill fields).
- [ ] **6.8** Spanish patient message with `tts.mjs` (needs C3).

**2 PM cut order:** Grok → 6.6 → 6.7 → 6.8 → the 6.12 Prescribers page (keep the approve sheet) → 6.11 → surfaces 3–4 (shown on the slide instead). **Never cut:** the coordinator queue with its one-tap fix, the Rx Alerts card, the pharmacy re-run, the verified label, and who sees what.

## 2:30–9 PM

- [ ] 2:30 Impiricus mini event: test the opener and the before/after slide.
- [ ] **6.9** Presentation:
  - rewrite `pitch-and-qa.md`;
  - add the teardown facts, with sources, to `claims-and-evidence.md`;
  - add the market-size slide;
  - align the README tagline and the GitHub repo description with W3.
- [ ] **4.4** QR on a stranger's phone from the HTTPS origin.
- [ ] **4.7** Two dry runs with strangers, on the live origin, plus one mock fallback run.
- [ ] 6 PM footage: the desktop queue, the phone's Rx Alerts, the watch close-up, and the judge's phone as Maria.

## 9 PM → Sun 6:30 AM

- [ ] 9 PM claims freeze (5.1 with Vinh).
- [ ] **5.2** Stills of every judge screen at its size, from the deployed origin. Look at each one.
- [ ] **5.3** Video, 2–3 min, following the spec's demo. Done by Sun 5 AM.
- [ ] **5.4** Writeup and poster: rewrite `docs/submission.md`.
- [ ] **5.5** Submit to Devpost and expo.hexlabs.org, then reload and verify both.

## Keys (yours; values in `.env`, never in git)

| Name | Unblocks |
|---|---|
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (MLH code) | 6.8 |
| `.tech` domain (`getfirstdose.tech`, `firstdose-rx.tech`) | Q4, submission |
| Vercel `firstdose-web` (Vinh invited) | 2.6 |

## Hard rules

1. Stage named paths only. Status commits are separate from code commits.
2. Never reword label text. Every patient sentence comes from `mock/templates.json`. Fill wording only (D8).
3. Every stand-in uses `<StandIn>`. DocUpdate: structure, never brand.
4. Every screen runs on `mock/` with zero network before merge.
