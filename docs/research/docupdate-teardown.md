# DocUpdate (ImpiricusHealth Corp) End to End: What It Does Today and Where FirstDose Fits

DocUpdate is a free, pharma-funded, iPhone- and Android-only e-prescribing app for individual U.S. prescribers. It routes non-controlled prescriptions through Surescripts, and since v4.0.0 (Sept 29, 2025) it has shipped Cancel Rx, an Alerts Center, renewal requests and pharmacy change requests. By its own FAQ, though, it gets no confirmation of whether a prescription was filled. That missing fill signal is exactly the "never started" gap FirstDose would close. The best way to build FirstDose is as an extension of the Alerts Center and prescription history, fed by Surescripts RxFill and/or Surescripts First-Fill Abandonment. The fix step would go through Concierge and Impiricus's Wallet, QPharma and Medvantx rails. The team must confirm with Impiricus whether DocUpdate is certified for RxFill today, because no public source says it is.

## TL;DR
- **What it is, confirmed:** Sign-up takes an NPI plus Persona identity verification (ID scan and selfie). You can then e-prescribe non-controlled drugs to "65,000+ pharmacies" via Surescripts, use Concierge for samples, reps and patient support, and use a 20+ language AI translator. Savings-card details can be attached to "eligible prescriptions" (v6.3.0, Jul 6, 2026). There are no staff accounts, no EHR integration and no controlled substances.
- **The gap FirstDose targets is real and stated by DocUpdate itself:** "we currently don't receive confirmation on whether it's been filled or successfully canceled." In July 2026 DocUpdate also published its own article titled "Prescription Abandonment: The Prescription Was Sent. The Patient Still Never Started It." Surescripts already sells the needed signals: RxFill (dispensed, partially dispensed or not dispensed) and First-Fill Abandonment, launched Oct 15, 2025.
- **Positioning:** Doximity Prescribe (with Photon) and iPrescribe (DrFirst) compete on showing price at or before pickup. None of the competitors reviewed publicly markets a "why it wasn't filled, plus one-tap fix" loop for an access coordinator. FirstDose's edge is the reason plus the fix, not detection. The main blocker is that DocUpdate says "Staff accounts and practice-level profiles aren't live yet," so the coordinator persona FirstDose depends on does not exist in DocUpdate today.

## 1. Where to See the UI

**App Store (iOS)**: https://apps.apple.com/us/app/docupdate/id6478404244. The subtitle is "The HCP Prescribing Assistant." Seller: ImpiricusHealth Corp. 4.8 stars from 2.8K ratings, #174 in Medical. The listing has four official screenshots. The MWM mirror (https://mwm.ai/apps/docupdate/6478404244) gives their direct image URLs and describes each one:
1. "App_Store_-_1_-_Prescriber.png": the home screen, with "Rx Alerts" (MWM: "proactive 'Rx Alerts' for generic substitutions") and a "Recent Patients" list. https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/37/99/e3/3799e36f-24dd-3194-8955-5ab111b8aaa2/App_Store_-_1_-_Prescriber.png/471x1024.webp
2. "App_Store_-_2_-_Prescriber.png": the prescription screen, showing "Patient Details" alongside "Pharmacy Details." https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/89/80/ce/8980ce70-d150-29a9-4591-d458ca05ed5b/App_Store_-_2_-_Prescriber.png/471x1024.webp
3. "App_Store_-_3_-_Concierge.png": Concierge, with "Request Free Samples" and "Speak with a Rep." https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/80/6b/57/806b57bf-ca89-8021-b7c7-4ece64229dcf/App_Store_-_3_-_Concierge.png/471x1024.webp
4. "App_Store_-_4_-_Translator.png": the translator, with a microphone interface and "English to Spanish" switching. https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/8f/f3/db/8ff3db1a-78cf-a354-2f15-e78a49d4768d/App_Store_-_4_-_Translator.png/471x1024.webp

**Google Play**: https://play.google.com/store/apps/details?id=com.impericus.prescriber&hl=en_US. It shows four landscape screenshots (e.g. https://play-lh.googleusercontent.com/wH1JQpW4pyJpvq9dBj9y3TStTOJSBnt2_HMgu6v5IaIS0kAtp-kdBHupiSRyfzCp6iCWktPtAbohqyxn9URj3Q=w526-h296 and three others with prefixes 0M3YBe8…, 5HuqRVX… and H6TFTNi…). I could not read the text inside these images. Given their order, they probably mirror the four iOS panels, but that is inferred.

**docupdate.io** (primary):
- Home page, https://www.docupdate.io/: hero video /assets/wp/2025/07/doctor_home_.mp4 and a three-step "Get Started" graphic (/assets/wp/2026/02/3screen.webp, download.webp, started.webp, mobile5.webp) captioned "Download the app and confirm your NPI → Complete secure identity setup with Persona → Access ePrescriptions, pharma requests and the AI Translator." It also shows feature images ePre.webp, terms.webp, concierge.webp, translator.webp and translatebottom.webp.
- Prescriber page, https://www.docupdate.io/prescriber/: hero video /assets/wp/2025/07/DocUpDate_Prescriber_Hero.mp4, a product video /assets/wp/2026/04/prescriber_centered.mp4, and a "Real-Time Alerts" screenshot (/assets/wp/2026/03/Content.png).
- Other pages: Concierge (https://www.docupdate.io/concierge/), Samples by specialty (https://www.docupdate.io/concierge/samples/), Translator (https://www.docupdate.io/translator/), and a legacy page, https://www.docupdate.io/conciergeold/, which carries testimonials.
- Web sign-up portal: https://portal.docupdate.io/#/signup-new.

**Video**: there is a YouTube channel at https://www.youtube.com/@GetDocUpdate and a Short, "DocUpdate – HIPAA Compliant Tools For Doctors" (https://www.youtube.com/shorts/k4C7IKv9PGs), described as "a free, HIPAA-compliant mobile platform built for licensed healthcare providers." The page would not render for me, so I cannot describe the video step by step. Watch it, and the two .mp4 files on docupdate.io, before demo day. I found no Vimeo walkthrough.

**Social**: facebook.com/GetDocUpdate, instagram.com/getdocupdate, linkedin.com/company/docupdate (all linked from the site footer). I did not review individual posts.

**Review and aggregator sites**:
- MWM (above) has screenshot captions and 168 written reviews, averaging 3.4/5.
- AppBrain: https://www.appbrain.com/app/prescriber/com.impericus.prescriber (it still lists the old app name "Prescriber").
- Cafe Bazaar mirror and UpdateStar (https://docupdate.updatestar.com/).
- I found no AppAdvice, Softpas, Figma, Dribbble or Behance shots.

**Heads-up**: a public repo, https://github.com/khadimswe/firstdose, already describes FirstDose as "A skill for Impiricus Ascend… Built at HackGT 13." Judges may find it, so make sure your pitch matches it.

## 2. End-to-End Flow

**(a) Sign-up and verification (confirmed).**
- The site describes three steps: "Download the app and confirm your NPI. Complete secure identity setup with Persona." It adds: "Identity is verified by Persona, a third-party identity verification service," with a "quick, one-time identity check" marketed as "Verified in Minutes."
- The privacy policy lists what is collected: "NPI, state medical, dental, or other professional license number(s) and issuing jurisdiction(s), DEA registration number (where applicable to e-prescribing), specialty, place of practice."
- Eligible users: MD, DO, DDS, DMD, DPM, NP/APRN, PA and OD, "in accordance with each state's scope of practice." A UpdateStar listing says the app is available in the U.S., USVI and Puerto Rico.
- Reviewers describe "a scan of my ID and face." One says "asking for NPI and ID card but then was also asking for SSN" (AppBrain). A veterinarian was blocked: "Requires an NPI number. I'm a veterinarian."
- Failure complaints:
  - "Said all I had to do was sign a form. But the screen never changed… endless loop" (MD Rob, Feb 8, 2026).
  - "send me the same link to the same identity verification form over and over" (Olio13, Jan 20, 2026).
  - "I cannot get verified no matter what I do!" (John Daly, Google Play, June 11, 2026).
- The v4.1.0 notes (Oct 27, 2025) added a "new ePrescribing pipeline [that] guides providers through verification." The v6.8.0 notes (about Sept 24, 2026) say it "fixes several login and identity-verification issues."
- Inferred: an SSN field is typical of Persona's database/KBA checks at IAL2-like assurance. DocUpdate does not document this.

**(b) Adding a patient.**
- The site lists the steps as "Enter patient details → Select medication and strength → Add patient directions → Sign and send."
- Address entry uses Google autocomplete, and it breaks: "Rarely can I get past the address. They use Google google to look up locations, but it bounces to the phone number after you enter the first digit" (Roberto Aguero, May 21, 2026).
- v5.3.0 (Mar 17, 2026) "Resolved an issue that could cause errors during eprescribing for patients with incomplete addresses."
- Exactly which fields are required is not public. From the NCPDP NewRx format, name, DOB, sex and address are probably needed, but that is inferred.

**(c) Writing a prescription.**
- Drug search: "Integrated the FDB drug database" (v5.2.0, Jan 26, 2026). Before that, users complained they could not find "Augmentin 875." v5.0.3 (Dec 30, 2025) added "custom medications."
- Quantity units are a known pain point: "It only allows you to prescribe the quantity and not the size (ml, L, gm)" (James Vu, June 15, 2026).
- Pharmacy reach: the store listing says "65,000+ pharmacies," and the FAQ says "We work with 95% of US pharmacies — non-controlled prescriptions can be sent nationwide" and "Every prescription routes through Surescripts."
- Controlled substances: "Not yet… on our roadmap."
- **Call-in / e-fax history (inferred):**
  - Before v4.0.0 ("Full e-prescribing," Sept 29, 2025), reviewers described a human relay: "I think it prompts someone to call it in on your behalf… this takes several hours" (Teeroks, Feb 6, 2025). Another wrote "the last pharmacist I spoke to said it is an E-Fax service" (ManO'Fire).
  - A legacy testimonial says that when a quantity was wrong, "THEY got on the phone with pharmacy and corrected the rx."
  - Put together, early DocUpdate (then called "Prescriber") very likely used fax or call-in fulfillment, and moved to native Surescripts routing in fall 2025.

**(d) After sending.**
- History: "Rx History, Built In… access past prescription data for easy refills."
- Confirmation: a reviewer says "I love knowing that the pharmacy has received the medication… directly sent a text message." Another says "Sometimes I get a confirmation the pharmacy received my prescription, and many times I do not."
- Patients get a text: "My patients appreciate the text they get confirming the RX was sent."
- Cancel: v4.0.0 says "Cancel Prescriptions that were ordered to a pharmacy." The FAQ adds: "while the cancellation request is transmitted to the pharmacy, we currently don't receive confirmation on whether it's been filled or successfully canceled."
- Renewals: "Approve, Approve with Changes, Replace, or Deny."
- Change requests: "approve/deny changes with a click."
- Callbacks: "Prescribers receive notifications for callbacks, refills, and any related pharmacy administrative questions."

**(e) Alerts Center.** v4.0.0 describes it as "Review and act on real-time pharmacy and renewal alerts all in one place." The Prescriber page adds "Receive pharmacy messages and refill alerts," and the first App Store screenshot shows "Rx Alerts." This is the natural home for a FirstDose "Not dispensed" alert.

**(f) Savings / copay cards.**
- v6.3.0 (Jul 6, 2026, also Google Play's current "What's new"): "Providers can now include savings card details with eligible prescriptions."
- It is not documented whether this means the BIN/PCN/Group/ID are sent as secondary coverage in the NewRx, or as a pharmacy note. Nor is it documented whether cards come from Impiricus Wallet. Inferred: they are likely sourced from Impiricus's pharma-sponsored programs, and v5.3.0's "pharmacy comments validation" hints that notes fields are used.
- The Concierge legacy page says: "From financial assistance programs to copay cards and more, Concierge will get the right resource to your patient ASAP."

**(g) Concierge.**
- What it offers: "request samples, rep visits, and other support directly from pharmaceutical companies," plus "Request samples and medical information instantly."
- Samples can be browsed by specialty (https://www.docupdate.io/concierge/samples/): Primary Care (Ozempic, Rybelsus, Farxiga, Wegovy), Dermatology (Dupixent, Litfulo, Rhofade, Upneeq), Rheumatology (Kevzara, Dupixent, Ozempic, Cosentyx) and GI (Linzess, Zenpep, Trulance, Viberzi).
- Sample pages state: "DocUpdate does not dispense medications or provide direct medication fulfillment."
- It is human-backed ("I worked directly with a real person, not a bot"), with AI added in v6.0.0 ("in-app messaging… with Concierge") and v6.1.0 ("Improved Concierge AI responses").
- Fulfillment through QPharma and Medvantx is confirmed only at the Impiricus Ascend level (see §8). That DocUpdate Concierge requests are fulfilled by them is inferred.

**(h) AI Medical Translator.** It offers "20+ languages, including Spanish, Chinese, Arabic, French." From "diagnoses to discharge instructions," it interprets "in your patient's language – and back to you." DocUpdate claims "a perfect 10/10" on an "ALTA medical evaluation." That is a vendor claim, not independently verified.

**(i) Referral.**
- v3.3.0 (Sept 11, 2025): "invite a colleague and receive an Amazon Gift Card when they join and verify their account."
- v6.5.0 (Aug 13, 2026): "Refer a colleague and earn $25 when they join."

**(j) Curated updates and preferences.** The FAQ says: "We keep it free by partnering with select, specialty-relevant pharma companies to share curated updates… delivered by DocUpdate, not by third-party marketers." Users can opt out at https://www.docupdate.io/manage-preferences/ or in the app. The App Store privacy label lists Contact Info as "Data Used to Track You" and as used for "Third-Party Advertising." One reviewer flagged "Questionable bedfellows… funded by Pharma."

**(k) Platforms.**
- The App Store says "Only for iPhone," with Mac (M1, "Not verified for macOS") and Apple Vision (visionOS 1.0) running it as an iPhone app. There is no Apple Watch app and no native iPad build.
- There is a web sign-up portal, but no evidence of web prescribing.
- The FAQ says "DocUpdate does not integrate with an EHR." Enterprise plans are "in development," and "Staff accounts and practice-level profiles aren't live yet."

## 3. Version History (App Store, last ~13 months; dates without a year are 2026)

| Version | Date | Notes (verbatim or condensed) |
|---|---|---|
| 3.3.0 | 09/11/2025 | Referral program (Amazon gift card); "Identity & profile reliability improvements" |
| 4.0.0 / 4.0.1 / 4.0.2 | 09/29, 10/01, 10/09/2025 | "Full e-prescribing… 65,000 pharmacies"; Cancel Rx; Alerts Center; Renewal requests; Change Requests |
| 4.1.0 | 10/27/2025 | Better drug search; "Seamless ePrescribing verification" pipeline |
| 5.0.0 / 5.0.1 | 12/02, 12/04/2025 | "fresh new brand"; redesign; "New bottom navigation bar"; redesigned prescriptions, patients, referrals and pharmacy screens |
| 5.0.2 | 12/12/2025 | Stability |
| 5.0.3 | 12/30/2025 | "prescribe custom medications" |
| 5.2.0 | Jan 26 | "Integrated the FDB drug database" |
| 5.3.0 | Mar 17 | Incomplete-address fix; "pharmacy comments validation" |
| 6.0.0 | Apr 16 | Concierge overhaul; "in-app messaging… with Concierge"; "Improved notifications" |
| 6.1.0 | May 6 | "real-time error messages"; "Improved Concierge AI responses" |
| 6.1.1 / 6.1.2 | May 13 / May 15 | Performance |
| 6.2.0 | May 22 | "Survey invitations… earn rewards" |
| 6.2.1 | Jun 8 | Fixes |
| 6.3.0 | Jul 6 | "include savings card details with eligible prescriptions" |
| 6.4.0 / 6.4.1 | Jul 28 / Jul 30 | Fixes |
| 6.5.0 | Aug 13 | "$25" referral; "Concierge is now faster" |
| 6.6.0 / 6.7.0 / 6.7.1 | Aug 31 / Sep 9 / ~Sep 21 | Fixes |
| 6.8.0 | ~Sep 24 | "fixes several login and identity-verification issues, and streamlines sign-up" |

Google Play only exposes the current note (the savings card note, updated Jul 1, 2026). The trajectory runs from an e-fax-era "Prescriber" app, to full Surescripts messaging (fall 2025), to a rebrand and FDB drug data (winter), to a Concierge AI and messaging push (spring), to monetization and access hooks: surveys, savings cards and referrals (summer 2026).

## 4. Reviews

**Scores**:
- iOS: 4.8/5 from 2.8K ratings.
- Google Play: 4.7 from 323 reviews, "10K+" downloads. AppBrain says "downloaded 15 thousand times… 63 downloads per day."
- MWM puts iOS downloads at "100k+" (a third-party estimate), and its written-review average is only 3.4/5 across 168 reviews.
- The gap between star ratings and written reviews suggests prompted in-app ratings. That is inferred.

**Praise**:
- "the identity verification was quick… I appreciate that it is free!" (Mayani25)
- "I had an issue logging in and they solved it in less than an hour" (Grisselle Ni)
- "The translator is very accurate at translating medical language from English to Spanish" (AppBrain)
- "Now though… I am no longer having that issue, and it is pretty fast, within about 15-30 min" (ManO'Fire)

**Complaints**:
- Pharmacies not receiving orders: "I've tried to prescribe to CVS, Kaiser, and other pharmacies and they never receive the order." DocUpdate replied: "While most transmissions are successful, issues can occur. Please contact support@docupdate.io."
- Support: "no customer service phone line, and email requests for assistance are poorly supported" and "Medications I did not prescribe… appear under my patient's profile."
- Verification loops, quantity units and address entry (quoted in §2).
- Pharmacy search: "finding pharmacies is elusive."

**Feature requests**: controlled substances ("still couldn't prescribe scheduled meds"), veterinarian support, and unit-of-measure entry.

## 5. NPI Verification In Depth

**What NPPES gives you.**
- The public API is at https://npiregistry.cms.hhs.gov/api/?version=2.1.
- Parameters (per the rOpenSci client that mirrors v2.1): number, enumeration_type (NPI-1 individual / NPI-2 organization), taxonomy_description, first_name, last_name (trailing wildcard after 2 characters), use_first_name_alias, organization_name, address_purpose (location, mailing, primary, secondary), city, state (cannot be the only criterion), postal_code, country_code, limit and skip.
- Returns are capped at 200 per call, and about 1,200 per query can be reached with skip.
- Responses contain basic (including status A/D), taxonomies[] (code, desc, primary flag, state, license), addresses[] (location plus mailing), practiceLocations[], identifiers[], other_names[] and endpoints[]. These field names come from third-party clients, because the CMS help pages did not render for me, so verify them against a live call.
- Deactivated NPIs are not shown in the registry. A lookup returns an error, so use the deactivation file.
- CMS itself warns: "Issuance of an NPI does not ensure or validate that the Health Care Provider is Licensed or Credentialed." CMS also limits queries per hour, and "Bulk NPI Registry queries must use the DDS file."
- **Bulk files** (https://download.cms.gov/nppes/NPI_Files.html): a monthly full replacement file ("September 14, 2026 – 1,105.79 MB"), a monthly deactivation file, and weekly incremental files. Only V.2 is supported since 03/03/2026.

**Taxonomy codes (CMS crosswalk)**:

| Code | Specialty |
|---|---|
| 207N00000X | Dermatology |
| 207RR0500X | Rheumatology |
| 207RX0202X | Medical Oncology |
| 207RH0003X | Hematology & Oncology |
| 207RG0100X | Gastroenterology |
| 363L00000X | Nurse Practitioner |
| 363A00000X | Physician Assistant (secondary sources) |

**What NPI does and does not prove.** A match proves that the number exists, is active, and belongs to that name, taxonomy and license state. It does not prove that the person holding the phone is that provider. That is why DocUpdate layers Persona document and selfie checks on top.
- Surescripts requires that "The name on the account must match the name under which the NPI is registered."
- EPCS is stricter. 21 CFR 1311.105 still cites "Assurance Level 3… NIST SP 800-63-1," and DEA's non-binding 2023 Q&A says "Identity Assurance Level 2 of NIST SP 800-63-3 is like DEA's current required standard."
- EPCS signing needs two factors under §1311.115, plus two-person logical access control under §1311.125.
- This is why DocUpdate says controlled substances "require additional security and identity verification."
- Doximity and OpenEvidence verify against NPI and similar data. I did not research their exact methods, so treat that as a gap.

**Staff without NPIs.** HIPAA requires NPIs only for covered providers. MAs and many nurses have none. For them, the industry pattern is delegation.
- CoverMyMeds staff create their own accounts and then verify each prescriber's NPI to their account. CoverMyMeds "will fax a code to the number provided," or verifies manually if staff have no access to a listed fax.
- It offers "groups" as "a security best practice… preferred alternative to sharing accounts."
- Its specialty flow lets verified prescribers "approve authorized delegates." Under DEA rules, agents may "enter data" but "only the registrant may sign."
- FirstDose's coordinator login should copy this model: staff identity, plus a link to an NPI-1 prescriber approved by that prescriber, plus the practice's NPI-2 and a BAA. DocUpdate has none of this today.

## 6. The Surescripts Side

- **Messages available to a certified prescriber app** (docs.surescripts.com): NewRx, RxRenewalRequest/Response, RxChangeRequest/Response (including "prior authorization"), CancelRx, and "RxFill: pharmacy → prescriber: notify that a prescription was filled, partially filled, or not picked up."
- **RxFill details:**
  - The NCPDP guidance (NIST-hosted paper) defines three cases: dispensed, partially dispensed and "never dispensed (patient did not pick up the medication)." "Returned to Stock (Not Dispensed)" applies when a filled script is returned to inventory. Use of RxFill "is voluntary for pharmacies and prescribers."
  - SCRIPT v2017071 added "RxFillIndicator and RxFillIndicatorChange," per a secondary source. With it, the prescriber sets which fill statuses it wants.
  - DrChrono calls RxFill a message "Surescripts provides… as required by the ONC."
  - I found no public figure on pharmacy RxFill adoption. Ask Surescripts.
- **Other Surescripts services**: Medication History, Real-Time Prescription Benefit and electronic PA also exist. Surescripts' own Annual Impact Report 2025 press release (Mar 2026) says "In 2025, 973,463 prescribers used Real-Time Prescription Benefit, receiving 1 billion responses," saving patients "more than $55 million" ($77 per Rx and $817 per specialty Rx when a lower-cost alternative was chosen). Surescripts says that combining e-prescribing with Eligibility & Formulary raises "first-fill medication adherence… by 20.5%." DocUpdate shows no evidence of offering RTPB or ePA.
- **First-Fill Abandonment** (launched Oct 15, 2025) "proactively monitors new prescriptions sent across the Surescripts network and flags when patients don't pick them up." It delivers "patient, provider, medication, dose… date written and days unfilled" on a daily or weekly cadence, and includes a "12-month look-back period of first fill abandonment trends." Surescripts' Oct 15, 2025 press release says: "In addition to offering First-Fill Abandonment to health systems and electronic health records vendors, Surescripts is partnering with Arcadia." Dr. Lynne Nowak of Surescripts described the goal as "empowering care providers with meaningful insights so they can perform faster, more targeted interventions." On Sept 24, 2026, Oracle and Surescripts said they would "explore" First-Fill Abandonment in Oracle Health, with capabilities "planned for general availability in 2027."
- **Implication:** there are two ways for FirstDose to get a "never started" signal. It can request RxFill per prescription, which needs certification and pharmacy participation. Or DocUpdate can license First-Fill Abandonment as a batch feed at the vendor level. Neither tells you *why*: RxFill gives a status, not a reason. The reason has to come from RxChange PA requests, pharmacy or hub status, patient outreach, or price data.

## 7. Competitors

| App | Fill status / pharmacy confirmation | Price transparency | Copay cards | Notes |
|---|---|---|---|---|
| DocUpdate | Sent/received confirmations are inconsistent; fill status explicitly not received | None evident | "savings card details" on eligible Rx (Jul 2026) | Free, non-controlled only, Concierge |
| Doximity Prescribe (Photon) | Not stated. Photon says it built "tools to keep patients in the loop about their prescription status" | Patient gets a text to "choose their preferred pharmacy and view estimated pricing before pickup" | Not stated | Free for verified MD/NP/PA; launched in Dialer in May 2026 after a 1,000+ prescriber beta; Photon does not transmit controlled substances (per Commure) |
| iPrescribe (DrFirst) | Not stated; "Notify patients via text when their prescription is authorized" | Yes: "check a patient's out-of-pocket costs… suggest lower-cost alternatives… share patient assistance programs" | Via assistance programs | EPCS, PDMP; "free for providers in the DrFirst prescribing network" |
| MDToolbox Rx Mobile | Not stated | "Real Time Pricing module" | Not stated | EPCS, ePA, 70,000+ pharmacies; mobile app free for Web users, Web from $30/user/month (Capterra) |
| Photon Health | Patient status tools (above) | Via Doximity flow | Not stated | API network |
| RXNT mobile, Treat | Not researched | Not researched | Not researched | Evidence gap |

Positioning: the competitors attack abandonment *before* pickup, with price and pharmacy choice. None publicly closes the loop *after* a non-fill by giving a reason and routing a fix to a coordinator.

## 8. The Company

- **Relationship.** ImpiricusHealth Corp is the App Store seller and the Play developer ("Impiricushealth Corp., 1 Concourse Pkwy Ste 800, Atlanta"). The Terms of Service define DocUpdate as "a network built to help physicians engage with pharma" and refer to "the Prescriber mobile application." CEO Osama Hashmi: "on the pharma side, we actually own a bunch of different channels… We then reduce the spam by 97%… On the flip side, we also create free tools and resources for physicians. So we have this app called DocUpdate." DocUpdate's own site calls him "DocUpdate CEO."
- **Pharma-side products.**
  - Ascend is described as "the company's agentic commercialization platform… more than 1 million opted-in healthcare providers."
  - QPharma integration (Aug 25, 2026) "embeds PDMA-compliant pharmaceutical sampling into active AI-powered physician conversations."
  - Medvantx (Sept 8, 2026): its "sample management and patient support capabilities are now integrated directly into Impiricus Ascend." Medvantx administers "patient assistance, bridge/quick start, cash-pay, sample distribution."
  - Impiricus Wallet lets HCPs share "co-pay, hub services, patient resources" via a QR code ("no app installation required") while "Tracking usage at the NPI level." PR Newswire confirms the launch date: "ATLANTA, July 25, 2023 — Impiricus announced the launch of their new product, Impiricus Wallet," with then-CEO Sandy Donaldson saying "HCPs consistently highlight that patient resources are either unknown to them or are cumbersome to access." That makes 2023 the launch date; a later Impiricus post saying "In June 2024, Impiricus launched" is the outlier.
  - ION, Pulse and Spark were not confirmed in the sources I reviewed.
- **Scale and growth.**
  - Deloitte's Nov 19, 2025 press release ranked Impiricus #1 on the 2025 Technology Fast 500: "Impiricus claimed the top spot with a growth rate of 29,738% from 2021 to 2024." Impiricus's Dec 2, 2025 PR Newswire release adds that it also ranked "#1 in the Artificial Intelligence category."
  - No. 14 on the 2026 Inc. 5000, per Impiricus's Aug 11, 2026 release, based on revenue growth from 2022 to 2025; Hashmi: "Our 11,691% growth rate is a powerful validation of the problem we set out to solve."
  - About 205 employees (Tracxn); a $3M seed in 2022 led by FCA Venture Partners.
  - DocUpdate-specific user, growth or retention figures: none published beyond "Join thousands of doctors, NPs, and PAs."
  - I could not find the VP Marketing, DocUpdate job posting.
- **2026 signals**: DocUpdate's clinician-authored articles include "Prescription Abandonment… The Patient Still Never Started It" (Jul 9), "Prior Authorization Delays" and "Copay Cards vs Patient Assistance Programs." Hashmi also appeared at ASCO 2026 and on FOX 5.

## Where FirstDose Fits

| FirstDose step | DocUpdate surface / service to extend | Status |
|---|---|---|
| Prescribe | New Rx flow (FDB drug search → sig → pharmacy → Sign and send) plus v6.3.0 savings card attachment | Exists |
| Watch | Prescription history; request RxFill on each NewRx and/or ingest Surescripts First-Fill Abandonment | Missing; FAQ says no fill confirmation |
| Alert | Alerts Center ("real-time pharmacy and renewal alerts") and push/SMS | Exists; add a "Not started" alert type |
| Coordinator handoff | Needs staff accounts delegated from a verified NPI-1 prescriber (CoverMyMeds model) | Missing: "Staff accounts… aren't live yet" |
| Fix | Copay: Wallet or savings card resend. Bridge sample: Concierge → QPharma/Medvantx (Ascend). PA or access: RxChange PA request, manufacturer hub | Rails exist at Impiricus; DocUpdate wiring unconfirmed |
| Re-run | Watch for RxFill "Dispensed," or the next abandonment feed | Depends on the Watch step |
| Proof | Aggregate time-to-first-fill for Market Access, de-identified; aligns with Wallet's "NPI level" tracking | Needs a data-use agreement and BAA review |

**Evidence gaps to ask Impiricus about:**
1. Is DocUpdate's Surescripts certification (directly or via an intermediary) enabled for RxFill, and does it set RxFillIndicator? What share of the network's pharmacies return it?
2. Does, or will, DocUpdate license First-Fill Abandonment?
3. How are savings cards transmitted: as structured secondary coverage or as a pharmacy note? And are they Wallet programs?
4. Are DocUpdate Concierge sample requests fulfilled by QPharma or Medvantx today, or only through Ascend?
5. What is the timeline for staff accounts and practice profiles?
6. Is there RTPB or ePA access, to support "declined at price" and "PA required" reasons?
7. What does Persona collect (SSN?), and what is the verification pass rate?
8. What are DocUpdate's active prescriber and monthly script volumes?
9. What are the consent and BAA terms for sharing abandonment outcomes with pharma?

## Caveats
- Several technical details are secondary: NPPES field names and the RxFillIndicator.
- App review counts differ by source.
- The e-fax and call-in history is inferred from reviews.
- I could not view the YouTube and Play screenshot contents directly.
- The existing public FirstDose GitHub repo may shape how judges read the pitch.