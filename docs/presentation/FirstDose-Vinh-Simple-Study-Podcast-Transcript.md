# FirstDose — simple drive-time study podcast

Synthetic ElevenLabs narrator, not Vinh’s recorded voice. Maria-only demo; Oracle, Impiricus and SpaceXAI. Source main 015c342.


## 00:00 — The idea, without the jargon

This is your FirstDose drive-time rehearsal. We will keep it simple: your Maria demo, the systems behind it, and the questions judges are likely to ask. This is a synthetic narrator, not a recording of Vinh.

Imagine a package delivery. Placing an order does not mean the package arrived. Opening a message about the package does not mean it arrived either. Someone has to confirm the delivery. FirstDose applies that distinction to a prescription. The doctor sends it, a pharmacy barrier is reported, a coordinator takes action, and the system waits for a separate fill confirmation. A fill still does not prove that the patient took a dose.

The coordinator is a real staff role. In a real practice, this could be an access coordinator, medical assistant, or another staff member who handles medication follow-up. In our demo, we simulate the accounts and patients. The software gives that person a queue, a reason, and a next step.

Here is your memory sentence. Gemini reads. Rules route. Humans approve. Supabase remembers. Tiger measures. The watch tells the doctor when something important happened.

FirstDose is a working prototype and a proposed DocUpdate and Ascend concept. It is not a deployed Impiricus integration. That distinction makes your answers clear and credible.


## 01:22 — Walk through your two-minute part

Khadim introduces the problem and says, Vinh? You point to the coordinator's queue. Three need a fix, two are waiting, eight are filled. Watch a new one arrive.

On the doctor phone, open New R X, choose Maria and Otezla, and tap Sign and send. Your line is: I am the doctor in our DocUpdate-style demo. The label is verified against saved DailyMed source. Sending is not filling.

Minh supplies the simulated pharmacy update, then the classification step. You say: The pharmacy reports a barrier. Gemini reads the note and returns declined at price. If classification fails, it stays unknown for a person to handle. Show the actual result, not the result you hoped for.

Show the first alert on the phone, and show the watch only if it actually buzzed. Tap Send to my coordinator. Say: The doctor hands off the follow-up. The coordinator gets one next action, chosen by a rule using the reason and recorded eligibility.

Minh opens Maria and sends the savings-card stand-in. Khadim, holding the patient phone, taps Use at pharmacy. Now pause. Say: That is acknowledgment, not a fill. It is still pending. This pause is the most important part of your demo.

Only then does Minh send the separate simulated pharmacy confirmation. Now the case becomes Fill confirmed. Say: The doctor hears about it when it breaks and when it is confirmed filled.

Finish on Market Access. Eight seeded fills plus Maria becomes nine. Check the source badge before saying Tiger supplied the result. Then Khadim closes. James stays outside this short demo unless a judge asks.


## 02:59 — The backend is a shared notebook

Here is the backend explanation you can give in about twenty seconds. The phone sends a request to our server. The server checks whether that action is allowed, saves the accepted events in Supabase, and the other screens read the updated history. Alerts and analytics happen after the save.

Think of Supabase as one shared notebook. The doctor's phone, coordinator desktop, and patient phone are different windows onto that notebook. They normally check for updates about every one and a half seconds. This is polling. Do not call it Supabase Realtime just because the screens update live.

The server also checks which demo run and version you are using. Think of that as the notebook's name and its page number. If someone resets the demo, an old request cannot write into the new notebook. If someone double-taps, duplicate event protection helps prevent recording the same action twice.

What are Next dot J S and React? Next dot J S provides the web app and server routes. React draws the screens. TypeScript helps define the data contracts. Vercel hosts the app. You do not have to list every library during the pitch. Name each tool when its job becomes relevant.

An A P I is simply the agreed way one piece of software asks another to do something. Our phone asks the server to record a handoff. Our server asks Gemini to classify a note. The server checks those requests before treating them as accepted workflow state.


## 04:31 — AI, rules, labels, and human control

A judge will probably ask: Why AI? Your answer is that messy notes can describe the same problem in different words. Gemini turns that text into one reason from a fixed list. A rule then chooses the administrative action.

Picture three desks. At the first desk, Gemini reads the note and labels the problem. At the second, a checklist looks at the reason, coverage, and eligibility. At the third, the coordinator reviews and sends the action. The model cannot jump straight from reading a note to dispensing medication.

If they ask how you prevent hallucinations, say: We restrict and validate the output, and an invalid response or provider failure leaves the reason unknown. We keep the action behind rules and human approval. Then add the honest limit: a valid reason can still be wrong. We have not proven perfect classification accuracy.

We do not use a numerical confidence threshold. Do not invent one. Unknown is the fallback when classification cannot produce an acceptable result.

For government coverage, the implemented rule blocks the manufacturer copay-card action and routes to access support. Commercial coverage alone is not enough; the card eligibility flag must also be true.

Labels are a separate system. DailyMed supplies the source label; RxNorm helps identify the drug. The app serves verified saved sections. Think of a checked photocopy, not an AI-written explanation. Gemini does not write the label or invent patient instructions.


## 06:06 — The watch and the scoreboard

The watch is the doorbell, not the notebook. After the accepted workflow is saved, a notification worker sends a prepared message through ntfy. The phone and watch setup determine whether it reaches the wrist. An accepted network request does not prove a watch buzz. If it does not arrive, show the real phone alert and say so. The case is still saved.

Tiger is the scoreboard. Supabase keeps the operational history. Tiger receives selected outcome events and calculates confirmed fills and elapsed time. It does not receive a copy of every detail. Names and raw notes are excluded. A keyed case fingerprint lets the analytics connect events without the raw case identifier. Those internal records are pseudonymous; the dashboard shows aggregate results.

Why nine? Eight background fills were seeded, and Maria adds one after the separate pharmacy confirmation. A card tap or support request adds nothing. These are fictional demonstration outcomes, not nine proven treatment successes.

What is median time to first fill? It is the middle elapsed time from prescription to confirmation among confirmed cases. It is not time saved. Unconfirmed cases are not included, so you still need to look at unresolved work.

If Tiger fails, the workflow stays in Supabase and can be replayed later. A labeled practice-event fallback may appear. Read that badge honestly. Also keep the real public reference cards separate: those are saved, dated CMS and other source figures, not live patient outcomes from FirstDose.


## 07:43 — Tracks, voice, identity, and what is still a prototype

Your three selected tracks are Oracle of the Deep, Impiricus, and Space X A I. Oracle is the bounded AI and outcome analytics story. Impiricus is the useful doctor-to-coordinator workflow. Space X A I is the Grok voice handoff.

Your three-minute Maria script does not show Grok, so keep it ready for questions. Use an eligible case that has not already been handed off. Tap to speak, say send Maria to my coordinator, stop recording, review the proposed case, and tap Send to my coordinator to confirm. Grok transcribes; the doctor still approves. Explain actual Cursor development use only if the team can substantiate it.

ElevenLabs is different. It generated the prepared English and Spanish Otezla message audio ahead of time. The patient taps to play it. The app is not generating unrestricted medical advice at runtime.

Another likely question is: How do you verify the doctor? Our N P I check validates the identifier's format and checksum. That does not prove identity or credentials. Coordinator approval is simulated with fictional accounts and a shared demo login. Production needs separate authenticated identities and practice-level permissions.

If asked what is missing, say real pharmacy and partner connections, production identity controls, evaluated classification and routing, and a practice pilot. We have not established clinical effectiveness, compliance, or measured financial savings. The proposed buyer is Market Access, but payment and profitability are still hypotheses.


## 09:21 — Judge questions: answer out loud

Let's finish with the questions you should be able to answer in one or two sentences.

What did you build? A prototype that turns a reported prescription barrier into an owned coordinator action and waits for independent fill confirmation.

Is the pharmacy real? No. The operator supplies simulated pharmacy and hub events. The backend workflow is real implementation.

Why not let AI choose everything? The model interprets the note. Rules make the permitted actions inspectable, and a person approves. That limits the model's authority.

Does the tap mean she took the medicine? No. The tap is acknowledgment. A separate pharmacy event confirms dispensing, and dispensing still does not prove a dose.

Why two databases? Supabase runs the workflow. Tiger measures a smaller set of outcome events. That separation is useful but adds synchronization work.

Why is James still stuck after access support? A request was sent, but no pharmacy confirmation arrived. Keeping him unfilled is correct.

Do you verify prescribers? Not in this demo. We check N P I format and simulate approval. Format is not identity.

What are you saving? We aim to reduce unowned follow-up and staff effort. We need a real pilot to measure saved time and independently confirmed fills.

When you answer, start with the outcome, give one technical reason, and stop. You can offer the deeper explanation if they want it. You do not have to recite every endpoint or model setting.

Your final memory line: Gemini reads. Rules route. Humans approve. Supabase remembers. Tiger measures. The patient tap is not a fill. That is enough structure to explain the whole demonstration in your own words.
