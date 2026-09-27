# FirstDose live demo: click, check, say

September 26, 2026. Companion to the master and personal guides. Based on source main `015c342` and the user-reported rehearsal. This is an operator runbook, not a new automated deployment or device test.

Use the live deployment on all devices. This runbook puts James after Maria so his alert does not interrupt her two-alert story. It supersedes the earlier suggestion to prepare James in the background. Rehearse the full sequence to your allotted time; spoken lines and physical interactions take different amounts of time.


## Your table and device map

Keep this guide beside Minh’s operator controls. Read only the purple spoken lines aloud.


| Surface | Link | Operator |
|---|---|---|
| Doctor | https://firstdose.vercel.app/doctor | Vinh |
| Maria patient | https://firstdose.vercel.app/patient/rx_001 | Second judge |
| Coordinator | https://firstdose.vercel.app/coordinator | Minh clicks; Vinh narrates |
| Board | https://firstdose.vercel.app/board | Audience screen |
| Market Access | https://firstdose.vercel.app/access | Audience screen |
| Simulator | https://firstdose.vercel.app/sim | Minh |

Confirm **Live data** on /sim and use the same deployment. Log in on both browsers/phones beforehand. The doctor app does not replace the laptop’s Market Access dashboard. The simulator supplies pharmacy/hub inputs; prescriptions are signed on the doctor UI.


## Before judges arrive: reset and link

This page is setup, not part of the timed pitch. Have everyone pause clicks while the shared run resets.


1. Pause other clicks. Operator: **Reset → Confirm reset** immediately.
2. Wait for **0 committed events**, then **Seed**. Do this before any prescription or simulator input.
3. Confirm coordinator counts **3 / 2 / 8**.
4. Coordinator: **Prescribers → Request Dr. Nadia Okafor approval**.
5. Doctor: **Profile → Review request → Approve**; verify **Linked**.
6. Return the doctor home and audience display to the queue. Patient browser is logged in on Maria’s page.

If Seed reports `invalid_transition`, verify that the workflow run is empty. The user encountered this during rehearsal and reported seeding worked after the correct reset/seed order. Reset clears current links/messages; approving again is expected.


## Open the pitch, then show the queue

Khadim introduces the story; Vinh takes over at “show them.” Leave the interface still during the opening.


Optional walk-up: “Sending a prescription does not finish the job. FirstDose connects a reported barrier to the coordinator who can act. Put this on.”


**Khadim says:** DocUpdate's headline says: ‘The prescription was sent. The patient still never started it.’ Surescripts found 27 percent were never dispensed in its analysis. Sending a prescription does not finish the job.


**Khadim says:** Impiricus reports over a million opted-in healthcare providers. We focus on another person in the practice: the access coordinator. Their job is helping patients get the medicine the doctor prescribed.


**Khadim says:** FirstDose is our proposed Ascend skill for DocUpdate: a staff workflow after a reported fill barrier. Spark engages on signals; FirstDose turns a barrier into an owned task. We would test Market Access payment per qualifying confirmed first fill. Vinh, show them.


**Vinh says:** “This is the coordinator’s morning: three cases need a fix, two are waiting, and eight are filled. These are fictional cases. The screens share the same live state.”

Surescripts 27% scope: January 2026 new e-prescriptions to fill-reporting pharmacies. See the master’s source pages.


## Maria: sign on the doctor phone

The operator cannot replace the doctor’s Sign and send action. This is a fictional prescribing demonstration.


### 1. Sign and send

**Who / surface:** Vinh / doctor phone

**Click / do:** Open New Rx → select Maria Lopez / Otezla → tap Sign and send. Briefly show the verified label lower on the page. Return to doctor home before the alert.

**Look for:** Sent to pharmacy. The operator’s Maria pharmacy input ev_04 is now available. The patient resource may still be absent; that is expected.

**Vinh says:**

> This is our DocUpdate-style prescribing demo. The Otezla label is verified against saved DailyMed source. Sending the prescription starts the workflow; it does not confirm a fill.

**Checkpoint:** Wait for Sent to pharmacy before Minh fires anything.


## Maria: trigger the barrier

Minh supplies the outside pharmacy update. Vinh shows the resulting doctor alert.


### 2. Pharmacy report → classification

**Who / surface:** Minh / operator; Vinh / doctor phone and watch

**Click / do:** Under Maria · Otezla, click Fire on ev_04 (Claim run). Wait for Fired. Then click Fire on ev_05 (Reason classified) and wait for the result. Use these specific rows, not repeated Next beat clicks.

**Look for:** Expected reason: declined at price, with the recorded $410 quote. The doctor gets a reason alert when classification succeeds; the watch may receive the corresponding notification.

**Vinh says:**

> The simulated pharmacy reports a barrier. Gemini reads the note and identifies the reason: declined at price. Read the alert to me.

**Checkpoint:** Invite the judge to read only after actual receipt. If classification is null or differs, describe that result rather than reading the expected reason.


## Maria: hand off, then send the fix

Keep the audience screen on the coordinator while Vinh explains the administrative action.


### 3. Doctor handoff → coordinator resource

**Who / surface:** Vinh / doctor phone; Minh / coordinator screen

**Click / do:** Doctor: tap Send to my coordinator. If prompted, complete Approve and send or Send to coordinator. Coordinator: open Maria Lopez → find “The fix · picked by rule, not AI” → click Re-send copay card.

**Look for:** Maria’s handoff and rule-selected action appear in the coordinator case. After sending, the patient phone shows an Otezla savings-card stand-in and Use at pharmacy.

**Vinh says:**

> The doctor hands off the follow-up. The coordinator now owns the next step. A rule picks the fix using the reason and recorded eligibility. The coordinator reviews it and sends the resource through our Wallet stand-in.

**Checkpoint:** Confirm the card is visible on the patient phone. Do not fire the pharmacy confirmation yet.


Optional audio: after the eligible resend fix, choose Español in the coordinator message section, then **Approve and send**. Patient: **Play message**. Say: “This approved Spanish message uses pre-generated ElevenLabs audio.” Message acknowledgment is separate from **Use at pharmacy**, and neither is a fill.


## Maria: the tap is not the fill

This pause is the key proof. Give the judges time to see the pending state before the separate confirmation.


### 4. Patient acknowledgment

**Who / surface:** Second judge / patient phone

**Click / do:** Hand over the prepared patient phone. Ask the judge to tap Use at pharmacy. Pause. Minh leaves ev_11 untouched during this pause.

**Look for:** “Savings card acknowledged. Pharmacy fill confirmation is still pending.” The case has not become a confirmed fill.

**Vinh says:**

> Now you’re Maria. Tap Use at pharmacy. That tap is acknowledgment. It is not a fill. We still wait for the pharmacy.

**Checkpoint:** Read the pending message before advancing. Acknowledge message, if present, is a different button and does not replace Use at pharmacy.


## Maria: confirm the pharmacy fill

Minh fires only on Vinh’s explicit cue. Then show the same outcome on the audience screen and doctor phone.


### 5. Separate confirmation

**Who / surface:** Minh / operator; Vinh / board, doctor phone and watch

**Click / do:** Vinh cues: “Now our operator sends the separate simulated pharmacy confirmation.” Minh clicks Fire on Maria’s ev_11 (Claim run, Dispensed). Wait for the shared screens to update.

**Look for:** The board/doctor/patient show confirmed fill. A confirmation notification is attempted. In the rehearsal, the user reported seeing filled on the phone and watch; confirm actual receipt again during presentation.

**Vinh says:**

> The separate pharmacy confirmation updates the shared case and notifies the doctor. A confirmed fill still does not prove that a dose was taken.

**Checkpoint:** Maria is now complete. Keep this same run for James. Do not reset between the cases.


## James: prepare the second case

Do this after Maria’s confirmation, so James’s alert does not interrupt her story. Minh’s spoken explanation stays short.


### 6. Order → pharmacy rejection → hub note

**Who / surface:** Vinh / doctor phone; Minh / operator

**Click / do:** Doctor: New Rx → James Carter / Humira → Sign and send. Operator: under James, Fire ev_16; wait. Fire ev_17; wait. Fire ev_18; wait for classification. Return the doctor phone home.

**Look for:** ev_16 is a prior-authorization rejection. ev_17 is the later failed-contact hub note. Gemini classifies that later note; the expected alert is “Hub can’t reach patient” / unable to reach.

**Vinh says:**

> Here is a second case with a different barrier. Minh built the AI part.

**Checkpoint:** Check the actual reason before Minh reads the next page. If unclassified, explain that fallback. A signed order is entered on the doctor screen, not fired from /sim.


## James: explain, then request support

Keep James unfilled. Sending an administrative request does not create a pharmacy confirmation.


**Minh says:**

> James Carter: Humira first fill confirmation is still pending.
> Gemini reads the hub note.
> It gives one reason: unable to reach.
> If it is not sure, it leaves the reason unknown.
> Gemini does not pick the fix. A rule does.

Doctor: **Send to my coordinator**. Coordinator: open James → **Connect to access support**.

Expected: request sent/in progress; doctor still stuck/unfilled, with coordinator/access-support wording. **This is correct.**

**Vinh says:** “James’s support request has been sent, but his fill is still unconfirmed. We keep that visible instead of treating a button click as a successful outcome.”

Minh’s short Q&A answer: “AI reads the note. A rule picks the fix. A human taps send.”


## Market Access, then Khadim closes

This is the last demo screen. Open /access in the laptop browser used for the demo; keep the completed run.


Open **/access** on the laptop. Expect **9 first fills confirmed** only if the seed contributed 8 and Maria is the only new confirmed case. James remains unconfirmed. The median is demo elapsed time, not measured product improvement. Reason counts can include later-filled cases.

**Vinh says:** “We started with eight background fills. Maria’s pharmacy confirmation brings that to nine. James stays unconfirmed, so clicking access support does not inflate the result. We also track time from prescription to confirmation. These are demonstration results; a real pilot would measure improvement.”

If the source badge says **Tiger aggregate counts**, add: “Selected events become metrics in Tiger Data.” Otherwise name the displayed practice-count fallback. Do not claim Tiger supplied a fallback result.

**Khadim closes:** “We propose three upgrades: a fill signal and staff workflow for DocUpdate, a barrier-to-task workflow for Ascend, and connections to existing resources like Wallet and Concierge. Our next proof is a practice pilot measuring staff effort and independently confirmed fills. Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets it filled.”

Stop clicking. Khadim takes business, Vinh build/watch, Minh AI/labels with Vinh supporting. Leave Market Access visible.


## Minh’s one-page operator cue card

Use this page during rehearsal. The other pages explain each click, expected state and spoken line.


## Quick recovery rules

- Seed fails: verify the confirmed reset left 0 workflow events before Seed.
- Grey Fire button: complete the preceding doctor/patient action.
- Patient card absent: verify Maria was handed off and the coordinator sent Re-send copay card.
- James still stuck after support: expected; no fill confirmation exists.
- Watch missing: show the app alert and state wrist receipt was absent.
- Tiger unavailable: name the practice-count fallback.
- Short on time: keep Maria’s acknowledgment-versus-confirmation proof; cut optional voice/audio, then James. Disclose any switch to a recording.
