# Presentation teaching pages. Product facts: main 015c342; no new app execution.
def feature_card(title,who,does,why,limit,y,h=120):
    h=max(h,110)
    rect(48,y,516,h,PALE)
    rect(48,y,4,h,TEAL,r=1)
    t=text(title,64,y+11,486,10,TEAL,True)
    end=text('<b>Who:</b> '+who+'<br/><b>What:</b> '+does+'<br/><b>Why:</b> '+why+'<br/><b>Boundary:</b> '+limit,64,t+6,486,9.6,leading=12.5)
    if end>y+h-7: overflows.append((page,'feature_card',title))

start('Why the industry cares','Industry feedback / Understand the problem','The team reports that an Impiricus representative called the problem one of the industry’s biggest. Treat that as qualitative feedback on importance.','Sources: [A] Surescripts; [B] AMA; [G] Impiricus. Feedback is team-reported, not a formal endorsement or an industry ranking.')
card('THE PROBLEM IN ONE SENTENCE','A prescription can be sent successfully while the patient still has no confirmed fill, the barrier needs attention, and the next person responsible is unclear.',48,148,h=85)
node('Prescribed','The doctor sends an order.',48,254,152,73)
node('The access gap','Cost, coverage, contact or another reported barrier.',218,254,158,73,col=RED)
node('Fill confirmed','A separate pharmacy signal closes this step.',394,254,170,73)
arrow(201,290,217,290); arrow(377,290,393,290)
table(['Why it matters','Evidence or implication'],[
    ('Patient access','Surescripts reports 27% of new e-prescriptions to fill-reporting pharmacies in its January 2026 analysis were never dispensed. Not a FirstDose result.'),
    ('Practice workload','AMA’s 2025 physician survey reports 13 physician/staff hours per physician per week on prior authorization. FirstDose does not automate all that work.'),
    ('Operational ownership','A status, a reason, an accountable next step and a later result are different pieces of information. FirstDose connects them in one case workflow.'),
    ('Partner relevance','Ascend connects HCPs to reps/resources; Spark includes prescription triggers. Our proposed fit is coordinator follow-through. Partner overlap still needs validation.')
],354,[132,384])
small('A useful distinction: importance of the problem, usefulness of the prototype, and measured impact are three different claims. The conversation supports the first; a pilot must establish the last.',48,677)

start('Features: the coordinator’s work','Feature explanation / The daily operator','Explain the job first, then point to the control. Proposed value is less searching and clearer ownership; time savings are not yet measured.','Source: current queue, case sheet, coordinator routes and local contact storage at main 015c342.')
feature_card('1 / QUEUE, FILTERS AND WAITING-ON STATUS','Access coordinator.','See needs-action, waiting and confirmed cases; filter the queue and see the reason, elapsed time and next owner.','Turn a scattered follow-up task into a visible work list.','The opening 3 / 2 / 8 counts are seeded fictional cases.',149)
feature_card('2 / CASE DETAIL, NEXT ACTION AND HISTORY','Coordinator reviewing one case.','Open the case to see its reported barrier, rule-selected action, messages and event history.','Keep the explanation and the next step beside the evidence.','A rule-selected resource is an administrative action, not a treatment recommendation.',283)
feature_card('3 / PRESCRIBER LINK AND APPROVAL','Coordinator requests; doctor approves in Profile.','The approved fictional relationship permits the case handoff into the coordinator workflow.','Make delegation explicit while keeping prescribing with the doctor.','Shared demo login and NPI format checks are not production identity verification; NPPES discovery is cut.',417)
feature_card('4 / CONTACT MARKS','Coordinator making follow-up calls.','Mark Reached patient or Left message in the case.','Leave a useful reminder of the contact attempt on that browser.','Device-local only. Clicking a mark does not place a call, send a message or update another browser.',551)
small('Say while showing it: “Here is who needs attention, why, who owns the next step, and what has already happened.”',48,694)

start('Features: the doctor’s view','Feature explanation / Approval and awareness','The doctor’s surface keeps relevant status and delegation close to the prescription. It is our DocUpdate-inspired concept.','Source: doctor screens, verified label facade and ntfy path at main 015c342; device evidence remains separately dated.')
feature_card('5 / NEW RX AND VERIFIED OTEZLA LABEL','Doctor in the synthetic prescribing flow.','Record the demo order and inspect cached label sections verified against saved DailyMed source and drug identity.','Put source-backed reference text beside the workflow.','No real prescription is sent. Otezla and Humira have verified cached label artifacts. This is not an AI-generated drug label.',149)
feature_card('6 / ALERT, HANDOFF, CONCIERGE AND WATCH','Doctor responding to a reported barrier.','Use the alert or Concierge’s Help my patient start to hand off. Follow the fill line; ntfy supplies alerts.','Assign the work and see the later fill signal.','Concierge’s samples/rep options are disabled. No Gemini reason means no reason alert. Server acceptance is not watch receipt.',283)
feature_card('7 / SEARCH, PATIENT DETAILS AND BEFORE-VISIT NOTE','Doctor reviewing a case or preparing for a visit.','Find the fictional patient, history and fill status. A prepared before-visit card can flag missing confirmation.','Keep unresolved access status available for review.','The before-visit card needs a scripted/offline event; no automatic live appointment trigger. Missing confirmation is not treatment failure.',417)
feature_card('8 / OPTIONAL SPOKEN HANDOFF','Doctor with a working microphone and live session.','Grok transcribes the supported request and proposes a case; the doctor confirms before handoff.','Offer another input path for the same administrative task.','Human/device and full recording-through-approval reset safety remain unverified. Keep the button path ready.',551)
small('Say while showing it: “The doctor can see the reported problem, approve the helper, and hand over the work.”',48,694)

start('Features: the patient’s next step','Feature explanation / Clear resource and clear evidence','Keep the patient experience simple. There are three different receipts; do not narrate them as one event.','Source: patient page, persisted message APIs, templates and pharmacy simulator at main 015c342.')
feature_card('9 / QR-OPENED RESOURCE PAGE','Patient, or a judge playing the patient.','Open the case page and see the approved card/resource and current status.','Make the selected next step available on the phone.','A web resource stand-in: no SMS, Apple Wallet issuance, redeemable credential or real partner fulfillment.',149)
feature_card('10 / APPROVED ENGLISH/SPANISH MESSAGE + AUDIO','Coordinator selects/approves; patient reads or listens.','After the scripted Otezla card-resend fix, the template and pre-generated ElevenLabs audio appear on the patient page.','Offer a controlled message in two languages and an audio format.','Not general messaging, runtime advice or Humira audio. Native pronunciation/physical playback still need review.',283,h=130)
heading('11 / Three receipts, three meanings',441)
node('Message acknowledged','The message acknowledgment is recorded.',48,478,156,88)
node('Resource acknowledged','The card/resource tap is recorded. Fill is still pending.',222,478,156,88)
node('Pharmacy fill signal','A separate pharmacy event confirms the fill step.',396,478,168,88,col=PURPLE)
small('These boxes describe different evidence, not three required sequential clicks. A message acknowledgment does not use the card; a card acknowledgment does not confirm a fill.',48,585)
card('THE LINE TO SAY ON STAGE','“That tap records acknowledgment. Watch: the fill remains pending. Only this separate simulated pharmacy confirmation changes the fill state. Even a fill does not prove a dose was taken.”',48,636,h=82,accent=PURPLE)

start('Features: intelligence and evidence','Feature explanation / How the workflow earns trust','Name each technology only after explaining its job and why that job matters.','Sources: classifier, router, analytics, public reference data and workflow modules at main 015c342; [C/D] CMS for market context.')
feature_card('12 / GEMINI REASON CLASSIFICATION','The workflow, on a supported pharmacy/hub note.','Map the fictional source note into one allowed reason code or null.','Make reported barriers usable by a consistent workflow.','No invented reason on failure; a four-second timeout becomes null. AI does not select the fix.',149,h=103)
feature_card('13 / DETERMINISTIC RESOURCE ROUTING','Server, followed by coordinator review/action.','Use the reason and explicit eligibility flags to choose a permitted resource path.','Keep administrative choices repeatable and constrained.','Unknown/ineligible cases use access support; simulated programs do not prove real eligibility or fulfillment.',265,h=103)
feature_card('14 / TIGER FILL, TIME AND REASON SUMMARY','The proposed access-program/buyer view.','Read run-scoped confirmed-fill counts, median time to first fill and reason counts.','Let reviewers inspect observed workflow results, not just clicks.','Synthetic results are not impact or ROI. Direct hypertable query; no continuous aggregate or coordinator-activity tiles.',381,h=103)
feature_card('15 / PUBLIC MARKET CONTEXT','Team or prospective buyer exploring rollout.','Show sourced Georgia prescribing/formulary reference data separately from demo case metrics.','Ground a market discussion in named datasets rather than invented demand.','Claims, prescribers, practices and customers are different units. These data do not establish our addressable market.',497,h=103)
small('<b>16 / Shared state and safeguards.</b> Supabase commits guarded events; 1.5-second polling refreshes screens. Run/revision checks and duplicate handling protect consistency. Tiger receives allowlisted HMAC metrics; the demo login is not a production role/privacy system.',48,623)
small('ELI5: Gemini reads the label on a problem; the rulebook chooses an allowed task; the notebook remembers it; the scoreboard counts later evidence.',48,689)

start('Explain every feature without rushing','Presentation coaching / One connected story','Completeness means every feature has a clear job. Stage time belongs to the core workflow; optional paths and engineering details belong in questions.','Feature scope: main 015c342. NPPES discovery and coordinator-specific activity tiles are cut. Partner services remain simulated.')
card('USE THIS SENTENCE FOR EACH FEATURE','“For [person], this [feature] shows or does [specific action], so they can [next step]. Here is what the demo proves.” Then point to the screen and perform the action.',48,148,h=86)
table(['Feature group','Short demonstration line'],[
    ('Coordinator queue','“This is the work list: who needs attention, why, and who acts next.”'),
    ('Doctor + source label','“The order starts the workflow; the Otezla reference text has a saved source.”'),
    ('Reason + rule + handoff','“Gemini reads the reported reason. Rules constrain the resource. The doctor delegates; the coordinator acts.”'),
    ('Patient message/resource','“The patient gets the approved resource and, for Otezla, a message they can read or hear.”'),
    ('Acknowledgment vs fill','“The tap stays pending. This separate simulated pharmacy event confirms the fill.”'),
    ('Tiger summary','“Now count the recorded fills and time in this synthetic run; these are not pilot outcomes.”')
],263,[151,365])
heading('17–20 / Explain the demo controls too',605)
small('<b>Setup/QR:</b> prepares the right screens. <b>Seed/reset:</b> loads a repeatable fictional week or starts a clean run; reset clears links/messages. <b>Simulator + raw RxFill-shaped view:</b> supplies labeled pharmacy evidence, not a live pharmacy feed. <b>Board:</b> optional timeline display for the audience; not another user product.',48,636)
small('Keep optional voice, before-visit detail and public-market tiles ready for questions. Do not promise every feature as a separate live scene in a four-minute pitch.',48,688)
