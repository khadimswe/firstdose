start('What changed in this revision','September 26 / Script aligned to main 015c342','Your new speaking order is preserved. These corrections make the same story hold up during questioning.','Code snapshot: 015c342. No fresh application, deployed Humira or physical-device test is claimed by this document.')
table(['Supplied line / topic','Use this version'],[
    ('Speaker ownership','Khadim opens/closes and takes business. Vinh drives the demo and build questions. Minh has a short AI scene and takes AI/label questions.'),
    ('Supabase Realtime','Supabase stores shared state; authenticated HTTP polling about every 1.5 seconds keeps the views current.'),
    ('James = prior auth','Earlier pharmacy reject 75 is prior auth. Gemini reads the later hub note about failed contact, expected UNABLE_TO_REACH. Rule: ACCESS_SUPPORT.'),
    ('Every event / counts only','Only allowlisted, reduced metric events reach Tiger. The view shows aggregates. HMAC identity is pseudonymous; shared demo login is not production buyer isolation.'),
    ('First staff seat / Wallet','Proposed staff workflow and partner integration. Wallet/QPharma/Medvantx fulfillment remain stand-ins; no claim that Impiricus has never served staff.'),
    ('New code and media','Both labels verified; Humira includes boxed warning and stronger identity checks. Minh sign-off and five original LFS source clips merged, not a final edited film.'),
    ('Fill / before visit','Acknowledgment is not fill. Simulated pharmacy confirmation is separate. Before-visit card needs a prepared scripted event; there is no live visit trigger.')
],151,[148,368])
small('Pricing per qualifying confirmed fill is a hypothesis. “Industry’s biggest problem” is team-reported qualitative feedback, not a ranked study or company endorsement.',48,692)

start('Sources behind the new script','Reference / Public facts and current implementation','Checked September 26, 2026. Preserve the population, date and uncertainty when quoting a number.')
rows=[
    ('J / DocUpdate headline','https://www.docupdate.io/articles/prescription-abandonment-the-prescription-was-sent-the-patient-still-never-started-it/','The supplied headline is real; the homepage dates the article July 9, 2026, by Sana Khateeb, PharmD. It establishes published problem recognition, not a FirstDose endorsement.'),
    ('K / Impiricus reach','https://job-boards.greenhouse.io/impiricus/jobs/5434527008','The company’s own job posting says more than one million opted-in HCPs. HCPs is broader than doctors. This is company-reported network reach, not FirstDose customers or active DocUpdate users.'),
    ('L / Workforce context','https://www.bls.gov/ooh/healthcare/medical-assistants.htm','Current page reports 833,900 medical-assistant jobs in 2025. The proposed 467,000 office estimate needs its 56% share independently sourced. Neither number measures access coordinators or customers. Removed from the timed pitch.'),
    ('M / Latest label and owner evidence','https://github.com/khadimswe/firstdose/blob/'+SHA+'/docs/minh-signoff-5.1.md','Humira PR #43 is now merged. Recorded branch-local label endpoint/render checks and 728 tests / 54 files; deployed Humira recheck remains distinct. Gemini pin and Tiger parity evidence are recorded here.'),
    ('N / Original demo clips','https://github.com/khadimswe/firstdose/blob/'+SHA+'/video/README.md','Five source recordings: Khadim beats 1–3, Minh beat 1, Vinh beat 1. Presence is not verification of spoken claims, a final edited submission or physical-device acceptance.')
]
y=151
for title,url,body in rows:
    y=text('<link href="'+url+'" color="'+TEAL+'"><b>'+title+'</b></link>',48,y,516,11)+6
    y=text(body,48,y,516,10.2)+19
card('WHY THE PROBLEM MATTERS','The evidence supports a substantial first-fill gap and recurring administrative work. FirstDose proposes a coordinator workflow around it. Savings, incremental fills, partner distribution and willingness to pay still need a pilot.',48,626,h=91,accent=PURPLE)
