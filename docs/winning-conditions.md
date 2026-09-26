> **Superseded 2026-09-26 09:40 for scope and story:** v2 is coordinator-first (`docs/spec-v2-coordinator.md`); PLAN.md Phase 6 holds the current cut order. The evidence and quality bars below still apply.

# FirstDose: conditions for a competitive demo

Updated September 26, 2026. These are our execution targets, not an official judging rubric or a prediction of an award. Read alongside the [winner evidence](research/winner-lessons.md) and [entry requirements](research/tracks-and-requirements.md).

## The position we want judges to remember

**One missed fill. One accountable next step.**

FirstDose turns a stuck first fill into a reviewed access task, then checks for a later pharmacy fill signal. Our proposed Impiricus value is a useful HCP engagement that leads to accountable follow-up. The watch makes the alert memorable; the coordinator workflow makes it useful; the event history makes the result inspectable.

Aim first for a compelling **Impiricus** entry and **A Marina's Mission** story, with overall quality as the ambition. Add sponsor entries only when their implementation strengthens that same demonstration. A wide prize list is not the product objective.

## Seven conditions, in priority order

| Condition | Observable acceptance test | Owner | Current gap |
|---|---|---|---|
| 1. The problem is understood immediately | After the first 20 seconds, two unfamiliar listeners can explain who is stuck and what action the office needs | Deem pitch, Vinh delivery | Script prepared; listener test pending |
| 2. One complete loop actually works | Two consecutive reset-to-fill runs on independent devices; patient acknowledgment cannot create a fill; separate simulator confirmation does | Vinh backend, Deem wiring | Mock logic exists; live backend and corrected contract pending |
| 3. Sponsor value is specific | Show the reason evidence, reviewed coordinator task, and later status; ask sponsor staff what is already shipped and record their answer | Vinh + Deem | Proposed fit; no sponsor validation claimed |
| 4. The result is credible | Source-backed label; unknown reason stays unknown; government/ineligible case never gets a manufacturer card; simulated fill is visibly labeled | Minh labels/classifier, Vinh router | Labels are placeholders; contract corrections pending |
| 5. Technical depth is visible | Show one real cross-device event, one real validated model response, and one blocked invalid action or deduplicated retry | Vinh + Minh | Planned; CI alone does not prove these |
| 6. The demo has one memorable moment | Physical wrist buzz leads to a handoff, then the board changes only after pharmacy confirmation; readable without narration | Vinh watch, Deem screens | Physical delivery and device rehearsal pending |
| 7. The package survives judging | Under two minutes with time to spare; working fallback; accurate credits; both required submissions reload successfully | Deem leads, all verify | Scripts prepared; footage and submission pending |

These gates are deliberately measurable. Do not mark them passed because a slide describes the intended behavior. Record build SHA, mode, device, input and outcome in the [claims register](presentation/claims-and-evidence.md).

## What to change in the original strategy

- Lead with the access task and person affected, then show the technology. Do not open with an API list or a long market-size explanation.
- Make Maria the entire short demo. James earns a short extended-demo beat only when he demonstrates that the system can leave a case unresolved responsibly.
- Keep one strong visual sequence: barrier -> wrist -> coordinator -> patient -> independent pharmacy signal -> board. Avoid touring all six screens.
- Replace "proves recovery" with "records a subsequent fill signal." Replace an automatic "$0" success with an explicitly simulated case-specific result, or omit the price.
- Make Gemini's constrained reasoning inspectable, while deterministic rules control actions. The model does not select treatment or grant eligibility.
- Show the proposed practice/partner data boundary once. It answers a practical question and demonstrates implementation judgment.
- If sponsor staff identify feature overlap, refine the exact workflow contribution. Do not assert competitors lack capabilities we have not verified.

## How to allocate the remaining effort

The critical path is Vinh's authoritative workflow and Realtime seam, Deem's integration, and Minh's verified label. Preserve this convergence before adding APIs. Minh can prepare classifier tests independently once labels are complete. Tiger follows stable event semantics. Grok follows the reliable tap path. ElevenLabs and a custom watch widget are optional polish.

At each gate ask: **Does this task increase the chance that a judge sees a useful, working, credible result?** If its only benefit is another logo, defer it.

If the core loop misses its target, immediately stop optional integrations. Preserve doctor alert, reviewed handoff, separate pharmacy confirmation, sourced label and data boundaries. The existing cut order remains label diffs, custom watch widget, voice, then the access screen. Do not hide a failed watch test or backend outage; switch to a clearly identified fallback.

## Rehearsal scorecard

Ask two people who did not build the project to watch without coaching. Record their answers to: Who is this for? What changed? Which part was simulated? Why would an office use it? What did this team build? A confused answer identifies a presentation defect, even when the code works.

Run once normally, once after reset on the second phone, and once with an optional provider unavailable. Time the complete narration including device switching. Keep 5-10 seconds of buffer. The exact event cap and judging weights still need organizer confirmation.

Historical winners support studying observable workflows and usable artifacts, not promises that hardware, extra SDKs, sponsor-name counts or more prize entries cause wins. We can control execution and clarity; we cannot guarantee judge preference.
