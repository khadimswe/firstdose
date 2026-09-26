> **Superseded 2026-09-26 09:40:** the product is now coordinator-first. Source of truth: `docs/spec-v2-coordinator.md`. This doc stays as a reference snapshot of the v1 doctor-first proposal.

# FirstDose product proposal

Updated September 25, 2026. Team: Vinh, Minh, Deem. The team split is accepted; this document is the working product and presentation brief. It does not claim the planned backend already exists.

## What we are building

**FirstDose turns a stuck first fill into a reviewed access task, then checks for a later pharmacy fill signal.**

The doctor gets a reason to act, the coordinator gets the evidence and a suggested next step, and the team can see whether a fill was subsequently recorded. We are designing that workflow for an Impiricus Ascend integration. The prototype uses fictional people and explicitly simulated pharmacy, hub, Ascend, Wallet, and sample-partner services.

**Product line:** One missed fill. One accountable next step.

**Thirty-second pitch:**

> A prescription can be written while the first fill is still missing. FirstDose brings the reported barrier to the doctor, hands a reviewed access task to the coordinator, and follows the case until a later pharmacy signal arrives. Our demo follows one fictional patient across the doctor's screen, the coordinator's queue, and a patient phone. Pharmacy and manufacturer services are simulated; our contribution is the reason, handoff, and follow-up workflow designed for Impiricus Ascend.

## Main objective for this hackathon

Deliver a repeatable, judge-operated Maria demonstration that makes the workflow understandable in under two minutes. Compete primarily on HCP usefulness for Impiricus and healthcare access for A Marina's Mission, with overall-award ambition. Add sponsor entries only where a functioning integration contributes to the same product.

The memorable moment is one case changing across the doctor's device, coordinator queue, patient phone, and shared board. A watch buzz earns its place by leading to that action. The visible result is **first fill observed in a simulated pharmacy scenario**, not an assertion that medicine was taken or health improved.

## People, jobs, and value hypotheses

| Person | Job in the workflow | Value we can test |
|---|---|---|
| Doctor | Review the reported access problem and assign follow-up | Can the doctor understand the reason and hand off without hunting across screens? |
| Access coordinator | Inspect evidence/eligibility, select the permitted administrative action, monitor progress | Is the next action clear, and is the unresolved case still visible? |
| Patient | Receive a scoped resource and acknowledge it | Can an unfamiliar person open and understand the phone view? |
| Practice team | See subsequent pharmacy status | Does the system distinguish acknowledgment, dispensing, and an unresolved barrier? |
| Potential buyer: manufacturer Market Access / platform partner | Understand aggregated access-workflow outcomes | Are the permitted aggregates useful enough to justify a pilot? This is unvalidated. |

Commercial model: propose a scoped workflow pilot or platform integration, with pricing to be learned from stakeholders. A per-resolved-case model in Stephen's PDF is a hypothesis, not an established agreement. Never describe payment per prescription or a guaranteed recovered patient.

## The first case

1. A doctor creates Maria's fictional prescription and views the verified source label.
2. The operator supplies a simulated pharmacy note recording a cost barrier. No missing reason is invented.
3. The doctor receives a practice-side alert and explicitly hands off.
4. The coordinator reviews the recorded evidence and the prepared scenario's program eligibility before sending the simulated assistance resource.
5. Maria's phone acknowledges the resource. This event cannot itself establish dispensing.
6. The operator supplies a separate simulated pharmacy confirmation. The board and case history record the fill.
7. If Tiger is implemented, a deduplicated aggregate updates with data-source/freshness disclosure. Otherwise show the mock summary as mock, or use an architecture slide.

James is the contrasting case: unsuccessful contact or another recorded barrier remains unresolved. Use access/outreach review, not an automatic sample request inferred solely from unreachable status. His pre-visit card should report the evidence and lack of a recorded fill, without generated treatment advice.

## What is original, and what already exists

Our engineering contribution is the coordinated case/event model, evidence-preserving reason classification, deterministic administrative routing, human handoff, synchronized views, and subsequent-fill tracking. We use source labeling and existing infrastructure; we do not claim to invent those services.

[Surescripts already offers first-fill abandonment detection and care-team outreach support](https://surescripts.com/products/first-fill-abandonment). Our proposal must therefore be evaluated as a concrete workflow and prospective integration, not the first system to notice an unfilled prescription. The exact overlap with Impiricus and its partners is a workshop question, not something a public-site omission proves.

## Scope

| Must demonstrate | Add after Maria works | Outside this weekend |
|---|---|---|
| Doctor alert and explicit handoff | James's contrasting unresolved case | Real prescribing or claim adjudication |
| Evidence and eligibility review | Gemini reason classification | Real patient onboarding or clinical deployment |
| Scoped patient resource | Tiger-backed metrics | Guaranteed manufacturer-program eligibility |
| Separate pharmacy confirmation | Grok voice handoff; optional ElevenLabs audio | Label-diff engine, broad drug coverage |
| Verified DailyMed source text | Richer board treatment | Custom watch application unless everything else is complete |
| Honest disclosure and data boundaries | Mirrored watch path once physically verified | Automatic treatment advice or medical decisions |

The existing never-cut list remains the delivery priority. If time shrinks, cut optional voice/analytics presentation before source integrity or the core handoff.

## Accepted ownership

- **Vinh:** schema/policies, command APIs, router, simulator backend, Realtime, notifications/watch, later Grok backend.
- **Minh:** verified labels first, Gemini classifier second, Tiger analytics third. Backend/AI experience confirmed.
- **Deem:** screens, frontend hook wiring, microphone capture/confirmation UI, QR, presentation/video/submission materials.

The classifier describes a reason; the router selects an allowed administrative action. Deem renders the shared contract. No teammate silently changes another owner's files or the frozen fixtures.

## Definition of a successful weekend

- Maria completes on two independent devices, with the same authoritative case state.
- A second, unresolved case does not produce a false success.
- Patient acknowledgment alone leaves dispensing unconfirmed.
- Exact displayed label text has saved, reproducible source evidence.
- A government/unverified-eligibility test never auto-issues a manufacturer card.
- A judge can change an allowed input and see the corresponding behavior.
- Every claimed live integration has a recorded check; mock/cached/recorded states are disclosed.
- The two-minute demo, longer walkthrough, repository, write-up, and evidence agree.
- Both required submission destinations have been checked by the team after submission.

These are project acceptance criteria, not published judging weights. Read [track strategy](research/tracks-and-requirements.md), [winner lessons](research/winner-lessons.md), and [claims register](presentation/claims-and-evidence.md).
