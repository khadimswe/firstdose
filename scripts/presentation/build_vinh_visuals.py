"""Simple vector diagrams for Vinh's Maria-only live demo and judge questions."""
from pathlib import Path
from xml.sax.saxutils import escape
import json
import zipfile
import pymupdf as fitz
from PIL import Image, ImageDraw

SOURCE=Path(__file__).resolve().parent
ROOT=SOURCE.parents[1]
stem='FirstDose-Vinh-Visual-Cheat-Sheet'
code=(SOURCE/'build_master.py').read_text(encoding='utf-8')
pre=code[:code.index("exec(compile((SOURCE/'master_pages_aligned.py')")]
pre=pre.replace("OUT = OUTPUT / 'FirstDose-Master-Guide.pdf'",f"OUT = OUTPUT / '{stem}.pdf'")
ns={'__file__':str(SOURCE/'build_master.py')}
exec(compile(pre,'shared_pdf_style','exec'),ns)
c=ns['c']; text=ns['text']; rect=ns['rect']; arrow=ns['arrow']; line=ns['line']; card=ns['card']
INK=ns['INK']; TEAL=ns['TEAL']; PURPLE=ns['PURPLE']; GOLD=ns['GOLD']; RED=ns['RED']; MUTED=ns['MUTED']
c.setTitle('FirstDose | Vinh: Visual Cheat Sheet')
c.setSubject('Plain-language diagrams: Maria demo, backend, AI, analytics, notifications, identity and tracks')
captions=[]
def start(title,deck):
    ns['start'](title,'Vinh / Visual study guide',deck,'Fictional patients and pharmacy events. Partner integrations are concepts. Source main 015c342 • Sep 27, 2026.')
    captions.append(f'\n## {title}\n\n{deck}\n')
def box(title,body,x,y,w=240,h=85,color=TEAL):
    rect(x,y,w,h,'#F4F7FA',r=10)
    rect(x,y,4,h,color,r=1)
    z=text(escape(title),x+15,y+13,w-30,12.5,color,True,16)+7
    end=text(escape(body),x+15,z,w-30,10.5,INK,leading=14)
    assert end<y+h-7,(title,end,y+h)
def say(message,y=656):
    card('SAY IT SIMPLY',escape(message),48,y,h=65)
    captions.append('\nSay: '+message+'\n')

start('One case, start to finish','Six steps. Only the last one supplies the fill confirmation.')
steps=[('Doctor signs','A fictional prescription starts the case.',PURPLE),('Pharmacy reports a barrier','The operator supplies this outside event.',GOLD),('Gemini reads; a rule routes','The reason becomes an allowed next action.',TEAL),('Doctor hands off; staff sends','A human coordinator owns the follow-up.',PURPLE),('Patient taps the card','Acknowledgment only. Still pending.',GOLD),('Pharmacy confirms dispensing','Separate simulated input → Fill confirmed.',TEAL)]
for i,(title,body,col) in enumerate(steps):
    y=145+i*82
    rect(52,y+17,42,38,col,r=9); text(str(i+1),65,y+24,22,17,'#FFFFFF',True)
    box(title,body,118,y,446,65,col)
    if i<5: arrow(341,y+66,341,y+80)
    captions.append(f'{i+1}. {title}: {body}\n')
say('The patient tap is not a fill. Even a confirmed fill does not prove a dose.',y=650)

start('Behind one click','The server saves accepted events; screens and outputs follow that saved state.')
for x,title,body in [(48,'Doctor phone','Signs and hands off'),(226,'Coordinator','Reviews and sends'),(404,'Patient phone','Acknowledges card')]:
    box(title,body,x,151,160,82,PURPLE)
    arrow(x+80,237,306,282)
box('Next.js server','Checks session + current run + allowed action',123,288,366,87)
arrow(306,377,306,405)
box('Supabase Postgres','Commits the workflow and notification intent together',123,409,366,92)
arrow(225,504,168,548); arrow(389,504,444,548)
box('ntfy notification','Attempts phone / watch delivery',48,551,240,83,GOLD)
box('Tiger analytics','Receives selected outcome events',324,551,240,83,TEAL)
say('One shared notebook. Screens normally read it about every 1.5 seconds.')
captions.append('React screens → Next.js validation → Supabase atomic commit. After commit: notifications and Tiger replay. Clients use authenticated polling, not Supabase Realtime.\n')

start('AI has one small job','Gemini labels the problem. It does not choose treatment or execute the fix.')
box('Messy pharmacy / hub note','Example: the fictional price-related barrier in Maria’s case.',48,150,516,81,GOLD)
arrow(168,234,168,260)
box('Gemini','Read note → propose an allowed reason',48,263,240,94,TEAL)
box('Strict validation','Accept allowed code or leave it unknown',324,263,240,94,TEAL)
arrow(289,310,321,310)
arrow(445,360,445,400); arrow(365,360,169,400,RED)
box('Unknown / failure','Human fallback; do not invent the expected answer',48,406,240,111,RED)
box('Deterministic rule','Reason + coverage + eligibility → administrative action',324,406,240,111,TEAL)
arrow(444,519,444,549)
box('Human coordinator','Reviews and sends the permitted action',324,553,240,81,PURPLE)
text('No numeric confidence threshold. A valid code can still be wrong.',48,555,231,12,MUTED,leading=17)
say('AI reads the note. A rule picks the fix. A human taps send.')
captions.append('Invalid output/provider failure/UNKNOWN becomes null. Rules enforce recorded eligibility; no model-generated labels or autonomous action.\n')

start('Two databases, two jobs','Operational details and outcome measurements serve different purposes.')
box('Supabase = notebook','What happened in the practice workflow?',48,155,516,83,PURPLE)
for i,(title,body) in enumerate([('Workflow events','Orders, handoffs and actions'),('Practice state','Links, messages and alert intents')]):
    box(title,body,48+i*276,261,240,83,PURPLE)
arrow(306,351,306,398)
text('FILTER + KEYED CASE FINGERPRINT',326,365,235,8.5,TEAL,True)
box('Tiger Data = scoreboard','Selected prescription, reason and dispensing events',48,405,516,89,TEAL)
box('Kept for metrics','Time, event identity, case hash, kind and allowed reason',48,517,240,106,TEAL)
box('Left out','Raw names, notes, drug, insurance and prices',324,517,240,106,RED)
say('Tiger stores pseudonymous events. The Market Access screen shows aggregates.')
captions.append('Projection is an explicit allowlist, not a copy of all events. HMAC case hashes are pseudonymous, not proof of anonymity.\n')

start('What counts as success?','Three different observations. Keep them separate in your explanation.')
box('1  Card acknowledged','The patient pressed Use at pharmacy.',48,158,516,90,GOLD)
text('FILL COUNT CHANGE: 0',66,262,480,13,GOLD,True)
arrow(306,289,306,322)
box('2  Pharmacy confirms fill','Separate operator event represents dispensing.',48,328,516,90,TEAL)
text('FILL COUNT CHANGE: +1',66,433,480,13,TEAL,True)
line(306,460,306,481,RED,1.5)
line(298,477,314,489,RED,2); line(298,489,314,477,RED,2)
text('Cannot infer a dose',331,465,225,10,RED,True)
box('3  Patient takes a dose','Not established by either action above.',48,496,516,90,MUTED)
text('DOSE / CLINICAL BENEFIT: NOT MEASURED',66,605,480,12,MUTED,True)
say('Eight seeded fills + Maria’s confirmation = nine demo fills. Not nine proven treatment successes.')
captions.append('The operator simulates pharmacy evidence; no real pharmacy feed is connected in this demo. Median elapsed time is not time saved.\n')

start('The watch is the doorbell','A missed notification must not erase the saved case.')
for i,(title,body,col) in enumerate([('Saved workflow','Supabase commits the event and alert intent.',PURPLE),('Notification worker','Claims the intent and sends prepared text.',TEAL),('ntfy → paired phone','The service accepts a notification request.',GOLD),('Watch receipt','Depends on actual delivery, pairing and settings.',GOLD)]):
    y=151+i*113
    box(title,body,89,y,434,86,col)
    if i<3: arrow(306,y+89,306,y+110)
text('Server accepted it ≠ the wrist received it.',48,622,516,14,RED,True)
say('Show the watch only if it buzzed. Otherwise show the actual phone alert.')
captions.append('Post-commit notification delivery is separate from durable workflow state. No exactly-once physical delivery claim.\n')

start('Approval is not identity proof','Know this distinction if a judge asks about NPI or coordinator access.')
box('NPI format check','Is the provider identifier structurally valid?',48,151,516,84,TEAL)
text('VALID FORMAT DOES NOT PROVE WHO IS USING IT',64,254,485,11,RED,True)
arrow(168,283,168,311)
box('Coordinator request','Staff asks to receive a prescriber’s follow-up tasks.',48,317,240,105,PURPLE)
box('Doctor approval','Records the permitted handoff in this demo.',324,317,240,105,PURPLE)
arrow(290,370,321,370)
box('Today: simulated accounts','Fictional identities and a shared demo login. No production identity verification claim.',48,466,516,94,GOLD)
box('Production needs','Separate authenticated identities and enforced practice permissions.',48,570,516,75,TEAL)
say('We check the NPI’s format. We do not verify the person’s identity.',y=653)
captions.append('An NPPES registry match would be an additional check, not proof of account ownership.\n')

start('Your stack and three tracks','Name the tool when you show its job. Avoid a long list during the pitch.')
box('Screens + server','React + Next.js + TypeScript, hosted on Vercel',48,148,516,76,PURPLE)
box('Reference + delivery','DailyMed/RxNorm labels • ntfy alerts • prepared ElevenLabs audio',48,241,516,82,GOLD)
for y,title,body,col in [(351,'Oracle of the Deep','Bounded Gemini classification + understandable outcome analytics',TEAL),(444,'Impiricus','Useful doctor alerts → coordinator ownership → tracked confirmation',PURPLE),(537,'SpaceXAI','Grok transcribes a handoff → human checks → explicit confirmation',GOLD)]:
    box(title,body,48,y,516,78,col)
say('Your short script omits voice. Keep it ready for SpaceXAI questions on an eligible case.')
captions.append('Selected tracks are user-confirmed. Actual Cursor use must be substantiated. Labels are cached verified sections; ElevenLabs audio is prerecorded, not runtime generation.\n')

start('Your demo in six short cues','Khadim opens. You run Maria. Minh supplies pharmacy events. Khadim holds the patient phone.')
rows=[('QUEUE','“Three need a fix, two are waiting, eight are filled.”'),('SIGN','“Sending is not filling. Here is the verified label.”'),('REASON + HANDOFF','“Gemini reads. A rule routes. The doctor hands off.”'),('PATIENT TAP','“That is acknowledgment, not a fill.” Pause.'),('PHARMACY CONFIRMS','“Now it says Fill confirmed.” Check the actual alert.'),('MARKET ACCESS','“Eight plus Maria gives nine.” Check the source badge.')]
for i,(label,body) in enumerate(rows):
    y=151+i*79
    rect(48,y,135,63,PURPLE if i!=3 else GOLD,r=8)
    text(escape(label),60,y+18,112,10,'#FFFFFF',True,13)
    text(escape(body),202,y+10,351,12,INK,leading=17)
    if i<5: line(204,y+67,564,y+67)
say('Never cut the acknowledgment pause. Read the actual screen, not an expected success.')
captions.append('James is reserved for questions. Wallet is a stand-in. Proposed product and payment claims stay qualified.\n')

start('Eight questions to know cold','Answer in one or two sentences. Add detail only if the judge asks.')
qas=[('What did you build?','Barrier → owned staff task → independent confirmation.'),('Is the pharmacy real?','No. Operator inputs simulate the external feed.'),('Does AI pick the fix?','No. It names the reason; rules and humans control action.'),('Why two databases?','Supabase runs the workflow; Tiger measures selected outcomes.'),('What does nine mean?','Eight seeded fills plus Maria’s confirmation. Demo data.'),('Do you verify NPIs?','Format/checksum only. That is not identity verification.'),('Why is James still stuck?','A support request is not pharmacy confirmation.'),('What did you save?','No measured savings yet. A real pilot must establish them.')]
for i,(q,a) in enumerate(qas):
    x=48+(i%2)*276; y=150+(i//2)*119
    box(q,a,x,y,240,101,PURPLE if i%2==0 else TEAL)
say('Gemini reads. Rules route. Humans approve. Supabase remembers. Tiger measures.')
captions.append('These diagrams simplify the inspected main 015c342 implementation. See the 30-question handout for deeper answers.\n')

c.save()
out=ROOT/'docs/presentation'/f'{stem}.pdf'
out.with_suffix('.md').write_text('# FirstDose — Vinh visual cheat sheet\n'+ '\n'.join(captions),encoding='utf-8')
doc=fitz.open(out)
assert len(doc)==10
assert not ns['overflows'],ns['overflows']
pngs=[]
for i,p in enumerate(doc):
    assert '\ufffd' not in p.get_text()
    for b in p.get_text('dict')['blocks']:
        for ln in b.get('lines',[]):
            for s in ln['spans']:
                x0,y0,x1,y1=s['bbox']; assert 0<=x0<x1<=613 and 0<=y0<y1<=793,(i,s['text'])
    path=ROOT/'.presentation-build'/f'visual-{i+1:02}.png'
    p.get_pixmap(matrix=fitz.Matrix(1.8,1.8)).save(path); pngs.append(path)
with zipfile.ZipFile(ROOT/'docs/presentation/FirstDose-Vinh-Diagram-Images.zip','w',zipfile.ZIP_DEFLATED) as z:
    for i,p in enumerate(pngs): z.write(p,f'FirstDose-diagram-{i+1:02}.png')
for batch in range(0,len(doc),6):
    sheet=Image.new('RGB',(3*330,2*445),'#DDE4EC')
    for i in range(batch,min(batch+6,len(doc))):
        im=Image.open(pngs[i]); im.thumbnail((318,417)); x=(i-batch)%3*330+6; y=(i-batch)//3*445+20
        sheet.paste(im,(x,y)); ImageDraw.Draw(sheet).text((x,y-15),str(i+1),fill='black')
    sheet.save(ROOT/'.presentation-build'/f'visual-contact-{batch//6+1}.png')
print(json.dumps({'file':out.name,'pages':len(doc),'diagrams':len(pngs),'bookmarks':len(doc.get_toc()),'layout_warnings':len(ns['overflows'])}))
