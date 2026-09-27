from pathlib import Path
import json, subprocess, re, math
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
TMP = ROOT / '.presentation-build'
TMP.mkdir(exist_ok=True)
OUTPUT = ROOT / 'docs/presentation'
OUT = OUTPUT / 'FirstDose-Master-Guide.pdf'
SHA = '015c3429a12518ed67753a47db9eaae308e82b13'
font_dir = Path('C:/Windows/Fonts')
font_files = ['arial.ttf','arialbd.ttf','ariali.ttf']
if not font_dir.exists():
    font_dir = Path('/usr/share/fonts/truetype/dejavu')
    font_files = ['DejaVuSans.ttf','DejaVuSans-Bold.ttf','DejaVuSans-Oblique.ttf']
for name, file in zip(['Body','Bold','Italic'],font_files):
    pdfmetrics.registerFont(TTFont(name, str(font_dir/file)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold', italic='Italic', boldItalic='Bold')
INK='#172544'; TEAL='#087F8C'; PURPLE='#7353D6'; MUTED='#56637A'; PALE='#EEF5F7'; GOLD='#AD6A13'; RED='#B44348'; LINE='#DAE2E9'
W,H=612,792
c=canvas.Canvas(str(OUT), pagesize=(W,H), pageCompression=1)
c.setTitle('FirstDose | Master Presentation, Business & Technical Guide')
c.setAuthor('FirstDose presentation preparation')
c.setSubject('Project study guide, pitch rehearsal, illustrated architecture and implementation boundaries')
page=0
reading_log=[]
page_text=[]
overflows=[]

def rect(x,y,w,h,fill,stroke=None,r=10):
    c.setFillColor(HexColor(fill)); c.setStrokeColor(HexColor(stroke or fill))
    c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))

def text(s,x,y,w=516,size=10.5,color=INK,bold=False,leading=None):
    style=ParagraphStyle('p',fontName='Bold' if bold else 'Body',fontSize=size,leading=leading or size*1.4,textColor=HexColor(color),spaceAfter=0)
    p=Paragraph(s,style); _,h=p.wrap(w,H)
    if y<749 and y+h>740: overflows.append((page,round(y+h,1),re.sub('<[^>]+>','',s)[:75]))
    p.drawOn(c,x,H-y-h)
    page_text.append(re.sub('<[^>]+>','',s))
    return y+h

def small(s,x,y,w=516): return text(s,x,y,w,8.3,MUTED)
def heading(s,y,x=48,w=516): return text(s,x,y,w,16,INK,True,20)
def para(s,y,x=48,w=516,size=10.5): return text(s,x,y,w,size)
def card(title,body,x,y,w=516,h=94,accent=TEAL):
    rect(x,y,w,h,PALE)
    rect(x,y,4,h,accent,r=1)
    t=text(title,x+16,y+13,w-30,10,accent,True)
    end=text(body,x+16,t+7,w-31,10.2)
    if end>y+h-8: overflows.append((page,'card',title))

def line(x1,y1,x2,y2,col=LINE,width=1):
    c.setStrokeColor(HexColor(col)); c.setLineWidth(width); c.line(x1,H-y1,x2,H-y2)

def arrow(x1,y1,x2,y2,col=TEAL):
    line(x1,y1,x2,y2,col,1.6)
    angle=math.atan2(y2-y1,x2-x1)
    for off in [-.48,.48]:
        line(x2,y2,x2-7*math.cos(angle+off),y2-7*math.sin(angle+off),col,1.6)

def node(title,body,x,y,w,h=65,col=TEAL):
    rect(x,y,w,h,'#FFFFFF',LINE)
    text(title,x+11,y+10,w-22,10,col,True)
    end=text(body,x+11,y+29,w-22,9.1)
    if end>y+h-5: overflows.append((page,'node',title))

def start(title,kicker,deck,source=''):
    global page,page_text
    if page: c.showPage()
    page+=1; page_text=[]
    reading_log.append((page,title))
    c.setFillColor(white); c.rect(0,0,W,H,fill=1,stroke=0)
    rect(0,0,W,8,TEAL,r=0)
    c.bookmarkPage('p'+str(page)); c.addOutlineEntry(title,'p'+str(page),0)
    text(re.sub(r'^\d+\s*/\s*', '', kicker).upper(),48,32,516,9,TEAL,True)
    text(title,48,55,516,24,INK,True,28)
    text(deck,48,99,516,10.5,MUTED)
    line(48,749,564,749)
    text('FIRSTDOSE  /  PRESENTATION PREP',48,760,330,7.3,MUTED,True)
    text(f'{page:02d}',537,758,27,9,TEAL,True)
    if source: text(source,48,727,516,7.5,MUTED)

def bullets(items,y,x=48,w=516):
    for title,body in items:
        text('•',x,y+1,14,11,TEAL,True)
        y=text('<b>'+title+'</b> '+body,x+18,y,w-18,10.4)+13
    return y

def table(headers,rows,y,widths=None):
    widths=widths or [145,371]
    x=48; rowh=31
    rect(x,y,sum(widths),rowh,INK,r=4)
    for j,h in enumerate(headers):
        text(h,x+sum(widths[:j])+10,y+8,widths[j]-20,9,'#FFFFFF',True)
    y+=rowh
    for row in rows:
        heights=[]
        for j,s in enumerate(row):
            st=ParagraphStyle('measure',fontName='Body',fontSize=9.4,leading=13.2)
            heights.append(Paragraph(s,st).wrap(widths[j]-20,1000)[1])
        rh=max(heights)+22
        rect(x,y,sum(widths),rh,'#F4F7FA' if rows.index(row)%2==0 else '#FFFFFF',r=0)
        for j,s in enumerate(row): text(s,x+sum(widths[:j])+10,y+10,widths[j]-20,9.4,INK,j==0,13.2)
        y+=rh
    return y

def pic(path,x,y,w,h):
    im=Image.open(path); iw,ih=im.size; scale=min(w/iw,h/ih)
    c.drawImage(str(path),x,H-y-ih*scale,iw*scale,ih*scale,mask='auto')
    return ih*scale


exec(compile((SOURCE/'master_pages_aligned.py').read_text(encoding='utf-8'), 'master_pages.py', 'exec'))

master_cover()

master_contents()

master_openings()

master_script_a()

master_script_b()

master_runbook()

master_ecosystem()

start('The problem, in three numbers','Evidence / Different populations, different meanings','These are external problem statistics. None is a measured FirstDose outcome.','[A] Surescripts, January 2026; [B] AMA survey of 1,000 practicing physicians, December 2025.')
heading('27 out of 100',150)
para('Visualizing the reported 27% unfilled share.<br/>This is not a sample of FirstDose users.',181,w=265)
for i in range(100):
    x=53+(i%10)*23; y=236+(i//10)*19
    rect(x,y,15,12,RED if i<27 else '#DDE5EB',r=2)
rect(48,447,10,10,RED,r=2); small('Reported unfilled share',65,444,w=233)
card('13 HOURS / WEEK','Average physician-and-staff time per physician spent completing prior authorizations in the AMA survey.',320,153,w=244,h=132)
card('40% OF PHYSICIANS','Reported employing staff who work exclusively on prior authorization. The same survey reports 40 requests per physician per week.',320,308,w=244,h=147,accent=PURPLE)
heading('What the figures do—and do not—establish',495)
bullets([
    ('A substantial access gap.', 'The Surescripts figure covers new e-prescriptions sent to fill-reporting pharmacies in January 2026. It is not a drug-specific abandonment rate.'),
    ('A costly administrative job.', 'AMA measures prior-authorization work, including medication and medical-service requests. FirstDose does not automate all of it.'),
    ('A reason to test our product.', 'These findings justify a pilot. They do not establish how many prescriptions we recover or how much money we save.')
],530)


master_cost_evidence()

start('What could FirstDose actually save?','Value / Start with measurable staff effort','Potential value: less status chasing, fewer duplicated touches, and faster identification of the next owner.','All economic inputs and savings below are illustrative assumptions, not pilot results.')
card('A SIMPLE EXAMPLE','200 cases/month × 5 minutes less work per case ÷ 60 = <b>16.7 hours/month</b>.<br/>At an assumed loaded labor cost of $35/hour: <b>about $583/month of staff capacity value</b>.',48,152,h=94)
fig,ax=plt.subplots(figsize=(8.4,3.05),dpi=170)
minutes=[2,5,10]; value=[200*m/60*35 for m in minutes]
bars=ax.bar(['2 min / case','5 min / case','10 min / case'],value,color=['#98C9CF',TEAL,PURPLE],width=.52)
ax.set_ylabel('Capacity value ($/month)'); ax.set_ylim(0,1400); ax.set_yticks([0,250,500,750,1000,1250])
ax.spines[['top','right']].set_visible(False); ax.yaxis.grid(True,color='#E5EAF0'); ax.set_axisbelow(True)
for b,v in zip(bars,value): ax.text(b.get_x()+b.get_width()/2,v+35,f'${v:,.0f}',ha='center',color=INK,fontweight='bold')
ax.axhline(250,color=GOLD,linestyle='--',linewidth=1.2)
ax.text(2.33,280,'$250 assumed fee',ha='right',fontsize=8,color=GOLD)
fig.tight_layout(); fig.savefig(TMP/'capacity-value.png',bbox_inches='tight',facecolor='white'); plt.close(fig)
pic(TMP/'capacity-value.png',48,266,516,224)
small('Sensitivity only: 200 cases/month and $35/hour held constant. The $250/month practice fee is a hypothetical pricing test, not an announced FirstDose price.',48,497)
bullets([
    ('Potential practice value.', 'At five minutes saved, $583 less a hypothetical $250 fee leaves $333 in monthly capacity value before onboarding and other costs. Freed time is not automatically payroll savings.'),
    ('Potential patient value.', 'Less waiting and better access to an eligible resource. The demo’s $410 → $0 price change is fictional; copay relief does not prove lower total healthcare spending.'),
    ('What must be measured.', 'Net minutes and touches per case, including new work the software creates. Confirm any reduction against a defined baseline.')
],543)


start('Yes, it is a software product','Business / User, buyer and repeat value','Product concept today. A commercially validated business requires evidence of adoption and willingness to pay.','Project positioning: [1–3]. External fit and existing alternatives: [A], [E].')
table(['Question','Concrete answer'],[
    ('Who uses it?','An access coordinator works the daily queue. A prescriber approves and receives relevant alerts. The patient receives the scoped resource.'),
    ('What is the product?','A workflow service: barrier evidence, ownership, allowed next step, communication and subsequent-fill tracking in one shared case history.'),
    ('Who might buy it?','A platform partner such as Impiricus, a patient-access program, or a practice. These are buyer hypotheses; no agreement is established.'),
    ('Why pay repeatedly?','The work recurs with new prescriptions. Payment is justified only if the product adds value after integration, training and ongoing operating effort.')
],150,[131,385])
heading('Two commercial hypotheses to test',454)
bullets([
    ('Workflow license or subscription.', 'A platform contract or practice subscription could pay for ongoing use. This is a possible model, not a confirmed deal.'),
    ('Fee per qualifying confirmed case.', 'Earlier project materials proposed Market Access payment per confirmed first fill. This needs a buyer-agreed definition, attribution and commercial review; a fill counter alone is not a billable outcome.')
],488)
card('WHY THIS COULD ALSO REMAIN A FEATURE','Surescripts already sells first-fill monitoring. FirstDose’s proposed contribution is the coordinator workflow around the signal. Differentiation, data access and distribution must hold up against existing products and a partner building the feature itself.',48,623,h=95,accent=PURPLE)


start('Could it be profitable? Test the math.','Economics / Illustrative only—no forecast','Potentially. Revenue has to cover real data, delivery, support, sales, integration and operating costs.')
table(['Assumption / calculation','Example per month'],[
    ('Billable volume × assumed fee','1,000 qualifying cases × $50 = <b>$50,000 revenue</b>'),
    ('Variable delivery cost','1,000 billable cases × assumed $20 = <b>$20,000</b>; must include allocated nonbillable work'),
    ('Contribution before fixed costs','$50,000 − $20,000 = <b>$30,000</b> (60%)'),
    ('Assumed fixed operating budget','$25,000 for engineering, sales/admin and operations'),
    ('Illustrative operating surplus','$30,000 − $25,000 = <b>$5,000</b>, before taxes/financing')
],150,[217,299])
fig,ax=plt.subplots(figsize=(8.4,2.7),dpi=170)
xs=[0,250,500,750,1000,1250,1500]; ys=[(50-20)*n-25000 for n in xs]
ax.plot(xs,ys,color=TEAL,linewidth=2.5); ax.axhline(0,color=MUTED,linewidth=1)
ax.scatter([25000/30,1000],[0,5000],color=[GOLD,PURPLE],s=34,zorder=3)
ax.annotate('Break-even: 834 whole cases',(25000/30,0),xytext=(270,12500),fontsize=9,arrowprops={'arrowstyle':'->','color':GOLD},color=GOLD)
ax.set_xlabel('Qualifying billable cases / month'); ax.set_ylabel('Operating result ($/month)')
ax.set_ylim(-28000,23000); ax.spines[['top','right']].set_visible(False); ax.grid(alpha=.18)
fig.tight_layout(); fig.savefig(TMP/'break-even.png',bbox_inches='tight',facecolor='white'); plt.close(fig)
pic(TMP/'break-even.png',48,433,516,188)
small('Break-even = fixed costs ÷ (fee − variable cost) = $25,000 ÷ $30. If the fee falls to $40, or variable cost rises to $30, break-even becomes 1,250 cases/month.',48,632)
small('<b>The assumptions are the hard part.</b> No buyer has validated the $50 fee; no operating study supports the $20 or $25,000 costs. Practice labor savings alone do not justify $50/case. A partner needs separately demonstrated value. One-time setup and acquisition costs also need recovery.',48,680)


start('The research behind the pitch','Research / What we had, and how to use it','External facts establish context. Team calculations and commercial assumptions require separate validation.','Repository: docs/research/public-data-sources.md; public-sources-briefing.md; data/reference/public-data.json.')
table(['Existing research','What the updated guide establishes'],[
    ('Abandonment + workload','27% Surescripts figure rechecked. AMA hours and dedicated-staff share rechecked; newer 2025 survey has 40 PAs/week, replacing the older 39.'),
    ('Georgia prescribing data','CMS 2024 Part D: Otezla—614 prescribers, 6,661 claims; Humira(CF) Pen—717 prescribers, 15,295 claims. Aggregate rows re-fetched [C–D].'),
    ('Product fit','DocUpdate FAQ says staff/practice accounts are on its roadmap [E]. Its fill-confirmation wording appears in a cancellation answer; do not claim a complete product gap from that alone.'),
    ('National workforce model','AAMC reports 866,460 direct-care physicians [F]. The team’s ~282,000 full-time-equivalent workload estimate extrapolates survey hours; it is not coordinator headcount or sellable seats.'),
    ('Coordinator market estimate','The prior ~69,000–116,000 range assumes 1 dedicated staff member per 3–5 physicians. That staffing ratio and paid addressable market are unvalidated.'),
    ('Broader reference data','The repo also contains formulary, acquisition-price and payer-mix research. Those figures describe markets and datasets; they do not measure FirstDose savings.')
],152,[147,369])
card('THE MISSING EVIDENCE IS OUR OWN','We have public evidence of a problem and a prototype of a response. We still need net time saved, comparative fill outcomes, buyer willingness to pay, actual data/support costs and acquisition/retention evidence.',48,630,h=88,accent=PURPLE)


start('Start the demo at the queue','03 / The main product surface','The desktop is the coordinator’s workspace. Use the queue to explain the product before showing the stack.','Source: recorded September 26 hosted audit; synthetic seeded queue. Evidence scope on page 34.')
pic(SOURCE/'assets'/'hosted-queue.png',48,153,516,324)
small('Recorded hosted audit capture, September 26, after PR #39. It precedes the latest frontend repairs and is not a new deployment check.',48,486)
table(['Point to','Explain'],[
    ('Summary tiles','Three needing a fix, two waiting, eight fill confirmations in this seeded background scenario.'),
    ('Reason + next step','The row connects the reported barrier to an administrative action.'),
    ('Waiting on','An owner makes the next step clear. An unresolved case stays visible.'),
    ('Coordinator approval','Approve the interactive relationship in Profile before handoff; this seeded view shows background cases.')
],525,[131,385])



start('The doctor gets a short handoff','04 / The phone surface','A concept for FirstDose inside DocUpdate. The demo uses FirstDose’s own interface and synthetic records.','Sources: recorded hosted audit; [3] integration; [6] templates. Screenshot predates latest frontend repairs.')
pic(SOURCE/'assets'/'hosted-doctor.png',48,152,237,519)
heading('Notice three things',161,x=310,w=254)
bullets([
    ('A reported status.', 'The alert begins with the pharmacy-shaped status, then the reason.'),
    ('One clear action.', '“Send to my coordinator” makes the next owner explicit.'),
    ('A visible trail.', 'The prescription status progresses toward a separately confirmed fill.')
],201,x=310,w=254)
card('ELI5','The phone is the “please help with this” button. The desktop is where the helper works the checklist.',310,453,w=254,h=110)
small('Profile supports coordinator approval. The hosted audit verified it across sessions; this saved image shows the alert surface.',310,588,w=254)
small('Saved hosted-browser evidence, not proof of current physical phone/watch delivery.',48,690)



start('Walk one case through the system','05 / Workflow state','Learn the event boundaries. They are more important than memorizing every screen.','Sources: [3] integration; [4] workflow; [6] patient confirmation templates.')
steps=[
    ('01','Prescription recorded','Doctor action creates the case and opening events.',TEAL),
    ('02','Reported barrier arrives','A simulated pharmacy/hub event supplies the evidence.',RED),
    ('03','Coordinator handoff','Approved relationship and assignment gate the handoff.',TEAL),
    ('04','Permitted resource sent','Rules and recorded eligibility constrain the action.',TEAL),
    ('05','Resource acknowledged','The phone tap records acknowledgment only.',GOLD),
    ('06','Pharmacy fill confirmed','A separate simulator action supplies the fill evidence.',PURPLE)
]
for i,(n,title,body,col) in enumerate(steps):
    y=151+i*73
    rect(48,y,38,38,col,r=19); text(n,58,y+10,22,11,'#FFFFFF',True)
    text(title,105,y,459,12,col,True); text(body,105,y+22,459,10)
    if i<5: arrow(67,y+42,67,y+66,LINE)
card('THE LINE TO MEMORIZE','A resource acknowledgment is not a pharmacy fill. A pharmacy fill is not proof of a first dose or clinical improvement.',48,610,h=78,accent=PURPLE)
small('Message acknowledgment and savings-card acknowledgment are also distinct. Neither creates dispensing evidence.',48,701)



start('The architecture in one picture','06 / How the parts connect','The implemented live adapter uses HTTP polling through the practice server.','Sources: [4] workflow + migrations; [7] lib/realtime.ts and API routes; [8] labels.')
small('Stack: Next.js 16 · React 19 · TypeScript · Tailwind 4 · Supabase / PostgreSQL',48,129)
node('Coordinator desktop','Queue, approval request, resource and message',48,151,160,79)
node('Doctor phone','Approval, prescription and handoff',226,151,160,79)
node('Patient phone','Resource, message and acknowledgment',404,151,160,79)
for x in [128,306,484]: arrow(x,230,x,259)
rect(48,260,516,55,PALE)
text('React screens + useEvents() + live EventSource adapter',63,271,486,12,TEAL,True)
text('Commands go up to the server; snapshots return about every 1.5 seconds.',63,292,486,9.3)
arrow(306,316,306,343)
node('Next.js server / API','Checks demo access, validates actions and invokes workflow commands',99,345,414,63)
arrow(306,409,306,434)
node('Supabase / PostgreSQL','Authoritative events, active run, approvals, assignments and messages',99,436,414,65)
arrow(99,470,78,470); line(78,470,78,545,TEAL); arrow(78,545,99,545)
node('Notification delivery','Committed alerts → ntfy → phone → paired watch',99,517,414,59,col=PURPLE)
card('SUPPORTING INPUTS','The simulator supplies pharmacy-shaped events. Verified DailyMed/RxNorm artifacts support the label card. Voice is optional; Gemini classification and Tiger replay are merged. Recorded deployed browser workflows and live summary checks passed; physical-device acceptance remains separate.',48,601,h=88)
small('“EventSource” here is a project interface name, not a claim of browser Server-Sent Events. Polling is implemented despite the filename realtime.ts.',48,699)



start('Commands, events and safe updates','07 / The core engineering idea','An action asks for a change. An event records a change the server accepted.','Sources: [4] workflow and migrations; [7] polling adapter.')
node('Command','“Please send the resource.”',48,154,153)
node('Validate + commit','Check state; write atomically.',230,154,153)
node('Event','“Resource sent.”',411,154,153)
arrow(201,186,230,186); arrow(383,186,411,186)
card('ELI5: ONE SHARED NOTEBOOK','Each screen reads the same notebook. You ask the teacher to add a line; you do not rewrite the notebook yourself. If two people ask at once, the teacher checks which action is still allowed.',48,251,h=106)
bullets([
    ('Atomic transition.', 'The database checks and writes the workflow change together. This limits races between simultaneous actions.'),
    ('Idempotent behavior.', 'Repeated requests should not create the same scripted event twice. Uniqueness is scoped to a run and script identity.'),
    ('Run identity.', 'Reset begins a new demo run. Clients clear the old run before displaying the new one.'),
    ('Revision + stale-response guards.', 'Late responses must not overwrite newer state or restore a retired run.'),
    ('Polling.', 'The live adapter asks the server for a snapshot on a roughly 1.5-second interval and de-duplicates delivered events.')
],386)
card('WHY A JUDGE SHOULD CARE','These choices make the demo repeatable across browsers and keep a fast double tap or delayed request from silently changing the story.',48,645,h=72,accent=PURPLE)



start('Rules decide. AI can help read.','08 / Administrative routing','Explain the classifier and router as separate components with different authority.','Sources: [9] lib/server/router.ts, mock/reasons.json; [13] merged classifier integration.')
node('Supplied note','Evidence from the simulated pharmacy or hub',48,156,160,77)
node('Reason code','Gemini category or null; rules keep action authority',226,156,160,77,col=PURPLE)
node('Rules + eligibility','Choose a permitted administrative action',404,156,160,77)
arrow(208,194,226,194); arrow(386,194,404,194)
table(['Check','Result in the current router'],[
    ('Unknown / invalid reason','Return ACCESS_SUPPORT. Do not invent a reason.'),
    ('Government coverage','The configured rules lead to access support, not a manufacturer copay-card action.'),
    ('Copay-card route','Requires a matching commercial-insurance rule AND explicit copayCardEligible === true.'),
    ('Bridge-sample route','Requires a matching rule AND explicit bridgeSampleEligible === true.'),
    ('Missing eligibility / no match','Return ACCESS_SUPPORT for review.')
],266,[151,365])
card('ELI5: READER AND RULEBOOK','AI can help put a messy note into a labeled box. The rulebook decides which action is allowed. A label on a box is not permission to give someone a benefit.',48,565,h=96)
small('These are prototype routing rules, not a legal determination or a complete program-eligibility engine. A reason may be supplied directly without a model call.',48,682)



start('How the label earns your trust','09 / Source verification','The label pipeline serves saved, verified material. It does not generate medication claims.','Sources: [8] lib/server/label.ts; labels/*; data/labels/drug_otezla/*; package prebuild.')
node('RxNorm identity','Check the intended drug identity',48,154,245,63)
node('DailyMed source','Save source XML + version evidence',319,154,245,63)
arrow(170,218,170,249); arrow(442,218,442,249)
node('Deterministic extraction + verification','Extract selected section text; check identity, hashes and provenance.',48,252,516,66)
arrow(306,320,306,348)
node('Bundled label + receipt','The mandatory prebuild step verifies saved artifacts. Runtime checks the bundled receipt.',48,351,516,67)
arrow(306,420,306,448)
node('Label API + card','Serve an allowlisted verified label, or surface unavailable / placeholder behavior.',48,451,516,66)
card('ELI5: CHECKED PHOTOCOPY','Think of a carefully checked copy of an instruction sheet. The copy keeps the source’s words, and a fingerprint helps detect changes. The fingerprint alone cannot prove the original sheet was authentic.',48,545,h=107)
small('Current verified-label scope: Otezla and Humira artifacts are included. Humira added strength/concentration, volume and nested KIT identity checks. “Byte exact” refers to the project’s extracted-text verification contract, not a claim that the rendered page is identical to raw XML.',48,673)



start('Who sees what, and why','10 / Access and notifications','Separate the intended product boundary from the demo’s identity and transport mechanisms.','Sources: [3] integration handoff; [10] coordinator/message routes + migrations; [11] ntfy.')
table(['Surface','Intended information'],[
    ('Practice','Case details, reported barriers, coordinator work, prescriber approval and fill status.'),
    ('Patient','The resource and approved message for the selected demo case.'),
    ('Partner / Market Access','Allowlisted aggregate measures; not a copy of the practice’s full case history.')
],153,[140,376])
heading('What the implementation actually gives you',368)
bullets([
    ('Private demo access.', 'Practice workflow commands use a demo cookie and server-side database credentials. The summary endpoint also requires demo authentication. The shared demo login still does not isolate real patient/practice roles.'),
    ('Persisted approval and assignment.', 'The live demo uses fixed synthetic identities. Changing a display name does not grant another case.'),
    ('Shared messages; local contact marks.', 'Approved EN/ES messages persist by run. “Reached patient / Left message” contact marks remain device-local.'),
    ('Watch delivery has its own proof.', 'An ntfy HTTP acceptance is not proof that a person saw a wrist alert. Check the actual phone/watch path.')
],400)
card('ELI5: DIFFERENT WINDOWS','People need different windows into the same work. A summary window should not expose the whole notebook. A separate partner authorization boundary and production compliance are not established by this demo.',48,622,h=93,accent=PURPLE)



start('Read the graphs honestly','11 / Demo counts and proposed measurement','This chart describes the seeded fictional background queue. It is not a real-world success rate.','Sources: [12] seed-week handoff + fixtures; [3] integration handoff.')
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11})
fig,ax=plt.subplots(figsize=(8.5,3.0),dpi=170)
vals=[3,2,8]; labels=['Needs a fix','Waiting','Fill confirmed']
bars=ax.barh(labels,vals,color=[RED,'#D49A43',TEAL],height=.55)
ax.invert_yaxis(); ax.set_xlim(0,9.4); ax.set_xticks(range(0,10,2)); ax.set_xlabel('Number of seeded background cases')
ax.spines[['top','right','left']].set_visible(False); ax.spines['bottom'].set_color(LINE)
ax.tick_params(axis='y',length=0,pad=12); ax.xaxis.grid(True,color='#E5EAF0'); ax.set_axisbelow(True)
for b,v in zip(bars,vals): ax.text(v+.15,b.get_y()+b.get_height()/2,str(v),va='center',fontweight='bold',color=INK)
fig.tight_layout(); chart=TMP/'seed-counts.png'; fig.savefig(chart,bbox_inches='tight',facecolor='white'); plt.close(fig)
pic(chart,48,148,516,217)
small('13 background cases = 3 + 2 + 8. The two interactive cases are separate, giving 15 cases in the fixture set. Counts reflect the seed state, not a completed interactive run.',48,372)
heading('What to measure in a pilot',429)
table(['Measure','Meaning'],[
    ('Time to first fill','Timestamp of first separate pharmacy confirmation minus prescription timestamp. Define the cohort and clock.'),
    ('Unresolved-case age','How long an open access problem has waited. Do not silently drop unresolved cases from analysis.'),
    ('Coordinator effort','Time or touches per task, compared with a defined baseline.'),
    ('Confirmation count','Count each distinct qualifying case once in the chosen run/cohort; disclose source and freshness.')
],459,[148,368])
small('A seeded count of 8 is not evidence that FirstDose caused 8 fills. No causal improvement, clinical outcome or return-on-investment estimate is established here.',48,693)



start('What is built vs. what is verified','12 / Know your claims','Code presence, a reported test, a deployed check and a physical demonstration are different kinds of evidence.','Fetched September 26: main 015c342. Recorded deployed evidence is distinct from this source snapshot; see page 34.')
table(['Capability','Evidence / wording to use'],[
    ('Workflow + sync','Merged APIs, PostgreSQL transitions and 1.5-second polling. Recorded hosted Maria/James workflows and independent-session reset checks passed.'),
    ('Coordinator + messages','Hosted approval/messages and Otezla EN/ES playback passed. Audio is pre-generated ElevenLabs; no runtime call. Physical/native Spanish review remains.'),
    ('Two verified labels','Saved source, identity data and verification pipeline present. Humira is now verified too; the prebuild gate checks both drugs.'),
    ('Pharmacy / partners','Simulated pharmacy/hub activity. Impiricus, DocUpdate, Wallet and sample-partner surfaces are concepts/stand-ins.'),
    ('Watch','ntfy publisher implemented. Repository records prior Garmin receipt. Latest Apple Watch acceptance remains unverified here.'),
    ('Voice / Grok','Pre-confirm run check merged. Full recording-through-approval reset safety and human-device acceptance remain unverified; keep voice optional.'),
    ('Gemini','Merged and wired into live commands. Recorded hosted runs returned price/unreachable reasons; null fallback remains. Rules choose the action.'),
    ('Tiger','Replay, auth, freshness and pharmacy-fill projection merged. Deployed audit: 8 seeded fills, median 60 seconds; reset gives 0/null. Synthetic data.'),
    ('Hosted / TestFlight','Production recorded live. Physical two-device/watch run remains. Frontend fixes merged; deployed recheck separate. iOS signing/install needs a Mac.')
],150,[132,384])
small('Before presenting, check the exact deployed commit and mode. Some older pitch/status documents still describe capabilities that later code supersedes.',48,697)


master_api()

master_copy()


start('Answers to likely judge questions','14 / Speak with precision','Give the direct answer first, then offer evidence or the next test.','Grounded in [1–4], [7–11] and the source snapshot; no external competitor claims are needed.')
qa=[
    ('“What makes this more than a dashboard?”','It assigns a next step, validates actions, preserves an event trail and distinguishes acknowledgment from pharmacy confirmation.'),
    ('“Where is the AI?”','Gemini maps the pharmacy note to a reason or null. Deterministic rules choose the fix. Voice proposes a handoff for human confirmation.'),
    ('“Are you connected to Impiricus or a pharmacy?”','Those partner connections are simulated concepts here. The workflow/backend is our implementation; a real partner feed is a next integration milestone.'),
    ('“Does the patient button mean the medicine was taken?”','No. It records acknowledgment. A separate pharmacy event records a fill, which still does not prove a dose was taken.'),
    ('“Who pays, and how much?”','A partner-sponsored workflow or pilot is a commercial hypothesis. We have no validated pricing, willingness-to-pay result or customer contract to claim.'),
    ('“What is technically difficult?”','Keeping multiple views consistent while enforcing valid actions, separating runs, preventing stale updates and preserving source-backed evidence.'),
    ('“What would you do next?”','Verify the latest deployed physical flow, validate the workflow with practice staff, and agree a real pharmacy/partner data integration.')
]
y=151
for q,a in qa:
    y=text(q,48,y,516,11,TEAL,True)+5
    y=text(a,48,y,516,10.3)+17


master_extra_qa()


start('The technical words, translated','15 / A pocket glossary','Use the analogy to learn it, then use the technical term when it helps.','Definitions describe how terms are used in this project, based on the inspected source.')
table(['Term','Like I’m 5 / what it means here'],[
    ('API','A service counter: a screen sends a request and the server returns a result.'),
    ('Event','A line in the notebook: an accepted thing that happened to a case.'),
    ('Command','A request to add a line: it can be rejected if the action is not allowed.'),
    ('State machine','Rules for which step can happen next. A card acknowledgment cannot jump directly to a pharmacy fill.'),
    ('Atomic transaction','One sealed change: the relevant checks and writes succeed together or fail together.'),
    ('Idempotency','Pressing the button again does not create a second copy of the same result.'),
    ('Polling','Asking “anything new?” repeatedly. The live adapter uses a roughly 1.5-second interval.'),
    ('Run + revision','Which notebook session, and which version of that session. They help reject old responses.'),
    ('Enum','A fixed set of labeled boxes. A reason must fit one allowed category or fall back to review.'),
    ('Hash + provenance','A fingerprint plus a source receipt. A hash detects changes; provenance records where the material came from.'),
    ('Aggregate','A summary count. Removing names alone does not automatically establish a complete privacy guarantee.'),
    ('RxFill-shaped event','A simulated message describing pharmacy fill status. The prototype does not establish a live certified network feed.')
],151,[133,383])



start('Practice until you can explain it','16 / Recall and rehearsal','If you can answer these without reading the page, you understand the core story.','Use the source map on pages 31–34 to investigate a component before making a stronger claim.')
heading('Five-minute rehearsal',153)
bullets([
    ('Minute 1: the job.', 'Say the one-sentence pitch. Name the main user and the next-step problem.'),
    ('Minute 2: the flow.', 'Draw six boxes from prescription to separate pharmacy confirmation.'),
    ('Minute 3: the system.', 'Name the screens, server, database and polling adapter. Explain a command versus an event.'),
    ('Minute 4: the safeguards.', 'Explain unknown reasons, eligibility flags, duplicate actions and source-verified label text.'),
    ('Minute 5: the limits.', 'Name what is simulated, what is merely present in code, and what was physically demonstrated in the run.')
],191)
heading('Three “teach it back” questions',465)
para('<b>1.</b> Why can’t the patient tap confirm the fill?<br/><b>2.</b> Why is “AI picked the fix” an inaccurate explanation?<br/><b>3.</b> Why does a successful server notification response not prove a watch buzz?',498)
card('SHORT ANSWERS','1. It is acknowledgment, not independent pharmacy evidence.<br/>2. Rules and eligibility flags choose the administrative action.<br/>3. Server acceptance and delivery to the physical device are different events.',48,589,h=94,accent=PURPLE)
small('Final preflight: correct deployed SHA/mode, same active run, approval ready, phone access working, label available, separate fill trigger, truthful fallback.',48,699)


master_cheat()


start('Sources and snapshot boundaries','17 / Trace the explanation','This guide is based on project files and code, not a newly executed deployment or clinical evaluation.')
small('Source links use fetched main '+SHA+'. The deployed audit used an earlier build after PR #39 merged. This PDF reconciles evidence; it is not a new production check.',48,148)
sources=[
    ('1','Product and demo','docs/spec-v2-coordinator.md'),
    ('2','Pitch source (contains older claims)','docs/presentation/pitch-and-qa.md'),
    ('3','Current web integration handoff','docs/handoffs/phase6-integration.md'),
    ('4','Workflow authority','lib/server/workflow.ts'),
    ('5','Archived screen captures','docs/stills'),
    ('6','Patient-facing fixed copy','mock/templates.json'),
    ('7','Live polling and commands','lib/realtime.ts'),
    ('8','Verified label facade and artifacts','lib/server/label.ts'),
    ('9','Deterministic routing','lib/server/router.ts'),
    ('10','Coordinator access and message storage','supabase/migrations'),
    ('11','Notification publisher','lib/server/ntfy.ts'),
    ('12','Seeded counts and scope','docs/handoffs/vinh-seed-week.md'),
]
y=227
for num,title,path in sources:
    kind='blob' if '.' in path.split('/')[-1] else 'tree'
    url=f'https://github.com/khadimswe/firstdose/{kind}/{SHA}/{path}'
    y=text(f'<b>[{num}] {title}</b><br/><link href="{url}" color="{TEAL}">{path}</link>',48,y,516,9.1,leading=12.2)+9
small('[13] Classifier: lib/server/classify.ts and classifier/gemini.ts, merged via PR #39. Current deployed claims: docs/claims-audit.md, top dated refresh; older sections are historical.',48,637)
small('Supporting code: app/api/*; supabase/migrations/*; data/labels/drug_otezla/*; components/data/*. The guide’s diagrams are explanatory illustrations. The bar chart is calculated from the repository’s seeded counts; the app images are saved hosted-audit captures; see page 34.',48,674)

exec(compile((SOURCE/'business_sources_page.py').read_text(encoding='utf-8'), 'business_sources_page.py', 'exec'))

master_extra_sources()


start('Current build and remaining proof','September 26 alignment / main 015c342','The pitch still fits. The implementation has moved from an integration branch to merged code and recorded deployed browser evidence.','Evidence is dated, not freshly rerun for this PDF. Physical phones and watches are separate from browser sessions.')
node('Merged source','Gemini/Tiger, frontend repairs, both labels and source clips.',48,151,159,87)
node('Recorded live checks','Maria, James, messages, Tiger summary and reset.',224,151,159,87)
node('Still to demonstrate','Latest build on physical devices; optional voice/audio.',400,151,164,87,col=PURPLE)
arrow(208,194,223,194); arrow(384,194,399,194)
table(['Evidence / scope','What to say'],[
    ('Deployed browser audit','After #39: both workflows and independent-session persistence/reset passed; 62 route/browser/viewport checks loaded. Not 62 end-to-end cases.'),
    ('Tiger summary','8 synthetic seeded fills; median 60 seconds; reason counts 2/2/2. Reset: 0 fills, null median, empty reasons. Direct hypertable query, no continuous aggregate.'),
    ('Frontend repairs (#40)','Merged. Recorded 724 tests, lint/live+mock builds and 57 axe scans passed. Chromium/Firefox 44 checks each; WebKit 43 plus corrected skip-link recheck.'),
    ('Voice + remaining gates','Merged pre-confirm run check; complete recording-to-approval reset safety remains unverified. Recheck latest deployed repairs; record physical flow, watch alerts, voice/audio.'),
    ('Latest #43 / #44 / #47','Humira verified; owner sign-off merged. Recorded 728 tests / 54 files and local build/lint/typecheck. Five original LFS clips, not a final edit. Deployed Humira recheck remains.'),
    ('Scope cuts (6.6 / 6.7)','No NPPES colleague discovery or coordinator-active/fixes-per-coordinator tiles. Existing Tiger fill/time/reason summary remains. TestFlight needs Mac acceptance.')
],263,[137,379])
small('Evidence: docs/minh-signoff-5.1.md; video/README.md; recorded hosted audit at commit 1d12279. Owner records are not fresh tests for this PDF.',48,677)


exec(compile((SOURCE/'feature_appendix.py').read_text(encoding='utf-8'),'feature_appendix.py','exec'))

exec(compile((SOURCE/'speaker_pages.py').read_text(encoding='utf-8'),'speaker_pages.py','exec'))

exec(compile((SOURCE/'revision_pages.py').read_text(encoding='utf-8'),'revision_pages.py','exec'))

c.save()

(TMP/'master-page-index.json').write_text(json.dumps(reading_log,ensure_ascii=False,indent=2),encoding='utf-8')
assert not overflows, json.dumps(overflows,ensure_ascii=False)
doc=fitz.open(OUT)
print(json.dumps({'pdf':str(OUT),'pages':len(doc),'bytes':OUT.stat().st_size,'text_chars':sum(len(p.get_text()) for p in doc),'layout_warnings':len(overflows)}))
for i,p in enumerate(doc):
    p.get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(TMP/f'master-page-{i+1:02d}.png')
# Contact sheets for visual review.
for startidx in range(0,len(doc),6):
    sheet=Image.new('RGB',(918,1188),'#D8DFE7')
    for j in range(startidx,min(startidx+6,len(doc))):
        im=Image.open(TMP/f'master-page-{j+1:02d}.png').convert('RGB'); im.thumbnail((300,580))
        sheet.paste(im,((j-startidx)%3*306,(j-startidx)//3*594))
    sheet.save(TMP/f'master-contact-{startidx//6+1}.png')
print('Rendered review pages and contact sheets:',TMP)
