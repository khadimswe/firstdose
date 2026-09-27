"""Render the requested 30 spoken Q&A answers as a standalone PDF."""
from pathlib import Path
from xml.sax.saxutils import escape
import json
import pymupdf as fitz
from PIL import Image, ImageDraw

SOURCE=Path(__file__).resolve().parent
ROOT=SOURCE.parents[1]
stem='FirstDose-Vinh-Judge-Questions-and-Answers'
code=(SOURCE/'build_master.py').read_text(encoding='utf-8')
pre=code[:code.index("exec(compile((SOURCE/'master_pages_aligned.py')")]
pre=pre.replace("OUT = OUTPUT / 'FirstDose-Master-Guide.pdf'",f"OUT = OUTPUT / '{stem}.pdf'")
ns={'__file__':str(SOURCE/'build_master.py')}
exec(compile(pre,'shared_pdf_style','exec'),ns)
c=ns['c']; start=ns['start']; text=ns['text']; card=ns['card']; line=ns['line']
c.setTitle('FirstDose | Vinh: 30 Judge Questions & Answers')
c.setSubject('Spoken technical answers and corrections for the September 27 Maria-only three-minute run sheet')
qa=json.loads((SOURCE/'vinh_judge_qa.json').read_text(encoding='utf-8'))
assert len(qa)==30
footer='Prepared September 27, 2026. Implementation snapshot: main 015c342. Fictional cases and pharmacy activity.'
start('30 judge questions & answers','Vinh / Three-minute demo follow-up','Short answers you can say aloud, with deeper detail when a judge asks.',footer)
card('THE ONE SENTENCE TO REMEMBER','Gemini reads the note. A rule picks the fix. A human approves. Supabase stores the workflow. Tiger measures the outcome.',48,153,h=105)
y=text('How to use this handout',48,293,516,17,ns['INK'],True)+16
y=text('Give the main answer first. Stop and let the judge respond. Use the smaller follow-up only when useful. The questions follow your Maria-only run sheet; James and optional voice stay available for questions.',48,y,516,11,leading=16)+25
for label,body in [('Start here','Q1–4: what you built, what is simulated, the stack and the path behind a click.'),('Know cold','Q9–16: AI boundaries, routing, coordinator approval and NPI checks.'),('Protect the outcome','Q18–24: acknowledgment, watch receipt, Tiger metrics and privacy limits.'),('Connect to the tracks','Q25–30: Grok, ElevenLabs, Oracle / Impiricus / SpaceXAI, tests and production.')]:
    y=text(escape(label),48,y,516,10,ns['TEAL'],True)+5
    y=text(escape(body),48,y,516,10.5,leading=15)+15
text('The final page has six small corrections to the supplied run sheet. The answers distinguish implemented prototype behavior from proposed production capabilities.',48,651,516,10,ns['MUTED'],leading=14)

md=['# FirstDose — Vinh: 30 judge questions and answers\n\nPrepared September 27, 2026 for the Maria-only three-minute demo.\n\nGemini reads the note. A rule picks the fix. A human approves. Supabase stores the workflow. Tiger measures the outcome.\n']
for offset in range(0,30,4):
    end=min(offset+4,30)
    start(f'Questions {offset+1}–{end}','Technical Q&A / Say the main answer first','Follow-up details are smaller. Expand only when the judge asks.',footer)
    y=149
    for idx in range(offset,end):
        question,answer,follow=qa[idx]
        y=text(f'{idx+1}. {escape(question)}',48,y,516,13,ns['INK'],True,17)+8
        y=text(escape(answer),48,y,516,10.7,leading=15)+7
        if follow: y=text(escape(follow),48,y,516,9.4,ns['MUTED'],leading=13)+9
        if idx<end-1:
            line(48,y+3,564,y+3); y+=20
        md.append(f'\n## {idx+1}. {question}\n\n{answer}\n\n{follow}\n')
    assert y<714,(offset,y)

start('Six run-sheet wording fixes','Use these before presenting','Keep the short script; tighten these claims so the follow-up answers stay consistent.',footer)
fixes=[
('“That’s the only alert”','“That’s the first alert.” You demonstrate a second alert after confirmation.'),
('“Through Impiricus Wallet”','“Through our Wallet stand-in.” The actual partner integration is proposed.'),
('“FirstDose is a new Ascend skill”','“FirstDose is our proposed Ascend skill.”'),
('“Pharma pays”','“Our proposed model is that pharma pays.” Pricing and buyer demand remain unvalidated.'),
('“As little as $0”','“Maria receives the demo savings card.” You have not demonstrated her actual final price.'),
('NPI / already-verified-doctor claim','Say that the prototype uses fictional accounts and a shared demo login. NPI format checking is not identity verification, and simulated coordinator approval does not establish production authorization.')]
y=151
md.append('\n## Six run-sheet wording fixes\n')
for old,new in fixes:
    y=text(escape(old),48,y,516,11,ns['PURPLE'],True)+6
    y=text(escape(new),48,y,516,10.6,leading=15)+21
    md.append(f'\n- {old} → {new}\n')
assert y<710,y
c.save()
out=ROOT/'docs/presentation'/f'{stem}.pdf'
out.with_suffix('.md').write_text('\n'.join(md),encoding='utf-8')
doc=fitz.open(out)
assert len(doc)==10
assert not ns['overflows'],ns['overflows']
combined='\n'.join(p.get_text() for p in doc)
assert all(f'{i}.' in combined for i in range(1,31))
assert '\ufffd' not in combined
for i,p in enumerate(doc):
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines',[]):
            for s in l['spans']:
                x0,y0,x1,y1=s['bbox']
                assert 0<=x0<x1<=613 and 0<=y0<y1<=793,(i,s['text'])
    p.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(ROOT/'.presentation-build'/f'judge-qa-{i+1:02}.png')
for batch in range(0,len(doc),6):
    sheet=Image.new('RGB',(3*330,2*445),'#DDE4EC')
    for i in range(batch,min(batch+6,len(doc))):
        im=Image.open(ROOT/'.presentation-build'/f'judge-qa-{i+1:02}.png'); im.thumbnail((318,417))
        x=(i-batch)%3*330+6; y=(i-batch)//3*445+20
        sheet.paste(im,(x,y)); ImageDraw.Draw(sheet).text((x,y-15),str(i+1),fill='black')
    sheet.save(ROOT/'.presentation-build'/f'judge-qa-contact-{batch//6+1}.png')
print(json.dumps({'file':out.name,'pages':len(doc),'questions':len(qa),'bookmarks':len(doc.get_toc()),'layout_warnings':len(ns['overflows']),'bytes':out.stat().st_size}))
