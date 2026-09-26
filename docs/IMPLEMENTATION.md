# FirstDose: implementation, end to end

> Companion to `../PLAN.md` (status, owners, decisions) and `spec-v2-coordinator.md` (the product). Task numbers match the PLAN dashboard. Each person's checklist is in `tasks/`. Read `../AGENTS.md` (Next.js 16) before any route code.

**Goal (v2):** FirstDose is the access coordinator's daily queue. When a new prescription stalls, the pharmacy or hub status becomes a reason, and the doctor sees it on the phone (the DocUpdate view) and on the wrist. One tap hands it to the coordinator, who applies the one fix the rule picks. A separate pharmacy confirmation closes the loop, and Market Access sees aggregate first fills only.

**Architecture:**
- One Next.js 16 app on Vercel serves the screens and all API routes.
- Supabase Postgres holds immutable run and event history. Clients read `GET /api/events` snapshots through `lib/realtime.ts`: 1.5 s polling with run/revision ETags, plus a refresh after each command. It is not a Realtime channel. See `backend-core.md` (arrives with PR #9).
- Commands go through guarded server routes behind a demo session cookie. The router is a pure function; ntfy delivery runs through a claim-once outbox.
- Tiger Data gets a name-free projection for aggregates (Minh). Gemini maps a note to a reason enum or null (Minh).
- Screens read only `useEvents()`. `NEXT_PUBLIC_DATA_SOURCE=mock` (the default) drives everything from `mock/*.json` with zero network.

**Owners:** **V** = Vinh (workflow, schema, router, simulator, ntfy/watch, voice). **M** = Minh (labels, Gemini, Tiger, NPPES proposed). **D** = Deem (screens, components, hook consumers, design, docs, demo, presentation, submission). Every task has one owner.

## Global constraints

- Hacking ends **Sun Sep 27, 8:00 AM ET**. Submit to **Devpost and expo.hexlabs.org** by 6:30 AM.
- Label text is verbatim from the DailyMed SPL. Every patient sentence is a `mock/templates.json` fill. Gemini outputs a reason key or null; the router picks the fix.
- Government coverage (Medicare, Medicaid, TRICARE) never gets `RESEND_COPAY_CARD`.
- Screen copy uses fill wording (PLAN D8). The patient tap is acknowledgment only; a separate pharmacy event confirms the fill.
- Every stand-in is labelled with `<StandIn>`. DocUpdate-styled screens copy structure, never brand, and say "Concept: FirstDose inside DocUpdate · Not affiliated".
- Nothing that identifies a patient or counts prescriptions reaches the Ascend side or Tiger. The DocUpdate view is practice side (`who-sees-what.md`).
- Secrets only in `.env` (gitignored) and Vercel/GitHub secrets. Never a token in a URL or QR code.
- Stage named paths only. Status commits are separate. No direct pushes to `main`.

## Review focus (every PR)

1. **Double taps:** a second tap on "Send to my coordinator", a fix or "Use at pharmacy" creates no second event and no second buzz.
2. **Government coverage:** a Medicare patient with `DECLINED_AT_PRICE` routes to `ACCESS_SUPPORT`.
3. **Label drift:** a changed or unverified label shows the red PLACEHOLDER badge, never stale or edited text.
4. **Gemini junk:** invalid JSON, an unknown reason or a timeout leaves `reason` null. It never guesses.
5. **Wi-Fi dies:** a mock build drives every screen from `/sim` with no network.
6. **Copy:** no "started" or "recovered" on screen; no hand-written patient sentence; the DocUpdate label is on every styled screen.

---

## Where the engine stands (Phases 0–2)

Detailed steps for these live with their owners; this table replaces the old TDD steps, which PR #9 superseded.

| Task | Owner | Where it lives now | What's left |
|---|---|---|---|
| 0.8 ntfy → iPhone → Garmin | V | #9 `scripts/ntfy-smoke.ts` | Done by the user's confirmation (in #9's PLAN) |
| 1.1–1.6, 2.1, 2.4, 2.7 screens and foundation | D | `main` | v2 changes below |
| 1.7 schema and seed | V | #9 `supabase/migrations/**`, `scripts/seed.ts` | Merge |
| 1.8 router | V | #9 `lib/server/router.ts`, `tests/router.test.ts` | Merge |
| 1.9 live source + sim routes | V | #9 `lib/realtime.ts`, `app/api/sim/**` | Merge |
| 1.10 verified Otezla label | M | #8 | Fix the six review items, then merge. See `tasks/MINH-TASKS.md` A1–A3 |
| 1.11 guarded action routes | V | #9 `lib/server/workflow.ts`, `app/api/**` | Merge |
| 1.12 ntfy alerts | V | #9 `lib/server/ntfy.ts`, `notification-worker.ts` | The second alert on the pharmacy confirmation, with physical receipt |
| 1.13 live hook | D → V | #9 `components/data/useEvents.ts`, `live.ts` | Merge (✂️ for Deem) |
| 2.3 Tiger | M | `tasks/MINH-TASKS.md` C1–C3 | Build |
| 2.5 Gemini | M | `tasks/MINH-TASKS.md` B1–B2 | Build |

**Phase 1 closes** when all four gates are recorded in PLAN.md (from #9's handoff):
1. affected-owner review and merge of #8 and #9;
2. the reviewed Otezla label visible in the live flow;
3. the pharmacy-confirmation wrist alert delivered and felt;
4. the full live HTTPS flow on two physical devices.

---

## Phase 6 (v2), task by task

Order after the workshop: 6.0 merges, then 6.3 (if W3 = DocUpdate) and 6.10, then 6.2 and 6.11, then 6.7, 6.6 and 6.8 as the cut order allows. Vinh's 6.1, 6.4 and 6.5 run in parallel.

### 6.0 Integrate the open PRs (V, M, D)

- [ ] **V:** rebase #9 onto `main`. Your branch predates Phase 6, so keep `main`'s Phase 6 rows and brief when resolving `PLAN.md`; don't take your side wholesale. Resolve `docs/IMPLEMENTATION.md` and `docs/tasks/*` by taking `main`'s versions and re-adding any facts that are only in yours.
- [ ] **M:** fix #8's six review items (build types, byte-preserving checkout, verify the committed artifact, reject malformed evidence, full sections versus highlights, publication gate). Keep one vitest config (Vinh's `vitest.config.mts`, Vitest 5). Regenerate the lockfile with npm.
- [ ] **D:** review both again, then merge #8 and #9 in that order. Rebase #4 (QR) and #7 (access/sim), regenerate the lockfile with npm, and retarget #7 to `main`.
- [ ] **D:** set `NEXT_PUBLIC_DATA_SOURCE=supabase` on the Vercel project and redeploy (2.6); V sets the private server env. Mock stays the offline fallback.
- **Done when:** `main` builds in both modes, `npm test` passes, and #9's two-device checklist (`handoffs/deem-phase1.md`) passes on the HTTPS origin.

### 6.1 Seed the week (V)

- [ ] Pre-load 10–15 fictional cases (fill confirmed, waiting, stuck) so the queue looks like a real Monday: "3 stuck, 2 waiting, 11 fills confirmed".
- [ ] **Decide C1 with Deem first:** what the seeded patients are called, and where they live in mock mode. Deem's proposal: a separate seed fixture, with names Deem approves, under the "Fictional test records · no PHI" stand-in. Don't change the shapes of `mock/*.json`.
- **Done when:** a reset plus "Seed the week" gives the same queue in mock and live mode.

### 6.2 Coordinator home (D): `screen/coordinator-home`

- [ ] `/` opens `/coordinator`; the screen index moves to `/screens`.
- [ ] A summary strip: stuck / waiting / fill confirmed this week, derived in `derive.ts` from case state.
- [ ] Stuck cases sorted by time stuck (oldest first); `useNowSeconds` from #7 keeps it live.
- [ ] "Reached patient" / "Left message" marks: local state in mock mode until C2 says otherwise.
- [ ] Header from W3: "FirstDose for DocUpdate" or "An Ascend skill for the practice", with its stand-in label.
- [ ] Desk table stays at md and up; cards with a pinned fix on a phone.
- **Done when:** checked at 1440 and 390 on mock, then live.

### 6.3 DocUpdate phone view (D): `screen/doctor-docupdate`

Build only if W3 = DocUpdate. If W3 = Ascend, keep the v1 Ascend thread as the doctor surface, move it to phone width, and put the four surfaces on a slide instead.

- [ ] A phone shell at 390×844: a bottom tab bar (Home · Patients · Concierge · Profile), a dark navy header with a purple primary, and `<StandIn>` "Concept: FirstDose inside DocUpdate · Not affiliated" on every screen. No DocUpdate logo, wordmark or screenshot.
- [ ] **Surface 1, Home → Rx Alerts:** one card per `alert_sent`. The anatomy is type · patient · drug · action. The chip is the pharmacy `status_text` as it arrived. The title and button come from `templates.doctor_alert`, and the reason from `templates.reason_short`. The button runs `act("handoff")` and is enabled by `canAct`. The before-visit card sits below (`templates.before_visit_card`). Reuse `thread.ts`'s alert derivation.
- [ ] **New Rx:** patient → drug and strength → directions → **Sign and send**, with `LabelCard` in order mode, calling `act("prescribe")`.
- [ ] **Surface 2, Patient → Past Prescriptions:** Sent → At pharmacy → Fill confirmed, or ⚠ Stuck + `reason_short`, driven by `boardStop()`.
- [ ] **Surface 3, Concierge:** Request Free Samples · Speak with a Rep · **Help my patient start**, which deep-links the `handoff` for the selected case. The other two are inert and labelled stand-ins.
- [ ] **Surface 4, Profile:** "My coordinator" + Invite. The first handoff opens the same sheet. It's local in mock mode, and persists once 6.4 lands.
- [ ] Retire `AscendThread` and the EHR `OrderPanel` tabs. Move `WristMirror` to `/board`.
- **Done when:** Maria's and James's paths work at 390×844 on mock, then live. The copy check passes (no invented patient sentences, no "started").

### 6.4 `coordinator_id` + `coordinator_invited` (V) ⚠️ CONTRACT if it touches mock shapes

- [ ] An additive field and event, proposed in PLAN before committing. The router is unchanged.
- [ ] Tell Deem (6.3's invite) and Minh (6.7's rollup) the event name and payload.

### 6.5 RxFill-shaped events (V data, D toggle)

- [ ] **V:** the pharmacy events carry RxFill fields (`NotDispensed`, `RxFillIndicator`, status as sent), labelled "Simulated pharmacy · real RxFill vocabulary".
- [ ] **D:** a "Raw message" toggle on `/sim`'s console (#7) shows those fields for the selected event.

### 6.6 NPPES colleague invite (M API proposed, D UI)

- [ ] **M:** `GET /api/npi?zip=&taxonomy=` → the NPPES v2.1 API, cached, with a rate limit. Verify the field names against a live call; the teardown's names are secondhand. Return taxonomy and address line; no names on the wire to the screen.
- [ ] **D:** "Likely colleagues at this practice → Invite" on `/coordinator`, names hidden, labelled "public NPPES record, not users".
- Run it from the deployed app. It is second in the cut order.

### 6.7 Coordinator tiles on `/access` (M data, D UI)

- [ ] **M:** a Tiger rollup of coordinators active this week and fixes per coordinator. Aggregate only, no patient fields. Needs 6.4.
- [ ] **D:** two tiles in #7's `/access` layout, with #9's "practice counts / Tiger unavailable" fallback labels.

### 6.8 Spanish patient message (D)

- [ ] **Needs C3 first:** a template key for the coordinator-approved patient message and its Spanish version (⚠️ CONTRACT with Vinh).
- [ ] Generate the mp3 with PR #3's `scripts/tts.mjs` (commit the script and the mp3, never `.env`). The coordinator approves; `/patient` plays it after one tap (the board's unlock pattern). Never medical advice.

### 6.9 Presentation (D)

- [ ] Rewrite `presentation/pitch-and-qa.md` around the coordinator and the four surfaces. Add the market-size slide in the spec's "about / our estimate" wording.
- [ ] Add every new fact from the teardown to `presentation/claims-and-evidence.md` with its source before it goes on a slide: the Jul 9 article, v6.3.0 savings cards, First-Fill Abandonment (Oct 15, 2025), and Oracle (Sep 24, 2026).
- [ ] Align the README tagline and the GitHub repo description (still "A skill for Impiricus Ascend…") with W3.

### 6.10 Before/after slide (D)

- [ ] DocUpdate's App Store home screenshot beside a still of our Home tab. Credit "App Store, ImpiricusHealth Corp" and add "Concept · Not affiliated". Their image appears only here.

### 6.11 "Waiting on" (D)

- [ ] One derived function, `waitingOn(case)` → Doctor / Coordinator / Patient / Pharmacy, shown as a column in the coordinator queue and a label on the `/board` lanes.

---

## Phase 4–5: finish line

| Task | Owner | Steps |
|---|---|---|
| 4.1 Grok voice handoff | V | First verify the current xAI transcription endpoint, model and keyterm option. Resolve only a permitted case and intent, return the suggestion without executing it, and call `/api/handoff` after an explicit confirm. First in the cut order |
| 4.4 QR on a stranger's phone | D | Scan from the HTTPS origin with no session; land on login; return to `/patient/rx_001` |
| 4.6 Connect IQ widget | V | Stretch. Go/no-go at 2 PM |
| 4.7 Dry runs | all | Twice, with strangers as coordinator and doctor, on the live origin; mock fallback rehearsed once |
| 5.1 Claims audit | V (M for labels, Gemini, Tiger) | Every named product called in code (file and line in `claims-audit.md`); `.env.example` parity; gitleaks on full history |
| 5.2 Stills | D | Every judge screen at its size, from the deployed origin: desktop queue, phone DocUpdate view, patient phone, access |
| 5.3 Video | D (V edits) | 2–3 min following the spec's demo; done by Sun 5 AM |
| 5.4 Writeup + poster | D | Rewrite `submission.md` from the spec and the claims register after the 9 PM freeze |
| 5.5 Submit | D | Devpost and expo.hexlabs.org; reload and verify both |
