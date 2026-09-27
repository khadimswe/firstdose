# FirstDose — Vinh visual cheat sheet

## One case, start to finish

Six steps. Only the last one supplies the fill confirmation.

1. Doctor signs: A fictional prescription starts the case.

2. Pharmacy reports a barrier: The operator supplies this outside event.

3. Gemini reads; a rule routes: The reason becomes an allowed next action.

4. Doctor hands off; staff sends: A human coordinator owns the follow-up.

5. Patient taps the card: Acknowledgment only. Still pending.

6. Pharmacy confirms dispensing: Separate simulated input → Fill confirmed.


Say: The patient tap is not a fill. Even a confirmed fill does not prove a dose.


## Behind one click

The server saves accepted events; screens and outputs follow that saved state.


Say: One shared notebook. Screens normally read it about every 1.5 seconds.

React screens → Next.js validation → Supabase atomic commit. After commit: notifications and Tiger replay. Clients use authenticated polling, not Supabase Realtime.


## AI has one small job

Gemini labels the problem. It does not choose treatment or execute the fix.


Say: AI reads the note. A rule picks the fix. A human taps send.

Invalid output/provider failure/UNKNOWN becomes null. Rules enforce recorded eligibility; no model-generated labels or autonomous action.


## Two databases, two jobs

Operational details and outcome measurements serve different purposes.


Say: Tiger stores pseudonymous events. The Market Access screen shows aggregates.

Projection is an explicit allowlist, not a copy of all events. HMAC case hashes are pseudonymous, not proof of anonymity.


## What counts as success?

Three different observations. Keep them separate in your explanation.


Say: Eight seeded fills + Maria’s confirmation = nine demo fills. Not nine proven treatment successes.

The operator simulates pharmacy evidence; no real pharmacy feed is connected in this demo. Median elapsed time is not time saved.


## The watch is the doorbell

A missed notification must not erase the saved case.


Say: Show the watch only if it buzzed. Otherwise show the actual phone alert.

Post-commit notification delivery is separate from durable workflow state. No exactly-once physical delivery claim.


## Approval is not identity proof

Know this distinction if a judge asks about NPI or coordinator access.


Say: We check the NPI’s format. We do not verify the person’s identity.

An NPPES registry match would be an additional check, not proof of account ownership.


## Your stack and three tracks

Name the tool when you show its job. Avoid a long list during the pitch.


Say: Your short script omits voice. Keep it ready for SpaceXAI questions on an eligible case.

Selected tracks are user-confirmed. Actual Cursor use must be substantiated. Labels are cached verified sections; ElevenLabs audio is prerecorded, not runtime generation.


## Your demo in six short cues

Khadim opens. You run Maria. Minh supplies pharmacy events. Khadim holds the patient phone.


Say: Never cut the acknowledgment pause. Read the actual screen, not an expected success.

James is reserved for questions. Wallet is a stand-in. Proposed product and payment claims stay qualified.


## Eight questions to know cold

Answer in one or two sentences. Add detail only if the judge asks.


Say: Gemini reads. Rules route. Humans approve. Supabase remembers. Tiger measures.

These diagrams simplify the inspected main 015c342 implementation. See the 30-question handout for deeper answers.
