"""Trim, splice, grade and loudness-match the talking-head clips.

Outputs, per speaker segment, a muted CFR 30 fps H.264 video and a clean
48 kHz stereo WAV, plus the kept source ranges so captions can be re-timed.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # repo root (video/demo/tools → repo)
SRC = ROOT / "video"
OUT = ROOT / "video" / "demo" / "media" / "heads"
OUT.mkdir(parents=True, exist_ok=True)

XF = 0.12  # crossfade at a splice (seconds)

CLIPS = {
    "k1-hook": ("kadim beat 1.mov", [(0.0, 18.0)]),
    "k2-intro": ("kadim beat 2.mov", [(0.0, 16.0)]),
    "v-maria": ("vinh beat 1.mov", [(0.0, 36.25), (36.95, 53.0)]),
    "m-james": ("minnh beat 1.mov", [(0.0, 46.35)]),
    "k3-close": ("kadim beat 3.mov", [(0.15, 22.55)]),
}

# Gentle grade: lift shadows and midtones so faces read clearly, with a mild
# highlight roll-off for the ceiling glare. No crop, no zoom: the native 3:2 frame stays.
GRADE = "fps=30,eq=contrast=1.02:saturation=1.05:gamma=1.04,curves=all='0/0 0.25/0.29 0.5/0.54 0.85/0.86 1/0.96'"
VOICE = "highpass=f=80,afftdn=nf=-28,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2"


def run(args, capture=False):
    r = subprocess.run(args, check=True, capture_output=capture, text=True)
    return r.stderr if capture else None


def trim_chain(kind, ranges):
    """Filter graph that trims [0:v]/[0:a] into ranges and joins them with a short crossfade."""
    parts, labels = [], []
    for i, (a, b) in enumerate(ranges):
        if kind == "v":
            parts.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS,{GRADE}[v{i}]")
        else:
            parts.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS[a{i}]")
        labels.append(f"{kind}{i}")
    cur, elapsed = labels[0], ranges[0][1] - ranges[0][0]
    for i in range(1, len(labels)):
        nxt = f"{kind}x{i}"
        if kind == "v":
            parts.append(f"[{cur}][{labels[i]}]xfade=transition=fade:duration={XF}:offset={elapsed - XF:.3f}[{nxt}]")
        else:
            parts.append(f"[{cur}][{labels[i]}]acrossfade=d={XF}[{nxt}]")
        cur = nxt
        elapsed += ranges[i][1] - ranges[i][0] - XF
    return ";".join(parts), cur, elapsed


meta = {}
for name, (src, ranges) in CLIPS.items():
    path = SRC / src
    vgraph, vout, dur = trim_chain("v", ranges)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-filter_complex", vgraph, "-map", f"[{vout}]",
         "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", str(OUT / f"{name}.mp4")])

    agraph, aout, _ = trim_chain("a", ranges)
    pre = f"{agraph};[{aout}]{VOICE},afade=t=in:d=0.08,areverse,afade=t=in:d=0.25,areverse,aresample=48000,pan=stereo|c0=c0|c1=c0[pre]"
    stats = run(["ffmpeg", "-v", "info", "-y", "-i", str(path), "-filter_complex",
                 pre + ";[pre]loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json[o]", "-map", "[o]", "-f", "null", "-"],
                capture=True)
    m = json.loads(stats[stats.rindex("{"): stats.rindex("}") + 1])
    ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-filter_complex",
         pre + f";[pre]{ln},aresample=48000[o]", "-map", "[o]",
         "-c:a", "pcm_s16le", str(OUT / f"{name}.wav")])

    # Map source time → segment time for each kept range (for caption re-timing).
    maps, t = [], 0.0
    for i, (a, b) in enumerate(ranges):
        maps.append({"src_in": a, "src_out": b, "out_start": t})
        t += (b - a) - (XF if i < len(ranges) - 1 else 0)
    meta[name] = {"source": src, "duration": round(dur, 3), "ranges": maps, "measured_I": m["input_i"]}
    print(f"{name}: {dur:.2f}s (source {m['input_i']} LUFS)")

(OUT / "heads.json").write_text(json.dumps(meta, indent=2))
