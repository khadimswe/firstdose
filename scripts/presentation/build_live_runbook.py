"""Create the click-by-click rehearsal companion, using the shared PDF style."""
from pathlib import Path
import json
from xml.sax.saxutils import escape
import pymupdf as fitz
from PIL import Image

source=Path(__file__).resolve().parent
root=source.parents[1]
pdf_path=root/'docs/presentation/FirstDose-Live-Demo-Step-by-Step.pdf'
code=(source/'build_master.py').read_text(encoding='utf-8')
pre=code[:code.index("exec(compile((SOURCE/'master_pages_aligned.py')")]
pre=pre.replace("OUT = OUTPUT / 'FirstDose-Master-Guide.pdf'", "OUT = OUTPUT / 'FirstDose-Live-Demo-Step-by-Step.pdf'")
ns={'__file__':str(source/'build_master.py')}
exec(compile(pre,'shared_pdf_style','exec'),ns)
start,text,small,card,table,heading,node,arrow=[ns[x] for x in ['start','text','small','card','table','heading','node','arrow']]
c=ns['c']; c.setTitle('FirstDose | Live Demo: Click, Check, Say')
c.setSubject('Exact live demo operator actions, expected screen states, named spoken lines and recovery cues')
script=json.loads((source/'pitch_script.json').read_text(encoding='utf-8'))
say_at={row['time'].split('–')[0]:row['say'] for row in script}
md=['# FirstDose live demo: click, check, say\n',
    'September 26, 2026. Companion to the master and personal guides. Based on source main `015c342` and the user-reported rehearsal. This is an operator runbook, not a new automated deployment or device test.\n',
    'Use the live deployment on all devices. This runbook puts James after Maria so his alert does not interrupt her two-alert story. It supersedes the earlier suggestion to prepare James in the background. Rehearse the full sequence to your allotted time; spoken lines and physical interactions take different amounts of time.\n']

def page(title,deck):
    start(title,'Live demo / Click · Check · Say',deck,'Fictional patients and pharmacy activity. Partner services are stand-ins. Source snapshot: main 015c342.')
    md.append('\n## '+title+'\n\n'+deck+'\n')

def block(label,body,y,color=None):
    y=text(label,48,y,516,9.4,color or ns['TEAL'],True,12)+4
    return text(escape(body).replace('\n','<br/>'),48,y,516,10.4,leading=14)+11

def step(number,title,who,click,expect,say,speaker,checkpoint,y=148):
    y=text(f'{number}. {escape(title)}',48,y,516,14,ns['INK'],True,18)+8
    y=block('WHO / SURFACE',who,y)
    y=block('CLICK / DO',click,y)
    y=block('LOOK FOR',expect,y)
    y=block(speaker.upper()+' SAYS','“'+say+'”',y,ns['PURPLE'])
    y=block('CHECKPOINT',checkpoint,y,ns['GOLD'])
    assert y<719,(title,y)
    md.append(f'\n### {number}. {title}\n\n**Who / surface:** {who}\n\n**Click / do:** {click}\n\n**Look for:** {expect}\n\n**{speaker} says:**\n\n> '+say.replace('\n','\n> ')+f'\n\n**Checkpoint:** {checkpoint}\n')
    return y

page('Your table and device map','Keep this guide beside Minh’s operator controls. Read only the purple spoken lines aloud.')
table(['Surface / person','Open / purpose'],[
    ('Doctor phone / Vinh','<link href="https://firstdose.vercel.app/doctor" color="#087F8C">/doctor</link> — signs the fictional order, approves the coordinator and hands off.'),
    ('Patient phone / judge','<link href="https://firstdose.vercel.app/patient/rx_001" color="#087F8C">/patient/rx_001</link> — Maria’s resource and acknowledgment. Log in before handing it over.'),
    ('Audience screen / Minh clicks','<link href="https://firstdose.vercel.app/coordinator" color="#087F8C">/coordinator</link> → <link href="https://firstdose.vercel.app/board" color="#087F8C">/board</link> → <link href="https://firstdose.vercel.app/access" color="#087F8C">/access</link>. Vinh narrates and points.'),
    ('Operator / Minh','<link href="https://firstdose.vercel.app/sim" color="#087F8C">/sim</link> — supplies simulated pharmacy/hub inputs. Prefer a separate operator window/display.'),
    ('Watch / first judge','Use the tested paired-phone setup. Only claim receipt when the physical watch receives the alert.'),
    ('Khadim','Opens, introduces the proposed product, closes and leads business questions.')
],151,[151,365])
card('HOW TO READ THE DEMO','Doctor acts → pharmacy reports a barrier → coordinator sends a resource → patient acknowledges → separate pharmacy confirmation. The simulator supplies outside events; it does not sign the prescription.',48,526,h=96)
small('Live data should appear at the top of /sim. Use the same deployment everywhere. A nearly empty patient screen before the resource is sent is expected. Disabled Fire buttons usually mean a prerequisite is missing. Do not use autoplay for this live walkthrough.',48,645)
md.append('''
| Surface | Link | Operator |
|---|---|---|
| Doctor | https://firstdose.vercel.app/doctor | Vinh |
| Maria patient | https://firstdose.vercel.app/patient/rx_001 | Second judge |
| Coordinator | https://firstdose.vercel.app/coordinator | Minh clicks; Vinh narrates |
| Board | https://firstdose.vercel.app/board | Audience screen |
| Market Access | https://firstdose.vercel.app/access | Audience screen |
| Simulator | https://firstdose.vercel.app/sim | Minh |

Confirm **Live data** on /sim and use the same deployment. Log in on both browsers/phones beforehand. The doctor app does not replace the laptop’s Market Access dashboard. The simulator supplies pharmacy/hub inputs; prescriptions are signed on the doctor UI.
''')

page('Before judges arrive: reset and link','This page is setup, not part of the timed pitch. Have everyone pause clicks while the shared run resets.')
y=block('A / RESET AND SEED — MINH, OPERATOR',
    'Click Reset → Confirm reset immediately. Wait for “0 committed events.” Click Seed under “Seed the week” before prescribing or firing anything. Confirm the coordinator queue shows 3 needing a fix, 2 waiting, 8 filled.',151)
y=block('B / APPROVE — COORDINATOR THEN DOCTOR',
    'Coordinator: Prescribers → Request Dr. Nadia Okafor approval. Doctor phone: Profile → Review request → Approve. Confirm Linked, then return the phone home and the audience screen to the queue.',y+5)
y=block('C / READY CHECK',
    'Maria and James have not been prescribed in this run. The patient phone is logged in on Maria’s page. Operator inputs are waiting for their prerequisites. The 8 fills are background cases; the board follows the interactive cases.',y+5)
card('IF SEED SHOWS invalid_transition','The server only seeds an empty workflow run (or treats an already-complete seed as a no-op). Pause other clicks, reset, verify 0 committed events, then Seed. If the count is nonzero, a prescription/event already happened. Do not repeatedly click Seed.',48,472,h=116,accent=ns['GOLD'])
small('Reset begins a fresh shared run and clears the current coordinator link/messages. Approve again after reset. A refresh can reload a stale screen; it does not itself reset the shared run. Background seed events do not send watch alerts.',48,622)
md.append('''
1. Pause other clicks. Operator: **Reset → Confirm reset** immediately.
2. Wait for **0 committed events**, then **Seed**. Do this before any prescription or simulator input.
3. Confirm coordinator counts **3 / 2 / 8**.
4. Coordinator: **Prescribers → Request Dr. Nadia Okafor approval**.
5. Doctor: **Profile → Review request → Approve**; verify **Linked**.
6. Return the doctor home and audience display to the queue. Patient browser is logged in on Maria’s page.

If Seed reports `invalid_transition`, verify that the workflow run is empty. The user encountered this during rehearsal and reported seeding worked after the correct reset/seed order. Reset clears current links/messages; approving again is expected.
''')

page('Open the pitch, then show the queue','Khadim introduces the story; Vinh takes over at “show them.” Leave the interface still during the opening.')
y=block('OPTIONAL WALK-UP / KHADIM',
    '“Sending a prescription does not finish the job. FirstDose connects a reported barrier to the coordinator who can act. Put this on.” Hand over the watch if the path is ready.',151)
for key,label in [('0:00','KHADIM / PROBLEM'),('0:15','KHADIM / PERSON'),('0:30','KHADIM / PROPOSED PRODUCT')]:
    y=block(label,'“'+say_at[key]+'”',y,ns['PURPLE'])
y=block('VINH / POINT TO THE QUEUE',
    '“This is the coordinator’s morning: three cases need a fix, two are waiting, and eight are filled. These are fictional cases. The screens share the same live state.”',y,ns['PURPLE'])
small('27% scope: Surescripts January 2026 analysis of new e-prescriptions to fill-reporting pharmacies. Company-reported >1 million reach means HCPs, not only doctors. FirstDose integrations and payment models are proposed. Full sources are linked in the master guide.',48,652)
md.append('\nOptional walk-up: “Sending a prescription does not finish the job. FirstDose connects a reported barrier to the coordinator who can act. Put this on.”\n')
for key in ['0:00','0:15','0:30']: md.append('\n**Khadim says:** '+say_at[key]+'\n')
md.append('\n**Vinh says:** “This is the coordinator’s morning: three cases need a fix, two are waiting, and eight are filled. These are fictional cases. The screens share the same live state.”\n\nSurescripts 27% scope: January 2026 new e-prescriptions to fill-reporting pharmacies. See the master’s source pages.\n')

page('Maria: sign on the doctor phone','The operator cannot replace the doctor’s Sign and send action. This is a fictional prescribing demonstration.')
step(1,'Sign and send','Vinh / doctor phone',
    'Open New Rx → select Maria Lopez / Otezla → tap Sign and send. Briefly show the verified label lower on the page. Return to doctor home before the alert.',
    'Sent to pharmacy. The operator’s Maria pharmacy input ev_04 is now available. The patient resource may still be absent; that is expected.',
    'This is our DocUpdate-style prescribing demo. The Otezla label is verified against saved DailyMed source. Sending the prescription starts the workflow; it does not confirm a fill.',
    'Vinh','Wait for Sent to pharmacy before Minh fires anything.')
card('ELI5','The doctor has placed the order. We still need to learn whether the order got stuck and whether the pharmacy later confirms it was filled.',48,560,h=86)

page('Maria: trigger the barrier','Minh supplies the outside pharmacy update. Vinh shows the resulting doctor alert.')
step(2,'Pharmacy report → classification','Minh / operator; Vinh / doctor phone and watch',
    'Under Maria · Otezla, click Fire on ev_04 (Claim run). Wait for Fired. Then click Fire on ev_05 (Reason classified) and wait for the result. Use these specific rows, not repeated Next beat clicks.',
    'Expected reason: declined at price, with the recorded $410 quote. The doctor gets a reason alert when classification succeeds; the watch may receive the corresponding notification.',
    'The simulated pharmacy reports a barrier. Gemini reads the note and identifies the reason: declined at price. Read the alert to me.',
    'Vinh','Invite the judge to read only after actual receipt. If classification is null or differs, describe that result rather than reading the expected reason.')
card('IF THE RESULT IS UNKNOWN OR THE WATCH IS QUIET','Null leaves the case unclassified and creates no reason alert. Use Patient Details for the handoff/access-support fallback. If only the watch is missing: “The alert is visible here; wrist delivery did not arrive in this run.”',48,577,h=115,accent=ns['GOLD'])

page('Maria: hand off, then send the fix','Keep the audience screen on the coordinator while Vinh explains the administrative action.')
step(3,'Doctor handoff → coordinator resource','Vinh / doctor phone; Minh / coordinator screen',
    'Doctor: tap Send to my coordinator. If prompted, complete Approve and send or Send to coordinator. Coordinator: open Maria Lopez → find “The fix · picked by rule, not AI” → click Re-send copay card.',
    'Maria’s handoff and rule-selected action appear in the coordinator case. After sending, the patient phone shows an Otezla savings-card stand-in and Use at pharmacy.',
    'The doctor hands off the follow-up. The coordinator now owns the next step. A rule picks the fix using the reason and recorded eligibility. The coordinator reviews it and sends the resource through our Wallet stand-in.',
    'Vinh','Confirm the card is visible on the patient phone. Do not fire the pharmacy confirmation yet.')
card('OPTIONAL AUDIO — ONLY IF REHEARSED','After the resource is sent, the coordinator may choose Español and Approve and send in the message section. On the patient page, use Play message. Say: “This approved Spanish message uses pre-generated ElevenLabs audio.” This is a separate approval; the resource click alone does not send audio.',48,574,h=132,accent=ns['PURPLE'])
md.append('\nOptional audio: after the eligible resend fix, choose Español in the coordinator message section, then **Approve and send**. Patient: **Play message**. Say: “This approved Spanish message uses pre-generated ElevenLabs audio.” Message acknowledgment is separate from **Use at pharmacy**, and neither is a fill.\n')

page('Maria: the tap is not the fill','This pause is the key proof. Give the judges time to see the pending state before the separate confirmation.')
step(4,'Patient acknowledgment','Second judge / patient phone',
    'Hand over the prepared patient phone. Ask the judge to tap Use at pharmacy. Pause. Minh leaves ev_11 untouched during this pause.',
    '“Savings card acknowledged. Pharmacy fill confirmation is still pending.” The case has not become a confirmed fill.',
    'Now you’re Maria. Tap Use at pharmacy. That tap is acknowledgment. It is not a fill. We still wait for the pharmacy.',
    'Vinh','Read the pending message before advancing. Acknowledge message, if present, is a different button and does not replace Use at pharmacy.')
node('Resource tap','Acknowledgment only',48,562,242,71)
node('Pharmacy event','Independent simulated confirmation',322,562,242,71,col=ns['PURPLE'])
arrow(292,597,320,597)
small('You are demonstrating distinct evidence sources, not claiming that clicking a card causes a fill.',48,662)

page('Maria: confirm the pharmacy fill','Minh fires only on Vinh’s explicit cue. Then show the same outcome on the audience screen and doctor phone.')
step(5,'Separate confirmation','Minh / operator; Vinh / board, doctor phone and watch',
    'Vinh cues: “Now our operator sends the separate simulated pharmacy confirmation.” Minh clicks Fire on Maria’s ev_11 (Claim run, Dispensed). Wait for the shared screens to update.',
    'The board/doctor/patient show confirmed fill. A confirmation notification is attempted. In the rehearsal, the user reported seeing filled on the phone and watch; confirm actual receipt again during presentation.',
    'The separate pharmacy confirmation updates the shared case and notifies the doctor. A confirmed fill still does not prove that a dose was taken.',
    'Vinh','Maria is now complete. Keep this same run for James. Do not reset between the cases.')
card('WHAT YOUR DEMO JUST PROVED','The resource acknowledgment and pharmacy confirmation are separate events. A real watch receipt is a separate observable result from a server accepting a notification.',48,566,h=90)

page('James: prepare the second case','Do this after Maria’s confirmation, so James’s alert does not interrupt her story. Minh’s spoken explanation stays short.')
step(6,'Order → pharmacy rejection → hub note','Vinh / doctor phone; Minh / operator',
    'Doctor: New Rx → James Carter / Humira → Sign and send. Operator: under James, Fire ev_16; wait. Fire ev_17; wait. Fire ev_18; wait for classification. Return the doctor phone home.',
    'ev_16 is a prior-authorization rejection. ev_17 is the later failed-contact hub note. Gemini classifies that later note; the expected alert is “Hub can’t reach patient” / unable to reach.',
    'Here is a second case with a different barrier. Minh built the AI part.',
    'Vinh','Check the actual reason before Minh reads the next page. If unclassified, explain that fallback. A signed order is entered on the doctor screen, not fired from /sim.')
card('WHY THE REASON IS NOT PRIOR AUTH','Both pieces of evidence exist. The current classifier input is the later hub note about failed contact, so the demonstrated category is UNABLE_TO_REACH. Do not claim that prior authorization was approved or resolved.',48,567,h=101)

page('James: explain, then request support','Keep James unfilled. Sending an administrative request does not create a pharmacy confirmation.')
y=block('MINH SAYS — ABOUT 20 SECONDS',
    '“James Carter: Humira first fill confirmation is still pending.\nGemini reads the hub note.\nIt gives one reason: unable to reach.\nIf it is not sure, it leaves the reason unknown.\nGemini does not pick the fix. A rule does.”',151,ns['PURPLE'])
y=block('CLICK / VINH AND MINH',
    'Doctor phone: Send to my coordinator. Coordinator screen: open James Carter → confirm Connect to access support → click it.',y+8)
y=block('LOOK FOR',
    'The coordinator action shows sent/in progress. The doctor can still show stuck and “With your coordinator · Connect to access support.” This is normal: no pharmacy fill was confirmed.',y+8)
y=block('VINH SAYS',
    '“James’s support request has been sent, but his fill is still unconfirmed. We keep that visible instead of treating a button click as a successful outcome.”',y+8,ns['PURPLE'])
card('MINH’S BEST QUESTION ANSWER','“AI reads the note. A rule picks the fix. A human taps send.”',48,606,h=76)
md.append('''
**Minh says:**

> James Carter: Humira first fill confirmation is still pending.
> Gemini reads the hub note.
> It gives one reason: unable to reach.
> If it is not sure, it leaves the reason unknown.
> Gemini does not pick the fix. A rule does.

Doctor: **Send to my coordinator**. Coordinator: open James → **Connect to access support**.

Expected: request sent/in progress; doctor still stuck/unfilled, with coordinator/access-support wording. **This is correct.**

**Vinh says:** “James’s support request has been sent, but his fill is still unconfirmed. We keep that visible instead of treating a button click as a successful outcome.”

Minh’s short Q&A answer: “AI reads the note. A rule picks the fix. A human taps send.”
''')

page('Market Access, then Khadim closes','This is the last demo screen. Open /access in the laptop browser used for the demo; keep the completed run.')
y=block('LOOK FOR / VINH POINTS',
    'First fills confirmed: 9, if the only changes after the 8-fill seed were Maria’s fill and James’s support request. Median time to first fill: an elapsed duration. Stuck reasons: recorded reason counts. These can include cases that later filled.',151)
y=block('VINH SAYS',
    '“We started with eight background fills. Maria’s pharmacy confirmation brings that to nine. James stays unconfirmed, so clicking access support does not inflate the result. We also track time from prescription to confirmation. These are demonstration results; a real pilot would measure improvement.”',y+6,ns['PURPLE'])
y=block('SOURCE LABEL',
    'If the badge says Tiger aggregate counts: “Selected events become metrics in Tiger Data.” If it says Practice event counts / Tiger unavailable, name the fallback honestly. No patient names appear in these aggregate tiles; this is not a production role-isolation claim.',y+5)
y=block('KHADIM CLOSES',
    '“We propose three upgrades: a fill signal and staff workflow for DocUpdate, a barrier-to-task workflow for Ascend, and connections to existing resources like Wallet and Concierge. Our next proof is a practice pilot measuring staff effort and independently confirmed fills.\nImpiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets it filled.”',y+5,ns['PURPLE'])
small('Stop clicking and take questions. Khadim: buyer/market/partner fit. Vinh: workflow/data/watch. Minh: AI/labels, with Vinh supporting. Leave Market Access visible.',48,680)
md.append('''
Open **/access** on the laptop. Expect **9 first fills confirmed** only if the seed contributed 8 and Maria is the only new confirmed case. James remains unconfirmed. The median is demo elapsed time, not measured product improvement. Reason counts can include later-filled cases.

**Vinh says:** “We started with eight background fills. Maria’s pharmacy confirmation brings that to nine. James stays unconfirmed, so clicking access support does not inflate the result. We also track time from prescription to confirmation. These are demonstration results; a real pilot would measure improvement.”

If the source badge says **Tiger aggregate counts**, add: “Selected events become metrics in Tiger Data.” Otherwise name the displayed practice-count fallback. Do not claim Tiger supplied a fallback result.

**Khadim closes:** “We propose three upgrades: a fill signal and staff workflow for DocUpdate, a barrier-to-task workflow for Ascend, and connections to existing resources like Wallet and Concierge. Our next proof is a practice pilot measuring staff effort and independently confirmed fills. Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets it filled.”

Stop clicking. Khadim takes business, Vinh build/watch, Minh AI/labels with Vinh supporting. Leave Market Access visible.
''')

page('Minh’s one-page operator cue card','Use this page during rehearsal. The other pages explain each click, expected state and spoken line.')
table(['Cue / location','Action / checkpoint'],[
    ('Before pitch / sim','Reset → Confirm reset → 0 events → Seed. Queue 3/2/8. Request and approve coordinator link.'),
    ('Vinh signs Maria / doctor','New Rx → Maria/Otezla → Sign and send. Wait for Sent to pharmacy.'),
    ('“Pharmacy reports a barrier”','Fire ev_04, then ev_05. Confirm actual reason; show doctor/watch alert if received.'),
    ('Doctor handoff / phone','Send to my coordinator. Complete approval if shown.'),
    ('Coordinator / Maria','Open case → Re-send copay card. Confirm patient card appears.'),
    ('“Now you’re Maria”','Judge taps Use at pharmacy. PAUSE on pharmacy confirmation still pending.'),
    ('“Separate pharmacy confirmation”','Fire ev_11. Confirm filled on board/phone; show watch only if received.'),
    ('James / same run','Doctor signs James/Humira. Fire ev_16 → ev_17 → ev_18, checking each result.'),
    ('Minh’s short explanation','Expected latest reason: unable to reach. Doctor handoff → coordinator Connect to access support. James remains unfilled.'),
    ('Final proof / access','8 seeded fills + Maria = 9, if no other actions. Check source badge; show median. Khadim closes.')
],151,[155,361])
small('If time is short: keep the Maria acknowledgment-versus-confirmation proof; cut optional voice/audio and, if necessary, James. If using a recording, say so. Never read a scripted success line over a failed or different live result.',48,688)
md.append('\n## Quick recovery rules\n\n- Seed fails: verify the confirmed reset left 0 workflow events before Seed.\n- Grey Fire button: complete the preceding doctor/patient action.\n- Patient card absent: verify Maria was handed off and the coordinator sent Re-send copay card.\n- James still stuck after support: expected; no fill confirmation exists.\n- Watch missing: show the app alert and state wrist receipt was absent.\n- Tiger unavailable: name the practice-count fallback.\n- Short on time: keep Maria’s acknowledgment-versus-confirmation proof; cut optional voice/audio, then James. Disclose any switch to a recording.\n')

assert ns['page']==12,ns['page']
assert not ns['overflows'],ns['overflows']
c.save()
(root/'docs/presentation/live-demo-step-by-step.md').write_text('\n'.join(md),encoding='utf-8')
doc=fitz.open(pdf_path)
assert len(doc)==12 and len(doc.get_toc())==12
full=' '.join(p.get_text() for p in doc)
for term in ['Sign and send','ev_04','ev_05','ev_11','ev_16','ev_17','ev_18','Connect to access support','9','0 committed events']:
    assert term in full,term
assert '\ufffd' not in full
for i,p in enumerate(doc):
    assert len(p.get_text())>300,i
    for block_data in p.get_text('dict')['blocks']:
        for line_data in block_data.get('lines',[]):
            for span in line_data['spans']:
                x0,y0,x1,y1=span['bbox']
                assert 0<=x0<x1<=613 and 0<=y0<y1<=793,(i+1,span['text'])
    p.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(root/'.presentation-build'/f'runbook-{i+1:02d}.png')
for begin in range(0,12,4):
    sheet=Image.new('RGB',(864,1120),'#D8DFE7')
    for j in range(begin,begin+4):
        im=Image.open(root/'.presentation-build'/f'runbook-{j+1:02d}.png').convert('RGB')
        im.thumbnail((424,550)); sheet.paste(im,((j-begin)%2*432,(j-begin)//2*560))
    sheet.save(root/'.presentation-build'/f'runbook-contact-{begin//4+1}.png')
print(json.dumps({'file':pdf_path.name,'pages':len(doc),'bookmarks':len(doc.get_toc()),'layout_warnings':len(ns['overflows']),'bytes':pdf_path.stat().st_size}))
