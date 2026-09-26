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
