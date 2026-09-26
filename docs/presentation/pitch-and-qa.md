# Pitch, slide copy and judge questions (v2)

**Recording checkpoint, September 26:** The [claims register](claims-and-evidence.md) now records deployed Gemini/Tiger, shared approvals/messages and browser playback. [PR #40](https://github.com/khadimswe/firstdose/pull/40) repairs are branch-verified, not yet live. Physical-device/watch, native Spanish/audio and TestFlight acceptance remain open. Do not present this script as a record of those unperformed checks.

Sat Sep 26, 2026 · Deem. Paste-ready content, not a rendered deck. The 4-minute demo script is in `../spec-v2-coordinator.md`. Every fact below must match a row in [claims and evidence](claims-and-evidence.md); every number carries its source there.

**One line:** "Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets the patient on it, every day."

**What it is:** an Impiricus Ascend skill that shows up in DocUpdate. The coordinator works a desktop queue. The doctor sees one alert, one status line, one checkbox and one profile row on the phone, and approves the coordinator.

## Slides

### 1. Their words
- **On slide:** "The Prescription Was Sent. The Patient Still Never Started It." Credit: DocUpdate article title, Jul 9, 2026.
- **Second line:** "27% of new prescriptions are never dispensed." Credit: Surescripts, First-Fill Abandonment page.
- **Say:** "A patient who never started looks exactly like a drug that doesn't work."

### 2. The missing step
- **On slide:** "DocUpdate sends the script. After that, nobody in the office can see whether the patient got it, or why not."
- **Say:** "DocUpdate's FAQ says it doesn't currently receive fill confirmation, and staff accounts are on the roadmap. FirstDose is the missing step after the script is sent."
- **Tact rule:** frame it as a missing step, never a bug. No app-review quotes on slides.

### 3. Before / after (6.10), the one-glance slide
- **Left:** DocUpdate's App Store home screenshot. Link it, don't copy it into the repo: [App Store listing](https://apps.apple.com/us/app/docupdate/id6478404244), image 1. Caption: "DocUpdate today · App Store screenshot, ImpiricusHealth Corp."
- **Right:** `../stills/doctor-home-rx-alert.png`, our Home tab from firstdose.vercel.app. Caption: "Concept: FirstDose inside DocUpdate · Not affiliated."
- **On slide:** "One alert type. One status line. One checkbox. One profile row. Not a new app."
- **Say:** "Same Rx Alerts card, one new alert type: the pharmacy's own status, the reason, and Send to my coordinator."

### 4. The coordinator's Monday
- **On slide:** `../stills/coordinator-queue-seeded.png` (firstdose.vercel.app, seeded week): 3 stuck, 2 waiting, 8 fills confirmed; one fix per row.
- **Say:** "This is the person who gets patients started. Chasing new starts by phone is already their whole job. Now it's a list of who's stuck, why, and the one fix."

### 5. The loop
- **On slide:** Sign and send → Not dispensed + reason → doctor's phone and watch → Approve and send → rule picks one fix → patient acknowledges → pharmacy confirms the fill.
- **Say:** "The rule picks the fix, not AI. The patient's tap isn't a fill; only the pharmacy's confirmation is."

### 6. Staff accounts, the CoverMyMeds way
- **On slide:** "Link by NPI → the doctor approves in DocUpdate → their stuck patients reach your queue. The coordinator never signs a prescription."
- **Say:** "CoverMyMeds faxes a code to the prescriber. We ask the prescriber inside the app they already verified with. FirstDose is what the first staff account does."

### 7. The people Impiricus doesn't reach yet (market size)
- **On slide:**
  - "About 467,000 medical assistants work in doctors' offices."
  - "Roughly 280,000 full-time jobs' worth of prior-auth and access work, every week."
  - "Our estimate: 70,000–115,000 staff who do only this."
- **Say:** "None of Impiricus's products are built for them. FirstDose is."
- **Rules:**
  - Say "about" or "roughly" for the calculated numbers.
  - Say "our estimate" for the range.
  - 280,000 counts hours, not people.

### 8. Built on rails Impiricus already announced
- **On slide:**
  - QPharma (Aug 25, 2026) and Medvantx (Sep 8, 2026), integrated into Ascend.
  - Spark triggers on "First-Time Prescriptions".
  - Wallet delivers co-pay resources by QR.
- **Say:** "FirstDose adds the fill signal and the reason, and routes to fixes you already run."
- **The Impiricus rule, in one line:** "We didn't rebuild anything Impiricus ships. FirstDose adds the step after the prescription is sent, reaches a person Impiricus has never reached, and uses Wallet, Concierge and the sample partners as the fix."

### 9. Trust and the buyer
- **On slide:** the who-sees-what split. "Market Access pays per confirmed first fill, never per prescription. Pharma sees counts only."
- **Say:** "We lead with confirmed first fills (the NRx you already sell on) and time to first fill."
- **Wording:** on slides and in the video, write "confirmed first fills". Never write "recovered" or "started" (D8).

## Poster copy

- **Title:** FirstDose
- **Tagline:** Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets the patient on it, every day.
- **Problem:** The prescription was sent. Nobody in the office can see whether the patient got it, or why not.
- **What it does:** Catches the prescriptions that stall, says why, routes the one fix that matches, and tells the doctor only when it matters.
- **Where it lives:** An Impiricus Ascend skill that shows up in DocUpdate. The coordinator works a desktop queue; the doctor approves on the phone.
- **Disclosure:** Synthetic patients and pharmacy activity; Impiricus, Wallet and partner names shown as a concept (PLAN D3). A pharmacy fill confirmation doesn't prove a first dose. "Concept: FirstDose inside DocUpdate · Not affiliated."
- **Team:** Vinh: workflow, backend and watch. Minh: verified labels, AI and analytics. Deem: screens, product and presentation. Vinh / Mac operator: iPhone wrapper build and signing; device acceptance remains.
- **QR:** firstdose.vercel.app. Test it on a stranger's phone before printing (4.4).

## Judge questions

| A judge might ask | Answer |
|---|---|
| Isn't this just Surescripts First-Fill Abandonment? | That says a script wasn't picked up, daily or weekly, and it's sold to health systems and EHR vendors (Oracle's version is planned for 2027). Neither it nor RxFill says why. We add the reason, route the one fix, and confirm the fill. |
| Doesn't DocUpdate already track this? | Its FAQ says it doesn't currently receive fill confirmation. Its July articles name the problem. We're the product version of what they're writing about. |
| Is a coordinator an HCP? | The prescriber stays the accountable HCP: they approve the coordinator and get the alert. Staff are the operators. Impiricus already markets Wallet to "full care teams". |
| Your job post says DocUpdate isn't building software for administrators. | That's why the doctor stays in the loop: the doctor approves the coordinator, gets the alert, and nothing is signed or changed without them. |
| How would a coordinator log in? | Staff link to a prescriber by NPI, and the prescriber approves them in DocUpdate. It's the CoverMyMeds delegation model, without the fax code. |
| Is that DocUpdate on the phone? | No. It's a concept built on DocUpdate's structure and labelled "Not affiliated". Their real screen appears only on the comparison slide, credited to the App Store. |
| Did you rebuild DocUpdate or anything Impiricus ships? | No. Everything tagged "New · FirstDose" is ours: the fill-status alert, the before-visit note, the fill status line, "Help my patient start" and "My coordinator". Everything untagged is DocUpdate today. Wallet, Concierge, QPharma and Medvantx are the fixes we route to, not things we rebuilt. In the demo, move through New Rx fast. |
| Doesn't Spark already watch new prescriptions? | Spark fires when a prescription is written, to engage the doctor. FirstDose fires when it isn't filled, and routes the fix to the practice. Different moment, different person. |
| Do you text the patient? | No. There's no SMS anywhere. The patient opens a web page from a QR code, and the ElevenLabs message plays there. The watch alert is a push notification through ntfy. |
| Who sees Maria's name? | Only the practice: the doctor's DocUpdate view and the coordinator's queue. Pharma sees counts. |
| Won't doctors ignore more alerts? | They get only the alerts that need them, plus a note before the visit. Silence means it worked. |
| Does the patient's tap mean they took it? | No. The tap is acknowledgment only. A separate pharmacy confirmation records the fill, and even that doesn't prove a first dose. |
| Medicare patients? | The router never sends a manufacturer copay card to Medicare, Medicaid or TRICARE patients. It routes them to access support. |
| What does AI do? | The live Gemini classifier maps the pharmacy or hub source note to an allowlisted reason or null; provider failure also stays null. Rules pick the fix either way. No AI writes drug or patient text. |
| Is the label real? | Otezla's, yes: verbatim DailyMed text, verified against the saved source, with RxCUI 1492746, shown on the New Rx screen. Humira's label isn't verified yet, so James's card shows the red placeholder badge. |
| What's real and what's simulated? | Real: the workflow backend, Otezla's verified label, the ntfy watch alerts (receipt confirmed on a Garmin; the Apple Watch check is C8), and the screens. Simulated and labelled: the pharmacy and hub events, DocUpdate, Ascend, the Wallet, QPharma and Medvantx, and prices. |
| How do you prove it works? | The demo proves the workflow. A pilot would measure confirmed first fills and time to first fill against a comparison group; we don't claim causal or clinical benefit. |

## Sponsor openings (only with the evidence in the claims register)

- **Impiricus:** "Your FAQ says staff accounts are on the roadmap. Here's what the first one does, and the doctor still approves it."
- **Gemini** (live; Minh's sign-off #44. If Gemini fails, the case stays unclassified, gets no doctor alert and routes to access support, so keep the mock fallback ready): "Gemini does one narrow job: turn a pharmacy or hub note into a reason code, or unknown. Rules choose the action."
- **Tiger Data** (hosted fill summary verified): "The event history answers confirmed first fills and time to first fill. Here's the query."
- **ElevenLabs** (pre-generated EN/ES mp3s for the Otezla message; browser playback verified; native Spanish/phone review pending): "The coordinator approves a templated message, and ElevenLabs voices it in the patient's language."
- **SpaceXAI** (entered on Grok; we make no Cursor claim): "Grok transcribes a spoken handoff that the doctor confirms before anything happens."
