"""Generate the requested study narration with ElevenLabs; reuse exact cached chapters.

Requires ELEVENLABS_API_KEY in the process environment, requests and ffmpeg/ffprobe.
No credentials are read from or written to tracked files. Generation uses provider credits.
"""
from pathlib import Path
import concurrent.futures
import hashlib
import json
import os
import subprocess
import requests

ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path(__file__).resolve().parent
OUT=ROOT/'docs/presentation'
CACHE=ROOT/'.presentation-build/vinh-audio'
CACHE.mkdir(parents=True,exist_ok=True)
chapters=json.loads((SOURCE/'vinh_audio_script.json').read_text(encoding='utf-8'))
VOICE='JBFqnCBsd6RMkjVDRZzb'  # ElevenLabs premade George; no personal voice clone.
MODEL='eleven_multilingual_v2'
settings={'stability':0.55,'similarity_boost':0.75,'style':0.12,'use_speaker_boost':True,'speed':1.04}

def probe(path):
    raw=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(path)],text=True)
    return float(json.loads(raw)['format']['duration'])

def generate(item):
    i,ch=item
    digest=hashlib.sha256(json.dumps([VOICE,MODEL,settings,ch['text']],ensure_ascii=False).encode()).hexdigest()[:16]
    mp3=CACHE/f'{i+1:02}-{digest}.mp3'
    if not mp3.exists():
        key=os.environ.get('ELEVENLABS_API_KEY')
        if not key: raise RuntimeError('ELEVENLABS_API_KEY is required for uncached chapters')
        response=requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}',
            params={'output_format':'mp3_44100_128'},headers={'xi-api-key':key,'accept':'audio/mpeg'},
            json={'text':ch['text'],'model_id':MODEL,'voice_settings':settings},timeout=180)
        if response.status_code!=200:
            raise RuntimeError(f'TTS failed for chapter {i+1}: HTTP {response.status_code}')
        if len(response.content)<10000: raise RuntimeError(f'Unexpectedly small chapter {i+1}')
        mp3.write_bytes(response.content)
    seconds=probe(mp3)
    print(f'Chapter {i+1:02}: {seconds:.1f}s / {ch["title"]}',flush=True)
    return i,mp3,seconds

if __name__=='__main__':
    # Two independent chapters at a time keeps provider concurrency bounded.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        rendered=sorted(pool.map(generate,enumerate(chapters)))
    # Uniform PCM and an explicit one-second pause between chapters.
    waves=[]; meta=[]; total=0
    for i,mp3,_ in rendered:
        wave=CACHE/f'{i+1:02}.wav'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(mp3),
            '-af','apad=pad_dur=1','-ar','44100','-ac','1',str(wave)],check=True)
        duration=probe(wave)
        meta.append({'title':chapters[i]['title'],'start_seconds':round(total,3),'duration_seconds':round(duration,3)})
        total+=duration; waves.append(wave)
    listing=CACHE/'concat.txt'
    listing.write_text('\n'.join("file '"+p.as_posix()+"'" for p in waves),encoding='utf-8')
    full=OUT/'FirstDose-Vinh-Study-Podcast.mp3'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),
        '-af','loudnorm=I=-19:TP=-1.5:LRA=7','-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','96k',
        '-metadata','title=FirstDose: Vinh Technical Demo Study Session',
        '-metadata','artist=FirstDose study guide — synthetic narration',
        '-metadata','comment=ElevenLabs premade George voice. Fictional cases. Main source 015c342. Prepared 2026-09-27.',str(full)],check=True)
    quick=OUT/'FirstDose-Vinh-Quick-Rehearsal.mp3'
    rehearsal=next(mp3 for i,mp3,_ in rendered if chapters[i]['title']=='Your short demo, rehearsed out loud')
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(rehearsal),
        '-af','loudnorm=I=-19:TP=-1.5:LRA=7','-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','96k',
        '-metadata','title=FirstDose: Vinh Short Demo Rehearsal','-metadata','artist=FirstDose study guide — synthetic narration',str(quick)],check=True)
    data={'provider':'ElevenLabs','voice':'George (premade synthetic narrator)','model':MODEL,'source_sha':'015c342',
        'date':'2026-09-27','duration_seconds':round(probe(full),3),'chapters':meta}
    (OUT/'FirstDose-Vinh-Audio-Chapters.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
    transcript=['# FirstDose — Vinh study podcast\n\nSynthetic ElevenLabs narration; not Vinh’s recorded voice. Prepared September 27, 2026.\n\nSelected tracks: Oracle of the Deep, Impiricus, SpaceXAI. See the companion technical PDF for source links and evidence boundaries.\n']
    for ch,m in zip(chapters,meta):
        sec=int(m['start_seconds']); transcript.append(f'\n## {sec//60:02d}:{sec%60:02d} — {ch["title"]}\n\n{ch["text"]}\n')
    (OUT/'FirstDose-Vinh-Study-Podcast-Transcript.md').write_text('\n'.join(transcript),encoding='utf-8')
    print(json.dumps({'full_seconds':probe(full),'quick_seconds':probe(quick),'bytes':full.stat().st_size,'chapters':len(chapters)}),flush=True)
