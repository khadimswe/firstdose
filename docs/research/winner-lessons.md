# What past winners can teach FirstDose

Research synthesis, 25 September 2026. The most useful pattern is a concrete user task with an observable result. This is our interpretation of publicly recognized projects, not a measured formula for winning.

## Evidence and its limits

The existing six-event audit covers 287 event-scoped prize-recognized project entries and 330 public award assignments across HackMIT 2026, TreeHacks 2026, Cal Hacks 12.0, HackGT 12, VTHacks 14 and HackHarvard 2025. Counts include publicly labeled honorable mentions. Projects are deduplicated within each event; these are not 287 necessarily independent teams or codebases. Some advertised categories have no observed public award label, and two TreeHacks project slots were not retrieved.

The [HackGT 12 gallery](https://hackgt-12.devpost.com/project-gallery) audit reconciled 27 recognized projects with all 28 published prize slots. The [VTHacks 14 gallery](https://vthacks-14.devpost.com/project-gallery) audit reconciled all 30 published slots. Award status comes from event-scoped Devpost labels or organizer-hosted Plume badges. Product functions below are team-reported; the audit did not execute every project or validate clinical claims.

Winner-only evidence cannot establish win rates, the causal effect of hardware or API use, or which feature convinced a judge. It also cannot validate demand, willingness to pay or a manufacturer's proposed fee model. These findings summarize the existing audit rather than a new scrape of every event.

## Relevant examples

| Project | Public award evidence | Transferable observation |
| --- | --- | --- |
| [Dose](https://devpost.com/software/dose-ebmo9z) | HackGT 12, **Best Overall — 1st Place** | A pill-bottle sensor connects a physical event to a visible dashboard. Weight change does not establish that medication was swallowed. |
| [RefNet](https://devpost.com/software/refnet-c04g9n) | HackGT 12, **Best Overall — 2nd Place** | The assistant works on a citation graph and exports a useful artifact. A software-only project can earn a high overall placement. |
| [FalsePay](https://devpost.com/software/falsepay) | VTHacks 14, **Impiricus: Build the Next HCP Engagement Tool — 1st Place** | Public payment data becomes a physician review queue and dispute draft. The write-up does not establish an Impiricus integration or explicit payer. |
| [CuraVox](https://devpost.com/software/curavox) | VTHacks 14, **Impiricus: Build the Next HCP Engagement Tool — 2nd Place** | Clinician-linked medication assistance gives patients a next step and routes uncertain questions back to the clinician. |
| [Persist Health](https://devpost.com/software/pied-piper-test) | VTHacks 14, **Impiricus: Build the Next HCP Engagement Tool — 3rd Place** | Patient observations connect to clinician review. The team explicitly proposes pharma funding but supplies no validated fee formula. |
| [Vital](https://devpost.com/software/vital-1qsh6u) | HackGT 12, **Impiricus**, rank undisclosed | Drug-policy updates connect to a clinician's patient panel. Its claimed Impiricus feed is not independently verified by the public page. |

The other two public HackGT 12 Impiricus winners are [Medicus](https://devpost.com/software/medicous) and [Doc McQuery](https://devpost.com/software/dr-mcquery). Their labels also omit rank. These six winners across two events do not establish that only six Impiricus winners exist. Three public write-ups name no explicit payer; there is no common demonstrated payment mechanism.

## Five choices for the FirstDose demo

1. **Make one Maria case work from beginning to end.** A simulated cost-barrier event turns the board red; the wrist buzzes; the doctor assigns a task; the coordinator reviews eligibility; the patient opens a resource; a separate simulated dispensing confirmation clears the alert. Vinh owns the workflow and notification reliability; Deem makes the transitions visible. Build this before a second case or extra screens.
2. **Connect the watch to an action.** Show alert → reviewed handoff → changed case status. Keep the button path reliable before adding Grok voice or a custom watch widget. Vinh owns watch/backend/Grok; Deem owns microphone UI and demo delivery. Run voice comparisons honestly and report their actual outcomes.
3. **Expose the evidence and its boundaries.** Distinguish a recorded barrier from an inferred reason; retain unknown/needs-review. Minh owns the sourced label, Gemini classification and Tiger metric. Show the original note, source/version and deterministic route. Use “First fill observed — simulated”; acknowledgment, dispensing, ingestion and clinical recovery are different events.
4. **Make the proposed contribution easy to test.** Demonstrate reason evidence → assigned access task → eligibility review → later status. Ask sponsor staff which parts already exist in their product. Describe the Impiricus relationship as proposed unless connected, and visibly label simulated pharmacy/manufacturer steps. The award record does not support claiming that competitors cannot capture reasons or route follow-up.
5. **Give each integration a visible job.** Gemini classifies a supplied note; Grok transcribes a real handoff; Tiger displays an event-derived metric with honest freshness; the label card preserves sourced wording. Explain the proposed buyer and who can see each result. Do not describe a simulated first fill as proven intervention effectiveness or validated commercial value.

## Heuristics to reject

**Repeating a sponsor name three times and placing SDK calls in multiple files are not established official judging rules.** The earlier claimed correlations were not reproduced in the audit; even reproduced correlations would not establish causality. Explain actual sponsor use clearly and keep code cohesive. Do not split files or pad the write-up to satisfy those counts.

Likewise, this evidence does not establish that hardware increases winning odds, entering more categories cannot hurt, splitting into more teams yields more prizes, or every Impiricus winner needs a manufacturer payer. Current event and sponsor eligibility requirements must be verified separately; historical awards do not create current permissions.
