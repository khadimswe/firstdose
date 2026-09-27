"""Generate the shorter, plain-language study episode using the existing audio engine."""
from pathlib import Path
import concurrent.futures
import json
import subprocess
import build_vinh_audio as engine

ROOT=engine.ROOT
SOURCE=Path(__file__).resolve().parent
OUT=ROOT/'docs/presentation'
stem='FirstDose-Vinh-Simple-Study-Podcast'
chapters=json.loads((SOURCE/'vinh_simple_audio.json').read_text(encoding='utf-8'))
engine.CACHE=ROOT/'.presentation-build/vinh-simple-audio'
engine.CACHE.mkdir(parents=True,exist_ok=True)

if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        rendered=sorted(pool.map(engine.generate,enumerate(chapters)))
    total=0; metadata=[]; waves=[]
    for i,mp3,_ in rendered:
        wave=engine.CACHE/f'{i+1:02}.wav'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(mp3),'-af','apad=pad_dur=1','-ar','44100','-ac','1',str(wave)],check=True)
        duration=engine.probe(wave)
        metadata.append({'title':chapters[i]['title'],'start_seconds':round(total,3),'duration_seconds':round(duration,3)})
        total+=duration; waves.append(wave)
    listing=engine.CACHE/'concat.txt'
    listing.write_text('\n'.join("file '"+p.as_posix()+"'" for p in waves),encoding='utf-8')
    out=OUT/f'{stem}.mp3'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),
        '-af','loudnorm=I=-19:TP=-1.5:LRA=7','-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','96k',
        '-metadata','title=FirstDose: Simple Demo and Judge Q&A Rehearsal',
        '-metadata','artist=FirstDose study guide - synthetic ElevenLabs narrator',str(out)],check=True)
    meta={'provider':'ElevenLabs','voice':'George (premade synthetic narrator)','source_sha':'015c342','date':'2026-09-27','duration_seconds':engine.probe(out),'chapters':metadata}
    (OUT/f'{stem}-Chapters.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
    transcript=['# FirstDose — simple drive-time study podcast\n\nSynthetic ElevenLabs narrator, not Vinh’s recorded voice. Maria-only demo; Oracle, Impiricus and SpaceXAI. Source main 015c342.\n']
    for chapter,m in zip(chapters,metadata):
        sec=int(m['start_seconds'])
        transcript.append(f'\n## {sec//60:02d}:{sec%60:02d} — {chapter["title"]}\n\n{chapter["text"]}\n')
    (OUT/f'{stem}-Transcript.md').write_text('\n'.join(transcript),encoding='utf-8')
    print(json.dumps({'file':out.name,'seconds':engine.probe(out),'bytes':out.stat().st_size,'chapters':len(chapters)}),flush=True)
