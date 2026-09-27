import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("medium.en", device="cpu", compute_type="int8")
for n in ["khadim-1","khadim-2","khadim-3","minh-1","vinh-1"]:
    segs, info = m.transcribe(f"assets/faces/{n}.mp4", language="en", word_timestamps=True, vad_filter=False, beam_size=5)
    words=[]; text=[]
    for s in segs:
        text.append(s.text.strip())
        for w in s.words: words.append({"text": w.word.strip(), "start": round(w.start,2), "end": round(w.end,2), "p": round(w.probability,2)})
    json.dump({"text": " ".join(text), "words": words}, open(f"transcripts/{n}.json","w"), indent=0)
    print(f"== {n} ({words[0]['start']}–{words[-1]['end']}s)\n{' '.join(text)}\n", flush=True)
