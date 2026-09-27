# FirstDose live pitch and questioning guide

Revised September 26, 2026 against main `015c3429a12518ed67753a47db9eaae308e82b13`.
This is the current PDF rehearsal script. The earlier pitch/submission drafts contain superseded implementation claims.

Khadim opens and closes, and takes business questions. Vinh drives the demo and takes build, synchronization and watch questions. Minh delivers the short AI explanation and takes AI/label questions; Vinh supports him. Suggested timing is 3:15 plus interaction buffer, not a measured runtime. Cut optional voice/audio or prepared before-visit detail before cutting the acknowledgment-versus-fill proof.

## Walk-up · Khadim · about 10 seconds

“Sending a prescription does not finish the job. FirstDose connects a reported barrier to the coordinator who can act. Put this on.”

Hand the judge the watch if that device path is ready. The operator must observe actual receipt before claiming a buzz.

## 0:00–0:15 · The problem · Khadim

> DocUpdate's headline says: ‘The prescription was sent. The patient still never started it.’ Surescripts found 27 percent were never dispensed in its analysis. Sending a prescription does not finish the job.

**Show:** No screens. Statistic scope: January 2026 new e-prescriptions to fill-reporting pharmacies.

**Action:** Face the judges; keep the watch ready.

## 0:15–0:30 · The person · Khadim

> Impiricus reports over a million opted-in healthcare providers. We focus on another person in the practice: the access coordinator. Their job is helping patients get the medicine the doctor prescribed.

**Show:** Introduce the coordinator as the daily user; no claim of an untouched market.

**Action:** Point to the coordinator desktop without starting the demo.

## 0:30–0:50 · What it is · Khadim

> FirstDose is our proposed Ascend skill for DocUpdate: a staff workflow after a reported fill barrier. Spark engages on signals; FirstDose turns a barrier into an owned task. We would test Market Access payment per qualifying confirmed first fill. Vinh, show them.

**Show:** Proposed integration and business model; no partner contract or real fulfillment.

**Action:** Hand the floor to Vinh.

## 0:50–1:00 · Her morning · Vinh

> This queue has three needing a fix, two waiting, and eight filled. These are fictional cases. Supabase stores the shared state; polling keeps the screens synchronized.

**Show:** Seeded coordinator queue; simulation disclosure visible.

**Action:** Show the seeded queue before adding interactive cases.

## 1:00–1:10 · The prescription · Vinh

> This is our DocUpdate-style prescribing demo. The Otezla label is verified against saved DailyMed source. New FirstDose tags mark our proposed additions.

**Show:** New Rx and cached Otezla label; Humira is also verified in merged source.

**Action:** Sign the synthetic order and show the label.

## 1:10–1:25 · It breaks · Vinh

> The simulated pharmacy reports a barrier. Gemini reads the note into a reason: declined at price. Read the alert to me.

**Show:** Template reason: Declined at price ($410). Watch only if actually received.

**Action:** Trigger barrier/reason; invite the judge to read the received alert. If null, use Patient Details/access support.

## 1:25–1:35 · One tap · Vinh

> Send to my coordinator. One handoff tap after setup. The doctor first approves the coordinator relationship. Optional voice proposes the same handoff for confirmation.

**Show:** Primary tap path; initial approval is separate from subsequent handoffs.

**Action:** Use the approved link, or show the approval step. Use voice only if rehearsed.

## 1:35–1:45 · The fix · Vinh

> A rule picks the fix, not AI. Government coverage never gets a manufacturer copay card in our router. The coordinator reviews and sends through our Wallet stand-in.

**Show:** Server-selected eligible action; this is simulated partner delivery.

**Action:** Send the permitted resource. Prepare the approved message if using audio.

## 1:45–2:15 · The judge plays the patient · Vinh

> Now you're Maria. Tap Use at pharmacy. That tap is acknowledgment; we still wait for the pharmacy. Now our operator sends a separate simulated fill confirmation. The board updates. The doctor gets two alerts: the barrier and the confirmed fill. Minh built the AI part.

**Show:** Pause on pending after the tap. Optional approved Spanish message uses pre-generated ElevenLabs audio.

**Action:** Hand over QR/prepared phone. Minh fires confirmation only on cue after acknowledgment. Report any missing wrist alert honestly.

## 2:15–2:35 · James — short sentences · Minh

> James Carter: Humira first fill confirmation is still pending.
> Gemini reads the hub note.
> It gives one reason: unable to reach.
> If it is not sure, it leaves the reason unknown.
> Gemini does not pick the fix.
> A rule does.

**Show:** Latest hub note, not the earlier PA rejection. Null leaves the case unclassified; no scripted reason or reason alert is substituted.

**Action:** After the opening queue, prepare James: sign ev_14, then fire ev_16–18 in order. At 2:15 Vinh shows the result; if null, explain that fallback instead.

## 2:35–2:45 · The proof · Vinh

> The rule routes to access support. Tiger receives selected metrics: confirmed fills and time to first fill. This view shows aggregates without names.

**Show:** Check actual Tiger source badge; before-visit card is a prepared optional view, not a live trigger.

**Action:** Show summary with its actual source. If fallback, say practice event counts.

## 2:45–3:05 · Three proposed upgrades · Khadim

> We build on the Impiricus ecosystem. DocUpdate gets a proposed fill signal and staff seat. Ascend gets a barrier-to-task workflow. Wallet, Concierge, QPharma and Medvantx are the resource destinations. Our next proof is a practice pilot measuring staff time and independently confirmed fills.

**Show:** Count three proposed upgrades; partner calls remain stand-ins.

**Action:** Take the floor from Vinh. Point to the ecosystem diagram if time allows.

## 3:05–3:15 · Close · Khadim

> Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets it filled. One missed fill. One accountable next step.

**Show:** Final timeline; no claim of medication ingestion or proven recovery.

**Action:** Stop. Khadim takes business, Vinh build, Minh AI and label questions.

## What changed from the supplied script

| Claim | Revision and reason |
|---|---|
| Supabase Realtime | Authenticated HTTP polling around 1.5 seconds; Supabase persists shared state. |
| Gemini returns prior auth for James | His earlier pharmacy reject is 75; the classified later hub note is about failed contact, expected `UNABLE_TO_REACH`. The rule selects access support. |
| Humira placeholder | Both drugs now have verified cached label artifacts. Humira #43, owner sign-off #44 and source clips #47 are merged. |
| Every event goes to Tiger | Only allowlisted reduced prescription/reason/dispense metric events. HMAC pseudonymization is not anonymity. |
| New Ascend skill / first staff account | Proposed integration and staff workflow; no official partner release or commercial contract. |
| Nobody knows / Impiricus never reaches staff | Removed unsupported absolutes. Existing monitoring and engagement products exist; the proposed differentiation is the coordinator workflow. |
| Over a million doctors | Company-reported reach is more than a million opted-in **HCPs**, a broader population. |
| About 467,000 medical assistants in offices | Removed from timed pitch. Current BLS page reports 833,900 jobs in 2025; the 56% office share was not confirmed in this fetch. Workforce counts are not customer counts. |
| Before-visit alert | Optional prepared scripted card; no automatic live appointment trigger. |
| Spanish audio | Approved Otezla message after the eligible resend fix; pre-generated ElevenLabs audio. Not runtime generation or Humira audio. |
| Payment per fill / profitability | Proposed experiment, with attribution, qualifying evidence, integration costs and contract terms still to validate. No revenue or measured savings. |

## Evidence for the pitch

- [Surescripts First-Fill Abandonment](https://surescripts.com/products/first-fill-abandonment): 27% in its January 2026 analysis of new e-prescriptions sent to fill-reporting pharmacies. This is not our recovery rate or a population-wide pilot result.
- [DocUpdate article](https://www.docupdate.io/articles/prescription-abandonment-the-prescription-was-sent-the-patient-still-never-started-it/): verified headline; homepage dates it July 9, 2026, by Sana Khateeb, PharmD.
- [Impiricus company job posting](https://job-boards.greenhouse.io/impiricus/jobs/5434527008): company-reported network of more than a million opted-in HCPs, not FirstDose customers or DocUpdate active users.
- [Impiricus products](https://www.impiricus.com/our-products/): Spark has multiple trigger types; Ascend offers resources. Our integration is proposed.
- [BLS Medical Assistants](https://www.bls.gov/ooh/healthcare/medical-assistants.htm): fetched page reports 833,900 jobs in 2025. We do not use it as a count of access coordinators.
- [AMA prior authorization survey](https://www.ama-assn.org/system/files/prior-authorization-survey.pdf): December 2025 survey of 1,000 physicians; average 40 requests and 13 hours of physician/staff work per physician per week, with 40% reporting staff devoted exclusively to PA. It includes medical-service work, not only prescriptions.
- [Minh sign-off](../minh-signoff-5.1.md): label/classifier/Tiger owner evidence; Humira's pending-PR wording is superseded by merge #43. Recorded 728 tests in 54 files and branch-local endpoint/render checks, not new deployed or physical-device proof.
- [Source recordings](../../video/README.md): five original clips, not the final edited video. No new application tests or deployment runs were performed for this documentation update.

## Question ownership and short answers

**Khadim — business.** We propose a recurring coordinator workflow. Market Access or a platform access program is a potential buyer; payment per qualifying confirmed first fill is one model to test. The PDFs preserve alternative license scenarios and cost sensitivity, all labeled assumptions. The representative conversation is qualitative feedback, not a contract, formal endorsement or industry ranking.

**Vinh — build.** A screen requests a command, the server validates it, Supabase commits the permitted events atomically, and the other screens poll shared state. The patient tap acknowledges a resource. A later simulated pharmacy event confirms a fill. Notification acceptance is separate from a physical watch receiving it.

**Minh — AI and labels.** “AI reads the note. A rule picks the fix. A human taps send.” Gemini returns an allowed reason or null; it does not create patient prose or choose treatment. Cached Otezla and Humira label text is checked against saved source, identity evidence and verification receipts. The served app is not FDA-approved by that verification.

## Study the full guides

The [45-page master](FirstDose-Master-Guide.pdf) includes graphs, workflow/architecture diagrams, screenshots, all feature explanations, ELI5 analogies, evidence scope, economics and scripts. Each personal guide adds 16 pages including 42 detailed questions and keeps the entire master:

- [Vinh — 61 pages](FirstDose-Vinh-Full-Prep.pdf)
- [Minh — 61 pages](FirstDose-Minh-Full-Prep.pdf)
- [Khadim — 61 pages](FirstDose-Khadim-Full-Prep.pdf)
