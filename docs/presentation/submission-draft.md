# FirstDose submission draft

Prepared September 26, 2026. **Working draft, not ready to submit.** Update against a reviewed release SHA and the current event form. This copy describes the inspected prototype, not a completed backend. Deem owns final prose; all owners verify their claims.

## Inspiration

A prescription is only the start of an access workflow. When it stalls, a practice needs a reason, an accountable next step and a way to see what happens afterward. We explored how an HCP engagement could lead directly to a reviewed coordinator task.

## What it does

FirstDose presents fictional prescription-access cases through doctor, coordinator, patient, board, access-summary and simulator views. Its proposed workflow connects a barrier to a reviewed task, a patient resource and a later pharmacy fill signal. We designed it as a proposed Impiricus workflow; pharmacy and partner services are simulated.

The current frontend prototype runs scripted cases using shared browser storage. Its patient action advances the scripted pharmacy sequence. Our target contract separates resource acknowledgment from an independent simulated dispensing confirmation. Neither a fill signal nor the current "started" label establishes medication ingestion or clinical recovery.

## How we built it

The inspected build uses Next.js and a shared frontend event interface with mock JSON fixtures. Deem's stacked branches contain all six screens. Vinh owns the planned authoritative workflow, Realtime integration and watch path; Minh owns label-source verification, constrained reason classification and analytics.

At this draft's evidence snapshot, Supabase/API integration, real provider clients and source-verified label data are pending. Replace this paragraph with the actual shipped implementation after verification. Name each provider's concrete job and evidence; do not add a technology because its prize exists.

## Challenges and learning

The difficult boundary is deciding what an event proves. A patient resource acknowledgment is not a pharmacy confirmation. A pharmacy confirmation is not ingestion. A note classifier must not grant eligibility or create a clinical claim. We also identified the need to separate practice records from partner-facing aggregates and to handle unknown reasons instead of forcing a confident action.

## Accomplishments

We built the frontend workflow and a shared event model for two fictional cases. Source-level checks exercised the Maria sequence and James's before-visit state, and remote branch CI passed its configured checks. Browser usability, physical watch delivery and independent-device synchronization need separate evidence; CI does not establish those outcomes.

## What's next

Complete and verify the authoritative case workflow, source-backed labels and cross-device integration. Validate the proposed contribution against existing Impiricus capabilities. Then test whether staff can follow up with less effort and clearer task ownership. Clinical effectiveness, real partner access and commercial demand remain unvalidated.

## Release editing checklist

- Replace progress-state paragraphs with verified shipped behavior, preserving simulation and outcome disclosures.
- Include the public code URL and reviewed commit. Credit all frameworks, datasets, assets and AI/coding tools actually used; distinguish original work from provided services.
- Add the actual demo/video link and check runtime against current rules. Do not submit placeholder URLs.
- Enter A Marina's Mission and Impiricus according to the current form. Add conditional categories only after the [entry checks](../research/tracks-and-requirements.md) pass.
- Verify team members and eligibility. FirstDose is Vinh, Minh and Deem; Stephen's project is separate.
- Submit to Devpost, then submit that link to expo.hexlabs.org, and reload both. This preparation has not submitted anything.
