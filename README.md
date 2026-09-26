# FirstDose

**Point-of-prescribing tools help most patients start their medicine. FirstDose catches the ones who still walk away: it tells the doctor why, on their wrist, fixes it in one tap, and proves it worked.**

> "A patient who never started looks exactly like a drug that doesn't work."

A new skill for **Impiricus Ascend**, built at HackGT 13 (September 25–27, 2026) for the Impiricus challenge *"Invent the Next Way We Engage HCPs."*

## The problem

29% of new-to-brand prescriptions are never filled (IQVIA, *U.S. Medicine Use Trends 2026*). Abandonment is under 5% when the patient pays $0 and 60% when they pay over $500 (IQVIA, 2020). Today the practice finds out weeks later, when the patient comes back no better and the doctor thinks the drug failed.

Your Amazon package is tracked by the minute. Your prescription goes dark the moment it leaves the doctor.

## What FirstDose does

1. **Prescribe.** The doctor picks the drug. FirstDose shows the real DailyMed label, word for word, and sends the copay card through the Impiricus Wallet.
2. **Stuck.** The pharmacy or hub posts a status: *Not dispensed*, *reject 75 Prior Authorization Required*, *Unable to reach patient*.
3. **Wrist.** The doctor's watch buzzes with the patient and the reason.
4. **Hand off.** "Send Maria to my coordinator." One tap or one sentence.
5. **Fix.** A deterministic rule picks **one** fix: re-send the Wallet copay card, request a bridge sample (QPharma / Medvantx), or connect to access support. Medicare and Medicaid patients never get a manufacturer copay card.
6. **Re-run.** The claim runs again, the price drops, the patient is *Started*, the watch buzzes once more. Silence means it worked.
7. **Proof.** Market Access sees patients recovered and time to first fill. No names, no prescription counts.

Surescripts and hubs can tell you a script didn't happen. FirstDose tells you **why**, fixes it in one tap inside Impiricus Ascend, and proves it worked.

## What's real and what's a stand-in

| Real | Simulated (labelled on every screen) |
|---|---|
| Drug lookup (RxNorm) | Pharmacy and hub status feed (uses real RxFill / hub vocabulary and NCPDP reject codes) |
| Label text (DailyMed SPL, byte-exact check, no AI-written drug claims) | Impiricus Ascend, Wallet, QPharma, Medvantx |
| Watch alert (ntfy → Garmin) | Insurance claim and prices (quoted price labelled "demo") |
| Voice handoff (Grok STT with keyterms) | Patients (fictional test records, no PHI) |
| Time-to-first-fill aggregate (Tiger Data) | |

The router never changes a prescription. It only removes access barriers. Market Access pays per patient recovered, never per prescription.

## Screens

| Route | Who looks at it | What it shows |
|---|---|---|
| `/doctor` | Doctor (judge 1) | Prescribe, real label card, alert, **Send to my coordinator** |
| `/coordinator` | Access coordinator | Queue, reason, the one suggested fix |
| `/patient/[id]` | Patient (judge 2, via QR) | Wallet copay card stand-in, **Use at pharmacy** |
| `/board` | Big screen | Relay Board: package tracking for a prescription, price counter |
| `/access` | Pharma Market Access | Patients recovered, time to first fill, reason tally, who-sees-what |
| `/sim` | Operator | Fire pharmacy/hub events by hand |

## Stack

Next.js on Vercel · Supabase (Postgres + Realtime) · Tiger Data (hypertable + continuous aggregate) · Gemini API (free-text note → reason enum, nothing else) · Grok STT (`grok-voice-transcribe-2.0` with keyterms) · ntfy → Garmin Forerunner 55 · ElevenLabs (status voice line)

## Run it

```bash
cp .env.example .env        # fill in keys
npm install
npm run dev                 # http://localhost:3000
```

Every screen runs on `mock/` data with no backend. Set `NEXT_PUBLIC_DATA_SOURCE=mock` (the default) and open `/sim` to drive the loop.

## Team

Built by **Vihn** (AI / data, owns the watch) and **Deem** (product, screens, demo) at HackGT 13.

## Sources

- IQVIA, *U.S. Medicine Use Trends 2026*: 29% unfilled rate across all brands
- IQVIA 2020 abandonment-by-cost ladder
- Impiricus: [Solutions](https://impiricus.com/our-solutions/), [Products](https://impiricus.com/our-products/), QPharma (Aug 25 2026) and Medvantx (Sep 8 2026) announcements
- NCPDP reject codes; RxFill (NCPDP) status vocabulary
- DailyMed SPL: Otezla `f6b1f516-4972-4d82-bced-113e47b41cc5`, Humira `608d4f0d-b19f-46d3-749a-7159aa5f933d`
