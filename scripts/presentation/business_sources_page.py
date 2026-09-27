start('Problem and business evidence','Primary sources / Checked September 26, 2026','External facts support the problem. All FirstDose savings, prices and profit figures in this guide are scenarios.')
external=[
    ('A','Surescripts: First-Fill Abandonment','https://surescripts.com/products/first-fill-abandonment','27% of new prescriptions unfilled; footnote specifies January 2026 e-prescriptions sent to fill-reporting pharmacies. The company already sells monitoring/outreach data.'),
    ('B','AMA: 2025 Prior Authorization Physician Survey','https://www.ama-assn.org/system/files/prior-authorization-survey.pdf','December 2025 survey of 1,000 physicians: 40 requests per physician/week; 13 hours of physician-and-staff work; 40% report dedicated PA staff. Released in 2026.'),
    ('C','CMS: Otezla, Georgia, Part D 2024','https://data.cms.gov/data-api/v1/dataset/9b4c142c-69cc-4a96-a09a-7cf2ba7f5816/data?filter%5BBrnd_Name%5D=Otezla&amp;filter%5BPrscrbr_Geo_Desc%5D=Georgia&amp;size=10','614 prescribers and 6,661 claims. Claims include refills and are not first fills, practice counts, customers or addressable revenue.'),
    ('D','CMS: Humira(CF) Pen, Georgia, Part D 2024','https://data.cms.gov/data-api/v1/dataset/9b4c142c-69cc-4a96-a09a-7cf2ba7f5816/data?filter%5BBrnd_Name%5D=Humira%28Cf%29%20Pen&amp;filter%5BPrscrbr_Geo_Desc%5D=Georgia&amp;size=10','717 prescribers and 15,295 claims; specific branded product. Do not add prescriber counts across drugs to infer distinct practices.'),
    ('E','DocUpdate FAQ','https://www.docupdate.io/faq/','Staff and practice accounts are described as future roadmap work. The fill-confirmation statement is inside an answer about cancellation requests.'),
    ('F','AAMC: 2025 Key Findings','https://www.aamc.org/data-reports/data/2025-key-findings','866,460 physicians in direct patient care in 2024. This source supplies physician headcount, not access-coordinator headcount or customer demand.')
]
y=154
for key,title,url,desc in external:
    y=text(f'<b>[{key}] <link href="{url}" color="{TEAL}">{title}</link></b>',48,y,516,10.3)+5
    y=text(desc,48,y,516,9.6)+20
card('A PILOT TURNS A HYPOTHESIS INTO EVIDENCE','Measure net minutes and touches per case, unresolved-case age, observed fill outcomes, buyer willingness to pay and actual cost to serve. Define a comparison before claiming incremental fills or causal savings.',48,634,h=84,accent=PURPLE)
