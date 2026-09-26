# Presentation claims and evidence

Updated September 26, 2026 after the hosted audit and frontend repair publication. This register governs factual wording in the slides, poster, video, README and Devpost. If a claim isn't here with evidence, it doesn't go on a slide. Each new verification records the commit, mode, date and result.

## Current verified engineering state - September 26

Hosted audit baseline: main `2ebc3ed` after #39. Current main `ba3c439` adds status docs. [Acceptance record](../handoffs/deployed-acceptance.md) separates browser proof, device proof and the pending frontend PR.

| Claim | Evidence | Allowed wording |
|---|---|---|
| Production uses a shared live backend | Actual authenticated Maria/James browser workflows, coordinator approvals, messages, seed and reset passed | "Live shared demo with fictional patients and simulated pharmacy/hub events" |
| Acknowledgment is separate from fill | Patient message/card actions remain pending until the independent pharmacy event | "The pharmacy confirms the fill; a tap does not" |
| Otezla's displayed text is source-verified | Build verifier and exact rendered artifact comparison passed | "Verified DailyMed label for Otezla"; Humira remains a placeholder |
| Coordinator approval persists before prescribing | Profile approval reached the independent coordinator session; reload/reset passed | "Shared run-scoped approval and assignment"; not real role-separated accounts or NPI verification |
| Seeded opening | Hosted queue 3 needing a fix / 2 waiting / 8 confirmed; separate background prescriber | Use these actual counts, not the old proposed 11 fills |
| Gemini reason classification | #23/#39 merged; provider smoke and hosted workflows recorded in the Phase 2/acceptance handoffs | "Gemini maps a source note to an allowlisted reason or null; rules pick the fix" |
| Tiger fill metrics | Hosted summary 8 fills / median 60 seconds / reasons 2,2,2; reset zero/null/empty | "Tiger provides run-scoped confirmed-fill metrics"; coordinator rollup 6.7 is cut |
| ElevenLabs patient audio | Approved English/Spanish Otezla message audio decoded and played in deployed browsers | "Templated patient message audio plays in the app"; native Spanish and physical-phone listening remain |
| Notification receipt | Historical iPhone/Garmin evidence exists; latest user confirms a direct test on both devices without naming the watch model | Do not claim the complete latest workflow or Apple Watch C8 was physically verified |
| Grok voice | Backend and UI merged; synthetic-provider and permission-denial checks exist | Human microphone/confirmation demonstration and Cursor evidence remain separate |
| Frontend repairs | Draft #40 application `c1fd445`: 724 tests, both builds, lint, three-engine checks, 57 axe scans and CI/preview pass | "Implemented and verified on the branch"; not yet merged/live, not complete accessibility conformance |
| TestFlight | #30 source merged; six Swift navigation-policy tests pass | "Wrapper prepared"; no signed/installed iOS build claimed |

Physical two-device/watch, native language/audio, owner claim sign-off and release approval remain. NPPES lookup 6.6 and coordinator analytics 6.7 are cut. The older engineering readiness table is superseded; external research facts below retain their original sources and dates.

## Pitch facts and their sources

| Fact (as it may appear) | Source | Notes |
|---|---|---|
| DocUpdate's article "Prescription Abandonment: The Prescription Was Sent. The Patient Still Never Started It." (Jul 9, 2026) | [docupdate.io](https://www.docupdate.io/) (article list; Sana Khateeb, PharmD) | Title and teaser only; full text not retrieved |
| DocUpdate doesn't currently receive fill confirmation | [DocUpdate FAQ](https://www.docupdate.io/faq/) | Paraphrase it: the quote's context is cancellation requests |
| "Staff accounts and practice-level profiles aren't live yet, but they're on our roadmap." | [DocUpdate FAQ](https://www.docupdate.io/faq/) | Quote exactly |
| "27% of new prescriptions are never dispensed" | [Surescripts First-Fill Abandonment](https://surescripts.com/what-we-do/first-fill-abandonment) (page updated Sep 14, 2026; Jan 2026 analysis of fill-reporting pharmacies) | Say "Surescripts" on the slide |
| First-Fill Abandonment launched Oct 15, 2025, for health systems, EHR and analytics vendors | [Surescripts press release](https://surescripts.com/press-releases/new-surescripts-first-fill-abandonment-solution-empowers-providers-insights-help-improve-patient-care-increase-medication-adherence-and-advance-value-based-care-performance) | |
| Oracle Health will "explore" First-Fill Abandonment; GA planned 2027 | [BusinessWire via FinancialContent, Sep 24, 2026](https://www.financialcontent.com/article/bizwire-2026-9-24-surescripts-oracle-health-partner-to-help-clear-prescription-barriers-for-patients-nationwide) | |
| RxFill has had "no material adoption in ambulatory settings" | [NIST/NCPDP analysis, 2011](https://www.nist.gov/system/files/nist_ncpdp_fill_status_and_medication_compliance.pdf) | Dated; say "historically" |
| DocUpdate v6.3.0: "include savings card details with eligible prescriptions" (Jul 6, 2026) | [App Store](https://apps.apple.com/us/app/docupdate/id6478404244) | The mechanism isn't public (W5) |
| QPharma (Aug 25, 2026) and Medvantx (Sep 8, 2026) integrated into Ascend | [QPharma release](https://www.globenewswire.com/news-release/2026/08/25/3350955/0/en/impiricus-launches-qpharma-integration-to-power-real-time-compliant-hcp-sampling.html) · [Medvantx release](https://www.globenewswire.com/news-release/2026/09/08/3357938/0/en/impiricus-integrates-medvantx-to-expand-real-time-patient-access-and-therapy-support.html) | |
| Spark triggers on "First-Time Prescriptions" | [Impiricus products](https://www.impiricus.com/our-products/) | |
| Wallet cards are "easy for HCPs to forward to their full care team" | [Impiricus solutions](https://www.impiricus.com/our-solutions/) | Supports "staff operate" |
| Abandonment is under 5% at $0 and 60% over $500 | IQVIA Institute, "Medicine Spending and Affordability in the U.S.", Aug 4, 2020 | Aggregate; never apply it to Maria |
| 866,460 doctors in direct patient care | [AAMC 2025 Key Findings](https://www.aamc.org/data-reports/data/2025-key-findings) (2024 data) | |
| 13 hours a week of prior-auth work per doctor; 39 PAs; 40% have dedicated staff | [AMA prior-auth survey](https://www.ama-assn.org/practice-management/prior-authorization/fixing-prior-auth-nearly-40-prior-authorizations-week-way) (Dec 2024) | "Physicians and their staff" |
| About 467,000 medical assistants in doctors' offices | [BLS OOH: Medical Assistants](https://www.bls.gov/ooh/healthcare/medical-assistants.htm) (833,900 jobs in 2025 × about 56% in physician offices) | The briefing cites about 57% for the 2024 edition; say "about" |
| Roughly 280,000 full-time jobs' worth of access work weekly | Our calculation: 866,460 × 13 h ÷ 40 h | Hours, not people |
| 70,000–115,000 dedicated access staff | Our estimate (40% of doctors, one person per 3–5 doctors) | Always say "our estimate" |
| CoverMyMeds verifies staff to prescribers by NPI and a faxed code | [CoverMyMeds](https://www.covermymeds.com/main/insights/articles/steps-to-npi-verification-with-covermymeds/) | |

**On screen since Sat 13:50** (`data/reference/public-data.json`; queries in `docs/research/public-data-sources.md`):

| Fact (as it appears) | Source | Notes |
|---|---|---|
| Otezla in Georgia: 614 prescribers, 6,661 claims | CMS Medicare Part D Prescribers by Geography and Drug, 2024 | Medicare Part D only; aggregate |
| Humira(CF) Pen in Georgia: 717 prescribers, 15,295 claims | Same, 2024 | Humira(CF) Pen row only |
| 90% of the Georgia Part D plans that cover Otezla require prior auth (100% for Humira(CF) Pen) | CMS Part D formulary files, Sep 2026 | Otezla is covered by 53.9% of Georgia plans, Humira(CF) Pen by 33.6% |
| Otezla 30 mg costs pharmacies $90.57 a tablet; a Humira(CF) Pen $3,367.41 | NADAC, effective Sep 23, 2026 | Reference only, not yet on screen |

**Disclosure (PLAN D3, revised):**
- Product screens carry one footer line: "Synthetic patients and pharmacy activity · Impiricus, Wallet and partner names shown as a concept."
- DocUpdate-style screens keep "Concept: FirstDose inside DocUpdate · Not affiliated".
- Real data shows its source and year.
- Patients, prescribers (Dr. Nadia Okafor, Dr. Colin Mercer) and pharmacy activity are synthetic.

Internal context only, never on a slide: the DocUpdate job post ("not building healthcare software for administrators"), app-review quotes, and Impiricus's "3x Higher NRx Lift" (their claim about their product, not ours).

## Numbers and language policy

- Screens, README and video say "first fill pending", "Fill confirmed" and "confirmed first fills". Never "started" or "recovered" (D8). Spoken, "the NRx you already sell on" is fine.
- `$410 → $0` is a labelled demo quote, never measured savings or a program guarantee.
- Mock times (0:20, 0:55) are a demo clock, not product latency.
- A later fill doesn't prove the fix caused it, or any clinical benefit.
- Don't claim Impiricus integration, sponsor approval, HIPAA compliance or production readiness.
- DocUpdate screens are "Concept: FirstDose inside DocUpdate · Not affiliated"; their real screenshot appears only on slide 3, credited.

## Recording approval record

Status: **not recorded yet**.

- [ ] Vinh records the build SHA, deployed origin, mode and the physical two-device result (Phase 1 gate 4).
- [ ] The Apple Watch receives both alerts with the iPhone locked (C8).
- [ ] Minh signs off on the label provenance and any Gemini or Tiger claims.
- [ ] Deem checks every visible screen and disclosure at phone and desktop size.
- [ ] Full run twice after reset, plus once with an optional provider unavailable.
- [ ] Claims frozen at 9 PM. After a material code change, rerun the affected check.
