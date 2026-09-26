> **Superseded 2026-09-26 09:20:** pitch is now coordinator-first ("Impiricus reaches the doctor; FirstDose reaches the person who gets the patient on it, every day"). Source of truth: `docs/spec-v2-coordinator.md`. Rewrite after the 11 AM workshop.

# Pitch, slide copy and judge questions

Prepared September 26, 2026. Paste-ready content for Deem's presentation, not a rendered deck. Lead with the app in a short expo pitch; use these slides for a longer explanation or submission asset. All implementation claims depend on the [evidence register](claims-and-evidence.md).

## Six slides

### 1. The problem

**On slide:** FirstDose. One missed fill. One accountable next step.

**Supporting line:** A prescription can stall between the office and the pharmacy. The team needs a reason, an owner and a follow-up status.

**Speaker:** "Maria is a fictional patient with a cost barrier. We focus on what the practice can do next, and how it can see a later fill signal."

**Visual:** One person and a broken prescribing-to-fill timeline. No unverified prevalence statistic.

### 2. The product

**On slide:** Barrier -> doctor alert -> coordinator review -> resource -> pharmacy signal.

**Speaker:** "Watch the handoff. Acknowledging a resource leaves the case pending. A separate simulated pharmacy confirmation changes the status."

**Visual:** Real reviewed app capture. Show current mock behavior accurately until the corrected target build passes.

### 3. What we built

**On slide today:** Six frontend views. Shared mock event model. Fictional Maria and James workflows. Backend integration in progress.

**After evidence passes:** Replace with the exact shipped components, such as validated workflow commands, cross-device updates, sourced labels and bounded classification. Do not preselect these claims because they are on the plan.

**Speaker:** "The pharmacy and partner services are simulated. Here is the implementation boundary and the evidence behind each live integration."

**Visual:** Small table: practice UI -> workflow/state -> simulator and verified providers. Mark implemented, simulated and proposed distinctly.

### 4. Trust by construction

**On slide:** Coordinator review. Deterministic action rules. Source-backed label. Explicit data boundary.

**Speaker:** "AI can map a note to a reason. It cannot grant eligibility or write a drug claim. Practice case details and partner aggregates serve different purposes. These are design targets until their checks pass."

**Visual:** Practice / patient / partner access table. Never claim HIPAA certification from a prototype.

### 5. Why it matters

**On slide:** Proposed value: less follow-up friction, clearer task ownership, inspectable outcomes.

**Speaker:** "Our first pilot question is whether staff resolve access tasks with less effort. We would measure time per task, unresolved-case age and subsequent fill signals. We have not measured clinical benefit or willingness to pay."

**Visual:** Three proposed pilot measures, no fabricated KPI dashboard or revenue figure.

### 6. Where it fits

**On slide:** Proposed Impiricus HCP workflow. A Marina's Mission. One missed fill. One accountable next step.

**Speaker:** "We want to test this with an office and validate which steps complement existing Impiricus capabilities. Our next milestone is a validated partner feed, not more demo screens."

**Visual:** Finished run timeline, source and simulation disclosures. Include only actual sponsor integrations with a visible job.

## Poster copy

**Title:** FirstDose

**Tagline:** One missed fill. One accountable next step.

**Problem:** A stalled prescription needs follow-up. A status alone does not assign the work.

**Proposed workflow:** Record the barrier. Alert the doctor. Route a reviewed coordinator task. Share a resource. Check for a subsequent pharmacy fill signal.

**Demo disclosure:** Fictional patients and simulated pharmacy/partner services. Current implementation status is shown in the demo. A fill signal does not establish ingestion, clinical benefit or intervention effectiveness.

**Team:** Vinh — workflow, integration and watch. Minh — source verification, AI and analytics. Deem — screens, interaction and presentation.

**QR:** Add the actual deployed URL only after testing it on another phone.

## Answers to likely questions

| Question | Answer to give |
|---|---|
| Isn't first-fill monitoring already available? | Yes. Surescripts and other workflows address abandonment. We are testing a specific reason-to-reviewed-task-to-follow-up experience, not claiming to invent detection. Sponsor feedback must establish what is new relative to their product. |
| Why involve the doctor instead of only the coordinator? | The intended doctor interaction is a brief, useful escalation and handoff. The coordinator owns the access work. A pilot should test when doctor interruption is justified. |
| Why a watch? | It makes an actionable alert noticeable and keeps the handoff short. The workflow also works by button; custom watch software is optional. |
| Is this integrated with Impiricus or a pharmacy? | Those connections are stand-ins in this prototype. Distinguish any independently verified live providers from those simulated partner services. |
| What does the AI do? | If implemented: classify a supplied note into a bounded reason, with uncertainty handling. Rules choose allowed administrative actions. Otherwise: the current prototype uses supplied reasons; model integration is pending. |
| Does the patient button mean medication was taken? | No. In the target contract it records acknowledgment. A separate pharmacy signal records dispensing, which still does not prove ingestion. The current mock auto-advances those steps and needs correction. |
| Does commercial insurance guarantee a $0 card? | No. Eligibility needs review against the applicable program. Government coverage must not route to a manufacturer copay card. Any demo price is fictional. |
| Who gets patient information? | The intended boundary is practice case details, case-scoped patient access and allowlisted partner aggregates. Show enforcement only if verified; the mock is not proof of security controls. |
| Who pays? | A practice or partner-sponsored workflow is a hypothesis to validate. We have no established contract, willingness-to-pay study or fee-per-fill model. |
| How do you prove improvement? | This demo proves workflow behavior when verified. A pilot would measure staff effort and subsequent fill signals with a defined comparison; it does not prove causal clinical improvement. |
| What if an API or Wi-Fi fails? | Keep the tap path independent of optional voice/classification. Show errors honestly, preserve unknown states and retries, and announce any switch to a recording or mock replay. |
| What did your team actually implement? | Answer from the reviewed SHA and evidence register, distinguishing frontend, backend, providers and fixtures. Credit frameworks and AI coding tools actually used. |

## Sponsor-specific opening, only when qualified

**Impiricus:** "We propose an HCP engagement that ends in an accountable access task. Let us show the handoff and the later status, then compare it with what already exists in your workflow."

**Gemini:** "We use Gemini for a narrow task: classify the supplied barrier note into a validated reason, including an unknown path. Deterministic rules control the action."

**Tiger:** "The event history supports subsequent-fill and elapsed-time queries. Here is the stored run and the query behind this display, including its freshness."

**SpaceXAI, only after verification:** "Grok transcribes a real handoff that the user confirms before execution." The saved challenge announcement calls for Cursor and Grok; explain actual Cursor development work as well. Neither voice integration nor Cursor-use evidence is currently verified. Skip this entry if its requirements are unmet; the ntfy/Garmin path alone does not qualify.
