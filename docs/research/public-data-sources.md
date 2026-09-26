# FirstDose: public data research (checked 2026-09-26)

Status key: **VERIFIED** = called with curl/python today and got data back. **DOCUMENTED** = read the source page or docs but did not fetch the data itself.
Aggregates only. This report names no real prescriber, pharmacy, NPI or address.

## 0. Corrections to act on first

| Finding | Evidence | Action |
|---|---|---|
| NDC **55513-0497-60 is Otezla 20 mg**, not 30 mg. The Otezla **30 mg ×60 NDC is 55513-0137-60** (RxCUI 1492746). | openFDA NDC and RxNav `ndcstatus` both return this. The repo's own `data/labels/drug_otezla/source.xml` lists 55513-137-60. | Use 55513-0137-60 everywhere. |
| Humira `rxcui: "TODO_VIHN"` in `mock/patients.json` → **1872980** = Humira(CF) Pen 40 mg/0.4 mL, NDC **00074-0554-02** (2 pens). The older 40 mg/0.8 mL pen is RxCUI 1655728, NDC 00074-4339-02. | RxNav `ndcstatus?ndc=00074055402` → ACTIVE, 1872980. | This is a mock contract change, so it goes to Vihn as a `docs/for-vihn.md` note. I did not edit it. |
| The current NADAC dataset is **fbb83258-11c7-47f5-8b18-5f8e79f7e704** ("NADAC 2026"). `f38d0706-…` is the 2025 dataset. `ndc_description` holds brand names only (a LIKE search for `APREMILAST` returns 0 rows; `OTEZLA` returns 129), so search by NDC. | See §1. | Query by 11-digit NDC. |
| Otezla is a Medicare negotiated drug: **$1,650 per 30-day supply from 2027-01-01**, which is after the demo date. Humira is not on the list. | CMS MFP file (§1). | Don't show a 2027 Medicare price as current. |

## 1. Real data we can use now

| What | Source + endpoint | Sample values (data year) | Status | How FirstDose would use it |
|---|---|---|---|---|
| Part D prescribing by state, per drug | CMS *Medicare Part D Prescribers – by Geography and Drug*, DY2024. API `data.cms.gov/data-api/v1/dataset/9b4c142c-69cc-4a96-a09a-7cf2ba7f5816/data` | **Otezla GA:** 614 prescribers, 6,661 claims, 7,142.5 30-day fills, $33,123,334 cost, 1,018 benes. **Otezla national:** 18,787 prescribers, 213,290 claims, 224,625 fills, $1,044,462,376, 31,029 benes. **Humira(CF) Pen GA:** 717 prescribers, 15,295 claims, 16,314.8 fills, $138,206,743, 2,035 benes. **National:** 23,305 prescribers, 490,135 claims, $4,327,121,751, 63,749 benes. All Humira brand rows summed: GA 19,871 claims / $177.7M; national 651,816 claims / $5.71B (2024) | VERIFIED | Market-context card on `/access`, or a "why this matters in Georgia" line on `/board` |
| Part D prescribers of Otezla/Humira in GA, grouped by specialty (aggregate only) | *Part D Prescribers – by Provider and Drug*, DY2024. API `…/dataset/9552739e-3d05-4c1b-8eff-ecabf391e2e5/data?filter[Brnd_Name]=Otezla&filter[Prscrbr_State_Abrvtn]=GA` | Otezla GA: 219 published prescribers (the dataset publishes only prescribers with ≥11 claims). Dermatology 56, PA 56, Rheumatology 41, NP 35. Median 19 claims per prescriber. Humira(CF) Pen GA: 374. Rheumatology 108, GI 67, NP 63, PA 59, Derm 49 (2024) | VERIFIED (counts only) | Calibrates who prescribes: roughly half are NPs/PAs, so `prescriber_label` should not always say "Dr." Never show individual rows. |
| Part D spending per claim and per unit | CMS *Medicare Part D Spending by Drug*, DY2024. API `…/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data?filter[Brnd_Name]=Otezla` | Otezla: $80.68/tablet, $4,897.14/claim, $33,661.77/bene, +1.19% per unit 2023→24. Humira(CF) Pen: $3,531.42/unit, $8,828.62/claim, $67,881.99/bene, −5.8% (2024) | VERIFIED | Sanity check for the prices in the sim. These are gross amounts before rebates. |
| Newer quarterly Part D spending | *Medicare Quarterly Part D Spending by Drug*. API `…/dataset/4ff7c618-4e40-483a-b390-c8a58c94fa15/data` | Otezla 2025 (Q1–Q4): 37,421 benes, 257,820 claims, $5,357.93/claim. 2026 Q1: $5,480.17/claim. Humira(CF) Pen 2025: 70,059 benes, $8,898.28/claim | VERIFIED | Most recent public per-claim cost |
| Medicaid spending | CMS *Medicaid Spending by Drug*, 2024. API `…/dataset/be64fce3-e835-4589-b46b-024198e524a6/data` | Otezla: $342.3M, 71,386 claims, $4,795.19/claim (2024) | VERIFIED | Context only |
| Pharmacy acquisition cost | **NADAC 2026**, data.medicaid.gov `api/1/datastore/query/fbb83258-11c7-47f5-8b18-5f8e79f7e704/0?conditions[0][property]=ndc&conditions[0][value]=55513013760` | **Otezla 30 mg:** $90.57171/tab, effective 2026-09-23 (×60 = **$5,434.30**). **Humira(CF) Pen 40 mg/0.4 mL (00074055402):** $3,367.41479/pen, effective 2026-09-23 (×2 = **$6,734.83**). Humira Pen 40/0.8 (00074433902): $3,366.90. Both are classed "B" (brand) | VERIFIED | Independent check on the WAC numbers in CLAUDE.md: WAC/NADAC is 1.0286 for Otezla and 1.0279 for Humira, consistent. Brand specialty drugs are in NADAC, so no substitute source is needed. |
| Georgia Medicaid utilization | Medicaid *State Drug Utilization Data 2025* `…/datastore/query/158a1baa-5506-400a-8ec3-97756f0b0536/0` (state=GA, product_name LIKE) | Otezla 30 mg GA 2025: 456 Rx (314 fee-for-service, 142 managed care), $2.18M reimbursed. Humira brand GA 2025: 3,112 Rx, $28.6M (unsuppressed rows) | VERIFIED | Shows Medicaid patients do get these drugs, which makes the "copay card blocked for Medicaid" guardrail case realistic |
| **Part D formulary: coverage, PA, ST, QL** | *Quarterly Prescription Drug Plan Formulary, Pharmacy Network, and Pricing Information* (SPUF 2026 Q2) `data.cms.gov/sites/default/files/2026-07/64c8d9e1-…/SPUF_2026_20260701.zip`. Re-ran on *Monthly* file `…/2026-09/903ba816-…/2026_20260916.zip` (Sep 2026) and got the same headline numbers | **Otezla 30 mg:** on 258/328 formularies (78.7%). Covered by 59.3% of 5,496 plans nationally, 53.9% of 152 GA plans (82). Among GA plans that cover it: PA 90.2%, QL 90.2% (mostly 60 per 30 days), step therapy 0%. **Humira(CF) Pen:** 155–156/328 formularies (~47%), 40.8% of plans nationally, **33.6% of GA plans (51)**, PA 100%, QL 100% (mostly 6 per 28 days), ST 0%. Every GA plan covers *some* adalimumab product (2026) | VERIFIED | Real odds for Medicare cases: reject 70/MR (not covered) vs 75 (PA). Aggregate only. |
| Part D cost sharing | Same zip, `beneficiary cost file` + `plan information` | GA plans covering Otezla: 74/82 put it on the specialty tier. 30-day retail coinsurance: 25% (53 plans), 27–33% (the rest). Humira(CF) Pen: 49/51 on specialty tier, 25–33%. Deductible $615 in 95/152 GA plans (2026) | VERIFIED | Calibrates Medicare out-of-pocket in the sim. Any price shown on screen needs owner sign-off (see §4). |
| 2026 Part D benefit parameters | CMS *Final CY 2026 Part D Redesign Program Instructions* (cms.gov fact sheet) | Deductible $615. Out-of-pocket cap **$2,100** (2026) | DOCUMENTED ($615 is also VERIFIED in the SPUF data) | Medicare guardrail copy (copay card excluded) and sim price ceilings |
| Medicare negotiated price | CMS *Selected Drug List and Maximum Fair Prices* `cms.gov/files/zip/selected-drug-list-negotiated-prices-also-known-maximum-fair-prices-statutezip.zip` (file dated 2026-09-21) | Otezla/Otezla XR, IPAY 2027: $1,650 per 30-day supply, effective 2027-01-01. NDC 55513-0137-60 costs $28.571974 per unit. Humira not listed | VERIFIED | Footnote only. It doesn't apply in Sept 2026. |
| Product NDCs / packages / labeler | openFDA `api.fda.gov/drug/ndc.json?search=brand_name:"Otezla"` (and `"Humira"`), last_updated 2026-09-25 | Otezla: 8 products, all Amgen, NDA205437. 55513-137 = 30 mg ("60 TABLET, FILM COATED in 1 BOTTLE (55513-137-60)"). 55513-497 = 20 mg. 55513-519 = Otezla XR 75 mg. Humira: 15 products (AbbVie BLA125057, plus Cordavis Limited co-labeled 83457-xxx, plus 1 repackager). 0074-0554-02 = 2 kits (40 mg/0.4 mL pen) | VERIFIED | Drug header chips (NDC, package, labeler), shown as exact openFDA strings. Package strings are not label text. |
| NDC → RxCUI | NLM RxNav `rxnav.nlm.nih.gov/REST/ndcstatus.json?ndc=…`, `/rxcui/1492746/properties.json` | 1492746 = "apremilast 30 MG Oral Tablet [Otezla]". 1872980 = "0.4 ML adalimumab 100 MG/ML Auto-Injector [Humira]" | VERIFIED | Join key between formulary, NADAC and openFDA |
| Local provider density (counts only) | NPPES `npiregistry.cms.hhs.gov/api/?version=2.1&taxonomy_description=Dermatology&postal_code=30309*&address_purpose=LOCATION&limit=200` | Practice location in the ZIP, with the taxonomy code: **30309:** dermatology (207N00000X) 8 (7 individuals, 1 org); rheumatology (207RR0500X) 7 (5 ind, 2 org); community/retail pharmacy (3336C0003X) 12. **30308:** derm 1, rheum 5, retail pharmacy 16. City of Atlanta: derm 144, rheum 73, specialty pharmacy (3336S0011X) 22. The API returned slightly higher raw counts (derm 12, rheum 9) because it also matches non-location addresses. | VERIFIED | Scale for the sim ("a practice like this sits among ~8 dermatology NPIs in 30309"). Never render rows. |
| Synthetic NPI method | NPPES `?version=2.1&number=1100938202` | `1100938202` is Luhn-valid over "80840"+NPI (check-digit code reproduces CMS's example 123456789 → 1234567893). NPPES returned `{"result_count":0}`, so it is unassigned today | VERIFIED | Gives a synthetic prescriber a correctly formatted NPI that belongs to nobody. Re-check at build time. Safer still: show no NPI at all. |
| Arthritis prevalence, Atlanta | CDC PLACES 2025 release, `data.cdc.gov/resource/swc5-untb.json?stateabbr=GA&locationname=Fulton&measureid=ARTHRITIS`. ZCTA dataset `qnzd-25i4` | Fulton County adults, all arthritis: 20.4% (CI 18.1–22.7), BRFSS 2023. ZCTA 30309: 14.1%. Not RA-specific | VERIFIED | Context only. No county-level RA or psoriasis data exists. |
| Psoriasis / RA prevalence | Armstrong et al., *JAMA Dermatology* 2021 (pubmed 34190957): psoriasis in 3.0% of US adults (~7.5M). CDC *PCD* 2025 (cdc.gov/pcd/issues/2025/24_0393.htm): arthritis subtypes | Psoriasis 3.0%. RA is roughly 1% of adults, about 3:1 female:male | DOCUMENTED | Sex ratio for the synthetic RA patients |
| Georgia insurance mix | KFF State Health Facts, *Health Insurance Coverage of the Total Population*, GA 2024 | Employer 48.29%, non-group 7.73%, Medicaid 16.90%, Medicare 13.09%, military 2.02%, uninsured 11.97% | VERIFIED (WebFetch of kff.org) | Payer mix for the generator. Census ACS would be better at ZIP level, but `api.census.gov` now requires a free key. |

**Formulary file size and format.** Each quarterly or monthly zip is 2.29–2.49 GB. Inside are nested zips of pipe-delimited `.txt` files, Latin-1 encoded. data.cms.gov offers **no API** for these files, only the zip. Almost all of the size is the six `pharmacy networks` parts (~2.3 GB) and the `pricing file` (191 MB). The useful members are small: `basic drugs formulary file` is 8.3 MB compressed (58.8 MB raw), `plan information` 0.4 MB, `beneficiary cost file` 0.5 MB, `geographic locator` under 0.1 MB. **Method:** read the zip's central directory with HTTP Range requests and pull only those members. Both runs fetched about **9–10 MB total**. The helper is `scratchpad/httpzip.py` (seekable HTTP file object handed to Python's `zipfile`). Join `plan information.FORMULARY_ID` to `basic drugs formulary.FORMULARY_ID` on `RXCUI`. For Georgia, use `STATE='GA'` for MA-PD plans plus PDP region 10.

## 2. What must stay synthetic, and how to generate it

**Must be synthetic:** patients (name, age, sex, payer, condition), prescriptions, prescriber identity, claim and reject events, RxFill and hub events, quoted prices per patient, timestamps, and the phone/wrist handoff. No public dataset contains individual patient fills, and none should.

**Recommendation: a small deterministic generator with a fixed seed, calibrated by the numbers below. Not Synthea.**

I ran Synthea and verified the following:
- **Run:** `java -jar synthea-with-dependencies.jar -s 20260926 -cs 20260926 -p 15 -a 30-75 --exporter.csv.export=true --exporter.fhir.export=false --generate.append_numbers_to_person_names=false Georgia Atlanta`. It produced 15 GA patients in 14 s. The jar is 197 MB (release `master-branch-latest`, 2026-08-18) and needs Java.
- **Wrong conditions and drugs.** Synthea has **no psoriasis module**. Its `rheumatoid_arthritis` module (SNOMED 69896004) prescribes only methotrexate, naproxen and prednisone, never adalimumab. The 15 GA patients had 0 RA or psoriasis conditions. The 108-patient sample set had 0 as well.
- **Real-organization leakage.**
  - `payers.csv` uses real insurer brands (Aetna, BCBS, Cigna, UnitedHealthcare, Anthem, Humana). The current payer mix for the 15 patients was 13 of those, 1 Medicare and 1 Humana.
  - `organizations.csv` holds **real facilities with real NPIs**: 8 of 8 sampled resolved in NPPES.
  - Clinician NPIs in `providers.csv` were unassigned (0 of 4 resolved).
  - All 15 patients were placed in DeKalb County.
- **Too much for the demo:** 18 CSVs of lifetime EHR data. It also changes between versions, since `master-branch-latest` is a moving target.
- **Where Synthea could still help:** as a demographics seed only (`patients.csv` BIRTHDATE and GENDER, and `payer_transitions.csv` mapped to a *generic* payer type). Drop SSN, DRIVERS, PASSPORT, ADDRESS, LAT/LON and every organization or provider row.
- **Sample CSV download:** `synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_csv_latest.zip` (5.96 MB, 108 Massachusetts patients). The older `…csv_apr2020.zip` is 8.98 MB.
- **Field mapping:** name = `patients.FIRST/LAST`; age = `BIRTHDATE`; sex = `GENDER`; payer = `payer_transitions.PAYER` → `payers.NAME`; condition = `conditions.CODE` (SNOMED); meds = `medications.CODE` (RxNorm) with `PAYER_COVERAGE` and `TOTALCOST`.
- **License:** Synthea code is Apache-2.0. Its NOTICE says SNOMED CT content is used as "fair use … for research and nonprofit educational purposes" and LOINC is under Regenstrief terms. The generated people are fictional, so it is fine for a public demo as long as the real-org rows are removed.

**Calibration numbers for the generator:**

| Parameter | Value | Source (date) | Status |
|---|---|---|---|
| New prescriptions never dispensed | **27%** | Surescripts First-Fill Abandonment page, surescripts.com/what-we-do/first-fill-abandonment ("Surescripts analysis of e-prescriptions sent to fill-reporting pharmacies in January 2026") | VERIFIED (page fetched, quote exact) |
| Prescriptions taking ≥7 days to fill | **14.2%** | Same Surescripts page, which cites Zheng et al., *JMCP* 32(4), Apr 2026, 434–44 | VERIFIED (quote exact; the underlying paper was not read) |
| Extra delay when PA is required | median **+4 days** to fill | Surescripts "5 Barriers to Patient Medication Access" (Jul 7 2026), surescripts.com/insights/5-barriers-patient-medication-access | VERIFIED |
| ePAs never completed | **22%** | Surescripts Q&A (Apr 28 2026), surescripts.com/insights/specialty-prescriptions-patient-access-qa (all 2025 ePA transactions) | VERIFIED |
| Abandonment vs out-of-pocket cost | **<5% at $0, 45% over $125, 60% over $500** | IQVIA press release, Aug 4 2020, iqvia.com/newsroom/2020/08/drug-prices-have-become-more-affordable-… (quote exact) | VERIFIED (2020 data, old) |
| Novel-medicine Rx outcomes (upper bound for specialty) | **65% unfilled, 49% rejected by payers, 17% abandoned after payer approval** | IQVIA *U.S. Medicine Use Trends 2026* (Apr 28 2026) landing page | VERIFIED (landing page). Otezla and Humira aren't novel, so treat as a ceiling. |
| Prior-auth burden | **39 PAs per physician per week, 13 h/week, 40% have dedicated PA staff**, 31% say PAs are often or always denied | AMA, ama-assn.org/practice-management/prior-authorization/fixing-prior-auth-nearly-40-prior-authorizations-week-way (survey of 1,000 physicians, Dec 2024; page Apr 24 2025) | VERIFIED |
| Part D PA decision clock | 72 h standard, 24 h expedited (exception clocks start when the prescriber's statement arrives) | 42 CFR 423.568 / 423.572; cms.gov Coverage Determinations page | DOCUMENTED |
| Specialty time to treatment | median 6 days (health-system specialty pharmacy) vs 13 days (external) | *JMCP* 2024;30(4):352 (page returned 403; figure from search snippet) | DOCUMENTED |
| Medicare coverage odds in GA | Otezla on 53.9% of plans, PA on 90.2% of those. Humira(CF) Pen on 33.6%, PA 100% | SPUF 2026 Q2 / Sep 2026 (§1) | VERIFIED |
| Medicare cost share | Specialty tier, 25% coinsurance (mode), $615 deductible, $2,100 out-of-pocket cap | SPUF + CMS 2026 | VERIFIED / DOCUMENTED |
| GA payer mix (insured only, renormalized) | Commercial 63.7% (employer 54.9 + non-group 8.8), Medicaid 19.2%, Medicare 14.9%, TRICARE/military 2.3% | KFF GA 2024 | VERIFIED |
| Unit prices | Otezla $90.57/tab, Humira(CF) Pen $3,367.41/pen | NADAC as of 2026-09-23 | VERIFIED |

## 3. Proposed demo dataset spec (15 background + Maria Lopez + James Carter, Atlanta GA)

Emit exactly the existing shapes: `mock/patients.json` patient objects, plus `data/demo-week.json` `patients` / `cases` / `events`. Rule 7 applies: no new fields. Put provenance in a *separate* sidecar such as `data/calibration.json` (each parameter with its source URL and year) and cite it in `docs/`. The generator script belongs under `scripts/` (Vihn's area), so Deem should hand it off as a `docs/for-vihn.md` note.

| Field | Real or generated | How |
|---|---|---|
| `patients[].id`, `display_short` | generated | `week_pt_01…15` |
| `name` | generated | Seeded pick from a fixed fictional list (SSA baby-name and Census 2010 surname lists are public). Every record reads "Fictional test record". **Conflict:** CLAUDE.md rule 4 says Maria and James are the only names. `demo-week.json` already carries 13 approved fictional names, so the owner must confirm names are allowed. |
| `age` | generated, calibrated | Commercial/Medicaid 30–64, Medicare ≥65. About 77% of GA Otezla Part D benes are ≥65 (789/1,018, CMS geo 2024). |
| sex (not a field today) | generated | RA about 3:1 F:M (CDC, DOCUMENTED); psoriasis about 1:1 |
| `insurance.type` | generated, calibrated | KFF GA 2024 insured mix. For 15 patients: **~9–10 commercial, 3 Medicaid, 2 Medicare, 0–1 TRICARE**. The current fixture has 11/1/1, which is commercial-heavy. |
| `insurance.plan_label` | generated, generic | "Commercial PPO, high-deductible (demo)", "Medicare Part D (demo)", "Georgia Medicaid (demo)". Never an insurer brand (unlike Synthea). |
| `copay_card_eligible` | derived rule | `type == "commercial"` only; false for Medicare, Medicaid and TRICARE |
| `state` | fixed | "GA" |
| `condition_label` | derived | Otezla → "Plaque psoriasis (demo)", Humira → "Rheumatoid arthritis (demo)". Split roughly 50/50. |
| `cases[].drug_id` + NDC/RxCUI | **real** | Otezla 55513-0137-60 / 1492746. Humira(CF) Pen 00074-0554-02 / 1872980 (openFDA + RxNav) |
| `prescriber_label` | generated | "Dr. Demo" / "NP Demo". About half of GA Otezla prescribers are NPs or PAs (CMS 2024). Optional synthetic NPI via the Luhn + NPPES-zero method. |
| `prescribed_at`, event `at` | generated | Inside the demo week, seeded |
| Stall vs fill | generated, calibrated | P(stall) 0.27 (Surescripts) up to about 0.45 for specialty (IQVIA ceiling). For 15 patients: **~5 stalled, ~2 waiting, ~8 dispensed**, which matches the current fixture's 3/2/8 queue. |
| `reason` / `reject_code` | generated, calibrated | Medicare Humira: NOT_COVERED (70/MR) with p ≈ 0.66 (not on 66% of GA plans), else PA_REQUIRED (75). Medicare Otezla: NOT_COVERED 0.46 / PA 0.49. Commercial: PA_REQUIRED or DECLINED_AT_PRICE / COPAY_NOT_APPLIED, weighted by the IQVIA out-of-pocket curve. Only values from `mock/reasons.json`. |
| `fix` | derived | Deterministic router in `reasons.json`. Never a copay card for non-commercial payers. |
| Time to fill (`started_at`) | generated, calibrated | Base 1–3 days. +4 days if PA (Surescripts median). ~14% at ≥7 days. PA decision clock ≤72 h for Part D. |
| `amount_usd` (quote) | derived from real inputs | NADAC × qty × plan design. Medicare: $615 deductible, then 25% coinsurance, capped at $2,100/yr. Maria keeps her approved "$410 demo quote". **Any new on-screen dollar figure needs owner approval** (CLAUDE.md "all others: ask"). |
| RxFill / hub `status_text` | generated | Only the listed vocabularies (Dispensed · Partially dispensed · Not dispensed/returned to stock · Transferred; hub statuses as in CLAUDE.md) |
| Market-context numbers (`/access`, `/board`) | **real** | CMS geo 2024, SPUF 2026, NADAC 2026, with source and year shown |

## 4. Risks

- **Real people and orgs.** Only aggregates from the CMS prescriber file and NPPES. Never render rows, since the provider-level CMS file contains names and NPIs. Synthea's `organizations.csv` uses real facility NPIs, and its payers are real insurer brands: strip both. The synthetic NPI is unassigned *today* and could be issued later, so re-check it or omit it.
- **Label-text rule.** The CMS quarterly spending API returns a `Drug_Uses` monograph paragraph ("USES: This medication is used to treat…"). It is not FDA label text. Never render it.
- **No drug suggestions.** The formulary data shows every GA plan covers *some* adalimumab even when Humira isn't covered. Don't turn that into an "alternative product" hint, because rule 2 forbids it.
- **Stale years.** CMS prescriber and spending data are 2024. Quarterly spending runs to 2026 Q1. Formulary data is 2026 (Q2 plus Sep monthly). NADAC is current to 2026-09-23. The IQVIA out-of-pocket curve is **2020**. The AMA survey is Dec 2024. The Otezla MFP applies from **2027**. Label each number with its year.
- **Scope of the stats.** Surescripts' 27% covers all new e-prescriptions, not specialty. IQVIA's 65% covers *novel* launches. Use them as a range, not as facts about Otezla or Humira. The 14.2% quote is Surescripts citing a JMCP paper; I didn't read the paper.
- **Licensing.** CMS, data.medicaid.gov, openFDA, NLM RxNav, NPPES and CDC are US-government public data. KFF, Surescripts, IQVIA and AMA numbers are fine to quote with attribution, but don't republish their datasets. Synthea is Apache-2.0, with a SNOMED "fair use" note. The Census API now needs a (free) key.
- **Contract changes.** The Humira RxCUI and the Otezla NDC fix touch `mock/patients.json`, which is Vihn's contract, so they go through `docs/for-vihn.md`. A generator under `scripts/` is also Vihn's.

## Appendix: exact queries that worked

```
# CMS catalog (finds current dataset ids)
curl -s https://data.cms.gov/data.json
# Part D by Geography & Drug, DY2024
curl -s "https://data.cms.gov/data-api/v1/dataset/9b4c142c-69cc-4a96-a09a-7cf2ba7f5816/data?filter%5BBrnd_Name%5D=Otezla&size=100"
curl -s "https://data.cms.gov/data-api/v1/dataset/9b4c142c-69cc-4a96-a09a-7cf2ba7f5816/data?filter%5BGnrc_Name%5D=Adalimumab&filter%5BPrscrbr_Geo_Desc%5D=Georgia&size=100"
# Part D by Geography & Drug, DY2023 (trend)
curl -s "https://data.cms.gov/data-api/v1/dataset/3463648b-1971-478d-84ca-80cadc758153/data?filter%5BBrnd_Name%5D=Otezla&size=100"
# Part D Prescribers by Provider & Drug (aggregate counts only)
curl -s "https://data.cms.gov/data-api/v1/dataset/9552739e-3d05-4c1b-8eff-ecabf391e2e5/data?filter%5BBrnd_Name%5D=Otezla&filter%5BPrscrbr_State_Abrvtn%5D=GA&size=5000"
# Part D Spending by Drug (annual 2020-2024) / quarterly / Medicaid spending
curl -s "https://data.cms.gov/data-api/v1/dataset/7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b/data?filter%5BBrnd_Name%5D=Humira(Cf)%20Pen"
curl -s "https://data.cms.gov/data-api/v1/dataset/4ff7c618-4e40-483a-b390-c8a58c94fa15/data?filter%5BBrnd_Name%5D=Otezla"
curl -s "https://data.cms.gov/data-api/v1/dataset/be64fce3-e835-4589-b46b-024198e524a6/data?filter%5BBrnd_Name%5D=Otezla"
# NADAC 2026 (dataset list: https://data.medicaid.gov/api/1/metastore/schemas/dataset/items)
curl -s -G "https://data.medicaid.gov/api/1/datastore/query/fbb83258-11c7-47f5-8b18-5f8e79f7e704/0" \
  --data-urlencode "conditions[0][property]=ndc" --data-urlencode "conditions[0][value]=55513013760" \
  --data-urlencode "sorts[0][property]=as_of_date" --data-urlencode "sorts[0][order]=desc" --data-urlencode "limit=3"
# (same with 00074055402 and 00074433902)
# Medicaid SDUD 2025, Georgia
curl -s -G "https://data.medicaid.gov/api/1/datastore/query/158a1baa-5506-400a-8ec3-97756f0b0536/0" \
  --data-urlencode "conditions[0][property]=state" --data-urlencode "conditions[0][value]=GA" \
  --data-urlencode "conditions[1][property]=product_name" --data-urlencode "conditions[1][value]=OTEZLA%" \
  --data-urlencode "conditions[1][operator]=LIKE" --data-urlencode "limit=500"
# Part D formulary (range-read only the small members, ~10 MB)
python3 scratchpad/httpzip.py "https://data.cms.gov/sites/default/files/2026-07/64c8d9e1-f350-45e5-88d8-5a2acce2b2d4/SPUF_2026_20260701.zip"
python3 scratchpad/httpzip.py "https://data.cms.gov/sites/default/files/2026-09/903ba816-d276-4c17-9b5a-0224bbd4e949/2026_20260916.zip"
# CMS negotiated prices
curl -sL -A "Mozilla/5.0" -O "https://www.cms.gov/files/zip/selected-drug-list-negotiated-prices-also-known-maximum-fair-prices-statutezip.zip"
# openFDA / RxNav
curl -s -G https://api.fda.gov/drug/ndc.json --data-urlencode 'search=brand_name:"Otezla"' --data-urlencode limit=50
curl -s "https://rxnav.nlm.nih.gov/REST/ndcstatus.json?ndc=00074055402"
curl -s "https://rxnav.nlm.nih.gov/REST/drugs.json?name=humira"
# NPPES (counts only; wildcard ZIP catches ZIP+4; filter results on taxonomy code + LOCATION zip)
curl -s "https://npiregistry.cms.hhs.gov/api/?version=2.1&taxonomy_description=Dermatology&postal_code=30309*&address_purpose=LOCATION&limit=200"
curl -s "https://npiregistry.cms.hhs.gov/api/?version=2.1&number=1100938202"   # -> {"result_count":0,"results":[]}
# CDC PLACES
curl -s "https://data.cdc.gov/resource/swc5-untb.json?stateabbr=GA&locationname=Fulton&measureid=ARTHRITIS"
# Synthea
curl -sL -O https://github.com/synthetichealth/synthea/releases/download/master-branch-latest/synthea-with-dependencies.jar
curl -sL -O https://synthetichealth.github.io/synthea-sample-data/downloads/latest/synthea_sample_data_csv_latest.zip
```

NPI check-digit (Luhn with the 80840 prefix), as used:
```python
def npi_check(first9):
    s = "80840" + first9; t = 0
    for i, ch in enumerate(reversed(s)):
        d = int(ch)
        if i % 2 == 0:
            d *= 2; d = d - 9 if d > 9 else d
        t += d
    return first9 + str((10 - t % 10) % 10)   # npi_check("123456789") == "1234567893"
```
