# Frontend plan (Deem)

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
| `mode.ts` | Mock until task 1.13 wires the live source |
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

## Screens

| Route | Size | What it shows | Changes on |
|---|---|---|---|
| `/doctor` | iPad 1180×820 | Left: the practice EHR (patient tabs, order, `LabelCard` in order mode with the boxed warning open and other sections collapsed). Right: the Impiricus Ascend thread, with alerts, the doctor's reply, the suggested fix, "started" and the before-visit card, plus a **Send to my coordinator** quick reply and the watch mirror. The thread shows no age, condition or plan. | prescribed, alert_sent, handoff, fix_chosen, started, before_visit_card |
| `/coordinator` | Desk first, phone fallback | A work-queue table: patient, reason, the status as it arrived, plan, time waiting, and one fix per row. On a phone: cards with a pinned fix button. | handoff, fix_chosen, fix_sent, dispensed |
| `/patient/[id]` | Phone 390×844 | A pharmacy-card layout: drug, strength and quantity, the "You pay" line, the demo quote struck through, the program, and the `StandInBand` (Impiricus Wallet stand-in). One **Use at pharmacy** button. No BIN/PCN, barcode or member ID. `id` is a case id; unknown ids 404. | fix_sent, copay_card_used, started |
| `/board` | 1920×1080, dark | A lane per case through Doctor → Pharmacy → Patient → Started, with the time each stop was reached. The stop is red with the STUCK reason while stuck and green when started. The price counter goes from the $410 demo quote to $0. Also the latest status as it arrived, and a WebAudio chime once sound is enabled. | every event |
| `/access` | Desktop | Patients recovered, median time to first fill (demo), stuck-reason bars, and the who-sees-what table. Receives the aggregate summary only. | recovered, reason_classified |
| `/sim` | Laptop | The beats with Fire and Reset. Task 2.7 adds `?upto`, `?replay` and Autoplay. | — |

## Why the screens look like this (research, 2026-09-25)

- **Impiricus Ascend reaches doctors through SMS and a secure mobile platform** ([launch release](https://www.prnewswire.com/news-releases/impiricus-launches-ascend-an-ai-platform-to-ethically-connect-physicians-and-pharma-302613771.html)). So the alert lives in a message thread, not in an EHR column.
- **Dermatologists prescribe on an iPad EHR**, and prior auths run through its queue ([ModMed EMA](https://www.modmed.com/specialties/dermatology/ehr/)). Hence the split iPad.
- **Coordinators work prior-auth and hub queues at a desk** ([CoverMyMeds](https://www.covermymeds.health/our-solutions/prior-authorization)). Hence a table first.
- **Patients already carry pharmacy savings cards** with a big price and a "not insurance" band ([GoodRx on Mobbin](https://mobbin.com/screens/b3ee8dca-f75b-4985-8cce-2f9cb465ecf4)). The stand-in label takes that band.
- **Pharmacy apps track prescriptions like packages** ([CVS](https://mobbin.com/screens/6ade5a53-e2a8-423e-b5d9-c135e5bf010c), [Walmart](https://mobbin.com/screens/ec0a4f9a-7a65-4f47-8fea-c837ad34d198)). Hence the board's stepper with times.
- **What we don't copy:** gradients, glass effects, emoji, AI-sparkle icons, stock art, fake barcodes, and any number that isn't in `mock/` or the facts sheet.

## Verify before merging

1. Run `npm run lint && NEXT_PUBLIC_DATA_SOURCE=mock npm run build`.
2. Check each screen at its target size, with `/sim` in a second tab, one beat at a time. The network panel shows only same-origin requests.
3. Check the diff has no keys and no drug or label text typed into `app/` or `components/`.
