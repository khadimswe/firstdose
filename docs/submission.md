> **Superseded 2026-09-26 09:40:** the writeup is rewritten around the coordinator at the 9 PM claims freeze (PLAN 5.4). Source of truth until then: `docs/spec-v2-coordinator.md`. Screen claims follow PLAN D8 (fill wording).

**Current engineering evidence, September 26:** Use [deployed acceptance](handoffs/deployed-acceptance.md) and the updated [claims register](presentation/claims-and-evidence.md). Production is live with Gemini/Tiger and patient audio; frontend repairs are in draft PR #40. This legacy submission draft still needs an editorial rewrite and release sign-off before publication.

# About FirstDose

*Devpost "About the project" draft. Freeze claims Sat 9 PM. Every number here is traced in the sourced facts sheet in `notes/` (shared by DM, not in the repo).*

**Not ready to publish:** this legacy draft describes intended features as completed. Reconcile every claim with PLAN.md and `presentation/claims-and-evidence.md`. September 26 audit: Grok voice and Cursor-use evidence are unverified; SpaceXAI remains a conditional entry. A successful standalone Garmin notification does not verify the full workflow or voice integration.

## Inspiration

A nurse we know watched medicines sit at "pharmacy pending" while patients missed doses, and nobody upstream found out. On the prescribing side the same gap is bigger: 29% of new-to-brand prescriptions are never filled (IQVIA, *U.S. Medicine Use Trends 2026*), and the doctor usually learns this six weeks later, when the patient comes back no better. A patient who never started looks exactly like a drug that doesn't work.

Impiricus's CEO put the goal in one sentence: *"We need to know what exactly is going to help get our patient on that medicine at that time."* FirstDose is that moment, on the doctor's wrist.

## What it does

FirstDose is a skill for **Impiricus Ascend**. After the doctor prescribes, it watches the pharmacy and hub status feed. When a script gets stuck, it:

1. Turns the status into a **reason** (declined at price, copay card not applied, unable to reach patient, prior authorization required).
2. **Planned workflow:** buzz the doctor's watch with the patient and reason, then let the doctor confirm a coordinator handoff. The tap path is primary; voice is optional and unimplemented in the inspected backend.
3. Routes the reason to the **one compliant fix**: re-send the copay card through the Impiricus Wallet, request a bridge sample through QPharma or Medvantx, or connect to the manufacturer's access support. Medicare and Medicaid patients never get a manufacturer copay card.
4. Re-runs the claim. The price drops. The patient is *Started*. The watch buzzes once more.
5. Proves it to Market Access: patients recovered and time to first fill, with no names and no prescription counts.

Surescripts First-Fill Abandonment can tell a care team a script wasn't picked up. Impiricus's Medvantx and QPharma integrations help when a doctor asks. FirstDose is the layer between: per-patient reason, one right fix, proof of recovery, inside Impiricus Ascend.

## How we built it

- **Next.js on Vercel** for six screens: doctor, coordinator, patient (a judge's own phone via QR), Relay Board, Market Access, and an operator console.
- **Supabase** Postgres + Realtime carries `rx_cases` and `fill_events` to every screen at once.
- **Tiger Data** holds `fill_events` as a hypertable with a `daily_ttff` continuous aggregate that feeds the Market Access screen's time-to-first-fill live.
- **Gemini API** classifies free-text pharmacy and hub notes into our reason enum with a fixed `responseSchema`. It never writes clinical text; a deterministic rule picks the fix.
- **Optional, not yet implemented: Grok voice handoff.** Proposed audio transcription produces a case/action suggestion for explicit confirmation. Verify the current API/model and actual Cursor development use before claiming SpaceXAI eligibility. Record any supported keyterm comparison honestly; no transcription failure or video evidence has been established.
- **RxNorm + DailyMed**: real drug lookup and the real SPL label, with a byte-exact check that every sentence on screen is a substring of the FDA source.
- **ntfy → iPhone → Garmin Forerunner 55** for the wrist alert. A Connect IQ widget was the stretch goal.
- **ElevenLabs** voices "Maria started Otezla" on the table speaker.

## What's real and what's simulated

Simulated pharmacy and hub statuses using real RxFill and hub vocabulary and NCPDP reject codes. Demo patients are fictional test records; no PHI. Label text is verbatim from DailyMed; no AI-written drug claims. Ascend, Wallet, QPharma and Medvantx are stand-ins with the same interface. Quoted prices are labelled "demo." The router never changes a prescription; it only removes access barriers.

## Challenges we ran into

*(Fill with issues actually encountered and evidenced. Do not prewrite a Grok transcription failure or imply voice/realtime integration has been tested.)*

## Accomplishments

*(fill Saturday)*

## What we learned

*(fill Saturday, including whatever Impiricus said at the 11 AM workshop)*

## What's next

A production feed from RxFill and hub data where it's switched on. A native Ascend skill interface. Any EHR assistant could call this skill.

## Team

Vihn (AI / data, owns the watch) and Deem (product, screens, demo). HackGT 13, Georgia Tech, September 2026.
