# FirstDose — Vinh study podcast

Synthetic ElevenLabs narration; not Vinh’s recorded voice. Prepared September 27, 2026.

Selected tracks: Oracle of the Deep, Impiricus, SpaceXAI. See the companion technical PDF for source links and evidence boundaries.


## 00:00 — The whole project in one mental picture

Welcome to your FirstDose study session. This is a synthetic narration prepared for Vinh. You can listen without looking at a screen. We will walk through your demo, explain the backend in plain language, connect it to your three selected tracks, and finish with a rehearsal and questions. Your tracks are Oracle of the Deep, Impiricus, and Space X A I.

Start with the problem. A prescription being sent does not tell the practice whether the pharmacy filled it. FirstDose is a prototype that takes a reported barrier, gives a coordinator an owned task, and waits for separate confirmation of the outcome. The coordinator is the person doing the follow-up work. The doctor approves and gets useful updates.

Picture a package delivery. The doctor places an order. A delivery problem is reported. Someone reads the problem, chooses a permitted next step, and hands it to the right coworker. The customer opening a message does not prove delivery. The delivery service has to confirm it. And delivery still does not prove that the customer used what was inside. That is the distinction between prescription, acknowledgment, fill, and first dose.

Here is the sentence to memorize. Gemini reads. Rules route. Humans approve. Supabase remembers. Tiger measures. We will come back to it.

Surescripts reports twenty-seven percent of new prescriptions were never dispensed in its January twenty twenty-six analysis of electronic prescriptions sent to fill-reporting pharmacies. That is external problem context. It is not a FirstDose success rate. We have a working prototype with fictional patients and simulated pharmacy activity, not measured clinical impact. Our partner integrations are concepts and stand-ins. This makes the demonstration useful: we can show the full workflow while being clear about what each step establishes.


## 01:55 — Set up the demo and introduce the stack

Before the judges arrive, use the same deployment on every device. Your doctor phone opens slash doctor. The patient phone opens Maria's patient page. The audience laptop shows the coordinator queue and later Market Access. A separate operator window opens slash sim. The simulator represents the pharmacy and hub systems we do not actually control. It is not where the doctor signs a prescription.

Pause everyone before a reset. Click Reset, immediately Confirm reset, wait for zero committed events, and then Seed before prescribing anything. The expected queue is three needing a fix, two waiting, and eight filled. Approve the coordinator link again after reset. Return the doctor phone home. Have the patient page authenticated and ready.

Your first spoken line can be: This is the coordinator's queue. Three cases need a fix, two are waiting, and eight are filled. Our screens share workflow state in Supabase. These are fictional cases.

Now understand the stack behind that sentence. Next dot J S sixteen provides the web app and server routes. React nineteen renders the screens. TypeScript defines the contracts. Tailwind and shad C N supply the styling and components. Vercel hosts the web application. Supabase Postgres stores accepted workflow history. Tiger Data, using Timescale D B, stores a smaller analytics projection.

Do not recite every library during the short demo. Explain the tool when its job becomes visible. Say Gemini when the reason appears. Say ntfy when the alert arrives. Say Tiger when showing the outcome dashboard. If a judge asks for the full stack, you have the list ready.

One correction to remember: the screens normally poll the server about every one and a half seconds. They are not using Supabase Realtime or WebSockets in the inspected implementation. Live data means a shared live backend, not a particular transport technology.


## 04:01 — Sign the order and explain trusted labels

Start Maria on the doctor phone. Open New R X, select Maria and Otezla, then Sign and send. Wait for Sent to pharmacy before the operator continues. In this prototype, that button records a prepared fictional order. It does not transmit a real prescription to a real pharmacy.

Your short line is: The label is verified against a saved DailyMed source. Signing starts the workflow. It does not establish a fill.

Here is the deeper explanation, including Minh's label work. RxNorm gives a standardized drug identity. DailyMed supplies the structured product label. The project saves source artifacts, extracts selected sections deterministically, and verifies their identity and contents. The build checks both Otezla and Humira before producing the app.

Think of the label as a checked photocopy. The system checks what document it came from, which version it is, and whether the selected content changed. Hashes are digital fingerprints used for that comparison. Humira has additional checks around concentration, volume, and its kit presentation.

The label endpoint serves the verified saved artifact. It does not ask Gemini to write a drug explanation. It also does not make a fresh DailyMed call on every screen load. We show four selected sections, not the entire original label layout. A supported but unverified artifact is withheld.

If a judge asks whether that makes FirstDose FDA approved, the answer is no. We verified the source and the saved content. That is not approval of our application. If they ask why we saved the source, explain that reproducible content and predictable demo behavior are valuable, while a real product would also need a controlled update process.

The important boundary is simple: AI can interpret an operational note. It cannot rewrite the label or invent patient instructions.


## 05:58 — Gemini reads; the rule chooses

The operator now fires Maria's first pharmacy input, event four, and waits. Then the operator fires event five, the reason-classification step. The expected story is declined at the fictional four hundred ten dollar quote. Show the actual result.

Say: Gemini reads the pharmacy note and returns one allowed reason. A rule picks the next action, not the model.

Gemini receives a short supported note, limited to one hundred forty Unicode code points. The server requests a constrained JSON object with one reason field. There are six allowed reason codes, plus unknown. A parser checks the shape and rejects extra fields or invalid values. The call has a four-second deadline. The recorded successful model configuration is Gemini three point one Flash Lite, selected through an environment setting. That is recorded integration evidence, not a new check of today's deployment settings.

Here is a likely judge question: What if it is not confident? Answer carefully. We do not have a numerical confidence score or threshold. Unknown, malformed output, timeout, missing configuration, or provider failure becomes null, which leaves the reason unclassified. We do not secretly substitute the expected demo answer. And a valid reason code can still be semantically wrong. A schema checks format, not truth.

The deterministic router then checks the reason and recorded coverage or eligibility. Government coverage goes to access support and never gets a manufacturer copay card in this prototype. Eligible commercial price or card problems can get the resend-card action only when the recorded copay-card eligibility flag is true. A bridge request also needs its own eligibility flag. Prior authorization and noncoverage go to access support. Another configured option is a bridge-sample request, which is still a stand-in administrative action.

Think of Gemini as sorting a messy sticky note into a labeled tray. A checklist decides which desk receives that tray. A person still approves the next step. Repeat the boundary: AI reads the note. A rule picks the fix. A human taps send.


## 08:12 — Handoff, Grok voice, and your SpaceXAI proof

Now the doctor hands Maria to the coordinator. The primary route is the Send to my coordinator button. The server checks the case, the active run, the prerequisites, and the coordinator link. If approval is needed, the doctor completes it. A handoff changes who owns the follow-up. It is not a fill and it is not proof that anyone reached the patient.

Because Space X A I is one of your selected tracks, prepare the voice version too. Do it before the manual handoff, not after a duplicate handoff. Tap Tap to speak. Say: Send Maria to my coordinator. Tap the listening button to stop. Check the transcript and the proposed Maria and Otezla case. Then tap Send to my coordinator in the proposal. That final button is the explicit confirmation, even though its label does not literally say Confirm.

Your line is: Grok transcribes the request. We match a narrow supported handoff, show it back, and require the doctor to confirm.

Underneath, our voice endpoint sends audio to x A I's speech-to-text service using Grok voice transcribe two point zero. The input is capped at four million bytes, and the provider deadline is twenty seconds. We supply keyterms for the fictional names and drugs. A narrow whole-utterance matcher resolves a supported patient handoff. Ambiguous speech does not silently choose someone.

This is not an autonomous medical agent. It is another way to prepare the same command for review. It does not pick treatment. If the microphone or transcription fails, use the tap path and disclose the voice failure. Do not claim the live voice demonstration succeeded when it did not.

The saved organizer brief describes Cursor plus Grok for the track. Explain actual Cursor development work only if the team can substantiate it. Your selected entry is confirmed; that alone does not prove every eligibility requirement is satisfied. Also, do not claim complete voice reset safety: the current recording-through-confirmation path has a remaining run-binding limitation documented in your PDF.


## 10:18 — The patient resource, audio, and independent fill

The coordinator opens Maria and clicks Re-send copay card. That command records the permitted administrative action. The patient page now displays a savings-card stand-in. Say: The coordinator sends the resource. We now wait to learn what happens next.

If you show the language feature, select Spanish in the coordinator message section, approve and send the message, and let the patient tap Play message. ElevenLabs generated those English and Spanish Otezla messages ahead of time. The app plays committed audio files. It is not calling ElevenLabs at runtime, and it is not freely generating or translating medical advice. The text comes from prepared templates. There is no general chatbot, no SMS, and no Humira audio in this implementation.

Now comes your most important pause. Ask the judge to tap Use at pharmacy. Read the pending message. Do not let the operator fire the confirmation yet. Say: That tap is acknowledgment, not a fill. We still wait for the pharmacy.

The patient-use endpoint records that acknowledgment. A separate message acknowledgment, if shown, is a different action. Neither counts as dispensing.

Now explicitly cue the operator: Send the separate simulated pharmacy confirmation. The operator fires Maria's event eleven, the claim result marked Dispensed. The server commits that confirmation. The screens can now show Fill confirmed. Notification and analytics work happens after that commit.

This is independent in the workflow sense: the fill evidence is a different source event, not an inference from the patient's button. The external pharmacy itself is simulated in this demo. We have not connected to a live pharmacy dispensing feed.

A judge may ask whether fill confirmed means the patient started treatment. Answer no. A fill is not proof that a dose was taken. That is why our wording matters. You have just demonstrated the difference between an action, evidence, and a clinical outcome.


## 12:22 — The backend and watch without jargon

Let's slow down and follow one click all the way through the backend. React sends a command to a Next dot J S server route. The server authenticates the demo session, checks whether the action is allowed, and plans an event batch. It calls a Supabase database function. The database checks the active run and revision under a lock, then commits the whole batch and the notification intent together.

Run means this rehearsal. Revision means the current accepted version within it. Think of a notebook with a name and a page number. Before writing, the server checks that you have the current notebook and page. Reset starts a new notebook. Old commands do not get to write into the new one.

Idempotency means repeating the same accepted operation does not add another copy. A unique run and script identity prevents duplicate events. If the revision changes underneath a command, the server can re-read and re-plan with a bounded retry count. It is not blindly trusting what the phone displayed earlier.

The other screens poll accepted history, normally every one and a half seconds. Unchanged responses can be cheap, and stale responses are rejected. The event history is the source of truth. A local green animation is not.

The watch is another output. The accepted transaction records an alert intent. A worker claims it and sends a bounded template message through ntfy. The paired phone and its notification settings determine whether the watch receives it. An accepted network request does not prove the wrist buzzed.

We have historical Garmin receipt evidence, and you reported phone and watch success during rehearsal. Check actual receipt again at the table. If it fails, show the real app alert. The notification path is not exactly-once physical delivery; uncertain sends and resets still have limits.

Remember the analogy. The database is the notebook. The watch is the doorbell. A missing doorbell should not erase the notebook.


## 14:21 — James stays unresolved, and Tiger measures honestly

After Maria, sign James's Humira order on the doctor phone. The operator fires events sixteen, seventeen, and eighteen, waiting between them. The first pharmacy result is prior authorization required. The later hub note reports failed contact. Gemini classifies that later note, so the expected current reason is unable to reach.

Say: James's later hub note says they could not reach him. Gemini names the reason. His rule-selected action is access support. Sending the request still leaves him unfilled.

Hand him to the coordinator and click Connect to access support. His doctor screen can still say stuck or with your coordinator. That is correct. We did something useful, but we did not receive a pharmacy confirmation. Maria shows completion. James shows honest incompletion.

Now open Market Access. With the expected seed and only Maria newly filled, the count is nine: eight background fills plus Maria. James adds zero. The median time to first fill measures elapsed time from prescription to confirmation among confirmed cases. It is not measured time saved. Unconfirmed cases are excluded from that median, so always remember the unfinished work too.

Tiger Data receives selected committed events: prescription, allowed reason, and independent dispensing. The row carries a run identifier, script identifier, timestamp, metric kind, allowed reason, and a keyed case fingerprint. Raw names, notes, drug, insurance and prices do not cross that projection. The internal records are pseudonymous, not magically anonymous. The display shows aggregates.

The server replays retained history into a Timescale database and computes the summary with SQL. Repeated identical replay does not duplicate a metric. A changed payload with the same identity is a conflict. Summary reads can catch up missed background replay. Freshness checks keep an old run from replacing the new run's display.

Check the source badge. If it says practice-event fallback, explain the fallback. Do not claim Tiger supplied that result. And say selected events, not every event: the smaller projection is intentional.


## 16:36 — Public data, tracks, and business questions

Your project combines fictional cases with real saved reference data. Those categories must stay separate. The Georgia CMS Part D prescribing snapshot is from twenty twenty-four. It reports six hundred fourteen Otezla prescribers and six thousand six hundred sixty-one claims. Those claims are not unique patients, new starts, or our paying customers. Humira C F Pen is a specific product row, not every Humira formulation.

The saved formulary snapshot is September twenty twenty-six. Among Georgia plans that cover Otezla, about ninety percent require prior authorization. That denominator matters. It does not mean ninety percent of patients are rejected. The saved acquisition-cost data, NADAC, is what pharmacies pay for a unit. It is not Maria's copay and not our savings. The public-data cards read saved, dated values; they are not fresh external queries each time you open the page.

Now connect the work to your actual selected tracks. Oracle of the Deep is the general machine-learning and AI track. Show useful bounded classification, the unknown path, and outcome analytics. Impiricus is the first sponsor track. Show a relevant doctor alert that creates an owned coordinator task, inside a proposed extension of their workflow. Space X A I is the second sponsor track. Show Grok preparing a handoff from speech with explicit human confirmation, and explain truthful Cursor development evidence.

Gemini, Tiger Data and ElevenLabs also have public MLH prizes, but your MLH selections were not supplied. A technology being in Built With does not automatically mean the team entered that prize. Your actual submission form places Aramco under sponsors, so the older guide's general-track recommendation is superseded.

If someone asks what we save, say we aim to reduce unowned follow-up and staff effort, and a pilot must measure that. If they ask whether it can be profitable, the proposed buyer is Market Access and the proposed pricing unit is a qualifying confirmed first fill. Pricing, demand, attribution and operating costs are not validated. Do not turn the demo count or the workforce extrapolation in the story into a claim of revenue or jobs eliminated.


## 19:00 — Your short demo, rehearsed out loud

Now rehearse your speaking part. Imagine the devices are already ready. You do not need to say all the technical detail from this episode. Let each screen earn one explanation.

This is the coordinator's queue: three need a fix, two are waiting, and eight are filled. Our Next dot J S and React screens share workflow state in Supabase. Maria's fictional prescription shows a label verified against saved DailyMed source.

Our operator supplies a simulated pharmacy update. Gemini reads the note and identifies declined at price. It only classifies the reason. A deterministic rule chooses the action. The doctor gets an alert. I can choose either the tap handoff or the voice handoff.

For the Space X A I demonstration, I can say, send Maria to my coordinator. Grok transcribes that request. I check the proposed case and explicitly confirm it. Voice prepares the handoff; it does not act on its own.

The coordinator sends a savings-card stand-in. The optional English or Spanish message uses pre-generated ElevenLabs audio. Now tap Use at pharmacy. That records acknowledgment. It does not confirm a fill.

Now we send the separate simulated pharmacy confirmation. The shared screens update, and the notification service sends the confirmation alert. We verify the watch actually receives it.

James's later hub note says he could not be reached. Gemini returns that reason, or leaves it unknown if classification fails. His rule-selected action is access support. Sending that request still leaves him unfilled.

Tiger Data receives selected, minimized events and measures confirmed first fills and time to first fill. Eight seeded fills plus Maria gives nine. James adds none. These are demonstration outcomes. Our bounded AI and analytics support Oracle. The useful doctor-to-staff workflow supports Impiricus. The Grok voice request supports our Space X A I story. Khadim will close.

That is your short demo. Rehearse it with the actual clicks. Keep the acknowledgment-versus-confirmation pause. For a Space X A I judge, preserve the voice evidence and trim elsewhere. For a general two-minute pass, you can explain the voice feature briefly and offer the interaction in questions.


## 21:25 — Recall drill and the answers to keep

Let's finish with a recall drill. Answer each question out loud before the explanation if you can.

What does Gemini do? It classifies a short operational note into an allowed reason. It does not choose the medicine or the fix.

What does a rule do? It uses the reason and recorded coverage or eligibility to choose a bounded administrative next step. A human still sends it.

What is the source of truth? The accepted operational event history in Supabase, not a local screen animation, the watch, or the analytics dashboard.

Why two databases? Supabase owns the workflow. Tiger owns a smaller outcome projection. That makes the boundary inspectable but adds replay and freshness complexity. A smaller future pilot might not need two databases.

What does unknown mean? Classification did not produce an acceptable reason. There is no numeric confidence threshold. Even an accepted enum can still be wrong, so evaluation and human review matter.

Why is James still stuck after access support? Because a support request is not a fill. There is no independent pharmacy confirmation for him in this sequence.

What if Tiger fails? The workflow stays committed. Replay can catch up later. The display must identify its practice-event fallback.

What if the watch does not buzz? Show the actual doctor alert and state that wrist receipt did not arrive. A provider response is not proof of physical delivery.

Are the labels generated by AI? No. They are selected sections from verified saved label sources. Are the Spanish messages generated live? No. They are prepared ElevenLabs audio files. Does Grok send automatically? No. The doctor confirms the proposed handoff.

Is the system production ready? No. The prototype still needs real pharmacy and partner feeds, production identity separation, evaluated rules and classification, operational monitoring, and a practice pilot. We have not established HIPAA compliance or clinical effectiveness.

One last time: Gemini reads. Rules route. Humans approve. Supabase remembers. Tiger measures. Grok transcribes. ElevenLabs voices prepared messages. ntfy alerts. Your demonstration is strongest when you can say exactly what happened, what caused it, and what evidence you still do not have.
