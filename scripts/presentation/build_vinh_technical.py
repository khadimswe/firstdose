"""Build Vinh's focused technical demo guide with vector diagrams and charts."""
from pathlib import Path
from xml.sax.saxutils import escape
import json
import pymupdf as fitz
from PIL import Image, ImageOps, ImageDraw
from vinh_technical_content import PAGES, SOURCES

SOURCE=Path(__file__).resolve().parent
ROOT=SOURCE.parents[1]
stem='FirstDose-Vinh-Technical-Demo'
code=(SOURCE/'build_master.py').read_text(encoding='utf-8')
pre=code[:code.index("exec(compile((SOURCE/'master_pages_aligned.py')")]
pre=pre.replace("OUT = OUTPUT / 'FirstDose-Master-Guide.pdf'",f"OUT = OUTPUT / '{stem}.pdf'")
ns={'__file__':str(SOURCE/'build_master.py')}
exec(compile(pre,'shared_pdf_style','exec'),ns)
c=ns['c']; text=ns['text']; rect=ns['rect']; arrow=ns['arrow']; line=ns['line']
c.setTitle('FirstDose | Vinh: Technical Demo & Judge Preparation')
c.setSubject('Oracle of the Deep, Impiricus and SpaceXAI; short script, backend, APIs, data and recall drills')
md=['# FirstDose — Vinh’s technical demo and judge preparation\n\nSeptember 27, 2026. Selected tracks: Oracle of the Deep, Impiricus, SpaceXAI.\n']
page_num=0
def start(title,deck):
    global page_num
    if page_num: c.showPage()
    page_num+=1; ns['page']=page_num
    c.bookmarkPage(f'p{page_num}'); c.addOutlineEntry(title,f'p{page_num}',0)
    rect(0,0,612,8,ns['TEAL'],r=0)
    text('VINH / TECHNICAL DEMO & JUDGE PREP',48,30,516,8.5,ns['TEAL'],True)
    y=text(escape(title),48,52,516,22 if len(title)<42 else 20,ns['INK'],True,25)
    y=text(escape(deck),48,y+10,516,10,ns['MUTED'],leading=13)+22
    line(48,744,564,744)
    text('FIRSTDOSE  /  SOURCE MAIN 015c342  /  27 SEP 2026',48,758,470,7.3,ns['MUTED'])
    text(str(page_num).zfill(2),540,757,24,9,ns['TEAL'],True)
    return y

def flow_page():
    y=start('Trace one action through the backend','Learn this diagram once; it explains every screen transition in your demo.')
    boxes=[('1  React screen','A person clicks a permitted action.'),('2  Next.js server','Authenticate → validate → plan events.'),('3  Supabase transaction','Check run/revision; commit batch + alert intent.'),('4  Polling screens','Read accepted history about every 1.5 seconds.')]
    for i,(title,body) in enumerate(boxes):
        top=y+i*92
        ns['node'](title,body,95,top,422,67)
        if i<3: arrow(306,top+68,306,top+90)
    by=y+390
    ns['node']('After commit: ntfy','Notify the phone / watch.',48,by,246,77)
    ns['node']('After commit: Tiger','Replay selected outcome metrics.',318,by,246,77)
    text('Gemini supplies a reason before the classification commit. The deterministic router remains outside the model. Neither a failed buzz nor a delayed analytics query erases the accepted workflow.',48,by+98,516,10.3)
    md.append('\n## Backend diagram\n\nReact → Next.js validation/planning → Supabase atomic commit → polling clients. Post-commit branches: ntfy notification delivery and minimized Tiger replay. Gemini interprets a note; rules select actions.\n')

def graph_page():
    y=start('Two denominators, different questions','Saved CMS Georgia Part D formulary snapshot, September 2026. Not patient probabilities.')
    for title,values,top in [('Share of Georgia plans covering product',[53.9,33.6],y),('Among covering plans: share requiring PA',[90.2,100.0],y+220)]:
        text(title,48,top,516,13,ns['INK'],True)
        for i,(name,val) in enumerate(zip(['Otezla','Humira(CF) Pen'],values)):
            yy=top+48+i*63
            text(name,48,yy,135,10,ns['INK'],True)
            rect(187,yy,295,24,'#E7EDF2',r=3)
            rect(187,yy,295*val/100,24,ns['TEAL'] if i==0 else ns['PURPLE'],r=3)
            text(f'{val:g}%',491,yy+3,73,11,ns['INK'],True)
        text('0%',187,top+181,100,8,ns['MUTED']); text('100%',462,top+181,70,8,ns['MUTED'])
    ns['card']('WHAT TO SAY','“Coverage asks whether a plan includes the product. Prior authorization asks what approval it requires among the plans that do. These figures provide context; they do not predict Maria’s outcome.”',48,y+451,h=98)
    md.append('\n## CMS graph\n\nGeorgia plan coverage: Otezla 53.9%, Humira(CF) Pen 33.6%. PA among covering plans: 90.2% and 100%, respectively. Saved September 2026 snapshot; do not interpret as patient rejection rates.\n')

for idx,(title,deck,blocks) in enumerate(PAGES):
    y=start(title,deck)
    md.append(f'\n## {title}\n\n{deck}\n')
    for label,body in blocks:
        from reportlab.platypus import Paragraph
        from reportlab.lib.styles import ParagraphStyle
        p=Paragraph(escape(body),ParagraphStyle('measure',fontName='Body',fontSize=10.2,leading=14))
        height=p.wrap(516,1000)[1]+32
        if y+height>713: y=start(title+' / continued',deck)
        col=ns['PURPLE'] if label.startswith(('SAY','QUEUE','BARRIER','RESOURCE','CONFIRMATION','JAMES /','MARKET ACCESS →')) else ns['TEAL']
        y=text(escape(label),48,y,516,8.8,col,True,11)+5
        y=text(escape(body),48,y,516,10.2,leading=14)+15
        md.append(f'\n**{label}**\n\n{body}\n')
    if idx==0: flow_page()
    if title=='Real reference data, fictional cases': graph_page()

y=start('Sources and evidence boundaries','Links are clickable. Private invite tokens and local credentials are intentionally excluded.')
for title,url,note in SOURCES:
    if y+80>708: y=start('Sources / continued','Implementation facts use the inspected source; outcome claims need separate evidence.')
    y=text(f'<link href="{escape(url)}" color="{ns["TEAL"]}"><b>{escape(title)}</b></link>',48,y,516,10.3)+5
    y=text(escape(note),48,y,516,9.4,ns['MUTED'],leading=13)+15
    md.append(f'\n- [{title}]({url}): {note}\n')

audio_meta=ROOT/'docs/presentation/FirstDose-Vinh-Audio-Chapters.json'
if audio_meta.exists():
    data=json.loads(audio_meta.read_text(encoding='utf-8'))
    y=start('Listen, then rehearse out loud','The MP3 is an ElevenLabs synthetic study narration; it is not a recording of Vinh.')
    for row in data['chapters']:
        secs=int(row['start_seconds']); stamp=f'{secs//60:02d}:{secs%60:02d}'
        y=text(f'<b>{stamp}</b>  {escape(row["title"])}',48,y,516,11)+14
    text('First listen for the mental model. On a second pass, pause at each question and answer before hearing the explanation. Use the short PDF script for timing; the full episode is study material.',48,y+12,516,10.5)

c.save()
out=ROOT/'docs/presentation'/f'{stem}.pdf'
(out.with_suffix('.md')).write_text('\n'.join(md),encoding='utf-8')
doc=fitz.open(out)
assert not ns['overflows'], ns['overflows']
for n,p in enumerate(doc):
    assert len(p.get_text())>120,(n,'empty')
    assert '\ufffd' not in p.get_text(),(n,'glyph')
    for b in p.get_text('dict')['blocks']:
        for ln in b.get('lines',[]):
            for s in ln['spans']:
                x0,y0,x1,y1=s['bbox']
                assert x0>=0 and y0>=0 and x1<=613 and y1<=793,(n,s['text'])
    p.get_pixmap(matrix=fitz.Matrix(1.15,1.15)).save(ROOT/'.presentation-build'/f'vinh-tech-{n+1:02}.png')
for batch in range(0,len(doc),8):
    sheet=Image.new('RGB',(4*306,2*410),'#DDE4EC')
    for j in range(batch,min(batch+8,len(doc))):
        im=Image.open(ROOT/'.presentation-build'/f'vinh-tech-{j+1:02}.png'); im.thumbnail((296,390))
        x=(j-batch)%4*306+5; yy=(j-batch)//4*410+15
        sheet.paste(im,(x,yy)); ImageDraw.Draw(sheet).text((x,yy-13),str(j+1),fill='black')
    sheet.save(ROOT/'.presentation-build'/f'vinh-tech-contact-{batch//8+1}.png')
print(json.dumps({'file':out.name,'pages':len(doc),'bookmarks':len(doc.get_toc()),'layout_warnings':len(ns['overflows']),'bytes':out.stat().st_size}))
