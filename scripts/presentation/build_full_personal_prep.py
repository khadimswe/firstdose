from pathlib import Path
import json
from xml.sax.saxutils import escape
import pymupdf as fitz
from PIL import Image

p=Path(__file__).parent
master_code=(p/'build_master.py').read_text(encoding='utf-8')
pre=master_code[:master_code.index("exec(compile((SOURCE/'master_pages_aligned.py')")]
pages=(p/'master_pages_aligned.py').read_text(encoding='utf-8')
person_source=(p/'speaker_pages.py').read_text(encoding='utf-8').split("# RENDER PERSONAL SCRIPTS")[0]
data={}
exec(compile((p/'deep_qa.py').read_text(encoding='utf-8'),'deep_qa.py','exec'),data)
output=p.parents[1]/'docs/presentation'
build=p.parents[1]/'.presentation-build'
master_path=output/'FirstDose-Master-Guide.pdf'
master=fitz.open(master_path)
assert len(master)==45
roles={
    'Vinh':('Drive the demo. Explain the shared state, workflow, pharmacy proof and watch. Khadim takes business; Minh takes AI and labels.',[]),
    'Minh':('Deliver the short James explanation. Take AI and label questions; Vinh adds a sentence when needed.',[]),
    'Khadim':('Open and close. Explain the business, buyer, market and proposed Impiricus fit. Hand the demo to Vinh.',[])
}

results=[]
for name,(role,extras) in roles.items():
    supplement=build/f'{name}-deep-prep-notes.pdf'
    local_pre=pre.replace("OUT = OUTPUT / 'FirstDose-Master-Guide.pdf'",'OUT = Path('+repr(str(supplement))+')')
    local_pre=local_pre.replace("'FIRSTDOSE  /  PRESENTATION PREP'",repr('FIRSTDOSE  /  '+name.upper()+' DEEP PREP'))
    ns={'__file__':str(p/'build_master.py')}
    exec(compile(local_pre,'prelude','exec'),ns)
    exec(compile(pages,'master_pages_aligned.py','exec'),ns)
    ns['script_lines']=ns['SCRIPT']
    exec(compile(person_source,'speaker_pages.py','exec'),ns)
    start,text,card,table,small,heading=[ns[k] for k in ['start','text','card','table','small','heading']]
    start(name+' · complete presentation prep','Personal script + in-depth judge questions','A self-contained study book: your role, 42 detailed questions, and the complete illustrated master guide. September 26, 2026.','Source snapshot: main 015c342. Code/evidence review for these notes; application tests were not rerun for this PDF.')
    card('START HERE',role,48,150,h=83)
    table(['Reading path','What you will find'],[
        ('Personal page 2','Your exact spoken lines, timing, actions and next-speaker cues.'),
        ('Personal pages 3–4','Questions tailored to your presentation responsibilities.'),
        ('Personal pages 5–13','Shared architecture, workflow, AI, metrics, privacy, testing and production questions.'),
        ('Personal pages 14–16','Advanced label identity/extraction, classifier contract and analytics ledger/math.'),
        ('Master pages 1–45','The complete original guide: pitch, named team scripts, features, charts, screenshots, business scenarios and linked sources.')
    ],261,[148,368])
    heading('How to answer a judge',572)
    small('Give the short answer first. Expand only as needed with the implementation or evidence. Finish with the practical limit or next validation. Each question below includes all three layers.',48,606)
    card('FIND THINGS QUICKLY','Use PDF bookmarks. P-1 to P-16 are your prep notes; M-1 to M-45 are the full master reference. Original master page numbers and links remain intact.',48,648,h=74,accent=ns['PURPLE'])
    ns['personal_script'](name,role,extras)

    topics=data['ROLE'][name]+data['COMMON']+data['ADVANCED']
    assert len(topics)==14 and sum(len(t[2]) for t in topics)==42
    for title,sources,questions in topics:
        source_path=sources.split(';')[0].strip()
        if ' ' not in source_path and '/' in source_path:
            kind='blob' if '.' in source_path.split('/')[-1] else 'tree'
            url='https://github.com/khadimswe/firstdose/'+kind+'/015c3429a12518ed67753a47db9eaae308e82b13/'+source_path
            footer='<link href="'+url+'" color="#087F8C">Source: '+escape(source_path)+'</link> · Further module references in the master source map.'
        else:
            footer='Sources: '+escape(sources)+'. See the master’s linked evidence pages for scope and dates.'
        start(title,'Judge Q&A / Short answer, then depth','Use these explanations to understand the system. Do not present a recorded test or an illustrative calculation as a new result.',footer)
        def measure(txt,size,lead,bold=False):
            sty=ns['ParagraphStyle']('m',fontName='Bold' if bold else 'Body',fontSize=size,leading=lead)
            return ns['Paragraph'](txt,sty).wrap(516,1000)[1]
        def dimensions(body_size):
            y=147
            for q,a,deep,take in questions:
                y+=measure(escape(q),11,14.3,True)+5
                y+=measure('<b>Short answer:</b> '+escape(a),10.3,13.7)+7
                y+=measure(escape(deep),body_size,body_size*1.36)+7
                y+=measure(escape(take),9.2,12.1)+21
            return y
        body_size=10.2
        while dimensions(body_size)>711 and body_size>9.3: body_size-=0.1
        assert dimensions(body_size)<=711,(title,dimensions(body_size))
        y=147
        for q,a,deep,take in questions:
            y=text(escape(q),48,y,516,11,ns['TEAL'],True,14.3)+5
            y=text('<b>Short answer:</b> '+escape(a),48,y,516,10.3,leading=13.7)+7
            y=text(escape(deep),48,y,516,body_size,leading=body_size*1.36)+7
            y=text(escape(take),48,y,516,9.2,ns['PURPLE'],leading=12.1)+21
    assert ns['page']==16
    assert not ns['overflows'],ns['overflows']
    ns['c'].save()
    notes=fitz.open(supplement)
    out=fitz.open()
    out.insert_pdf(notes)
    offset=len(notes)
    out.insert_pdf(master)
    toc=[[1,name+' — personal notes and questions',1]]
    toc.extend([[level+1,title,page] for level,title,page in notes.get_toc()])
    toc.append([1,'Complete master reference',offset+1])
    toc.extend([[level+1,title,page+offset] for level,title,page in master.get_toc()])
    out.set_toc(toc)
    out.set_page_labels([{'startpage':0,'prefix':'P-','style':'D','firstpagenum':1},{'startpage':offset,'prefix':'M-','style':'D','firstpagenum':1}])
    out.set_metadata({'title':f'FirstDose | {name} Complete Pitch, Technical and Q&A Prep','author':'FirstDose presentation preparation','subject':'Personal script, 42 deep questions and the full illustrated reference; source 015c342'})
    built=output/f'FirstDose-{name}-Full-Prep.pdf'
    out.save(built,garbage=4,deflate=True)
    out.close()
    doc=fitz.open(built)
    assert len(doc)==61
    full='\n'.join(page.get_text() for page in doc)
    assert name+' · your speaking script' in doc[1].get_text()
    for required in ['42 detailed questions','Label identity and the verification chain','Analytics ledger, SQL and interpretation','Why the industry cares','pre-generated ElevenLabs']:
        assert required in full,required
    if name=='Vinh': assert '834' in full
    for i,page in enumerate(doc):
        assert len(page.get_text())>400 and '\ufffd' not in page.get_text(),(name,i+1)
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                for span in line['spans']:
                    x0,y0,x1,y1=span['bbox']
                    assert 0<=x0<x1<=613 and 0<=y0<y1<=793,(name,i+1,span['text'])
        for link in page.get_links():
            if link['kind']==fitz.LINK_GOTO: assert 0<=link['page']<len(doc)
    # Confirm the original master contents links moved to the preserved master pages.
    original_links=[v for v in master[1].get_links() if v['kind']==fitz.LINK_GOTO]
    merged_links=[v for v in doc[offset+1].get_links() if v['kind']==fitz.LINK_GOTO]
    assert [v['page'] for v in merged_links]==[v['page']+offset for v in original_links]
    # Render every newly authored note page; the master was already reviewed.
    for i in range(offset):
        doc[i].get_pixmap(matrix=fitz.Matrix(1.1,1.1)).save(build/f'{name.lower()}-full-{i+1:02d}.png')
    for begin in range(0,offset,4):
        sheet=Image.new('RGB',(864,1120),'#D8DFE7')
        for j in range(begin,min(begin+4,offset)):
            im=Image.open(build/f'{name.lower()}-full-{j+1:02d}.png').convert('RGB')
            im.thumbnail((424,550))
            sheet.paste(im,((j-begin)%2*432,(j-begin)//2*560))
        sheet.save(build/f'{name.lower()}-full-contact-{begin//4+1}.png')
    results.append({'name':name,'built':str(built),'pages':len(doc),'new_qa':42,'master_pages':len(master),'bookmarks':len(doc.get_toc())})
print(json.dumps(results))
