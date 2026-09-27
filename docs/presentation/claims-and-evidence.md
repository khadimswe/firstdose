# Presentation claims and evidence

Updated Sat Sep 26, 2026, 13:05 (Deem). This register governs factual wording in the slides, poster, video, README and Devpost. If a claim isn't here with evidence, it doesn't go on a slide. Each new verification records the commit, mode, date and result.

## What's built and verified (main `4c80650`)

| Claim | Evidence | Allowed wording |
|---|---|---|
| All PRs through #15 are merged; CI is green | GitHub checks on every PR; locally 339 tests, lint, and mock + live builds pass (Deem, 13:00) | "All the code is on main and the checks pass" |
| The v2 screens exist | Coordinator Queue and Prescribers, the DocUpdate-style phone view, board, access, sim, `/demo`, `/qr`. Checked in Chrome at 1440 and 390×844 in mock mode; production serves them at firstdose.vercel.app (mock) | "Built and running" |
| The live workflow works end to end in browsers | #15 (Vinh): the full v2 flow across three independent browser sessions against hosted Supabase; 14 PostgreSQL checks | "Works live across browsers". **Not yet**: "on two physical devices"; the deployed live run is still open |
| The patient's tap is acknowledgment only | #9 and #15 tests; the board and access count only the separate pharmacy confirmation | "The tap isn't a fill; the pharmacy confirms the fill" |
| Otezla's label is verbatim DailyMed | #15: the full saved narratives, RxCUI 1492746, and the build verifies the saved XML, RxNorm and artifact | "Verbatim from DailyMed, verified" for **Otezla only**. Humira still shows the placeholder |
| No mock or demo wording on product screens | `tests/no-fake-labels.test.ts`; a browser text scan of 13 product routes (Sat 13:45) | "Synthetic data, real public reference data" |
| Watch alerts | #15: the reason alert and the pharmacy-fill alert were accepted once, and the user confirmed both on iPhone and Garmin | "Buzzes the doctor's wrist" (Garmin). The Apple Watch path is C8, still to check |
| Prescriber approval | Mock: approving on the phone flips the desktop to Linked across tabs (Chrome). Live: the approval travels with the first handoff | "The doctor approves the coordinator in one tap." Don't show a Profile-only approval reaching the desktop in live mode until C7 |
| Gemini, Tiger, ElevenLabs, Grok | Not merged (Grok is draft #16) | Don't name them as working until 5.1 finds them called in code |
| A seeded week in the queue | Draft #17 | Until it merges, the queue opens with only Maria and James |

## Pitch facts and their sources

| Fact (as it may appear) | Source | Notes |
|---|---|---|
| DocUpdate's article "Prescription Abandonment: The Prescription Was Sent. The Patient Still Never Started It." (Jul 9, 2026) | [the article](https://www.docupdate.io/articles/prescription-abandonment-the-prescription-was-sent-the-patient-still-never-started-it/) (Sana Khateeb, PharmD; the date is from docupdate.io's article list) | Headline, byline and date checked on the live pages, Sep 26. The demo video shows a credited screenshot with the headline unaltered |
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
- [x] **Demo video v1** (`video/demo`, Sep 26):
  - **Source and length:** built from the offline build on synthetic data, 2:43.
  - **Numbers and title on screen:** the article title and date, 27% (Surescripts) and about 467,000 (BLS).
  - **Watch:** shown as a generic wrist alert via ntfy, because the Apple Watch check (C8) is still open.
  - **Label text:** shown only as the app renders it from DailyMed.
  - **Sign-off:** Deem reviewed every beat against this register.
