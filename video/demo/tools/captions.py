"""Caption cues and word anchors for each talking-head segment.

The caption text is what each speaker says, spelled correctly (brand names,
Minh's accent). Word times come from whisper.cpp and are mapped through the
trims in heads.json. Unmatched words are interpolated between neighbours.
"""
import difflib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # repo root (video/demo/tools → repo)
HEADS = json.loads((ROOT / "video/demo/media/heads/heads.json").read_text())
TR = Path(__file__).resolve().parent / "transcripts"

TEXT = {
    "k1-hook": "DocUpdate published this headline: “The prescription was sent. The patient still never started it.” "
               "Surescripts says one in four new prescriptions are never dispensed. And a patient who never started "
               "looks exactly like a drug that doesn't work. The person who can fix it is someone Impiricus has never reached.",
    "k2-intro": "So we created FirstDose. It's a new Ascend skill inside DocUpdate. Spark fires when the prescription is "
                "written. FirstDose fires when it isn't filled. It gives DocUpdate its first staff account, and Market "
                "Access would pay per confirmed first fill, never per prescription.",
    "v-maria": "This is the coordinator's queue. She's the person who gets patients onto their medication, and she opens "
               "this every morning. Maria is a fictional patient. Her doctor signs an Otezla prescription in DocUpdate, "
               "with the label verbatim from DailyMed. Today, that's where the story ends. Here, the pharmacy reports it "
               "wasn't dispensed: declined at the price. The doctor's watch buzzes with the reason. One tap: Send to my "
               "coordinator. The first time, the doctor approves their coordinator, a staff account, the way CoverMyMeds "
               "does it, inside the app they already use. Maria jumps to the top of the queue with one fix: re-send the "
               "copay card. Maria opens her card on her phone and taps Use at pharmacy. That's an acknowledgment, not a "
               "fill. The case stays pending. Only when the pharmacy confirms does it say Fill confirmed. The doctor heard "
               "about it twice: when it broke, and when it was fixed.",
    "m-james": "James is on Humira. His pharmacy note says prior authorization required, and he couldn't be reached after "
               "three calls. Gemini reads that messy note and returns one reason code, or unknown, which goes to a person. "
               "Then a rule, not AI, picks the fix: connect to access support. No model writes drug or patient text. "
               "Every step lands in an event history on Tiger Data, so the office sees confirmed first fills and time to "
               "first fill. Pharma sees counts only, never a name.",
    "k3-close": "About 467,000 medical assistants work in doctors' offices. None of Impiricus's products are built for "
                "them. FirstDose is. And it routes to fixes Impiricus already runs: Wallet, Concierge, QPharma and "
                "Medvantx. Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets "
                "the patient on it, every day.",
}

SOURCE = {"k1-hook": "kadim-beat-1", "k2-intro": "kadim-beat-2", "v-maria": "vinh-beat-1",
          "m-james": "minnh-beat-1", "k3-close": "kadim-beat-3"}


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def to_segment_time(name, t):
    for r in HEADS[name]["ranges"]:
        if r["src_in"] - 0.05 <= t <= r["src_out"] + 0.05:
            return r["out_start"] + (t - r["src_in"])
    return None  # inside a cut


out = {}
for name, text in TEXT.items():
    d = json.loads((TR / f"{SOURCE[name]}.json").read_text())
    heard = []
    for seg in d["transcription"]:
        w = seg["text"].strip()
        if not w:
            continue
        a = to_segment_time(name, seg["offsets"]["from"] / 1000)
        b = to_segment_time(name, seg["offsets"]["to"] / 1000)
        if a is None or b is None:
            continue
        heard.append((norm(w), a, b))
    words = text.split()
    sm = difflib.SequenceMatcher(a=[norm(w) for w in words], b=[h[0] for h in heard], autojunk=False)
    times = [None] * len(words)
    for i, j, n in sm.get_matching_blocks():
        for k in range(n):
            times[i + k] = (heard[j + k][1], heard[j + k][2])
    # Interpolate unmatched words between matched neighbours.
    dur = HEADS[name]["duration"]
    known = [i for i, t in enumerate(times) if t]
    for i in range(len(words)):
        if times[i]:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        t0 = times[prev][1] if prev is not None else 0.0
        t1 = times[nxt][0] if nxt is not None else dur - 0.2
        lo = prev if prev is not None else -1
        hi = nxt if nxt is not None else len(words)
        span = (t1 - t0) / (hi - lo)
        times[i] = (t0 + span * (i - lo - 1), t0 + span * (i - lo))
    # Keep times monotonic.
    for i in range(1, len(times)):
        if times[i][0] < times[i - 1][0]:
            times[i] = (times[i - 1][0], max(times[i][1], times[i - 1][0]))

    # Cues: one per sentence when it fits; long sentences split into balanced
    # chunks, preferring a break after a comma or colon near each target.
    sentences, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        if re.search(r"[.?!]”?$", w) or i == len(words) - 1:
            sentences.append(cur)
            cur = []
    cues = []
    for sent in sentences:
        n_chars = len(" ".join(words[k] for k in sent))
        parts = max(1, -(-n_chars // 52)) if n_chars > 58 else 1
        if parts == 1:
            cues.append(sent)
            continue
        target = n_chars / parts
        chunk, acc = [], 0
        for idx, k in enumerate(sent):
            chunk.append(k)
            acc += len(words[k]) + 1
            remaining = len(sent) - idx - 1
            near = acc >= target * 0.8
            soft = re.search(r"[,:;]$", words[k]) is not None
            if remaining and len(cues) < 10**6 and ((near and soft) or acc >= target * 1.15) and remaining >= 2:
                cues.append(chunk)
                chunk, acc = [], 0
        if chunk:
            cues.append(chunk)
    cue_list = []
    for c in cues:
        cue_list.append({"start": round(times[c[0]][0], 3), "end": round(times[c[-1]][1], 3),
                         "text": " ".join(words[k] for k in c)})
    # Extend each cue to the next (no flicker), capped at +0.6 s of silence.
    for a, b in zip(cue_list, cue_list[1:]):
        a["end"] = round(min(b["start"], a["end"] + 0.6), 3)
    cue_list[-1]["end"] = round(min(dur, cue_list[-1]["end"] + 0.5), 3)
    out[name] = {
        "duration": dur,
        "cues": cue_list,
        "words": [{"w": w, "start": round(t[0], 3), "end": round(t[1], 3)} for w, t in zip(words, times)],
        "matched": f"{sum(1 for t in known)}/{len(words)}",
    }
    print(f"{name}: {len(cue_list)} cues, matched {len(known)}/{len(words)} words")

(ROOT / "video/demo/media/heads/captions.json").write_text(json.dumps(out, indent=2, ensure_ascii=False))
