# Frontend plan (Deem)

**Frontend audit follow-up, September 26:** [PR #40](https://github.com/khadimswe/firstdose/pull/40) adds responsive layouts, main-content/route focus, sheet return focus, search feedback, contrast, named QR images and keyboard table scrolling. It is verified locally and in CI/preview, awaiting owner review/merge. See [repair checks](handoffs/frontend-audit-fixes.md) and [hosted acceptance](handoffs/deployed-acceptance.md).

The approved plan for the six screens and their data layer, as built on `main`. Status lives in `PLAN.md`; task steps in `docs/IMPLEMENTATION.md`.

## Data layer: one hook

Screens read and write only through `useEvents()` (`components/data/useEvents.ts`):

```
{ mode, script, beats, fired, firedIds, cases, catalog, access,
  fire(ids), act(action, caseId), canAct(action, caseId), reset() }
```

| File | Job |
|---|---|
| `types.ts` | Types for the `mock/` contract, `CaseView`, `AccessSummary` (no patient fields), `ScreenAction`, and the `EventSource` interface Vihn implements in `lib/realtime.ts` |
| `catalog.ts` | The only module that imports `mock/*.json` (templates excepted) |
| `store.ts` | Mock source: fired event ids in `localStorage`; other tabs on the machine follow via the `storage` event |
| `derive.ts` | Pure functions: `deriveCases`, `boardStop`, `beats` (bursts ≤ 2 s apart), `accessSummary`, `calendarDaysBetween`, `atSeconds` |
| `mode.ts` | Build-time mock/live selection; production uses the merged live source |
| `components/copy/` | `templates.json` typed, `fill()` for `{variables}`, `money()`, `clock()` |

Rules the layer enforces:
- **The frontend never decides.** `reason` comes only from `reason_classified`, `fix` only from `fix_chosen`.
- **Text:** every sentence about a patient is a `templates.json` fill or `event.wrist` as sent.
- **Labels:** label text renders exactly as stored. It's shortened only with CSS, never by editing the words.
- **Buttons act, they don't write events.** Screen buttons call `act()`:

  | Action | Screen | Live route | Mock beat |
  |---|---|---|---|
  | `prescribe` | `/doctor` | `/api/rx` | ev_01–03 |
  | `handoff` | `/doctor` | `/api/handoff` | ev_07–08 / ev_20–21 |
  | `fix` | `/coordinator` | `/api/fix` | ev_09 / ev_21b |
  | `use_card` | `/patient` | `/api/patient/use` | ev_10–13 |

  Only `/sim` calls `fire(ids)`.

## Screens (v1, as built on `main`)

| Route | Size | What it shows | Changes on |
|---|---|---|---|
| `/doctor` | iPad 1180×820 | Left: the practice EHR (patient tabs, order, `LabelCard` in order mode with the boxed warning open and other sections collapsed). Right: the Impiricus Ascend thread, with alerts, the doctor's reply, the suggested fix, "started" and the before-visit card, plus a **Send to my coordinator** quick reply and the watch mirror. The thread shows no age, condition or plan. | prescribed, alert_sent, handoff, fix_chosen, started, before_visit_card |
| `/coordinator` | Desk first, phone fallback | A work-queue table: patient, reason, the status as it arrived, plan, time waiting, and one fix per row. On a phone: cards with a pinned fix button. | handoff, fix_chosen, fix_sent, dispensed |
| `/patient/[id]` | Phone 390×844 | A pharmacy-card layout: drug, strength and quantity, the "You pay" line, the demo quote struck through, the program, and the `StandInBand` (Impiricus Wallet stand-in). One **Use at pharmacy** button. No BIN/PCN, barcode or member ID. `id` is a case id; unknown ids 404. | fix_sent, copay_card_used, started |
| `/board` | 1920×1080, dark | A lane per case through Doctor → Pharmacy → Patient → Started, with the time each stop was reached. The stop is red with the STUCK reason while stuck and green when started. The price counter goes from the $410 demo quote to $0. Also the latest status as it arrived, and a WebAudio chime once sound is enabled. | every event |
| `/access` | Desktop | A live header (pulsing dot, "updated x ago"), KPI tiles that count to their new value with a +n chip (patients recovered, median time to first fill (demo)), stuck reasons as ranked bars with count and share, and who-sees-what as two permission lists plus the three rules. Receives the aggregate summary only. | recovered, reason_classified |
| `/sim` | Laptop | Two panes. Left: beats grouped by case, each with a live status pill, done/next/pending icon, event range, actors, raw status and demo time, plus Fire. Right, sticky: progress, next-beat preview, Next beat, Autoplay 1×/4×, Stop, two-step Reset, the selected beat's events with raw JSON, and the patient QR. Keys: N, A, 4, Esc. Also `?upto` and `?replay`. | — |

## Why the screens look like this (research, 2026-09-25)

- **Impiricus Ascend reaches doctors through SMS and a secure mobile platform** ([launch release](https://www.prnewswire.com/news-releases/impiricus-launches-ascend-an-ai-platform-to-ethically-connect-physicians-and-pharma-302613771.html)). So the alert lives in a message thread, not in an EHR column.
- **Dermatologists prescribe on an iPad EHR**, and prior auths run through its queue ([ModMed EMA](https://www.modmed.com/specialties/dermatology/ehr/)). Hence the split iPad.
- **Coordinators work prior-auth and hub queues at a desk** ([CoverMyMeds](https://www.covermymeds.health/our-solutions/prior-authorization)). Hence a table first.
- **Patients already carry pharmacy savings cards** with a big price and a "not insurance" band ([GoodRx on Mobbin](https://mobbin.com/screens/b3ee8dca-f75b-4985-8cce-2f9cb465ecf4)). The stand-in label takes that band.
- **Pharmacy apps track prescriptions like packages** ([CVS](https://mobbin.com/screens/6ade5a53-e2a8-423e-b5d9-c135e5bf010c), [Walmart](https://mobbin.com/screens/ec0a4f9a-7a65-4f47-8fea-c837ad34d198)). Hence the board's stepper with times.
- **Market-access teams track time to first fill, fill rate and abandonment reasons on real-time dashboards** ([Claritas Rx](https://www.claritasrx.com/thought-leadership/market-access-strategy/)). `/access` follows realtime analytics on Mobbin: a live dot ([Wix](https://mobbin.com/screens/0858a799-8e2e-42ef-be51-2ab9c234cbd1)), ranked "top events" bars ([Google Analytics](https://mobbin.com/screens/bbe96d04-027f-4a8f-a2d5-c128b424322f)), and KPI tiles with a change chip ([Amplitude](https://mobbin.com/screens/d0eee203-09f5-43ca-a6c3-3edc74a0abdf)). Who-sees-what borrows the permission lists from [Discord](https://mobbin.com/screens/b19ff1c2-1060-491d-bca0-e6f2102916fb) and [GitHub](https://mobbin.com/screens/01bc9bde-3eb5-41d1-b143-83fc0e0f8081).
- **Operator consoles show events as a list next to a detail pane with raw JSON** ([Stripe](https://mobbin.com/screens/5423e185-8374-4b6c-a4a0-2d3ae9adc1d0), [WorkOS](https://mobbin.com/screens/a5b50327-60e0-4075-9cfd-7f383d18265c)), and runs as steps with a status each ([AirOps](https://mobbin.com/screens/6dadd86c-1a15-47ea-b654-a45132bb45d1)). That is `/sim`.
- **What we don't copy:** gradients, glass effects, emoji, AI-sparkle icons, stock art, fake barcodes, and any number that isn't in `mock/` or the facts sheet.

## Verify before merging

1. Run `npm run lint && NEXT_PUBLIC_DATA_SOURCE=mock npm run build`.
2. Check each screen at its target size, with `/sim` in a second tab, one beat at a time. The network panel shows only same-origin requests.
3. Check the diff has no keys and no drug or label text typed into `app/` or `components/`.

## v2 screen changes (Phase 6, after the 11 AM workshop)

Spec: `docs/spec-v2-coordinator.md` ("FirstDose inside DocUpdate: the four surfaces" and "The 4-minute demo"). Research: `docs/research/docupdate-teardown.md`. PLAN.md rows 6.x carry the status.

**The picture:** phone = the doctor's DocUpdate view; desktop = the coordinator's queue, the thing DocUpdate can't do today; the judge's phone = Maria. `/board` is optional at the table.

**Gates.** Nothing on screen changes before the 11 AM workshop. The answers decide three things (PLAN.md → W6 lead, W3 header, W1 pitch). Build on `main` after #9 merges, so live mode and the fill wording come with it.

Rules for every change:
- **Copy follows D1, D2 and D8.** Every patient sentence is a `templates.json` fill. The alert chip is the pharmacy status as it arrived. The last step says "Fill confirmed". Nothing claims a patient started or recovered.
- **Brand: structure, not brand.** Dark navy, a purple primary, a bottom tab bar and DocUpdate's card anatomy are fine. Never their logo, wordmark or screenshots inside our UI. Every DocUpdate-styled screen carries `<StandIn>` "Concept: FirstDose inside DocUpdate · Not affiliated" (a code label, PLAN C4).
- **Nothing in `mock/*.json` changes.** Live mode is #9's hook: `subscribe(onInsert, onRunChange, onError, onSync)`. Screens read only `useEvents()`.

### v2 structure: devices and routes

**Built, Sat 12:10** (stacked on #9):
- #11: the coordinator shell, Queue with case Sheet, and `/demo`;
- #12: the DocUpdate phone view with approve-and-send;
- #13: Prescribers;
- #14: the board's "Waiting on".

The watch is an Apple Watch paired to the doctor's iPhone, and it buzzes only while the phone is locked (PLAN C8). The wrapper source is merged in PR #30 (6.13, Vinh / Mac operator); signing, install and device acceptance remain. Stephen is not on the project.

There are two dashboards, on opposite sides of the privacy line, by design:
- **The coordinator's workspace** (desktop, practice side, with patient names). DocUpdate connects here: every "Send to my coordinator" lands in its queue.
- **Market Access** (`/access`, Ascend side, counts only).

Everything else is a device the story runs on, or backstage.

| Device | Route | Who | Side |
|---|---|---|---|
| Desktop / laptop | `/coordinator/*`, an app shell with a sidebar | Access coordinator (Judge 1) | Practice |
| iPhone | `/doctor/*`, a phone shell with bottom tabs (DocUpdate concept) | Doctor (Judge 2) | Practice |
| Apple Watch | No screen: two ntfy texts from `templates.wrist` (stuck, fill confirmed), mirrored from the doctor's locked iPhone. Output only; the tap happens on the phone | Doctor | Practice |
| Judge's own phone | `/patient/[id]` via QR | Maria | Practice |
| Second monitor (optional) | `/board`, which also shows the `WristMirror` preview | Audience | — |
| Slide or laptop | `/access` | Market Access | Ascend |
| Vinh's laptop | `/sim` | Operator | — |
| Setup | `/demo`: one card per device with a QR, the mode, reset, and the watch preview. It replaces today's `/` list | Team | — |

```
app/page.tsx                         → redirect("/coordinator")
app/(screens)/
  coordinator/  layout.tsx           sidebar (Queue · Prescribers), header per W3, StandIn
                page.tsx             Queue (home): strip, tabs, table, case Sheet
                prescribers/page.tsx linked prescribers, "Link a prescriber" (NPI), likely colleagues (6.6)
  doctor/       layout.tsx           phone shell: tabs Home · Patients · Concierge · Profile, concept StandIn
                page.tsx             Home: Rx Alerts, before-visit card, recent patients
                new/page.tsx         New Rx → Sign and send, with LabelCard
                patients/[id]/page.tsx  past prescriptions with the fill-status line
                concierge/page.tsx   Help my patient start
                profile/page.tsx     My coordinator: approve the link request / invite
  patient/[id]/  access/  board/  sim/   same roles as today
  demo/page.tsx                      the setup launcher
```

Each phone tab is a real URL, so stills, the video and the `/demo` QRs can open any surface directly. `/doctor` keeps the selected case in `?case=`.

**The coordinator's Queue (`/coordinator`).** It follows work-queue apps: a sidebar, a count strip, and a table sorted by age with status chips ([Zoho CRM workqueue](https://mobbin.com/screens/1e524375-06aa-497b-98a5-3e65d9da8c99), [Airtable tasks](https://mobbin.com/screens/1ccf6613-4abd-420f-9d18-ac7b40a04848)).
- The strip: Stuck · Waiting · Fill confirmed this week.
- The tabs: Needs a fix / Waiting on patient or pharmacy / Fill confirmed.
- The table: patient, drug, reason, status as it arrived, time stuck, "Waiting on", the one fix, contact marks.
- Clicking a row opens a Sheet with the event timeline as it arrived, the eligibility line (`templates.coordinator_card`), the fix, the marks and, for 6.8, "Approve patient message".
- On a phone: a top menu, and the existing cards with the pinned fix.

**Prescribers (`/coordinator/prescribers`, 6.12): the CoverMyMeds model.** CoverMyMeds staff open Prescribers, type the NPI, choose Add Prescriber, then Initiate Verification: a code is faxed to the prescriber and typed back ([CoverMyMeds](https://www.covermymeds.com/main/insights/articles/steps-to-npi-verification-with-covermymeds/)). Prescribers can also approve authorized delegates. FirstDose inside DocUpdate replaces the fax with an approval in DocUpdate, where the prescriber's NPI and identity are already verified.
- "Link a prescriber" → NPI → the record → "Request approval" → **Pending approval** → the doctor approves on the phone → **Linked**.
- The table: prescriber, NPI record (masked), state, status, since when.
- The demo prescriber is `rx.prescriber_label` with a code-level `<StandIn>` "Demo prescriber record · not a real NPI". Real NPPES data appears only in "Likely colleagues" (6.6), with names hidden.
- The coordinator never signs or changes a prescription; they work only on access fixes.
- Patterns: [Expensify Copilot](https://mobbin.com/flows/ea2f54d3-93e0-4b26-abc6-234c73235150), [Docusign shared access](https://mobbin.com/flows/2888efee-5689-4f55-9612-87200f79253c) (Pending → Active) and [Linktree invite admin](https://mobbin.com/flows/b67c1556-9708-4b60-8aa6-f39eeca3bd37).

**The approval in the demo (0:55).** Before the demo, the coordinator has requested the link, so it's Pending.
1. The doctor taps "Send to my coordinator".
2. Because no coordinator is linked yet, a sheet asks: "Your access coordinator asked to work on your patients' access. Approve?"
3. One tap approves the delegate and hands Maria off.
4. On the desktop, Prescribers flips to Linked and Maria lands at the top of the queue.

In mock mode, the link state and the contact marks live in the local store's overrides, synced across tabs like fired events. In live mode, coordinator links now use persisted run-scoped events (PLAN C7); Profile approval reaches the desktop before handoff. Contact marks remain local in both modes, as disclosed on the case sheet.

### What gets rebuilt, what gets reused

| Today (`main` + #7, #4) | v2 | Verdict |
|---|---|---|
| `/doctor`: iPad EHR `OrderPanel` + `AscendThread` + `WristMirror` | DocUpdate phone view, 390×844: Home (Rx Alerts + before-visit card), New Rx (Sign and send + `LabelCard`), Patient (Past Rx with a fill-status line), Concierge ("Help my patient start"), Profile ("My coordinator") | **Rebuild the shell.** Reuse `LabelCard` (order mode), `thread.ts`'s alert derivation, `canAct`/`act`, `boardStop()`. Retire `AscendThread` and the EHR tabs. `WristMirror` moves to `/board` |
| `/coordinator`: `WorkTable` (desk) + `QueueCard` (phone) | Home at `/`: summary strip, stuck sorted by time stuck, contact marks, "Waiting on" column, header per W3 | **Remodel** into an app shell (sidebar: Queue · Prescribers). Keep both components for the Queue; add the strip, tabs, sort, marks, column and case Sheet. `/` redirects here; today's index becomes `/demo` |
| `/patient/[id]`: GoodRx-style `WalletPass` | Same, plus (6.8) the coordinator-approved message played in Spanish | **Keep.** Add the audio player only |
| `/board`: `RelayLane`, `PriceCounter`, chime | Optional second monitor; lanes show "Waiting on"; hosts `WristMirror` | **Keep**, small additions |
| `/access` (#7 design) | Adds coordinators-active and fixes-per-coordinator tiles (6.7); #9's practice-count labels | **Keep**, add two tiles |
| `/sim` (#7 console) | Adds 6.5's RxFill "raw message" toggle; live mode offers only #9's valid inputs | **Keep**, add the toggle |
| `WhoSeesWhat` | DocUpdate view listed on the practice side; "first fill confirmed" counts (`docs/who-sees-what.md`) | **Reword** after #9 |
| `PatientQr` (#4) | Unchanged: `<origin>/patient/rx_001`, never a token; a scan without a session goes through #9's login | **Keep** |

### Rows

| Row | Screen | Change | Depends on |
|---|---|---|---|
| 6.2 | `/coordinator` → home | The app shell and Queue: summary strip (stuck / waiting / fill confirmed this week), tabs, stuck sorted by time stuck, "Reached patient / Left message" marks, the case Sheet, header per W3. `/` opens it; `/demo` replaces the index. Desk table stays; cards on a phone | W6, W3; C1 for the seeded week (6.1); C2 for the marks |
| 6.3 | `/doctor` | The DocUpdate phone view (table above). Priority: surface 1 (Rx Alerts card) → New Rx with the label → surface 2 (fill-status line) → surfaces 3–4 | #9 merged; 6.4 to persist the invite |
| 6.10 | Slide | DocUpdate's App Store home screenshot beside a still of our `/doctor` Home, credited, "Not affiliated" | 6.3 still |
| 6.11 | `/coordinator`, `/board` | "Waiting on: Doctor / Coordinator / Patient / Pharmacy", from one derived function over case state | 6.2 |
| 6.7 | `/access` | Coordinators active this week, fixes per coordinator (aggregate only) | 6.4 + Minh's rollup |
| 6.6 | `/coordinator` | "Likely colleagues at this practice → Invite" from `/api/npi`. Names hidden, labelled "public NPPES record, not users" | 6.2 + the API |
| 6.8 | `/coordinator` → `/patient` | The coordinator approves a templated patient message, voiced with ElevenLabs in the patient's language (Spanish for Maria). Reuses PR #3's `scripts/tts.mjs` and the board's unlock-on-click pattern. Never medical advice | 6.2; C3 for the template |
| 6.5 UI | `/sim` | "Raw message" toggle showing the RxFill fields Vinh's events carry | 6.5 data |
| 6.12 | `/coordinator/prescribers` + `/doctor/profile` | Link a prescriber by NPI; the doctor approves in DocUpdate. The approve sheet also opens on the first "Send to my coordinator" | C7 for live; mock overrides first |

### The DocUpdate phone view (6.3), screen by screen

| Tab | Content | Data |
|---|---|---|
| Home | Rx Alerts: one card per alert, as type · patient · drug · action (chip = `status_text`; title and button = `templates.doctor_alert`; reason = `templates.reason_short`). Below: the before-visit card (`templates.before_visit_card`). Recent Patients: Maria, James | `alert_sent`, `before_visit_card`, `canAct("handoff")` |
| New Rx | Patient → drug and strength → directions → **Sign and send**. `LabelCard` in order mode sits under the drug | `canAct("prescribe")`, `label_shown` |
| Patient | Patient Details, then Past Prescriptions with **Sent → At pharmacy → Fill confirmed**, or **⚠ Stuck + reason_short** | `boardStop()`, `reason_classified` |
| Concierge | Request Free Samples · Speak with a Rep · **Help my patient start** (deep-links the `handoff` action for the selected case) | `canAct("handoff")` |
| Profile | **My coordinator**: the pending request from the coordinator, with Approve (6.12). The first handoff opens the same approve sheet | store overrides in mock; C7 events live |

**Cut order at 2 PM:** Grok voice → 6.6 → 6.7 → 6.8 → the 6.12 Prescribers page (keep the approve sheet) → 6.11 → surfaces 3–4 (slide instead). **Never cut:** the coordinator queue with its one-tap fix, the Rx Alerts card, the pharmacy re-run, the verified label, and who sees what.
