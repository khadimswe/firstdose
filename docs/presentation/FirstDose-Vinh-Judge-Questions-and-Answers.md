# FirstDose — Vinh: 30 judge questions and answers

Prepared September 27, 2026 for the Maria-only three-minute demo.

Gemini reads the note. A rule picks the fix. A human approves. Supabase stores the workflow. Tiger measures the outcome.


## 1. What did you actually build?

We built a working prototype that connects a reported prescription barrier to a coordinator’s next action, then tracks whether the pharmacy confirms the fill. That includes the screens, workflow backend, AI classification, verified labels, analytics and notifications.




## 2. What is real, and what is simulated?

The application, database workflow and provider integrations are implemented. The patients and pharmacy events are fictional. Impiricus Wallet and the partner fulfillment steps are stand-ins for proposed integrations.

If they point at /sim: That is our controlled replacement for an external pharmacy or hub feed.


## 3. What is your technology stack?

Next.js and React with TypeScript, hosted on Vercel. Supabase Postgres stores the operational workflow. Gemini classifies notes, Tiger Data calculates outcome metrics, and ntfy delivers notifications. Grok supports optional voice handoff, and ElevenLabs provides prerecorded patient-message audio.




## 4. Walk me through what happens behind one click.

The screen sends a command to our Next.js server. The server checks the session, current case and allowed action. It commits the resulting events to Supabase, and the other screens read that accepted state. Notifications and analytics processing happen after the commit.

Remember: click → validate → save → update screens → notify and measure.


## 5. How do the phone and laptop stay synchronized?

They read the same backend history. The clients normally poll about every 1.5 seconds and refresh after commands. They also reject stale responses.

If asked whether it is Supabase Realtime: No—the current implementation uses authenticated polling.


## 6. What happens if two people click at the same time?

The database checks the current run and revision before accepting a change. It commits the action atomically and prevents duplicate event identities. A conflicting command must refresh and retry or fail.

Plain English: The server makes sure both people aren’t writing over an outdated version.


## 7. What are a run and a revision?

A run identifies this demo session. A revision identifies the latest accepted state within that session. Reset creates a new run, so an old request cannot update the fresh demo.

Memory aid: run = notebook; revision = page number.


## 8. Why use both Supabase and Tiger Data?

Supabase runs the application: cases, actions, coordinator links and messages. Tiger receives a smaller analytics projection for outcome queries. That separates operational detail from the data needed to measure fills.

If challenged: One database could be enough for a smaller pilot. The separation is useful, but it adds replay and synchronization work.


## 9. What exactly does Gemini do?

It reads a short pharmacy or hub note and returns one reason from a fixed list, such as declined at price or prior authorization required. It does not choose a medication, write the drug label or decide the fix.




## 10. Why use AI instead of rules for the note?

People describe the same problem in different ways. Gemini interprets that wording. Once we have a structured reason, deterministic rules are easier to inspect for choosing the administrative action.




## 11. How do you prevent hallucinations?

We restrict the response format and allowed reason codes, validate the result, and reject malformed output. Unknown results and provider failures leave the reason unclassified. The model cannot directly execute the fix.

Important follow-up: A valid reason code can still be wrong. These controls limit what the model can do; they don’t prove classification accuracy.


## 12. How does it know when it isn’t confident?

We don’t currently use a numerical confidence score. The model can return unknown, and invalid output, timeouts or provider failures also become an unclassified result.

Do not claim an 80% confidence threshold. That threshold does not exist in the implementation.


## 13. What chooses the fix?

A deterministic router checks the reason, insurance type and recorded eligibility. The coordinator reviews and sends the resulting administrative action.

For Maria: A commercial price-related case can receive the resend-card action only when the copay-card eligibility flag is true.


## 14. What happens with Medicare or Medicaid?

Our prototype routes government coverage to access support and blocks the manufacturer copay-card action. It checks coverage and eligibility separately from the AI classification.

Frame this as what the implemented rule does, rather than claiming the prototype solves every eligibility situation.


## 15. Why does the doctor approve the coordinator?

The approval records who is allowed to receive the doctor’s follow-up tasks. The coordinator handles access work; they don’t sign prescriptions.

Demo boundary: We simulate that approval using fictional accounts and a shared demo login. Production would require separate authenticated identities and enforced practice-level permissions.


## 16. How do you verify an NPI?

An NPI is a provider identifier. Our demo checks its ten-digit format and checksum to catch invalid entries. That does not verify the person’s identity, credentials or account ownership.

If asked about NPPES: A registry lookup would be an additional check. Matching a registry record would still not prove that the person using the account owns that identity.


## 17. Where do the drug labels come from?

DailyMed supplies the label source, and RxNorm helps establish drug identity. We save the source and verify selected sections against it before building the app. The model doesn’t generate the label.

If they dig deeper: We check identity, version, hashes and extracted content. Both Otezla and Humira have verified artifacts. Runtime serves those saved artifacts rather than fetching a new label every time.


## 18. Does Use at pharmacy mean the medication was filled?

No. It records acknowledgment of the resource. Only the separate pharmacy confirmation changes the case to Fill confirmed. Even a confirmed fill does not prove the patient took a dose.

This is your most important answer. Preserve the pause between acknowledgment and confirmation in the live demo.


## 19. How does the watch work?

After the workflow commits, a notification worker sends a prepared message through ntfy. The paired phone forwards the notification through the configured watch setup.

If asked about reliability: A successful API response is not proof that the watch received it. We check actual wrist receipt, and the case stays saved even if notification delivery fails.


## 20. What exactly goes into Tiger Data?

A filtered set of committed prescription, reason and dispensing events. Each metric includes a timestamp, event identity and a keyed case hash. We exclude raw patient names, notes, insurance, prices and other unnecessary details.

Important distinction: Tiger stores pseudonymous event-level metrics. The Market Access screen displays aggregate counts. Those are not the same thing.


## 21. Why does Market Access show nine?

We seeded eight fictional background fills. Maria’s separate pharmacy confirmation adds one, giving nine. A handoff, card tap or support request does not increase the fill count.

If asked whether that proves impact: No. It proves the demo’s accounting behavior, not real-world improvement.


## 22. What does median time to first fill mean?

For each confirmed case, we calculate the time between prescription and pharmacy confirmation. The median is the middle elapsed time across those confirmed cases.

Add if needed: Unconfirmed cases are excluded, so the median must be considered alongside unresolved cases. It isn’t a measure of time saved.


## 23. What if Tiger Data is unavailable?

The operational workflow remains committed in Supabase. Retained history can replay into Tiger later. The dashboard can show a labeled practice-event fallback, but we would not present that as a successful Tiger query.

Before saying “tracked in Tiger Data,” check the dashboard’s source badge.


## 24. Does pharma get patient information?

The demonstrated Market Access view shows aggregate results. Our analytics projection excludes names and raw notes.

Keep the boundary honest: We haven’t established production identity isolation or compliance. The demo uses fictional patients and a shared session; a real deployment needs stronger access controls and a reviewed data-sharing boundary.


## 25. What does Grok do, and why SpaceXAI?

Grok transcribes a spoken handoff request. Our code resolves a narrow supported action, shows the proposed patient, and requires the doctor to confirm before the existing handoff executes.

Your three-minute script does not demonstrate this. For SpaceXAI questions, keep the voice flow ready using an eligible case that has not already been handed off. Describe Cursor development work only if your team can substantiate it.


## 26. What does ElevenLabs do?

It generated the approved English and Spanish Otezla message audio ahead of time. The coordinator sends the prepared message, and the patient taps to play it.

We don’t generate unrestricted medical advice or call ElevenLabs at runtime.


## 27. How does this fit your three tracks?

Oracle is our bounded AI classification and outcome analytics. Impiricus is the proposed doctor-to-coordinator engagement workflow. SpaceXAI is Grok preparing a voice handoff with explicit human confirmation.




## 28. What did you test?

Our recorded verification includes unit tests, PostgreSQL integration checks and browser workflow checks. We tested things like invalid transitions, duplicate actions, stale runs, label verification and separating acknowledgment from dispensing.

If quoting the number: The recorded sign-off reports 728 tests. That is engineering evidence—not proof of clinical effectiveness or guaranteed device delivery.


## 29. What would production need?

Real pharmacy and hub connections, actual partner integrations, separate authenticated staff and practice accounts, evaluated classification and routing, and operational monitoring. Then a practice pilot to measure staff effort and independently confirmed fills.




## 30. What are you saving, and who pays?

We aim to reduce unowned follow-up and coordinator effort. We haven’t measured saved hours or dollars yet. The proposed buyer is Market Access, with payment tied to qualifying confirmed first fills. Pricing, attribution and profitability still need validation.

Hand the deeper business discussion to Khadim.


## Six run-sheet wording fixes


- “That’s the only alert” → “That’s the first alert.” You demonstrate a second alert after confirmation.


- “Through Impiricus Wallet” → “Through our Wallet stand-in.” The actual partner integration is proposed.


- “FirstDose is a new Ascend skill” → “FirstDose is our proposed Ascend skill.”


- “Pharma pays” → “Our proposed model is that pharma pays.” Pricing and buyer demand remain unvalidated.


- “As little as $0” → “Maria receives the demo savings card.” You have not demonstrated her actual final price.


- NPI / already-verified-doctor claim → Say that the prototype uses fictional accounts and a shared demo login. NPI format checking is not identity verification, and simulated coordinator approval does not establish production authorization.
