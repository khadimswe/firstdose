def master_cover():
    start('FirstDose','Master presentation & technical guide','One shared story for Khadim, Vinh and Minh. September 26, 2026.','Problem source [A]: Surescripts analysis, January 2026; population details on page 8.')
    rect(48,152,516,226,INK)
    text('27%',70,171,470,76,'#FFFFFF',True,84)
    text('of new prescriptions in Surescripts’<br/>analysis were never dispensed.',72,273,460,21,'#FFFFFF',True,28)
    text('One missed fill. One accountable next step.',72,344,460,13,'#C8D8EE',True)
    card('THE PRODUCT','A daily access-coordinator queue that connects a reported barrier, a reviewed next step and a later pharmacy fill signal. Proposed as an Ascend skill with a DocUpdate-style doctor experience.',48,402,h=108)
    heading('Learn the pitch. Understand the system.',540)
    bullets([
        ('Say it.', 'Openings, a timed 3:15 script, stage directions and fallbacks.'),
        ('Back it up.', 'Sourced statistics, value hypotheses and transparent business math.'),
        ('Explain it.', 'Screens, diagrams, data flow, rules, AI boundaries and judge Q&A.')
    ],578)
    small('Synthetic cases and pharmacy activity. Proposed partner integrations. Source: main 015c342. Both labels verified; five source clips added. Recorded browser evidence and physical-device acceptance are separate.',48,693)

def master_contents():
    start('Find what you need fast','Reading paths / Click a page reference','Full named script: pages 4–5. Individual scripts: 41–43. Feature explanations: 35–40.')
    items=[
        ('03','20-second opening + 30-second summary'),
        ('04–05','The complete 3:15 demo script'),
        ('06','Operators, setup, two-minute cut and failure lines'),
        ('07','Impiricus, DocUpdate, Ascend, Spark and FirstDose'),
        ('08–09','The problem: evidence, scope and cost barriers'),
        ('10–13','Savings, buyer, profitability and research inventory'),
        ('14–16','Actual screens and the core case workflow'),
        ('17–22','Architecture, events, routing, labels, privacy and metrics'),
        ('23–25','Current status, API walkthrough and exact demo copy'),
        ('26–27','Judge questions: product, technology and partner fit'),
        ('28–30','Glossary, teach-back practice and one-page cheat sheet'),
        ('31–34','Sources and latest-push evidence / deployment gates'),
        ('35–40','Industry problem + complete feature explanations'),
        ('41–43','Individual scripts: Khadim, Vinh and Minh'),
        ('44–45','Latest script corrections and newly verified sources')
    ]
    y=153
    for pages,title in items:
        target=int(pages.split('–')[0]); rect(48,y,64,30,PALE,r=5)
        text(pages,58,y+7,47,10,TEAL,True)
        text(title,128,y+6,426,10.8)
        c.linkRect('',f'p{target}',(48,H-y-31,564,H-y),relative=0,thickness=0)
        y+=34
    small('How this was combined: Deem’s supplied speaking prep + the revised research/technical guide. Conflicting lines were reconciled against source evidence; unsupported claims were rewritten.',48,683)

def master_openings():
    start('The opening and the short answer','Khadim / Problem first, then product','Keep the first sentence concrete. The complete speaker script follows on pages 4–5.','[A] Surescripts January 2026; [J] DocUpdate headline. New source details on page 45.')
    card('WALK-UP / ABOUT 10 SECONDS','“Sending a prescription does not finish the job. FirstDose connects a reported barrier to the coordinator who can act. Put this on.”',48,151,h=101)
    small('Hand the judge the watch. Offer it only if that device path is ready; never promise a buzz before receipt.',48,264)
    card('FIRST 15–20 SECONDS','“DocUpdate’s headline says: ‘The prescription was sent. The patient still never started it.’ Surescripts found 27 percent were never dispensed in its analysis. Sending a prescription does not finish the job.”',48,307,h=126)
    heading('If you get only 30 seconds',460)
    para('“FirstDose is a daily queue for access coordinators. It connects a reported prescription barrier to a reviewed task and a later pharmacy fill signal. We propose it as an Ascend skill for DocUpdate. This is a fictional demonstration; the next proof is a practice pilot measuring staff effort and confirmed fills.”',493,size=11)
    card('ELI5','Sending an order is not the same as getting it. FirstDose is the shared checklist that notices a stuck step, assigns a helper, and waits for a separate receipt.',48,622,h=88,accent=PURPLE)

SCRIPT=json.loads((SOURCE/'pitch_script.json').read_text(encoding='utf-8'))
script_lines=SCRIPT
speakers={row['time']:row['speaker'] for row in SCRIPT}
operators={row['time']:row['operator'] for row in SCRIPT}

def cue(row,y):
    text(row['time'],48,y,83,9.2,TEAL,True)
    text(row['speaker'].upper(),48,y+16,83,8.4,PURPLE,True)
    end=text(row['title'],140,y,424,10.4,INK,True,13)
    spoken=row['say'].replace('. ','.<br/>') if row['speaker']=='Minh' else row['say']
    end=text('“'+spoken+'”',140,end+3,424,9.4,leading=12.3)
    end=text('<b>Show:</b> '+row['show'],140,end+4,424,8,MUTED,leading=10.3)
    return end+12

def master_script_a():
    start('The master script · first half','Performance / 0:00–1:35','Khadim opens; Vinh drives the demonstration; Minh has a short AI explanation. Timings are rehearsal targets.','Fictional cases and simulated pharmacy/partner services. Read operator directions silently.')
    y=146
    for row in SCRIPT[:7]: y=cue(row,y)

def master_script_b():
    start('The master script · second half','Performance / 1:35–3:15','Pause after the patient tap. Then show the separate pharmacy confirmation. Khadim closes.','Optional audio requires the approved message. Physical alert receipt must be observed in the run.')
    y=146
    for row in SCRIPT[7:]: y=cue(row,y)

def master_runbook():
    start('Run the table without losing the story','Operators / Setup and fallbacks','Khadim: opening, business and close. Vinh: desktop, phone, patient, watch and build questions. Minh: short AI scene, labels and classification; helps operate the simulator on cue.')
    table(['Before judges arrive','Check'],[
        ('One known run','Check build/mode; coordinate reset. Seed the queue, then request and approve the interactive coordinator link again. Reset clears links and messages.'),
        ('Three ready surfaces','Coordinator desktop, doctor phone, patient phone. Prepare the private demo login and a spare phone before handing over the QR.'),
        ('Verify the proof beats','Patient tap remains pending; separate simulator confirmation updates the other device. Confirm the Otezla card, sound and actual watch path.'),
        ('Prepare James after queue','Sign James’s order (ev_14), then fire ev_16–18 in order before 2:15. If unready, skip or disclose a prepared replay. Null stays unclassified; use access support.')
    ],150,[146,370])
    heading('Short, honest recovery lines',425)
    bullets([
        ('Watch does not arrive.', '“The alert is visible here; wrist delivery did not arrive in this run.” Show the phone alert.'),
        ('QR or login stalls.', '“Use our prepared patient phone for this step.” Keep the same case and run.'),
        ('Network fails.', '“I’m switching to a labeled replay/recording of the workflow.” Explain that it is a fallback.'),
        ('Time is short.', 'Cut James first, then optional audio/voice and analytics detail. Keep the separate acknowledgment and confirmation.')
    ],458)
    small('Two-minute cut: opening → queue/barrier → handoff → resource → acknowledgment still pending → separate fill → close. A recorded three-browser check is not a current physical-device check.',48,688)

def master_ecosystem():
    start('Where FirstDose would fit','Product landscape / The proposed integration','The diagram is our proposed product placement. It does not indicate a live Impiricus partnership.','Public product roles: [E] DocUpdate FAQ, [G] Impiricus products. Resource concepts: project spec [1].')
    node('Practice side','Coordinator desktop + doctor phone',48,151,245,67)
    node('Partner side','Impiricus / Ascend resources',319,151,245,67,col=PURPLE)
    arrow(171,219,171,247); arrow(442,219,442,247)
    node('FirstDose concept','Reported barrier → reviewed task → resource → separate pharmacy confirmation',48,250,516,72)
    table(['Name','Plain-language role / boundary'],[
        ('DocUpdate','Prescriber-facing application. Our phone view is a FirstDose concept modeled on that experience, not the actual partner application.'),
        ('Ascend','Impiricus describes real-time access to representatives and brand resources. Proposed home for this workflow; integration is simulated here.'),
        ('Spark','Lists first-time prescriptions among multiple engagement triggers. FirstDose demonstrates coordinator work after a reported barrier; we do not claim Spark cannot address it.'),
        ('Wallet / Concierge / partners','Named resource paths in the concept: card delivery, support and sample requests. FirstDose does not currently call real partner fulfillment APIs.')
    ],348,[136,380])
    card('WHY THIS IS USEFUL TO A PARTNER','The hypothesis is a repeatable staff workflow around an actionable prescriber engagement. Validate the overlap and distribution opportunity with the partner; do not claim an untouched market.',48,632,h=83,accent=PURPLE)

def master_cost_evidence():
    start('Cost is a real barrier—use the right year','Backup evidence / Historical association','A useful supporting fact, not a prediction of what FirstDose will change.','[H] IQVIA, Michael Kleinrock, October 8, 2020. Historical prescription-cost discussion.')
    card('WHAT THE PRIMARY SOURCE REPORTS','IQVIA’s October 2020 account reports <b>44% abandonment when prescription out-of-pocket cost exceeded $125</b>, and <b>more than 60% when cost exceeded $500</b>. These describe historical populations.',48,151,h=111)
    rect(48,291,516,118,INK)
    text('Cost barrier ≠ program eligibility',67,312,478,23,'#FFFFFF',True)
    text('A price problem identifies work to review. It does not prove that a particular person qualifies for a card or sample.',69,352,474,12,'#FFFFFF')
    heading('How to use it in questions',440)
    bullets([
        ('Say the date.', '“Historical IQVIA research also associates higher out-of-pocket costs with greater abandonment.”'),
        ('Keep the groups separate.', 'The >$125 and >$500 thresholds overlap. They are not additive slices of the population.'),
        ('Do not infer a treatment effect.', 'These figures do not say that reducing a demo quote from $410 to $0 will recover a given share of prescriptions.'),
        ('Keep 27% as the opening.', 'The newer Surescripts first-fill statistic has a different population and definition; do not blend the two datasets.')
    ],478)
    small('Source choice: this master uses the directly checked October 2020 account’s 44% and >60%. The supplied prep used a different 2020 reference for <5% / 45% / 60%; do not interchange the series.',48,693)

def master_api():
    start('Trace an action all the way through','Technical reference / Requests and committed events','A screen asks; the server checks; the database commits; other screens refresh.','Sources [4], [7], [14]: workflow, live adapter and latest analytics modules.')
    table(['Route / component','What to explain'],[
        ('POST /api/rx','Starts the fictional prescription workflow.'),
        ('POST /api/handoff','Validates the case and coordinator flow, then records the handoff.'),
        ('POST /api/fix','Checks the requested action against server-side routing and case state.'),
        ('POST /api/patient/use','Emits the resource acknowledgment event only. For the interactive case this is ev_10.'),
        ('POST /api/sim/fire','Accepts an ordered list of scripted IDs. ev_11 is the separate simulated pharmacy confirmation after acknowledgment.'),
        ('GET /api/events','Returns run identity, revision and events. The live adapter polls and rejects stale state.'),
        ('Reset / coordinator / message','Reset begins a new run; coordinator approval and patient messages have their own persistence routes.'),
        ('GET /api/access/summary','Authenticated replay-before-read and matching run/revision headers. Recorded live summary passed. Stale = 409; unavailable = 503.')
    ],151,[193,323])
    card('ELI5: ASK, CHECK, WRITE, READ','Two people can press a button. The server and database decide what is allowed to become a line in the notebook. Every screen then reads the accepted story.',48,627,h=87)

def master_copy():
    start('Read the real copy; explain the tags','Demo reference / Exact templates','Use the current display text when narrating a case. Do not replace pending status with an invented clinical conclusion.','Source [6]: mock/templates.json at main 015c342. Values below fill existing fictional-case template variables.')
    card('PENDING ALERT','“Maria Lopez: Otezla first fill pending”',48,151,h=74)
    card('AFTER THE RESOURCE TAP','“Maria Lopez acknowledged the Otezla savings card. Pharmacy fill confirmation is still pending.”',48,244,h=87,accent=GOLD)
    card('AFTER SEPARATE PHARMACY CONFIRMATION','“Maria Lopez: Otezla pharmacy fill confirmed. This does not confirm treatment start.”',48,350,h=88,accent=PURPLE)
    card('UNRESOLVED BEFORE-VISIT VIEW','“James Carter: Humira first fill confirmation is still pending. Review fill status before the visit.”',48,457,h=88)
    heading('What “New · FirstDose” means',574)
    para('“The tags highlight our proposed additions. The surrounding interface is our concept of the DocUpdate experience.”',607,size=12)
    small('The tags now exist in code. They do not turn our UI into the real partner app or prove exact feature parity. Before-visit copy needs a prepared scripted/offline event; no automatic live visit trigger. Otezla and Humira labels verified in merged source.',48,670)

def master_extra_qa():
    start('Partner and evidence questions','Judge Q&A / Short answer, then proof','Keep the user benefit clear while naming the integration boundary.')
    questions=[
        ('“Isn’t this already Spark?”','Spark lists multiple engagement triggers. Our proposed contribution is the coordinator’s barrier-to-task-to-follow-up workflow. We need partner feedback on overlap.'),
        ('“Don’t you rebuild Wallet or DocUpdate?”','The demo reproduces enough UI to show the concept. We propose routing to existing resources; real partner APIs are stand-ins here.'),
        ('“Where would a real fill signal come from?”','A licensed and validated pharmacy/network integration. Our simulator uses pharmacy-shaped status vocabulary; that alone does not establish network compatibility or certification.'),
        ('“Does pharma see patient names?”','The intended partner view contains aggregates. The shared demo login and prototype boundaries do not establish production role isolation. Internal hashed metrics are pseudonymous, not automatically anonymous.'),
        ('“Does it send SMS?”','The demonstrated patient path is a QR-opened web page. Messages/audio play there. The wrist path uses ntfy push to the paired phone/watch.'),
        ('“Why use synthetic records?”','They make the demo repeatable without real patient records. Real operation needs appropriate access, privacy controls and partner agreements; HIPAA is not a blanket ban on all authorized use.'),
        ('“Have you proven the economics?”','No. The model shows what must be true. We need measured net staff time, actual delivery costs and a budget owner willing to pay.')
    ]
    y=151
    for q,a in questions:
        y=text(q,48,y,516,11,TEAL,True)+5
        y=text(a,48,y,516,10.3)+16
    small('Sources: [E], [G], [I]; current project boundaries in [3], [10], [14].',48,716)

def master_cheat():
    start('Your one-page judging cheat sheet','Final review / Keep these distinctions straight','This is the page to revisit immediately before presenting.')
    table(['Remember','Say it precisely'],[
        ('Problem','27% in Surescripts’ January 2026 study; scope: new e-prescriptions to fill-reporting pharmacies.'),
        ('Main user','Coordinator owns the recurring work; the prescriber approves and handles relevant handoffs.'),
        ('Core proof','Patient acknowledgment stays pending. Separate simulated pharmacy confirmation changes the fill state.'),
        ('Technical contribution','Guarded commands, atomic events, run/reset isolation, polling, deterministic routing and sourced labels.'),
        ('AI boundary','Gemini returns a reason or null; rules choose the fix. Null gets no reason alert and uses access support. Voice proposes a confirmed handoff.'),
        ('Status update','Gemini/Tiger merged and recorded live. Frontend repairs merged; physical-device proof remains. Otezla and Humira labels verified in merged source.'),
        ('Value and business','Potentially less staff effort. Pricing, partner payment and profit are hypotheses; illustrative numbers are not measured outcomes.'),
        ('Do not claim','Prevented escalation, real partner fulfillment, instant fill from a tap, certified network compatibility, guaranteed savings or production compliance.')
    ],151,[139,377])
    card('LAST LINE','“One missed fill. One accountable next step.”',48,631,h=67,accent=PURPLE)
    small('Cut optional scenes before cutting the disclosure or the acknowledgment/confirmation distinction. Name any switch to mock replay or recorded footage.',48,705)

def master_extra_sources():
    start('Additional sources and reconciliation','Evidence / What changed when the guides were combined','This master replaces the earlier guides for rehearsal. Implementation status is tied to a dated source snapshot.')
    rows=[
        ('G','Impiricus product descriptions','https://www.impiricus.com/our-products/','Used for Ascend and Spark roles. These are the vendor’s descriptions, not evidence of a FirstDose partnership.'),
        ('H','IQVIA historical affordability discussion','https://www.iqvia.com/blogs/2020/10/drug-pricings-1-problem-prices-are-flat-or-down-for-most-people-but-youd-never-know-it','October 8, 2020 account: 44% above $125 and >60% above $500. Historical association; source-specific thresholds.'),
        ('I','HHS: treatment, payment and operations','https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/disclosures-treatment-payment-health-care-operations/index.html','Supports correcting the blanket “HIPAA forbids real data” claim. It is not an assessment of this prototype’s compliance.'),
        ('14','Latest claims and deployed evidence','https://github.com/khadimswe/firstdose/blob/'+SHA+'/docs/claims-audit.md','Use the top dated refresh; older audit sections are historical. Merged/live Gemini and Tiger evidence supersedes missing-provider claims. Latest gates and scope cuts: page 34.')
    ]
    y=151
    for key,title,url,desc in rows:
        y=text(f'<b>[{key}] <link href="{url}" color="{TEAL}">{title}</link></b>',48,y,516,10.4)+6
        y=text(desc,48,y,516,10)+21
    heading('What was reconciled',499)
    para('The story keeps Deem’s coordinator-first pacing and judge participation. It now separates acknowledgment from confirmation, labels the partner concept, removes unproven clinical effects, treats payment as proposed, updates AMA survey timing, and corrects polling and Tiger status.',532)
    small('Inputs: Deem’s supplied FirstDose-Pitch-Prep.md; the revised FirstDose PDF and business-case notes; project code/docs at main '+SHA+'. Screens are saved hosted-audit captures preceding the frontend repairs. No fresh deployment, device, application-test or clinical evaluation was performed to produce this PDF.',48,618)
    small('All charts are either attributed external facts, explicitly synthetic fixture counts, or labeled economic assumptions. Financial arithmetic was checked; that does not validate willingness to pay or the assumed costs.',48,690)
