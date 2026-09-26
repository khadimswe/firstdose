# FirstDose Briefing: What Public Sources Say About DocUpdate, Impiricus Ascend, Fill Status and Market Access KPIs (as of Sept 26, 2026)

Public sources support FirstDose's problem framing, but they don't support its core technical premise. DocUpdate says publicly that it does not get fill confirmation. Every Impiricus integration relevant to FirstDose (QPharma, Medvantx) is announced as part of Impiricus Ascend, not DocUpdate. And nothing public says staff accounts exist yet or when they will ship. The strongest pitch is: "We are the missing fill signal plus the one-tap fix, built on rails Impiricus already announced."

## TL;DR
- **The gap is real, and Impiricus admits it in its own FAQ.** The DocUpdate FAQ says "we currently don't receive confirmation on whether it's been filled or successfully canceled." Surescripts says "27% of new prescriptions are never dispensed." Staff accounts are only "on our roadmap," with no public timeline.
- **Product home: the fix rails live in Ascend. The HCP front door is DocUpdate.** QPharma (Aug 25, 2026) and Medvantx (Sept 8, 2026) were both "integrated into Impiricus Ascend." Spark already lists "First-Time Prescriptions" as a trigger. Pitch FirstDose as an Ascend/Spark skill that shows up in DocUpdate, not as a stand-alone DocUpdate feature.
- **Metric: lead with patients recovered, i.e., incremental first fills (NRx), and back it with time to first fill.** Impiricus sells to pharma on NRx lift ("3x Higher NRx Lift," "$33 million in incremental revenue"). Abandonment rate and speed to therapy are the standard patient-services diagnostics (IQVIA, CoverMyMeds, Surescripts).

## Key Findings by Question

### 1. Staff accounts and practice-level features

**(a) Demo-table answer:** "DocUpdate says staff and practice profiles are on the roadmap but not live. It's prescriber-only today. We found no public timeline, release note or job post that describes them. Comparable apps start with a staff role that can prepare prescriptions and handle paperwork, while only the prescriber signs. That's the model we mirror: the coordinator works the queue, the doctor approves."

**(b) Evidence:**
- **DocUpdate FAQ** (https://www.docupdate.io/faq/, fetched Sept 2026, © 2026):
  - "Can my practice or staff sign up? Staff accounts and practice-level profiles aren't live yet, but they're on our roadmap."
  - "Enterprise plans are in development. Right now, DocUpdate is available for individual providers and can be shared through an organization."
  - Sign-up is limited to prescribers: "physicians (MD, DO), dentists (DDS, DMD), podiatrists (DPM), nurse practitioners (NP, APRN), physician assistants (PA), and optometrists (OD)."
- **App Store version history** (https://apps.apple.com/us/app/docupdate/id6478404244), v3.3.0 (09/11/2025) through v6.8.0 (Sept 2026). No release mentions staff, delegate or practice accounts. Related items that do appear:
  - v6.6.0 (Aug 31): "Refer a colleague and earn $25 when they join."
  - v6.2.0 (May 22): "Survey invitations."
  - v6.0.0 (Apr 16): "Added in-app messaging for quicker, more reliable communication with Concierge."
- **Leadership stance, possibly a counter-signal.** The Impiricus job post for VP of Marketing (DocUpdate) (https://job-boards.greenhouse.io/impiricus/jobs/5207613008) says: "Founded by dermatologist Dr. Osama Hashmi, DocUpdate is physician-led, clinician-first… We are not building healthcare software for administrators." It frames the goal as making DocUpdate "the most trusted and recognizable physician network in the country."
- **User evidence that delegation happens anyway.** An NP's App Store review (05/23/2025): "not only am I calling in my prescriptions, but also the doctors prescriptions."
- **Comparable models:**
  - *iPrescribe (DrFirst)* (https://help.drfirst.com/hc/en-us/articles/15467282516243-Providers-invited-to-group-practice) has three staff roles: "Non-clinical – Add, search, view, and modify patients… Clinical – … Create pending prescriptions for prescribers. Provider Agent – … send non-controlled substances prescriptions on behalf of the prescriber."
  - iPrescribe pricing (https://help.drfirst.com/hc/en-us/articles/44273393594131): "iPrescribe charges per provider. Staff users are free."
  - iPrescribe limits (https://help.drfirst.com/hc/en-us/articles/45152313234835-Manage-Provider-Agents): "If you reside in the state of NY or GA, you cannot add a provider agent."
  - *CoverMyMeds* (https://www.covermymeds.health/articles/provider-insights/quick-guide-to-covermymeds-prior-authorization-requests): staff verify the office's prescribers by NPI and fax code. After that, "pharmacy-initiated prior auth requests will automatically appear in your dashboard." An Indian Health Service training deck describes setting up an account "as a 'prescriber delegate.'"
  - *Photon Health* (https://photonhealth.com/faq) takes a different approach. It "handles fulfillment exceptions, and reroutes automatically, without clinical staff involvement." In other words, it removes staff work rather than creating a staff seat.
  - *Doximity:* I did not verify its staff/delegate model from a primary source in this research.

**(c) Confidence and unknowns:** High confidence that staff accounts are not live. There is no public evidence on what staff accounts will do first, when they'll ship, or whether Hashmi has spoken about access coordinators; I found no interviews, webinars or job posts on this. The "not building software for administrators" line is marketing copy, but it suggests leadership will want the prescriber kept in the loop.

### 2. DocUpdate's July 2026 access articles

**(a) Demo-table answer:** "In July, DocUpdate published a cluster of patient-access articles: abandonment, prior auth and copay cards. The copay-card piece names DocUpdate Concierge as the tool to 'send copay cards and patient resources.' None of the articles announces fill tracking. FirstDose is the product version of what they're already writing about."

**(b) Evidence:**
- **The July 9, 2026 cluster** (per the DocUpdate homepage, https://www.docupdate.io/):
  - "Prescription Abandonment: The Prescription Was Sent. The Patient Still Never Started It." by Sana Khateeb, PharmD. Teaser: "The prescription was sent. The treatment plan was made. But the therapy never actually started. That gap has a name: prescription abandonment."
  - "Prior Authorization Delays: How Clinicians Can Reduce Avoidable Denials" by Lauren Maeder, MSOT, OTR/L. Teaser: "The useful question is what can be done before the first denial."
  - "Copay Cards vs Patient Assistance Programs" by Nicholas Leazer, PharmD.
- **Copay-card article, full text** (https://www.docupdate.io/articles/copay-cards-vs-patient-assistance-programs-helping-patients-afford-prescribed-medications/):
  - "'Your copay is $684.' That is often the moment a treatment plan turns into a financial decision. The patient may not call the office… They may simply walk away."
  - "For many patients, it is the difference between starting therapy and quietly abandoning a prescription."
  - "Copay cards are most often designed for patients with commercial insurance and generally cannot be used by patients enrolled in federal healthcare programs such as Medicare, Medicaid, or TRICARE."
  - "Clinicians may need to complete a prescriber section or provide clinical documentation. This is where pharmacist and clinic staff support becomes essential."
  - "Through DocUpdate Concierge, clinicians can request support such as copay card information and patient education resources without turning the visit into a benefits investigation."
  - "…tools like DocUpdate Concierge to send copay cards and patient resources, patients are more likely to understand their options and start the medications prescribed for them. Because the goal is not simply to prescribe the right medication — the goal is to help the patient actually get it."
- **Product plans:** None of the articles states a plan for fill tracking. The only named product tie-in is Concierge, for copay cards, patient resources and samples.

**(c) Confidence and unknowns:** High confidence for the copay-card article. For the abandonment and prior-auth articles I could confirm only the title, author, date and teaser; I could not retrieve their full text. Read both articles on-site before the demo so you can check for any product mentions.

### 3. Product home: DocUpdate vs. Ascend

**(a) Demo-table answer:** "Impiricus puts new fulfillment and access capabilities in Ascend, its pharma-facing agentic platform. The QPharma and Medvantx integrations were announced 'into Impiricus Ascend.' DocUpdate is the free app HCPs actually use: prescriber, translator and Concierge. So FirstDose is an Ascend skill. The alert and the one-tap fix show up for the practice inside DocUpdate/Concierge. Spark already triggers on first-time prescriptions."

**(b) Evidence:**
- **The platform as Impiricus describes it** (https://www.impiricus.com/our-products/):
  - "ION continuously analyzes physician engagement… to determine the next best action."
  - Pulse: "AI-powered delivery of timely, personalized resources… through the largest network of SMS opted-in HCPs."
  - Ascend: "Always-on Field Force Multiplier connecting underserved HCPs to reps and resources in real-time… 3x Higher NRx Lift… Accelerate patient access with always-on, real-time pathways to therapy support."
  - Spark: "Trigger personalized HCP engagement journeys based on physician signals and real-world events." Its listed triggers include "First-Time Prescriptions," "Competitive Prescriptions," "Lab Orders and Results," "New Diagnosis Codes."
- **Ascend launch** (PR Newswire, Nov 13, 2025, https://www.prnewswire.com/news-releases/impiricus-launches-ascend-an-ai-platform-to-ethically-connect-physicians-and-pharma-302613771.html): "This allows physicians to connect with a representative in real-time and access pharma resources such as samples, treatment information, order assistance, dosing calculators, and patient resources. Top pharmaceutical companies are using Ascend to amplify their field forces."
- **QPharma** (GlobeNewswire, Aug 25, 2026, https://www.globenewswire.com/news-release/2026/08/25/3350955/0/en/impiricus-launches-qpharma-integration-to-power-real-time-compliant-hcp-sampling.html): "QPharma's Titanium platform and PDMA-compliant sampling infrastructure are now integrated into Impiricus Ascend… eligible healthcare professionals (HCPs) can request samples… directly within active conversations in SMS, chatbots, intelligent media…"
- **Medvantx** (GlobeNewswire, Sept 8, 2026, https://www.globenewswire.com/news-release/2026/09/08/3357938/0/en/impiricus-integrates-medvantx-to-expand-real-time-patient-access-and-therapy-support.html):
  - "Medvantx's sample management and patient support capabilities are now integrated directly into Impiricus Ascend… accelerate therapy initiation for patients."
  - Medvantx administers "patient assistance, bridge/quick start, cash-pay, sample distribution…"
  - Hashmi: "This partnership with Medvantx extends our ability to transform physician engagement into immediate action directly within the clinical workflow."
- **Wallet** (PR Newswire, July 25, 2023, https://www.prnewswire.com/news-releases/impiricus-wallet-launches-to-innovate-hcp-and-patient-support-beyond-the-script-301884457.html): "HCPs easily pull up the resource and a patient can scan the QR code… This innovative approach to resource utilization can be used with co-pay, hub services, patient resources, financial support, or clinical trial enrollment." It also advertises "Tracking usage at the NPI level: unique QR code usage."
- **Concierge inside DocUpdate** (https://www.docupdate.io/): "Direct access to reps, samples and patient support."
- **The team's own public repo** (https://github.com/khadimswe/firstdose) already describes FirstDose as "A skill for Impiricus Ascend." That conflicts with the "inside DocUpdate" framing in the brief, so settle on one story.

**(c) Confidence and unknowns:** High confidence that fulfillment integrations sit in Ascend. Medium confidence, as inference, that DocUpdate Concierge is the HCP-facing surface for Ascend. The press releases name SMS, chatbots and "intelligent media," not DocUpdate, and I found no public diagram connecting DocUpdate to Ascend. I found no public statement about where HCP-side workflow tools "live."

### 4. RxFill / fill status and Surescripts First-Fill Abandonment

**(a) Demo-table answer:** "DocUpdate says publicly it gets no fill confirmation, and nothing public says it supports RxFill. RxFill is voluntary and historically almost unused in ambulatory care. Surescripts' First-Fill Abandonment fills that gap, but it's sold to health systems, EHR vendors and analytics vendors, with Arcadia as a partner and Oracle Health only 'exploring' it, planned for 2027. That's exactly why a signal plus a fix layer matters."

**(b) Evidence:**
- **DocUpdate FAQ** (https://www.docupdate.io/faq/):
  - "while the cancellation request is transmitted to the pharmacy, we currently don't receive confirmation on whether it's been filled or successfully canceled."
  - "Every prescription routes through Surescripts."
  - "DocUpdate does not integrate with an EHR."
  - What it does support: "notifications for callbacks, refills, and any related pharmacy administrative questions."
  - Release v4.0.0 (09/29/2025) added Cancel Rx, renewals, change requests and an Alerts Center. RxFill is not mentioned.
- **The standard** (ONC ISA, https://isp.healthit.gov/allows-a-pharmacy-notify-a-prescriber-prescription-fill-status): RxFill reports "the FillStatus (dispensed, partially dispensed, not dispensed or returned to stock, transferred to another pharmacy)." It notes "Both the pharmacy and the prescriber must have their systems configured for the transaction." The listing shows SCRIPT 2017071 at adoption level "Rating 2."
- **Adoption** ("NIST NCPDP Analysis – SCRIPT Fill Status Message for Patient Medication Compliance," by Laura Topor and Frank McKinney of 1st American Systems and Services, prepared for NIST and dated August 31, 2011; https://www.nist.gov/system/files/nist_ncpdp_fill_status_and_medication_compliance.pdf):
  - "Use of the NCPDP SCRIPT RXFILL is voluntary for pharmacies and prescribers."
  - "To-date, the RXFILL message has only been implemented in the long-term and post-acute care settings… Fill Status messaging has had no material adoption in ambulatory settings."
- **Surescripts First-Fill Abandonment launch** (Oct 15, 2025, https://surescripts.com/press-releases/new-surescripts-first-fill-abandonment-solution-empowers-providers-insights-help-improve-patient-care-increase-medication-adherence-and-advance-value-based-care-performance):
  - "In addition to offering First-Fill Abandonment to health systems and electronic health records vendors, Surescripts is partnering with Arcadia."
  - Dr. Lynne Nowak: "once they leave the office, we typically do not have the ability to know if the patient has gotten the prescription we've written."
- **Product page** (updated Sept 14, 2026, https://surescripts.com/what-we-do/first-fill-abandonment):
  - Audiences: "EHR vendors / Health systems / Healthcare analytics vendors."
  - How it works: "New prescriptions checked against fills at virtually every U.S. pharmacy," "Direct pharmacy data refreshed every 24 hours."
  - Data provided: "Patient-specific data includes information on the patient, provider, medication, dose, route of administration, date written and days unfilled," plus trends by clinic, prescriber and drug, a "12-month look-back," and "daily or weekly cadence."
  - Headline stats: "27% of new prescriptions are never dispensed" (a "Surescripts analysis of e-prescriptions sent to fill-reporting pharmacies in January 2026") and "14.2% of prescriptions take 7 days or longer to fill."
- **Oracle Health** (Sept 24, 2026, via FinancialContent/BusinessWire, https://www.financialcontent.com/article/bizwire-2026-9-24-surescripts-oracle-health-partner-to-help-clear-prescription-barriers-for-patients-nationwide): "Oracle and Surescripts will also explore incorporating First-Fill Abandonment within Oracle Health workflows… The new capabilities are planned for general availability in 2027." The release cites the AMA prior authorization survey: "95% of physicians said the prior authorization process sometimes delays care, and 79% said it at least sometimes leads to treatment abandonment." It also cites KFF: "1 in 4 people indicated that the cost of medications prevented them from filling a prescription."

**(c) Confidence and unknowns:** High confidence that DocUpdate currently has no fill confirmation. No public evidence shows whether DocUpdate's Surescripts certification includes RxFill/RxFillIndicator, or whether a stand-alone e-prescribing app vendor could license First-Fill Abandonment. The EHR-vendor channel suggests it might (inference). I found no current percentages for RxFill adoption among ambulatory pharmacies or prescribers. The NIST paper is the best available source, and it is dated. First-Fill Abandonment is not a reason code: it reports *that* a prescription went unfilled, not *why*.

### 5. Savings card details in DocUpdate v6.3.0

**(a) Demo-table answer:** "The July 6 release note says providers 'can now include savings card details with eligible prescriptions.' Impiricus hasn't published how it works. It could be structured secondary-coverage BIN/PCN/Group/ID fields or a pharmacy note, and the source could be Wallet or manufacturer programs. We treat it as an open question and design for both."

**(b) Evidence:**
- **App Store v6.3.0** (Jul 6, 2026, https://apps.apple.com/us/app/docupdate/id6478404244): "Providers can now include savings card details with eligible prescriptions."
- **Indirect clues:**
  - v5.3.0 (Mar 17) "Added pharmacy comments validation," so a notes path exists.
  - Wallet is described as delivering "co-pay" resources via QR code (2023 release).
  - The copay-card article says Concierge can "send copay cards."

**(c) Confidence and unknowns:** There is no public evidence on the mechanism (structured NewRx coverage segment vs. free-text note), the card source (Wallet vs. manufacturer programs), or which drugs or programs qualify. Whether the feature pulls from Wallet is inference only. Ask Impiricus engineering directly.

### 6. Who counts as an "HCP"

**(a) Demo-table answer:** "DocUpdate accounts are prescriber-only. But Impiricus explicitly markets Wallet as something HCPs 'forward to their full care team.' The PhRMA Code says its rules should be followed for office staff too. Open Payments reporting covers physicians and five advanced-practice types, not MAs or coordinators. Staff are the operators, and the prescriber stays the accountable HCP."

**(b) Evidence:**
- **Impiricus's network:**
  - "More than one million opted-in HCPs trust Impiricus as a preferred channel" (Impiricus Director of Product Design job post, via freehire.me).
  - The QPharma and Medvantx releases say "more than 1 million opted-in healthcare providers."
  - No public breakdown of that network by role was found.
- **Care-team language from Impiricus:**
  - Solutions page (https://www.impiricus.com/our-solutions/): "Provide full care teams with digital wallet access… Digital wallet cards are easy for HCPs to forward to their full care team."
  - Same page: "Deliver contact cards… directly into the hands of HCP care teams."
  - 2023 Wallet flyer: "Physicians can easily share with NP/PAs and other members of their practice."
  - Hashmi "leads a 2,000-member HCP council that shapes the company's approach to physician enablement and engagement" (Forbes Technology Council profile); an earlier PM360 ELITE 2025 profile put the council at 1,800 physicians.
- **PhRMA Code** (effective Jan 1, 2022), per subagent retrieval of phrma.org PDF, Q24: "Although the Code does not directly apply to persons who are not health care professionals, it would be difficult to separate a company's interactions with any of a physician's employees from those directly with the physician. Therefore, the Code should be followed under these circumstances."
- **AdvaMed's broader definition, for comparison.** It covers anyone who may "purchase, lease, recommend, use, arrange for the purchase or lease of, or prescribe." That is the device code, not PhRMA.
- **Open Payments** (CMS glossary): "Any physician, physician assistant, nurse practitioner, clinical nurse specialist, certified registered nurse anesthetist, or certified nurse-midwife…" CMS says the five non-physician types were added "in response to the SUPPORT Act," effective Program Year 2021. Office staff are not on the list.
- **Workforce size:**
  - BLS: "Medical assistants held about 833,900 jobs in 2025," and about 57% of MAs (2024 edition) work in physician offices.
  - AMA 2024 Prior Authorization Physician Survey (1,000 practicing physicians, polled December 2024): "practices complete 39 prior authorization requests per physician, per week… Physicians and their staff spend an average of 13 hours completing those requests each week. 40% of physicians have staff who work exclusively on prior authorizations."

**(c) Confidence and unknowns:** High confidence on the regulatory definitions. I found no published count of US access coordinators or prior-auth/reimbursement specialists; BLS has no such category. Rough inference: 40% of physicians have dedicated prior-auth staff, and the Federation of State Medical Boards counted 1,082,187 actively licensed US physicians in its 2024 census, which points to hundreds of thousands of practices with a dedicated access role. That estimate is unverified. There is no public evidence that Impiricus counts non-clinical staff inside its "1M+ HCPs."

### 7. Which Market Access metric matters most

**(a) Demo-table answer:** "Pharma buys Impiricus on NRx lift and incremental revenue, so 'patients recovered' is the headline, because it converts straight into NRx. Abandonment rate is the diagnostic, and time to first fill is the speed-to-therapy KPI patient-services teams already track. We show all three, and we lead with recovered starts."

**(b) Evidence:**
- **How Impiricus sells:**
  - "3x Higher NRx Lift" (Ascend, https://www.impiricus.com/our-products/).
  - Hashmi (Pulse 2.0 interview, https://pulse2.com/impiricus-profile-dr-osama-hashmi-interview/): "The campaign achieved a 145% lift in prescriptions… driving $33 million in incremental revenue."
  - Ascend launch: "a $60 million lift in just a few months."
  - Medvantx release: "accelerate therapy initiation."
  - I did not find the exact phrase "faster therapy initiation and reduced abandonment" in any Impiricus source.
- **Abandonment vs. cost:** IQVIA Institute for Human Data Science, "Medicine Spending and Affordability in the U.S." (Aug 4, 2020): "abandonment rates are less than 5% when the prescription carries no out-of-pocket cost, it rises to 45% when the cost is over $125 and 60% when the cost is over $500."
- **Speed to therapy as a vendor KPI** (CoverMyMeds, vendor claims): "help increase speed to therapy, reduce prescription abandonment"; "Electronic prior authorization helps patients start therapy up to 13 days sooner" (https://www.covermymeds.health/our-solutions/prior-authorization); "every day of delay increases the risk the patient never starts."
- **Surescripts measures:** abandonment rates by clinic, prescriber and drug, plus "14.2% of prescriptions take 7 days or longer to fill."
- **Specialty baseline** (Neon Health, citing BrightInsight/Claritas Rx; vendor blog): "only 62% of specialty prescriptions result in a paid fill."

**(c) Confidence and unknowns:** Medium confidence. The ranking of the metrics is my inference, drawn from how Impiricus and its peers market themselves. I found no public pharma patient-services benchmark that values a recovered patient in dollars. Vendor claims (CoverMyMeds, Neon, Gethoot) are self-reported.

## Top 5 Pitch Facts
1. DocUpdate FAQ: "we currently don't receive confirmation on whether it's been filled."
2. Surescripts (Sept 2026 product page): "27% of new prescriptions are never dispensed."
3. IQVIA: abandonment is "<5%" at $0 and "60% when the cost is over $500." This is why routing to a copay card or bridge works.
4. Spark already triggers on "First-Time Prescriptions," and Medvantx/QPharma sit inside Ascend, so FirstDose uses rails Impiricus has already announced.
5. DocUpdate's own July 2026 article: "the goal is to help the patient actually get it."

## Facts That Weaken or Contradict FirstDose
- **No fill signal today.** RxFill has had "no material adoption in ambulatory settings." First-Fill Abandonment is sold to health systems and EHR/analytics vendors, and Oracle Health's version isn't expected until 2027. FirstDose's "stuck" status is an integration stand-in, not a real data feed.
- **No staff seats.** Staff accounts are not live, and the DocUpdate job post says "We are not building healthcare software for administrators." A coordinator work queue may run against leadership's stated positioning.
- **Delivery reliability complaints.** App reviews report dropped transmissions ("they never receive the order when I call to confirm"), and one user heard it may be "an E-Fax service." Fill tracking is only as good as delivery.
- **Copay cards don't work for government-insured patients.** Manufacturer copay cards are barred for Medicare/Medicaid/TRICARE patients, so the Wallet fix only covers commercial patients.
- **Product-home inconsistency.** The public repo calls FirstDose an Ascend skill, while the brief calls it a DocUpdate feature. Pick one story: an Ascend skill that shows up in DocUpdate.