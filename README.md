# FirstDose

**Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets the patient on it, every day.**

**Live demo:** [firstdose.vercel.app](https://firstdose.vercel.app). It runs in mock mode: scripted fictional cases, synced between tabs of one browser. Open `/sim` to drive it.

FirstDose is the access coordinator's daily work queue. It was built at HackGT 13 by **Vinh, Minh and Deem** as a proposed Impiricus workflow.

After a prescription is sent, nobody in the office can see whether the patient started, or why not. DocUpdate, Impiricus's e-prescribing app, says so in its own FAQ and its July 2026 article on prescription abandonment. FirstDose:
- watches each new prescription and catches the ones that stall;
- says why, and routes the one fix that matches;
- tells the doctor only when it matters.

> A patient who never started looks exactly like a drug that doesn't work.

Inside DocUpdate it adds four things, not a new app: one alert type, one fill-status line, one Concierge checkbox and one "My coordinator" profile row. The doctor sees those on the phone; the coordinator works the queue on a desktop, which DocUpdate can't do today.

Spec: [docs/spec-v2-coordinator.md](docs/spec-v2-coordinator.md). Research: [DocUpdate teardown](docs/research/docupdate-teardown.md). It's an Impiricus Ascend skill that shows up in DocUpdate (PLAN.md → D7; the reasoning is in the [public-sources briefing](docs/research/public-sources-briefing.md)).

## Who uses it

| Person | How often | What they do |
|---|---|---|
| **Access coordinator** (main user) | Every workday, first thing | Works a queue sorted by who's slipping soonest. Applies one fix per stuck patient. Marks "Reached patient" or "Left message" |
| **Doctor** | A few alerts a week, plus before visits | One tap: "Send to my coordinator". The watch buzzes only when it matters |
| **Patient** | Once, when stuck | Opens the savings card on their phone and taps "Use at pharmacy" |
| **Market Access** (buyer) | Weekly | Sees aggregate counts only: first fills confirmed, time to first fill, stuck reasons. Pays per confirmed first fill, never per prescription |

## The demo (target)

1. The coordinator's Monday-morning queue is on the desktop.
2. On a phone styled as DocUpdate (a labelled concept, not affiliated), the doctor prescribes Otezla for Maria. The order shows the source-checked DailyMed label.
3. The simulated pharmacy reports "Not dispensed" with a reason. The phone's Rx Alerts shows it and the doctor's watch buzzes.
4. The doctor taps "Send to my coordinator". Maria jumps to the top of the queue with one fix, chosen by rule, not by AI.
5. The coordinator taps the fix. A judge scans the QR, becomes Maria, and acknowledges the card. That alone is not a fill.
6. A separate simulated pharmacy confirmation arrives. The doctor's prescription line reads "Fill confirmed", and the watch buzzes again.
7. James: a different reason and a different fix, plus the doctor's before-visit card.
8. Market Access: aggregate counts only, and who sees what.

Screens say "first fill pending" and "pharmacy fill confirmed". A fill signal doesn't prove a patient started treatment (PLAN.md → D8).

## What's real and what's simulated

- **Simulated and labelled on every screen:**
  - pharmacy and hub events (real RxFill and hub vocabulary, real NCPDP reject codes);
  - DocUpdate (our phone view copies its structure, never its brand, and says "Concept: FirstDose inside DocUpdate · Not affiliated"), Ascend, the Wallet, QPharma and Medvantx;
  - prices;
  - patients, which are fictional (no PHI).
- **Real, or being built (status in PLAN.md):**
  - RxNorm and a verified DailyMed label (PR #8);
  - Supabase persisted workflow and live wiring (PR #9);
  - the ntfy → iPhone → Garmin alert;
  - ElevenLabs audio;
  - later, Gemini (note → reason code only) and Tiger Data (aggregate time to first fill).

The router never changes a prescription. It only removes access barriers, and Medicare and Medicaid patients never get a manufacturer copay card.

## Current state

- **On `main`:** six screens on mock data, state-based button guards, replay and Autoplay, and a production deploy in mock mode.
- **In review:**
  - #8, the verified Otezla label (Minh);
  - #9, the persisted backend and live wiring (Vinh);
  - #4, the patient QR, and #7, the access/sim design (Deem).
- **Built, in review:** #11–#14 (stacked on #9) cover the v2 screens: the coordinator's Queue and Prescribers, the DocUpdate phone view with approve-and-send, the board's "Waiting on", and `/demo` (which device runs which screen).
- **Next:** the before/after slide, coordinator tiles, the colleague invite, the patient voice message and a TestFlight wrapper for the doctor's phone.

## Screens

| Route | Who looks at it | What it shows |
|---|---|---|
| `/coordinator` | Access coordinator (home screen in v2) | The queue of stuck patients, the reason, and the one fix |
| `/doctor` | Doctor, on a phone | The DocUpdate view (v2, being built): Rx Alerts with "Send to my coordinator", New Rx with the verbatim label, past prescriptions with fill status, the before-visit card. On `main` it is still the v1 iPad EHR |
| `/patient/[id]` | Patient (a judge, via QR) | The savings card stand-in and "Use at pharmacy" |
| `/board` | Optional second screen | Each prescription's route, the stuck reason and the demo price |
| `/access` | Market Access | Aggregate counts, stuck reasons and who sees what |
| `/sim` | Operator | Fires the simulated pharmacy and hub events |

## Team and branches

| Owner | Responsibility |
|---|---|
| Vinh | Authoritative workflow, schema, router, Realtime, simulator, watch; optional voice backend |
| Minh | Verified labels, then the Gemini classifier, then Tiger analytics |
| Deem | Screens, design, demo and presentation |

We work on short module branches and merge reviewed PRs into `main` (see the [branch workflow](docs/branch-workflow.md)). [PLAN.md](PLAN.md) is the single status dashboard.

## Start here

- [v2 spec: the coordinator's daily queue](docs/spec-v2-coordinator.md) and the [DocUpdate teardown](docs/research/docupdate-teardown.md)
- [PLAN.md: status, owners, gates and decisions](PLAN.md)
- [Frontend plan: screens, the data layer and the design research](docs/frontend-plan.md)
- [Architecture and frontend contract](docs/architecture.md) and [who sees what](docs/who-sees-what.md)
- [Presentation pack](docs/presentation/README.md) (being rewritten around the coordinator, task 6.9) and the [claims register](docs/presentation/claims-and-evidence.md)
- [Tracks, sponsors and requirements](docs/research/tracks-and-requirements.md)

## Run it

```text
npm ci
npm run dev        # http://localhost:3000
```

Every screen runs on `mock/` data with no backend (`NEXT_PUBLIC_DATA_SOURCE=mock`, the default); open `/sim` to drive it. Live mode (`supabase`) arrives with PR #9. It is set at build time, and its server settings stay private. Never put secrets in `NEXT_PUBLIC_*` variables or commit `.env`.

## Verification

CI runs lint, build, gitleaks and the mock-contract gate on every PR. These still need their own recorded checks before any claim: physical watch delivery, source fidelity of the label, and synchronization across two real devices (see PLAN.md → Phase 1 checkpoint and 5.1 claims audit).
