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

## Done Sat 13:00

- [x] **6.0** Merged #10, #8, #9, #11–#14, #15, #4 and #7 into `main` (`4c80650`) and deleted the merged branches.
- [x] **6.2 / 6.3 / 6.11 / 6.12** Coordinator app, DocUpdate phone view, Waiting on, Prescribers.
- [x] **4.3** Design pass: access and sim (from #7) now carry #9's live behaviour.
- [x] `WhoSeesWhat` reworded to `docs/who-sees-what.md`; the QR is on `/demo`; the `for-vihn.md` done lines are cleared.
- [x] **6.9 / 6.10** Pitch, poster, judge answers and claims register; before/after slide spec and still.

## Still open in my lane

- [x] **6.8 / C3** Spanish patient message: shipped inside Vinh's #32 with its persistence; #21 closed as superseded.
- [x] Owner review of #32 (#35): product-voice status copy, queue counts that match the tabs, message case from data.
- [x] Vercel: access code set, unused keys removed, production offline until Vinh re-seeds (Sat).
- [ ] **Phase 1 gate 4** with Vinh: after his hosted migrations 005/006 and re-seed, flip `NEXT_PUBLIC_DATA_SOURCE=supabase`, redeploy, and run the two-device checklist (`docs/handoffs/deem-phase1.md`).
- [ ] **4.4** QR on a stranger's phone from the deployed origin.
- [x] Slide 4 still: the seeded coordinator Queue (#33).
- [ ] **6.7 UI / 6.6 UI** when Minh's rollup and `/api/npi` land.

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
