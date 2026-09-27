"""Verify generated PDF structure, shared scripts, bounds and master inclusion."""
from pathlib import Path
import json, re
import pymupdf as fitz

root=Path(__file__).resolve().parents[2]
folder=root/'docs/presentation'
rows=json.loads((Path(__file__).parent/'pitch_script.json').read_text(encoding='utf-8'))
master=fitz.open(folder/'FirstDose-Master-Guide.pdf')
assert len(master)==45 and len(master.get_toc())==45
assert all(len(page.get_text())>300 for page in master)

def compact(s):
    return re.sub(r'\s+',' ',s).strip()

master_text=compact(' '.join(p.get_text() for p in master))
for row in rows:
    assert compact(row['say']) in master_text, row['time']
for expected in ['728','833,900','UNABLE_TO_REACH','HCPs','polling','Khadim','42']:
    # 42 is a page number here; detailed question counts are checked below.
    assert expected in master_text,expected

results=[]
for path in [folder/'FirstDose-Master-Guide.pdf',*sorted(folder.glob('FirstDose-*-Full-Prep.pdf'))]:
    doc=fitz.open(path)
    full=compact(' '.join(page.get_text() for page in doc))
    for stale in ['Humira placeholder','Humira remains an explicit placeholder','Otezla only, fixed','d532073','C:/Users/','C:\\Users\\','Null is displayed as unknown']:
        assert stale not in full,(path.name,stale)
    assert '\ufffd' not in full,path.name
    for i,page in enumerate(doc):
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                for span in line['spans']:
                    x0,y0,x1,y1=span['bbox']
                    assert 0<=x0<x1<=613 and 0<=y0<y1<=793,(path.name,i+1,span['text'])
        for link in page.get_links():
            if link['kind']==fitz.LINK_GOTO:
                assert 0<=link['page']<len(doc),(path.name,i+1,link)
    if 'Full-Prep' in path.name:
        name=path.name.split('-')[1]
        assert len(doc)==61 and len(doc.get_toc())==63,path.name
        assert sum(p.get_text().count('Short answer:') for p in list(doc)[:16])==42,path.name
        for i,original in enumerate(master):
            assert doc[16+i].get_text()==original.get_text(),(path.name,i)
        mine=compact(doc[1].get_text())
        for row in rows:
            if row['speaker']==name: assert compact(row['say']) in mine,(name,row['time'])
        assert doc[0].get_label()=='P-1' and doc[16].get_label()=='M-1'
        old=[x['page'] for x in master[1].get_links() if x['kind']==fitz.LINK_GOTO]
        new=[x['page'] for x in doc[17].get_links() if x['kind']==fitz.LINK_GOTO]
        assert new==[v+16 for v in old],path.name
    results.append({'file':path.name,'pages':len(doc),'bookmarks':len(doc.get_toc()),'bytes':path.stat().st_size})
assert len(results)==4
(root/'.presentation-build/pdf-verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps(results,indent=2))
