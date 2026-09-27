"""Generate the FirstDose demo composition from transcript timings + live capture marks.

Run: python build.py   (writes index.html and compositions/*.html)
Times: scene-local seconds. Footage T values are wall-clock seconds from capture/out/marks.json.
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).parent
MARKS = json.loads((ROOT / "capture/out/marks.json").read_text())
PAGE_START = {"desk": MARKS["desk_start"], "doctor": MARKS["doctor_start"], "patient": MARKS["patient_start"]}

# ---------------------------------------------------------------- scenes (global layout)
SCENES = [  # id, duration, face clip, face audio duration
    ("hook", 18.2, "khadim-1"),
    ("pitch", 15.6, "khadim-2"),
    ("tour", 10.0, None),
    ("maria", 53.6, "vinh-1"),
    ("james", 46.2, "minh-1"),
    ("market", 22.6, "khadim-3"),
    ("endcard", 7.0, None),
]
PEOPLE = {
    "khadim": ("Khadim", "Product & screens"),
    "vinh": ("Vinh", "Workflow & backend"),
    "minh": ("Minh", "Labels, AI & analytics"),
}
# face centre in 1620x1080 source (eyes-mouth midpoint, sampled at 5s)
FACE_CENTER = {"khadim-1": (840, 486), "khadim-2": (825, 645), "khadim-3": (855, 750),
               "minh-1": (810, 651), "vinh-1": (750, 675)}

INK, MUTED, BG, LINE = "#0e1116", "#545b6b", "#f3f4f8", "#dadde6"
BLUE, RED, GREEN, PURPLE, NAVY = "#2c5bd6", "#c8261b", "#17703e", "#6d3bd1", "#1d1b4b"

BASE_CSS = f"""
@font-face {{ font-family: "Geist"; src: url("assets/fonts/Geist-Variable.woff2") format("woff2"); font-weight: 100 900; }}
@font-face {{ font-family: "Geist Mono"; src: url("assets/fonts/GeistMono-Variable.woff2") format("woff2"); font-weight: 100 900; }}
"""


def esc(s):
    return html.escape(s, quote=True)


def rich(s):
    """*word* -> emphasis span."""
    return re.sub(r"\*(.+?)\*", r'<b>\1</b>', esc(s))


def scene_css(sid):
    r = f"#{sid}-root"
    return BASE_CSS + f"""
{r} {{ position: absolute; inset: 0; overflow: hidden; background: {BG}; color: {INK};
  font-family: "Geist", "Helvetica Neue", sans-serif; }}
{r} .wrap {{ position: absolute; inset: 0; }}
{r} .glow {{ position: absolute; width: 1400px; height: 1400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(44,91,214,.20) 0%, rgba(44,91,214,.07) 38%, rgba(44,91,214,0) 68%); }}
{r} .glow2 {{ position: absolute; width: 1000px; height: 1000px; border-radius: 50%;
  background: radial-gradient(circle, rgba(109,59,209,.14) 0%, rgba(109,59,209,0) 65%); }}
{r} .dots {{ position: absolute; inset: 0; opacity: .5;
  background-image: radial-gradient(rgba(14,17,22,.13) 1.4px, transparent 1.6px); background-size: 34px 34px; }}
{r} .face {{ position: absolute; border-radius: 50%; overflow: hidden; background: #d8dbe4;
  box-shadow: 0 0 0 6px #fff, 0 0 0 9px rgba(44,91,214,.55), 0 24px 60px rgba(14,17,22,.22); }}
{r} .face video {{ position: absolute; object-fit: cover; }}
{r} .ring {{ position: absolute; border-radius: 50%; border: 3px solid rgba(44,91,214,.35); }}
{r} .who {{ position: absolute; }}
{r} .who .n {{ font-size: 44px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; }}
{r} .who .r {{ font-size: 24px; font-weight: 450; color: {MUTED}; margin-top: 6px; }}
{r} .pill {{ display: inline-flex; align-items: center; gap: 10px; font: 600 20px "Geist Mono", monospace;
  letter-spacing: .02em; padding: 8px 16px; border-radius: 999px; background: #fff; border: 2px solid {LINE}; color: {INK}; }}
{r} .pill i {{ width: 12px; height: 12px; border-radius: 50%; background: {RED}; display: block; }}
{r} .pill.live i {{ background: #e5372b; box-shadow: 0 0 0 5px rgba(229,55,43,.18); }}
{r} .caps {{ position: absolute; }}
{r} .cap {{ position: absolute; left: 0; right: 0; bottom: 0; opacity: 0; font-size: 34px; line-height: 1.3;
  font-weight: 560; color: {INK}; letter-spacing: -0.005em; }}
{r} .cap .w {{ color: #6c7383; }}
{r} .cap .w.e {{ font-weight: 760; }}
{r} .foot {{ position: absolute; left: 80px; right: 80px; bottom: 22px; font: 500 19px "Geist Mono", monospace;
  color: {MUTED}; letter-spacing: .01em; }}
{r} .mono {{ font-family: "Geist Mono", monospace; }}
{r} .card {{ background: #fff; border: 2px solid {LINE}; border-radius: 28px; box-shadow: 0 18px 50px rgba(14,17,22,.10); }}
{r} .kicker {{ font: 600 22px "Geist Mono", monospace; letter-spacing: .06em; text-transform: uppercase; color: {BLUE}; }}
"""


def face_circle(sid, clip, D, left, top, dur, span=880):
    fx, fy = FACE_CENTER[clip]
    s = D / span
    W, H = 1620 * s, 1080 * s
    vl = min(0, max(D - W, D / 2 - fx * s))
    vt = min(0, max(D - H, D / 2 - fy * s))
    return (f'<div class="ring" id="{sid}-ring" style="left:{left-18}px;top:{top-18}px;width:{D+36}px;height:{D+36}px"></div>'
            f'<div class="face" id="{sid}-face" style="left:{left}px;top:{top}px;width:{D}px;height:{D}px">'
            f'<video id="{sid}-facev" class="clip" src="assets/faces/{clip}.mp4" data-start="0" data-duration="{dur}" '
            f'data-media-start="0" data-track-index="6" data-layout-allow-overflow muted playsinline '
            f'style="left:{vl:.1f}px;top:{vt:.1f}px;width:{W:.1f}px;height:{H:.1f}px"></video></div>')


def asr_words(clip):
    return json.loads((ROOT / f"transcripts/{clip}.json").read_text())["words"]


def captions(sid, cues, left, top, width, height, size=34, align="left", clip=None):
    """Karaoke captions (after registry caption-pill-karaoke): each word lights up at its spoken time.
    Word times come from the ASR transcript when the cleaned cue has the same word count, else spread evenly."""
    words = asr_words(clip) if clip else []
    out = [f'<div class="caps" style="left:{left}px;top:{top}px;width:{width}px;height:{height}px;text-align:{align}">']
    js = []
    for i, (s, e, t) in enumerate(cues):
        cid = f"{sid}-c{i}"
        toks = t.split(" ")
        heard = [w for w in words if s - 0.08 <= w["start"] < e - 0.05]
        if len(heard) == len(toks):
            times = [w["start"] for w in heard]
        else:
            span = max(0.3, (e - s) - 0.25)
            times = [s + span * k / len(toks) for k in range(len(toks))]
        spans = []
        for k, tok in enumerate(toks):
            emph = "*" in tok
            spans.append(f'<span class="w{" e" if emph else ""}" id="{cid}w{k}">{esc(tok.replace("*", ""))}</span>')
            js.append(f'tl.fromTo("#{cid}w{k}",{{color:"#6c7383"}},{{color:"{BLUE if emph else INK}",duration:.12,immediateRender:false}},{times[k]:.2f});')
        out.append(f'<p class="cap" id="{cid}" style="font-size:{size}px">{" ".join(spans)}</p>')
        js.append(f'tl.fromTo("#{cid}",{{opacity:0,y:10}},{{opacity:1,y:0,duration:.2,ease:"power2.out"}},{max(0, s - 0.08):.2f});')
        nxt = cues[i + 1][0] - 0.08 if i + 1 < len(cues) else e + 1
        out_at = min(e, nxt - 0.1)
        js.append(f'tl.to("#{cid}",{{opacity:0,y:-6,duration:.1,ease:"power1.in"}},{out_at:.2f});')
    out.append("</div>")
    return "".join(out), "\n".join(js)


def ambient(sid, dur, gx=1500, gy=-300):
    h = (f'<div class="glow" id="{sid}-glow" style="left:{gx-700}px;top:{gy-700+700}px"></div>'
         f'<div class="glow2" id="{sid}-glow2" style="left:-300px;top:600px"></div>'
         f'<div class="dots"></div>')
    reps = max(1, int(dur / 6))
    js = (f'tl.fromTo("#{sid}-glow",{{scale:.92,opacity:.8}},{{scale:1.08,opacity:1,duration:3,ease:"sine.inOut",yoyo:true,repeat:{reps}}},0);'
          f'tl.fromTo("#{sid}-glow2",{{x:0,y:0}},{{x:120,y:-60,duration:{dur/2:.2f},ease:"sine.inOut",yoyo:true,repeat:1}},0);')
    return h, js


def who(sid, person, left, top, live=False):
    n, r = PEOPLE[person]
    pill = '<div style="margin-top:18px"><span class="pill live"><i></i>LIVE · firstdose.vercel.app</span></div>' if live else ""
    return f'<div class="who" id="{sid}-who" style="left:{left}px;top:{top}px"><div class="n">{n}</div><div class="r">{r}</div>{pill}</div>'


def template(sid, dur, body, js, extra_css=""):
    return f"""<!doctype html>
<html><head><meta charset="UTF-8" /></head>
<body>
<template id="{sid}-template">
<style>{scene_css(sid)}{extra_css}</style>
<div id="{sid}-root" data-composition-id="{sid}" data-width="1920" data-height="1080" data-duration="{dur}">
{body}
</div>
<script>
(() => {{
const tl = gsap.timeline({{ paused: true }});
{js}
tl.fromTo("#{sid}-root .wrap",{{opacity:0,scale:.985,filter:"blur(14px)"}},{{opacity:1,scale:1,filter:"blur(0px)",duration:.6,ease:"power2.out"}},0);
tl.to("#{sid}-root .wrap",{{opacity:0,scale:1.03,filter:"blur(16px)",duration:.45,ease:"power1.in"}},{dur-0.45:.2f});
window.__timelines["{sid}"] = tl;
}})();
</script>
</template>
</body></html>
"""


# ================================================================= DEMO STAGE (maria / james)
# Narrow left column (face, name, step title); captions in a strip under the stage; the stage takes the
# rest of the frame. Layouts: "desk" (coordinator desktop at native 1440x810), "both" (desktop + phone side
# by side), "phone" (full phone + a large live magnifier of the part being narrated).
# Segment "hl" entries are focus regions in SOURCE pixels (desktop 1440x810, phones 390x844):
#   desktop regions -> the camera zooms to them; phone regions -> the magnifier shows them (phone layout).
DESK = dict(left=440, top=80, w=1440, h=810)
PHONE = dict(left=1480, top=121, w=400, h=838)   # 12px bezel -> 376x814 screen
SRC_DESK_W, SRC_DESK_H, SRC_PHONE_W, SRC_PHONE_H = 1440, 810, 390, 844
MAG = dict(left=930, top=150, w=950, h=640)
LAYOUT = {  # (desk box, phone box): left, top, width, opacity
    "desk": (dict(l=440, t=80, w=1440, o=1), dict(l=1930, t=120, w=380, o=0)),
    "both": (dict(l=440, t=170, w=1010, o=1), dict(l=1490, t=95, w=380, o=1)),
    "phone": (dict(l=200, t=300, w=500, o=0), dict(l=450, t=80, w=400, o=1)),
}
ROLE = {
    "desk": ("Coordinator's desktop", "New user: the office staff member who fixes access"),
    "doctor": ("Doctor's phone", "In DocUpdate, the app they already use"),
    "patient": ("Patient's phone", "Maria opens her card from a QR code"),
}
STAGE_CSS = f"""
.dslot {{ position: absolute; left:{DESK['left']}px; top:{DESK['top']}px; width:{DESK['w']}px; height:{DESK['h']}px; transform-origin: 0 0;
  border-radius: 18px; overflow: hidden; background: #fff; box-shadow: 0 0 0 2px {LINE}, 0 30px 70px rgba(14,17,22,.18); }}
.dinner {{ position: absolute; left:0; top:0; width:{DESK['w']}px; height:{DESK['h']}px; transform-origin: 0 0; }}
.dinner video {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
.pslot {{ position: absolute; left:{PHONE['left']}px; top:{PHONE['top']}px; width:{PHONE['w']}px; height:{PHONE['h']}px; transform-origin: 0 0;
  border-radius: 58px; background: #101218; box-shadow: 0 30px 80px rgba(14,17,22,.30); }}
.pscreen {{ position: absolute; left: 12px; top: 12px; width: {PHONE['w']-24}px; height: {PHONE['h']-24}px; border-radius: 46px; overflow: hidden; background: #fff; }}
.pscreen video {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
.mag {{ position: absolute; left:{MAG['left']}px; top:{MAG['top']}px; width:{MAG['w']}px; height:{MAG['h']}px; opacity: 0;
  border-radius: 26px; overflow: hidden; background: #fff; box-shadow: 0 0 0 2px {LINE}, 0 34px 80px rgba(14,17,22,.22); }}
.maginner {{ position: absolute; left: 0; top: 0; width: {SRC_PHONE_W}px; height: {SRC_PHONE_H}px; transform-origin: 0 0; }}
.maginner video {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
.maghead {{ position: absolute; left:{MAG['left']}px; top:{MAG['top']-62}px; width:{MAG['w']}px; }}
.maghead .h {{ position: absolute; left: 0; top: 0; opacity: 0; font-size: 34px; font-weight: 780; letter-spacing: -0.02em; white-space: nowrap; }}
.role {{ position: absolute; left: 0; top: 0; opacity: 0; white-space: nowrap; }}
.role.ph {{ width: 520px; }}
.role .k {{ font: 700 19px "Geist Mono", monospace; letter-spacing: .06em; text-transform: uppercase; color: {BLUE}; }}
.role .d {{ font-size: 21px; font-weight: 500; color: {MUTED}; margin-top: 3px; }}
.step {{ position: absolute; left: 40px; top: 290px; width: 360px; opacity: 0; }}
.step .num {{ font: 600 19px "Geist Mono", monospace; color: {BLUE}; letter-spacing: .05em; }}
.step .t {{ font-size: 42px; font-weight: 820; letter-spacing: -0.035em; line-height: 1.04; margin-top: 12px; }}
.step .s {{ font-size: 23px; font-weight: 430; color: {MUTED}; line-height: 1.34; margin-top: 16px; }}
.step .s b {{ color: {INK}; font-weight: 700; }}
.tag {{ display: inline-block; font: 600 19px "Geist Mono", monospace; padding: 7px 11px; border-radius: 10px; margin: 12px 8px 0 0; }}
.tag.red {{ background: #fbe6e4; color: {RED}; }} .tag.green {{ background: #e2f3e8; color: {GREEN}; }}
.tag.blue {{ background: #e5ecfb; color: {BLUE}; }} .tag.ink {{ background: #eceef3; color: {INK}; }}
.flow {{ display: flex; align-items: center; gap: 8px; margin-top: 16px; flex-wrap: wrap; }}
.flow .box {{ font-size: 19px; font-weight: 600; padding: 9px 11px; border-radius: 11px; background: #fff; border: 2px solid {LINE}; }}
.flow .ar {{ font-size: 22px; color: {MUTED}; }}
.stat {{ display: inline-block; vertical-align: top; margin: 16px 20px 0 0; }}
.stat .v {{ font-size: 72px; font-weight: 850; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }}
.stat .l {{ font-size: 19px; color: {MUTED}; margin-top: 8px; max-width: 170px; line-height: 1.25; }}
"""


def _xf(box, canon):
    s = box["w"] / canon["w"]
    return dict(x=box["l"] - canon["left"], y=box["t"] - canon["top"], scale=round(s, 4), o=box["o"])


def _cam(x, y, w, h, W, H, kmax, fill=.88):
    """Scale + translate (origin 0 0) that frames a source region inside a WxH viewport."""
    k = max(1.0, min(kmax, fill * W / w, fill * H / h))
    cx, cy = x + w / 2, y + h / 2
    tx = min(0, max(W - W * k, W / 2 - cx * k))
    ty = min(0, max(H - H * k, H / 2 - cy * k))
    return round(k, 3), round(tx, 1), round(ty, 1)


def demo_scene(sid, dur, clip, person, segs, steps, cues, footer, qr=None):
    body, js = [], []
    ah, aj = ambient(sid, dur, gx=1500, gy=-200)
    body.append('<div class="wrap">' + ah)
    body.append(face_circle(sid, clip, 140, 40, 40, dur))
    body.append(who(sid, person, 204, 62))
    body.append(f'<div id="{sid}-live" style="position:absolute;left:40px;top:206px"><span class="pill live"><i></i>LIVE · firstdose.vercel.app</span></div>')
    d = [f'<div class="dslot" id="{sid}-desk"><div class="dinner" id="{sid}-dinner" data-layout-allow-overflow>']
    p = [f'<div class="pslot" id="{sid}-phone"><div class="pscreen" id="{sid}-pscreen">']
    m = [f'<div class="mag" id="{sid}-mag"><div class="maginner" id="{sid}-maginner" data-layout-allow-overflow>']
    heads, cam, mag = [], [], []
    for i, g in enumerate(segs):
        t0, t1, T0 = g["t0"], g["t1"], g["T"]
        ln = round(t1 - t0, 3)
        ph = g.get("phone", "doctor")
        d.append(f'<video id="{sid}-d{i}" class="clip" src="assets/footage/desk.mp4" data-start="{t0}" data-duration="{ln}" '
                 f'data-media-start="{round(T0-PAGE_START["desk"],3)}" data-track-index="2" muted playsinline></video>')
        p.append(f'<video id="{sid}-p{i}" class="clip" src="assets/footage/{ph}.mp4" data-start="{t0}" data-duration="{ln}" '
                 f'data-media-start="{round(T0-PAGE_START[ph],3)}" data-track-index="3" muted playsinline></video>')
        if g["focus"] == "phone":
            m.append(f'<video id="{sid}-m{i}" class="clip" src="assets/footage/{ph}.mp4" data-start="{t0}" data-duration="{ln}" '
                     f'data-media-start="{round(T0-PAGE_START[ph],3)}" data-track-index="4" muted playsinline></video>')
        # desktop camera: segment default, then each desktop focus region
        k, zx, zy = g.get("zoom", (1, 0, 0))
        cam.append((t0, 0.001 if i == 0 else 1.0, k, -(k - 1) * zx, -(k - 1) * zy))
        regs = []
        for (a, b, dev, x, y, w, h, tag, *_o) in g.get("hl", []):
            if dev == "d":
                cam.append((a, 1.0) + _cam(x, y, w, h, SRC_DESK_W, SRC_DESK_H, 1.9))
            elif g["focus"] == "phone":
                regs.append([a, b, _cam(x, y, w, h, MAG["w"], MAG["h"], 3.2, fill=.92), tag])
        # the magnifier stays up for the whole phone segment, handing off region to region
        for j, r in enumerate(regs):
            r[0] = t0 + .35 if j == 0 else r[0]
            r[1] = regs[j + 1][0] if j + 1 < len(regs) else t1
        mag += [tuple(r) for r in regs]
    for n_, (a, b, (k, tx, ty), tag) in enumerate(mag):
        # centre the region in the panel (the clamp in _cam keeps edges filled)
        heads.append(f'<div class="h" id="{sid}-mh{n_}">{esc(tag)}</div>')
    d.append("</div></div>"); p.append("</div></div>"); m.append("</div></div>")
    body += d + p + m
    body.append(f'<div class="maghead">{"".join(heads)}</div>')
    for key, (kk, desc) in ROLE.items():
        body.append(f'<div class="role{"" if key == "desk" else " ph"}" id="{sid}-role-{key}"><div class="k">{esc(kk)}</div><div class="d">{esc(desc)}</div></div>')
    for i, st in enumerate(steps):
        body.append(f'<div class="step" id="{sid}-s{i}"><div class="num">{esc(st["num"])}</div>'
                    f'<div class="t">{rich(st["t"])}</div><div class="s">{st["s"]}</div></div>')
        js.append(f'tl.fromTo("#{sid}-s{i}",{{opacity:0,x:-40}},{{opacity:1,x:0,duration:.55,ease:"power3.out"}},{st["a"]});')
        js.append(f'tl.fromTo("#{sid}-s{i} .s > *",{{opacity:0,y:16}},{{opacity:1,y:0,duration:.4,stagger:.12,ease:"back.out(1.6)"}},{st["a"]+.35});')
        if i + 1 < len(steps):
            js.append(f'tl.to("#{sid}-s{i}",{{opacity:0,x:30,duration:.3,ease:"power2.in"}},{steps[i+1]["a"]-.3});')
        for c in st.get("counts", []):
            js.append(f'(() => {{ const el=document.querySelector("#{c[0]}"); const o={{v:0}};'
                      f'tl.fromTo(o,{{v:0}},{{v:{c[1]},duration:1.1,ease:"power2.out",onUpdate:()=>{{el.textContent=Math.round(o.v)+"{c[2]}";}},'
                      f'onComplete:()=>{{el.textContent="{c[1]}{c[2]}";}}}},{st["a"]+.5});'
                      f'tl.fromTo(el,{{scale:.8}},{{scale:1,duration:1.1,ease:"power2.out"}},{st["a"]+.5}); }})();')
    ch, cj = captions(sid, cues, 440, 918, 1440, 100, size=32, align="center", clip=clip)
    body.append(ch); js.append(cj)
    if qr:
        svg = (ROOT / qr["svg"]).read_text().split("?>", 1)[-1].replace('width="31mm" height="31mm"', 'width="250" height="250"')
        body.append(f'''<div id="{sid}-qr" class="card" style="position:absolute;left:980px;top:240px;width:360px;padding:34px;text-align:center;opacity:0;z-index:5">
            <div class="kicker">{esc(qr["kicker"])}</div><div style="margin-top:18px">{svg}</div>
            <div style="font-size:26px;font-weight:700;margin-top:14px">{esc(qr["label"])}</div></div>''')
        a, z = qr["pop"], qr["zoom"]
        js.append(f'tl.fromTo("#{sid}-qr",{{opacity:0,scale:.4,rotate:-8}},{{opacity:1,scale:1,rotate:0,duration:.6,ease:"back.out(1.9)"}},{a});')
        js.append(f'tl.fromTo("#{sid}-qr svg",{{scale:1}},{{scale:1.06,duration:.35,ease:"sine.inOut",yoyo:true,repeat:1}},{a+.6});')
        js.append(f'tl.to("#{sid}-qr",{{x:{qr["to_x"]},y:{qr["to_y"]},scale:2.4,opacity:0,filter:"blur(10px)",duration:.7,ease:"power3.in"}},{z});')
        js.append(f'tl.fromTo("#{sid}-pscreen",{{scale:1.18,filter:"blur(8px)"}},{{scale:1,filter:"blur(0px)",duration:.7,ease:"power3.out",immediateRender:false}},{z+.35});')
    body.append(f'<div class="foot">{esc(footer)}</div>')
    body.append("</div>")
    # layouts + role labels
    prev_rp = None
    for i, g in enumerate(segs):
        db, pb = LAYOUT[g["focus"]]
        dx, px = _xf(db, DESK), _xf(pb, PHONE)
        du = 0.001 if i == 0 else 0.8
        at = 0 if i == 0 else max(0, g["t0"] - 0.3)
        js.append(f'tl.to("#{sid}-desk",{{x:{dx["x"]},y:{dx["y"]},scale:{dx["scale"]},opacity:{dx["o"]},duration:{du},ease:"power3.inOut"}},{at});')
        js.append(f'tl.to("#{sid}-phone",{{x:{px["x"]},y:{px["y"]},scale:{px["scale"]},opacity:{px["o"]},duration:{du},ease:"power3.inOut"}},{at});')
        js.append(f'tl.to("#{sid}-role-desk",{{x:{db["l"]},y:{db["t"]-60},opacity:{1 if db["o"] >= .9 else 0},duration:{du},ease:"power3.inOut"}},{at});')
        rp = g.get("phone", "doctor") if pb["o"] > 0 else None
        rx = pb["l"] if g["focus"] == "phone" else pb["l"] + pb["w"] - 520
        for key in ("doctor", "patient"):
            js.append(f'tl.to("#{sid}-role-{key}",{{x:{rx},y:{pb["t"]-60},opacity:{1 if key == rp else 0},duration:{du if rp == prev_rp else .35},ease:"power3.inOut"}},{at});')
        prev_rp = rp
        if g["focus"] != "phone":
            js.append(f'tl.to("#{sid}-mag",{{opacity:0,x:40,duration:.35}},{at});')
    for (t, du, k, tx, ty) in sorted(cam):
        js.append(f'tl.to("#{sid}-dinner",{{scale:{k},x:{tx:.1f},y:{ty:.1f},duration:{du},ease:"power2.inOut"}},{t});')
    for n_, (a, b, (k, tx, ty), tag) in enumerate(mag):
        js.append(f'tl.to("#{sid}-mag",{{opacity:1,x:0,duration:.45,ease:"power3.out"}},{a});')
        js.append(f'tl.to("#{sid}-maginner",{{scale:{k},x:{tx},y:{ty},duration:{0.001 if n_ == 0 or mag[n_-1][1] < a - .5 else .7},ease:"power2.inOut"}},{a});')
        js.append(f'tl.fromTo("#{sid}-mh{n_}",{{opacity:0,y:12}},{{opacity:1,y:0,duration:.35,ease:"power3.out"}},{a});')
        js.append(f'tl.to("#{sid}-mh{n_}",{{opacity:0,duration:.2}},{b - .2:.2f});')
        nxt = mag[n_ + 1][0] if n_ + 1 < len(mag) else None
        if nxt is None or nxt > b + .5:
            js.append(f'tl.to("#{sid}-mag",{{opacity:0,x:40,duration:.35,ease:"power2.in"}},{b - .3:.2f});')
    js.insert(0, aj)
    js.append(f'tl.fromTo("#{sid}-face",{{scale:.6,opacity:0}},{{scale:1,opacity:1,duration:.7,ease:"back.out(1.5)"}},0.05);')
    js.append(f'tl.fromTo("#{sid}-who",{{x:-20,opacity:0}},{{x:0,opacity:1,duration:.5,ease:"power3.out"}},0.3);')
    js.append(f'tl.fromTo("#{sid}-live",{{y:10,opacity:0}},{{y:0,opacity:1,duration:.5,ease:"power3.out"}},0.5);')
    extra = f"\n#{sid}-root .who .n {{ font-size: 34px; }} #{sid}-root .who .r {{ font-size: 20px; }} #{sid}-root .pill {{ font-size: 17px; padding: 6px 12px; }}"
    return template(sid, dur, "\n".join(body), "\n".join(js), _scope(STAGE_CSS, sid) + extra)


def _scope(css, sid):
    out = []
    for line in css.strip().splitlines():
        if line.lstrip().startswith(".") and "{" in line:
            sel, rest = line.split("{", 1)
            sels = ", ".join(f"#{sid}-root {s.strip()}" for s in sel.split(","))
            out.append(f"{sels} {{{rest}")
        else:
            out.append(line)
    return "\n".join(out)


FOOT = "Recorded live on firstdose.vercel.app · Sep 26, 2026 · Synthetic patients & pharmacy events · DocUpdate concept, not affiliated"

# ------------------------------------------------------------------ MARIA (Vinh)
# hl: (start, end, "d"|"p", x, y, w, h, tag, [class]) in scene seconds + source pixels
MARIA_SEGS = [
    dict(t0=0.0, t1=7.3, T=7.5, focus="desk", hl=[
        (0.6, 3.9, "d", 300, 232, 1085, 113, "Monday morning: 3 stuck · 2 waiting · 8 confirmed"),
        (4.0, 7.2, "d", 300, 420, 1085, 282, "Each row: who, why it's stuck, the one fix")]),
    dict(t0=7.3, t1=16.3, T=24.1, focus="phone", hl=[
        (7.6, 12.4, "p", 16, 120, 358, 520, "New prescription: Maria · Otezla"),
        (12.4, 14.6, "p", 16, 560, 358, 284, "Verbatim DailyMed label · Sign and send"),
        (14.6, 16.2, "p", 16, 600, 358, 244, "Sent → At pharmacy → Fill confirmed")]),
    dict(t0=16.3, t1=22.5, T=38.5, focus="phone", hl=[
        (18.7, 20.7, "p", 16, 170, 358, 182, "New alert: pharmacy status + reason", "red"),
        (20.8, 22.4, "p", 30, 598, 330, 50, "Stuck · declined at price", "red")]),
    dict(t0=22.5, t1=31.4, T=45.5, focus="both", zoom=(1.7, 560, 250), hl=[
        (22.6, 24.1, "p", 33, 294, 324, 42, "One tap"),
        (24.4, 27.4, "p", 17, 600, 356, 195, "Doctor approves the coordinator", "below"),
        (29.0, 31.3, "d", 625, 258, 190, 44, "Linked", "green")]),
    dict(t0=31.4, t1=33.9, T=55.4, focus="desk", zoom=(1.25, 1440, 700), hl=[
        (31.6, 33.8, "d", 300, 600, 1085, 82, "Maria is in the queue, with the reason")]),
    dict(t0=33.9, t1=36.9, T=62.0, focus="desk", zoom=(1.8, 1440, 150), hl=[
        (34.1, 36.8, "d", 1062, 140, 370, 160, "Why it's stuck + the fix, picked by rule")]),
    dict(t0=36.9, t1=39.4, T=73.5, focus="phone", phone="patient", hl=[
        (37.5, 39.3, "p", 20, 40, 350, 325, "$410 quoted → as little as $0", "below")]),
    dict(t0=39.4, t1=45.2, T=79.3, focus="phone", phone="patient", hl=[
        (39.5, 41.9, "p", 18, 793, 354, 50, "Use at pharmacy"),
        (42.2, 45.1, "p", 16, 618, 300, 50, "Acknowledged, fill still pending", "red")]),
    dict(t0=45.2, t1=49.2, T=90.4, focus="both", phone="patient", zoom=(1.6, 1440, 150), hl=[
        (47.0, 49.1, "p", 16, 660, 330, 56, "Pharmacy confirmed", "green"),
        (47.0, 49.1, "d", 1030, 132, 353, 113, "Fill confirmed: 9", "green below")]),
    dict(t0=49.2, t1=53.6, T=98.0, focus="phone", phone="doctor", hl=[
        (49.6, 53.4, "p", 16, 295, 358, 120, "Doctor's Past Rx: Fill confirmed", "green below")]),
]
MARIA_STEPS = [
    dict(a=0.3, num="01 · COORDINATOR'S QUEUE", t="Monday morning, one list.", s='<span class="tag red">3 stuck</span><span class="tag ink">2 waiting</span><span class="tag green">8 fills confirmed</span>'),
    dict(a=7.4, num="02 · DOCTOR'S PHONE", t="Sign and send in DocUpdate.", s='<div>Maria · Otezla 30 mg</div><span class="tag blue">Label verbatim from DailyMed</span>'),
    dict(a=16.4, num="03 · PHARMACY", t="Not dispensed. Declined at the price.", s='<div>The doctor gets the <b>reason</b>: on the phone, and a watch push.</div>'),
    dict(a=22.6, num="04 · ONE TAP", t="Send to my coordinator.", s='<div>First time only: the doctor <b>approves</b> the coordinator. The desktop flips to <b>Linked</b>.</div>'),
    dict(a=31.5, num="05 · COORDINATOR", t="A rule picks one fix.", s='<span class="tag blue">Re-send copay card</span><div style="margin-top:12px">Commercial plan · copay card eligible</div>'),
    dict(a=37.0, num="06 · PATIENT'S PHONE", t="Acknowledged is not filled.", s='<span class="tag ink">Use at pharmacy</span><span class="tag red">Fill still pending</span>'),
    dict(a=45.3, num="07 · PHARMACY", t="Only the pharmacy confirms the fill.", s='<span class="tag green">Fill confirmed</span><div style="margin-top:12px">Everyone sees it: patient, coordinator, doctor.</div>'),
]

MARIA_CUES = [
    (0.0, 2.0, "This is the coordinator's queue."),
    (2.1, 4.95, "She's the person who gets patients onto their medication,"),
    (5.0, 7.25, "and she opens this every morning."),
    (7.38, 8.95, "Maria is a fictional patient."),
    (9.06, 12.1, "Her doctor signs an *Otezla* prescription in *DocUpdate*,"),
    (12.2, 14.3, "with the label verbatim from *DailyMed*."),
    (14.42, 16.25, "Today, that's where the story ends."),
    (16.38, 19.0, "Here, the pharmacy reports it *wasn't dispensed*:"),
    (19.1, 20.4, "declined at the price."),
    (20.48, 22.45, "The doctor's watch buzzes with the reason."),
    (22.56, 24.25, "One tap: *Send to my coordinator.*"),
    (24.34, 26.6, "The first time, the doctor approves their coordinator."),
    (26.7, 29.3, "A staff account, the way *CoverMyMeds* does it,"),
    (29.38, 31.45, "inside the app they already use."),
    (31.56, 34.8, "Maria jumps to the top of the queue with *one fix*:"),
    (34.9, 37.45, "re-send the copay card."),
    (37.58, 41.45, "Maria opens her card on her phone and taps *Use at pharmacy*."),
    (41.54, 43.5, "That's an acknowledgment, *not a fill*."),
    (43.62, 45.15, "The case stays pending."),
    (45.26, 49.1, "Only when the pharmacy confirms does it say *Fill confirmed*."),
    (49.22, 51.05, "The doctor heard about it twice:"),
    (51.14, 53.3, "when it broke, and when it was fixed."),
]

# ------------------------------------------------------------------ JAMES (Minh)
JAMES_SEGS = [
    dict(t0=0.0, t1=3.5, T=106.0, focus="phone", hl=[
        (0.3, 3.4, "p", 32, 218, 326, 62, "James · Humira")]),
    dict(t0=3.5, t1=10.9, T=112.0, focus="phone", hl=[
        (5.8, 10.8, "p", 16, 150, 358, 190, "Unable to reach · PA required", "red below")]),
    dict(t0=10.9, t1=14.9, T=124.0, focus="phone", hl=[
        (11.0, 11.9, "p", 16, 270, 358, 150, "Concierge: Help my patient start"),
        (12.0, 14.8, "p", 16, 440, 358, 50, "Sent to the coordinator", "green")]),
    dict(t0=14.9, t1=25.8, T=129.5, focus="desk", zoom=(1.8, 1440, 150), hl=[
        (15.8, 19.4, "d", 1062, 140, 370, 100, "Why: pharmacy + hub notes", "red below"),
        (19.6, 21.9, "d", 1062, 262, 370, 120, "Rule picks: access support", "below"),
        (22.2, 25.7, "d", 1062, 330, 200, 32, "Sent", "green below")]),
    dict(t0=25.8, t1=30.4, T=149.3, focus="desk", zoom=(1.5, 720, 700), hl=[
        (26.0, 30.3, "d", 543, 628, 354, 137, "No AI-written drug claims")]),
    dict(t0=30.4, t1=36.9, T=142.4, focus="desk", hl=[
        (30.6, 33.5, "d", 170, 100, 300, 28, "Tiger aggregate counts"),
        (33.6, 36.8, "d", 176, 157, 636, 263, "Confirmed first fills · time to first fill", "below")]),
    dict(t0=36.9, t1=42.2, T=143.3, focus="desk", zoom=(1.6, 176, 157), hl=[
        (37.0, 39.4, "d", 176, 157, 311, 263, "First fills confirmed", "green below"),
        (39.5, 42.1, "d", 503, 157, 309, 263, "Median time to first fill (demo clock)", "below")]),
    dict(t0=42.2, t1=46.2, T=153.3, focus="desk", zoom=(1.4, 1005, 560), hl=[
        (42.4, 46.1, "d", 746, 545, 518, 55, "Pharma never receives patient identity", "red")]),
]
ACC = MARKS.get("access_summary", {}).get("body", {})
FILLS, TTFF = ACC.get("recovered", 9), ACC.get("median_ttff_seconds", 60)
JAMES_STEPS = [
    dict(a=0.3, num="01 · SECOND CASE", t="James · Humira.", s='<span class="tag red">Prior auth required</span><span class="tag red">Unreachable after 3 calls</span>'),
    dict(a=11.0, num="02 · GEMINI", t="Messy note in, one reason out.",
         s='<div class="flow"><span class="box">Pharmacy note</span><span class="ar">→</span><span class="box" style="border-color:#6d3bd1;color:#6d3bd1">Gemini</span><span class="ar">→</span><span class="box">Reason code</span></div><div style="margin-top:14px">…or <b>unknown</b>, which goes to a person.</div>'),
    dict(a=19.6, num="03 · RULES, NOT AI", t="A rule picks the fix.", s='<span class="tag blue">Connect to access support</span><div style="margin-top:14px">No model writes drug or patient text.</div>'),
    dict(a=30.6, num="04 · TIGER DATA", t="Every step is an event.",
         s=f'<div class="stat"><div class="v" id="james-n1">{FILLS}</div><div class="l">first fills confirmed</div></div>'
           f'<div class="stat"><div class="v" id="james-n2">{TTFF}s</div><div class="l">median time to first fill (demo clock)</div></div>',
         counts=[("james-n1", FILLS, ""), ("james-n2", TTFF, "s")]),
    dict(a=42.3, num="05 · WHO SEES WHAT", t="Pharma sees counts. Never a name.", s='<span class="tag blue">Practice: names + fill status</span><span class="tag ink">Pharma: aggregate counts</span>'),
]
JAMES_CUES = [
    (0.0, 1.95, "James is on *Humira*."),
    (2.1, 6.95, "His pharmacy note says *prior authorization required*,"),
    (7.14, 10.85, "and he couldn't be reached after three calls."),
    (11.02, 13.75, "*Gemini* reads that messy note"),
    (13.86, 17.0, "and returns one reason code, or *unknown*,"),
    (17.22, 19.35, "which goes to a person."),
    (19.5, 21.85, "Then a *rule, not AI*,"),
    (22.0, 25.35, "picks the fix: connect to access support."),
    (25.55, 30.35, "No model writes drug or patient text."),
    (30.58, 36.1, "Every step lands in an event history on *Tiger Data*,"),
    (36.3, 42.15, "so the office sees confirmed first fills and time to first fill."),
    (42.34, 44.95, "Pharma sees *counts only*,"),
    (45.14, 46.1, "never a name."),
]

# ------------------------------------------------------------------ HOOK (Khadim 1)
HOOK_CUES = [
    (0.0, 2.35, "DocUpdate published this headline:"),
    (2.48, 5.55, "“The prescription was sent. The patient still never started it.”"),
    (5.72, 9.45, "*Surescripts* says one in four new prescriptions are never dispensed."),
    (9.58, 13.85, "And a patient who never started looks exactly like a drug that doesn't work."),
    (13.96, 17.8, "The person who can fix it is someone *Impiricus* has never reached."),
]


def hook_scene():
    sid, dur = "hook", 18.2
    ah, aj = ambient(sid, dur, gx=1500, gy=-100)
    D = 470
    body = ['<div class="wrap">', ah,
            f'<div class="mono" id="hook-brand" style="position:absolute;left:80px;top:56px;font-size:24px;font-weight:600;letter-spacing:.06em">FIRSTDOSE</div>',
            face_circle(sid, "khadim-1", D, 150, 250, dur),
            who(sid, "khadim", 150 + D / 2 - 170, 250 + D + 40),
            # right column cards
            f'''<div id="hook-q" class="card" style="position:absolute;left:800px;top:150px;width:1000px;padding:44px 52px">
                <div class="kicker">DocUpdate article · Jul 9, 2026</div>
                <div style="font-size:60px;font-weight:820;letter-spacing:-0.035em;line-height:1.06;margin-top:18px">The prescription was sent. The patient still never started it.</div></div>''',
            f'''<div id="hook-stat" style="position:absolute;left:800px;top:560px;width:1000px;display:flex;align-items:flex-end;gap:36px">
                <div id="hook-27" style="font-size:210px;font-weight:880;letter-spacing:-0.05em;line-height:.85;color:{RED};font-variant-numeric:tabular-nums">27%</div>
                <div style="padding-bottom:12px"><div style="font-size:40px;font-weight:700;line-height:1.1">of new prescriptions are never dispensed</div>
                <div class="mono" style="font-size:21px;color:{MUTED};margin-top:12px">more than 1 in 4 · Surescripts, First-Fill Abandonment</div></div></div>''',
            f'''<div id="hook-drug" style="position:absolute;left:800px;top:230px;width:1000px;opacity:0;font-size:66px;font-weight:820;letter-spacing:-0.035em;line-height:1.08">
                A patient who never started looks exactly like a <span style="color:{RED}">drug that doesn't work.</span></div>''',
            f'''<div id="hook-who2" style="position:absolute;left:800px;top:250px;width:1000px;opacity:0">
                <div class="kicker">Who can fix it?</div>
                <div style="display:flex;gap:28px;margin-top:26px">
                  <div class="card" style="flex:1;padding:34px"><div class="mono" style="font-size:22px;color:{GREEN}">REACHED BY IMPIRICUS</div><div style="font-size:48px;font-weight:800;margin-top:12px">The doctor</div><div style="font-size:26px;color:{MUTED};margin-top:8px">writes the prescription</div></div>
                  <div class="card" style="flex:1;padding:34px;border-color:{BLUE}"><div class="mono" style="font-size:22px;color:{RED}">NEVER REACHED</div><div style="font-size:48px;font-weight:800;margin-top:12px">The coordinator</div><div style="font-size:26px;color:{MUTED};margin-top:8px">gets the patient on it</div></div>
                </div></div>''']
    ch, cj = captions(sid, HOOK_CUES, 160, 900, 1600, 110, size=38, align="center", clip="khadim-1")
    body += [ch, '</div>']
    js = [aj, cj,
          'tl.fromTo("#hook-face",{scale:.7,opacity:0},{scale:1,opacity:1,duration:.9,ease:"back.out(1.4)"},0.05);',
          'tl.fromTo("#hook-ring",{scale:.8,opacity:0},{scale:1,opacity:1,duration:1.1,ease:"power3.out"},0.2);',
          'tl.fromTo("#hook-ring",{scale:1},{scale:1.04,duration:2.2,ease:"sine.inOut",yoyo:true,repeat:6,immediateRender:false},1.3);',
          'tl.fromTo("#hook-who",{y:20,opacity:0},{y:0,opacity:1,duration:.6,ease:"power3.out"},0.5);',
          'tl.fromTo("#hook-brand",{opacity:0,x:-20},{opacity:1,x:0,duration:.6},0.2);',
          'tl.fromTo("#hook-q",{opacity:0,y:50,rotateX:12},{opacity:1,y:0,rotateX:0,duration:.8,ease:"power3.out",transformPerspective:1200},2.35);',
          'tl.fromTo("#hook-stat",{opacity:0,x:60},{opacity:1,x:0,duration:.7,ease:"power3.out"},5.7);',
          '(() => { const el=document.querySelector("#hook-27"); const o={v:0}; tl.fromTo(o,{v:0},{v:27,duration:1.3,ease:"power2.out",onUpdate:()=>{el.textContent=Math.round(o.v)+"%";},onComplete:()=>{el.textContent="27%";}},5.75); tl.fromTo(el,{scale:.7},{scale:1,duration:1.3,ease:"power2.out",transformOrigin:"0% 100%"},5.75); })();',
          'tl.to(["#hook-q","#hook-stat"],{opacity:0,y:-30,duration:.4,ease:"power2.in",stagger:.08},9.3);',
          'tl.fromTo("#hook-drug",{opacity:0,y:40},{opacity:1,y:0,duration:.7,ease:"power3.out"},9.7);',
          'tl.to("#hook-drug",{opacity:0,y:-30,duration:.4,ease:"power2.in"},13.6);',
          'tl.fromTo("#hook-who2",{opacity:0,y:40},{opacity:1,y:0,duration:.7,ease:"power3.out"},14.0);',
          'tl.fromTo("#hook-who2 .card",{scale:.9},{scale:1,duration:.6,stagger:.25,ease:"back.out(1.6)"},14.1);']
    return template(sid, dur, "\n".join(body), "\n".join(js))


# ------------------------------------------------------------------ PITCH / LANDING (Khadim 2)
PITCH_CUES = [
    (0.0, 2.3, "So we created *FirstDose*."),
    (2.44, 4.55, "It's an *Ascend skill* inside DocUpdate."),
    (4.68, 6.75, "*Spark* fires when a prescription is written."),
    (6.84, 9.3, "*FirstDose* fires when it is unfilled."),
    (9.4, 11.15, "It gives DocUpdate its first staff account,"),
    (11.22, 14.25, "and Market Access pays per *confirmed first fill*,"),
    (14.34, 15.5, "never per prescription."),
]


def pitch_scene():
    sid, dur = "pitch", 15.6
    ah, aj = ambient(sid, dur, gx=1400, gy=-100)
    page = f'''
<div id="pitch-page" style="position:absolute;left:0;top:0;width:1100px">
  <section style="height:842px;overflow:hidden;padding:56px 80px 0">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:34px;font-weight:850;letter-spacing:-0.03em">First<span style="color:{BLUE}">Dose</span></div>
      <div class="mono" style="font-size:19px;color:{MUTED}">Concept · Impiricus Ascend skill · in DocUpdate</div></div>
    <div id="pitch-h1" style="font-size:86px;font-weight:880;letter-spacing:-0.045em;line-height:.98;margin-top:64px"><span style="display:block">Catch the prescriptions</span>that <span style="color:{RED}">stall.</span></div>
    <div id="pitch-sub" style="font-size:31px;color:{MUTED};line-height:1.35;margin-top:34px;max-width:880px">Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets the patient on it, every day.</div>
    <div id="pitch-chips" style="margin-top:40px"><span class="tag blue">An Impiricus Ascend skill</span><span class="tag ink">Shows up in DocUpdate</span></div>
    <div id="pitch-cite" style="margin-top:40px;padding-top:22px;border-top:2px solid {LINE};font-size:25px;color:{MUTED};line-height:1.35">
      <span style="color:{INK};font-weight:700">“The Prescription Was Sent. The Patient Still Never Started It.”</span>
      <span class="mono" style="display:block;margin-top:8px;font-size:19px">DocUpdate article, Jul 9, 2026 · they named the problem; FirstDose is the step after send</span></div>
  </section>
  <section style="height:842px;overflow:hidden;padding:56px 80px 0">
    <div class="kicker">Two different moments</div>
    <div style="font-size:64px;font-weight:840;letter-spacing:-0.04em;margin-top:16px;line-height:1.02"><span style="display:block">Spark fires on the prescription.</span>FirstDose fires on the <span style="color:{RED}">non-fill.</span></div>
    <div style="position:relative;height:300px;margin-top:70px">
      <div id="pitch-line" style="position:absolute;left:0;right:0;top:120px;height:6px;border-radius:3px;background:{LINE};transform-origin:0 50%"></div>
      <div id="pitch-m1" style="position:absolute;left:40px;top:40px;width:420px">
        <div style="width:30px;height:30px;border-radius:50%;background:{PURPLE};margin:68px 0 0 0"></div>
        <div style="font-size:34px;font-weight:780;margin-top:24px">Rx written</div><div class="mono" style="font-size:22px;color:{PURPLE};margin-top:6px">→ Spark engages the doctor</div></div>
      <div id="pitch-m2" style="position:absolute;left:520px;top:40px;width:460px">
        <div style="width:30px;height:30px;border-radius:50%;background:{RED};margin:68px 0 0 0;box-shadow:0 0 0 10px rgba(200,38,27,.15)"></div>
        <div style="font-size:34px;font-weight:780;margin-top:24px">Rx not filled</div><div class="mono" style="font-size:22px;color:{RED};margin-top:6px">→ FirstDose routes one fix</div></div>
    </div>
  </section>
  <section style="height:842px;overflow:hidden;padding:56px 80px 0">
    <div class="kicker">What it adds</div>
    <div id="pitch-k1" class="card" style="padding:40px 44px;margin-top:30px">
      <div class="mono" style="font-size:21px;color:{BLUE}">FOR DOCUPDATE</div>
      <div style="font-size:50px;font-weight:820;letter-spacing:-0.03em;margin-top:10px">Its first staff account.</div>
      <div style="font-size:27px;color:{MUTED};margin-top:10px">The doctor approves their access coordinator in one tap.</div></div>
    <div id="pitch-k2" class="card" style="padding:40px 44px;margin-top:28px">
      <div class="mono" style="font-size:21px;color:{GREEN}">FOR MARKET ACCESS</div>
      <div style="font-size:50px;font-weight:820;letter-spacing:-0.03em;margin-top:10px">Pay per <span style="color:{GREEN}">confirmed first fill.</span></div>
      <div style="font-size:27px;color:{MUTED};margin-top:10px">Never per prescription. Counts only, no patient names.</div></div>
  </section>
</div>'''
    body = ['<div class="wrap">', ah,
            face_circle(sid, "khadim-2", 230, 80, 80, dur),
            who(sid, "khadim", 350, 110),
            f'''<div id="pitch-big" style="position:absolute;left:80px;top:420px;width:600px">
                <div class="kicker">The product</div>
                <div style="font-size:64px;font-weight:850;letter-spacing:-0.04em;line-height:1.02;margin-top:14px">The missing step after the script is sent.</div></div>''',
            f'''<div id="pitch-win" style="position:absolute;left:760px;top:70px;width:1100px;height:900px;border-radius:26px;overflow:hidden;background:#fff;
                 box-shadow:0 0 0 2px {LINE},0 40px 90px rgba(14,17,22,.20)">
              <div style="height:56px;background:#eef0f5;display:flex;align-items:center;gap:10px;padding:0 22px;border-bottom:2px solid {LINE}">
                <i style="width:14px;height:14px;border-radius:50%;background:#e5534b;display:block"></i><i style="width:14px;height:14px;border-radius:50%;background:#e8b43a;display:block"></i><i style="width:14px;height:14px;border-radius:50%;background:#43b05c;display:block"></i>
                <div class="mono" style="margin-left:22px;font-size:18px;color:{MUTED};background:#fff;border-radius:10px;padding:6px 18px">FirstDose · product concept</div></div>
              <div style="position:absolute;left:0;right:0;top:58px;bottom:0;overflow:hidden">{page}</div></div>''']
    ch, cj = captions(sid, PITCH_CUES, 80, 820, 620, 190, size=33, clip="khadim-2")
    body += [ch, f'<div class="foot">Concept: FirstDose inside DocUpdate · Not affiliated · Impiricus, Spark and partner names shown as a concept</div>', '</div>']
    js = [aj, cj,
          'tl.fromTo("#pitch-face",{scale:.6,opacity:0},{scale:1,opacity:1,duration:.7,ease:"back.out(1.5)"},0.05);',
          'tl.fromTo("#pitch-who",{x:-20,opacity:0},{x:0,opacity:1,duration:.5,ease:"power3.out"},0.3);',
          'tl.fromTo("#pitch-big",{x:-30,opacity:0},{x:0,opacity:1,duration:.6,ease:"power3.out"},0.5);',
          'tl.fromTo("#pitch-win",{y:80,opacity:0,rotateX:14,scale:.94},{y:0,opacity:1,rotateX:0,scale:1,duration:1.0,ease:"power3.out",transformPerspective:1600},0.1);',
          'tl.fromTo("#pitch-h1",{y:40,opacity:0},{y:0,opacity:1,duration:.7,ease:"power3.out"},0.6);',
          'tl.fromTo("#pitch-sub",{y:30,opacity:0},{y:0,opacity:1,duration:.6,ease:"power3.out"},1.0);',
          'tl.fromTo("#pitch-chips .tag",{y:20,opacity:0},{y:0,opacity:1,duration:.45,stagger:.15,ease:"back.out(1.7)"},2.5);',
          'tl.fromTo("#pitch-cite",{y:20,opacity:0},{y:0,opacity:1,duration:.5,ease:"power3.out"},1.5);',
          'tl.fromTo("#pitch-page",{y:0},{y:-842,duration:1.0,ease:"power3.inOut"},4.3);',
          'tl.fromTo("#pitch-line",{scaleX:0},{scaleX:1,duration:1.2,ease:"power2.out"},4.7);',
          'tl.fromTo("#pitch-m1",{y:30,opacity:0},{y:0,opacity:1,duration:.5,ease:"back.out(1.6)"},4.9);',
          'tl.fromTo("#pitch-m2",{y:30,opacity:0},{y:0,opacity:1,duration:.5,ease:"back.out(1.6)"},6.9);',
          'tl.to("#pitch-page",{y:-1684,duration:1.0,ease:"power3.inOut"},9.0);',
          'tl.fromTo("#pitch-k1",{x:60,opacity:0},{x:0,opacity:1,duration:.6,ease:"power3.out"},9.5);',
          'tl.fromTo("#pitch-k2",{x:60,opacity:0},{x:0,opacity:1,duration:.6,ease:"power3.out"},11.3);']
    return template(sid, dur, "\n".join(body), "\n".join(js))


# ------------------------------------------------------------------ MARKET + CLOSE (Khadim 3)
MARKET_CUES = [
    (0.0, 5.3, "About *467,000* medical assistants work in doctors' offices."),
    (5.44, 8.3, "None of Impiricus's products are built for them."),
    (8.42, 9.3, "*FirstDose is*,"),
    (9.38, 12.0, "and it routes to fixes Impiricus already runs:"),
    (12.16, 15.8, "*Wallet*, *Concierge*, *QPharma* and *Medvantx*."),
    (15.92, 18.7, "Impiricus reaches the doctor who writes the prescription."),
    (18.8, 22.5, "*FirstDose* reaches the person who gets the patient on it, every day."),
]


def market_scene():
    sid, dur = "market", 22.6
    ah, aj = ambient(sid, dur, gx=1400, gy=-100)
    chips = "".join(f'<div class="card mk-chip" id="market-ch{i}" style="padding:26px 30px;font-size:40px;font-weight:800;letter-spacing:-0.02em">{n}'
                    f'<div class="mono" style="font-size:19px;color:{MUTED};font-weight:500;margin-top:6px;letter-spacing:0">{d}</div></div>'
                    for i, (n, d) in enumerate([("Wallet", "copay resources by QR"), ("Concierge", "samples & reps"),
                                                ("QPharma", "sampling · Aug 25, 2026"), ("Medvantx", "patient access · Sep 8, 2026")]))
    body = ['<div class="wrap">', ah,
            face_circle(sid, "khadim-3", 230, 80, 80, dur),
            who(sid, "khadim", 350, 110),
            f'''<div id="market-a" style="position:absolute;left:800px;top:130px;width:1040px">
                <div class="kicker">The people Impiricus doesn't reach yet</div>
                <div id="market-num" style="font-size:230px;font-weight:880;letter-spacing:-0.055em;line-height:.9;margin-top:24px;font-variant-numeric:tabular-nums;color:{BLUE}">467,000</div>
                <div style="font-size:46px;font-weight:760;letter-spacing:-0.02em;margin-top:18px">medical assistants work in doctors' offices.</div>
                <div class="mono" style="font-size:20px;color:{MUTED};margin-top:14px">About · BLS Occupational Outlook: 833,900 jobs (2025) × ~56% in physician offices</div>
                <div id="market-b" style="font-size:42px;font-weight:600;color:{MUTED};margin-top:56px">None of Impiricus's products are built for them.</div>
                <div id="market-c" style="font-size:76px;font-weight:880;letter-spacing:-0.04em;margin-top:10px">FirstDose is.</div></div>''',
            f'''<div id="market-r" style="position:absolute;left:800px;top:150px;width:1040px;opacity:0">
                <div class="kicker">Routes to fixes Impiricus already runs</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:34px">{chips}</div>
                <div class="mono" style="font-size:20px;color:{MUTED};margin-top:30px">Partner names shown as a concept · FirstDose adds the fill signal and the reason</div></div>''',
            f'''<div id="market-close" style="position:absolute;left:800px;top:230px;width:1040px;opacity:0">
                <div id="market-l1" style="font-size:58px;font-weight:700;letter-spacing:-0.03em;line-height:1.1;color:{MUTED}">Impiricus reaches the doctor who writes the prescription.</div>
                <div id="market-l2" style="font-size:78px;font-weight:880;letter-spacing:-0.045em;line-height:1.02;margin-top:44px"><span style="color:{BLUE}">FirstDose</span> reaches the person who gets the patient on it, every day.</div></div>''']
    ch, cj = captions(sid, MARKET_CUES, 80, 820, 620, 190, size=33, clip="khadim-3")
    body += [ch, f'<div class="foot">Market figures: BLS OOH 2025; FirstDose team estimate where noted · Concept, not affiliated with Impiricus or DocUpdate</div>', '</div>']
    js = [aj, cj,
          'tl.fromTo("#market-face",{scale:.6,opacity:0},{scale:1,opacity:1,duration:.7,ease:"back.out(1.5)"},0.05);',
          'tl.fromTo("#market-who",{x:-20,opacity:0},{x:0,opacity:1,duration:.5,ease:"power3.out"},0.3);',
          'tl.fromTo("#market-a",{opacity:0,y:30},{opacity:1,y:0,duration:.6,ease:"power3.out"},0.1);',
          '(() => { const el=document.querySelector("#market-num"); const o={v:0}; tl.fromTo(o,{v:0},{v:467000,duration:1.8,ease:"power3.out",onUpdate:()=>{el.textContent=Math.round(o.v).toLocaleString("en-US");},onComplete:()=>{el.textContent="467,000";}},0.4); tl.fromTo(el,{scale:.75},{scale:1,duration:1.8,ease:"power3.out",transformOrigin:"0% 50%"},0.4); })();',
          'tl.fromTo("#market-b",{opacity:0,y:20},{opacity:1,y:0,duration:.5},5.44);',
          'tl.fromTo("#market-c",{opacity:0,scale:.8},{opacity:1,scale:1,duration:.55,ease:"back.out(1.8)",transformOrigin:"0% 50%"},8.42);',
          'tl.to("#market-a",{opacity:0,y:-30,duration:.4,ease:"power2.in"},9.2);',
          'tl.fromTo("#market-r",{opacity:0},{opacity:1,duration:.4},9.5);',
          'tl.fromTo("#market-ch0",{opacity:0,y:30,scale:.9},{opacity:1,y:0,scale:1,duration:.45,ease:"back.out(1.8)"},12.1);',
          'tl.fromTo("#market-ch1",{opacity:0,y:30,scale:.9},{opacity:1,y:0,scale:1,duration:.45,ease:"back.out(1.8)"},12.7);',
          'tl.fromTo("#market-ch2",{opacity:0,y:30,scale:.9},{opacity:1,y:0,scale:1,duration:.45,ease:"back.out(1.8)"},13.65);',
          'tl.fromTo("#market-ch3",{opacity:0,y:30,scale:.9},{opacity:1,y:0,scale:1,duration:.45,ease:"back.out(1.8)"},14.55);',
          'tl.to("#market-r",{opacity:0,y:-30,duration:.4,ease:"power2.in"},15.5);',
          'tl.fromTo("#market-close",{opacity:0},{opacity:1,duration:.3},15.8);',
          'tl.fromTo("#market-l1",{opacity:0,y:30},{opacity:1,y:0,duration:.6,ease:"power3.out"},15.9);',
          'tl.fromTo("#market-l2",{opacity:0,y:40},{opacity:1,y:0,duration:.7,ease:"power3.out"},18.75);']
    return template(sid, dur, "\n".join(body), "\n".join(js))


def endcard_scene():
    sid, dur = "endcard", 7.0
    ah, aj = ambient(sid, dur, gx=960, gy=-300)
    qr = (ROOT / "assets/qr.svg").read_text().split("?>", 1)[-1].replace('width="31mm" height="31mm"', 'width="210" height="210"')
    body = ['<div class="wrap">', ah,
            f'''<div id="end-main" style="position:absolute;left:140px;top:300px;width:880px">
                <div style="font-size:150px;font-weight:880;letter-spacing:-0.055em;line-height:.9">First<span style="color:{BLUE}">Dose</span></div>
                <div style="font-size:38px;font-weight:600;color:{MUTED};margin-top:30px;line-height:1.25">One missed fill. One accountable next step.</div>
                <div style="font-size:32px;font-weight:700;margin-top:46px">Vinh · Minh · Khadim</div></div>''',
            f'''<div id="end-prev" style="position:absolute;left:1040px;top:470px;width:760px;border-radius:22px;overflow:hidden;background:#fff;
                 box-shadow:0 0 0 2px {LINE},0 30px 70px rgba(14,17,22,.18)">
                <div style="height:44px;background:#eef0f5;display:flex;align-items:center;gap:9px;padding:0 18px;border-bottom:2px solid {LINE}">
                  <i style="width:12px;height:12px;border-radius:50%;background:#e5534b;display:block"></i><i style="width:12px;height:12px;border-radius:50%;background:#e8b43a;display:block"></i><i style="width:12px;height:12px;border-radius:50%;background:#43b05c;display:block"></i>
                  <span class="mono" style="margin-left:16px;font-size:17px;color:{MUTED}">firstdose.vercel.app/coordinator</span></div>
                <img src="assets/queue-still.jpg" style="display:block;width:760px;height:428px;object-fit:cover" /></div>''',
            f'''<div id="end-qr" class="card" style="position:absolute;left:1500px;top:120px;padding:24px;text-align:center;z-index:3">{qr}
                <div class="mono" style="font-size:22px;font-weight:600;margin-top:12px">Scan to try it</div></div>''',
            f'<div class="foot" style="bottom:36px">Synthetic patients and pharmacy activity · DocUpdate concept, not affiliated · Impiricus, Wallet and partner names shown as a concept · A pharmacy fill confirmation does not prove a first dose</div>',
            '</div>']
    js = [aj,
          'tl.fromTo("#end-main",{opacity:0,y:40},{opacity:1,y:0,duration:.8,ease:"power3.out"},0.1);',
          # QR pops onto the screen with a spring, pulses once...
          'tl.fromTo("#end-qr",{opacity:0,scale:.3,rotate:10},{opacity:1,scale:1,rotate:0,duration:.7,ease:"back.out(2)"},0.6);',
          'tl.fromTo("#end-qr svg",{scale:1},{scale:1.07,duration:.3,ease:"sine.inOut",yoyo:true,repeat:1},1.35);',
          # ...then what it opens grows out of it (zoom-through, after registry zoom-through-transition)
          'tl.fromTo("#end-prev",{opacity:0,scale:.18,x:420,y:-300,filter:"blur(10px)"},{opacity:1,scale:1,x:0,y:0,filter:"blur(0px)",duration:1.0,ease:"power3.out",transformOrigin:"100% 0%"},2.0);',
          'tl.fromTo("#end-prev img",{scale:1.12},{scale:1,duration:3.5,ease:"power1.out"},2.0);']
    return template(sid, dur, "\n".join(body), "\n".join(js), f"#endcard-root #end-qr svg path {{ fill: {INK}; }}")



# ------------------------------------------------------------------ TOUR: the three screens (music only)
def tour_scene():
    sid, dur = "tour", 10.0
    ah, aj = ambient(sid, dur, gx=960, gy=-250)
    cards = [
        ("desk", "tour-desk.png", "01 · Coordinator's desktop", "New user · the office staff member",
         "Their daily work queue: who is stuck, why, and the one fix to send."),
        ("doctor", "tour-doctor.png", "02 · Doctor's phone", "Inside DocUpdate (concept)",
         "One alert when a script stalls. One tap hands it to the coordinator."),
        ("patient", "tour-patient.png", "03 · Patient's phone", "Opened from a QR code",
         "Their savings card and message. The pharmacy, not the tap, confirms the fill."),
    ]
    geo = {"desk": (70, 190, 900, 506), "doctor": (1040, 150, 300, 650), "patient": (1440, 150, 300, 650)}
    body = ['<div class="wrap">', ah,
            f'<div id="tour-head" style="position:absolute;left:70px;top:48px"><div class="kicker">One loop, three screens</div>'
            f'<div style="font-size:54px;font-weight:840;letter-spacing:-0.035em;margin-top:8px">Who uses FirstDose, and why</div></div>']
    js = [aj, 'tl.fromTo("#tour-head",{opacity:0,y:20},{opacity:1,y:0,duration:.6,ease:"power3.out"},0.1);']
    for i, (key, img, k, sub, why) in enumerate(cards):
        x, y, w, h = geo[key]
        if key == "desk":
            frame = (f'<div style="width:{w}px;height:{h}px;border-radius:18px;overflow:hidden;background:#fff;'
                     f'box-shadow:0 0 0 2px {LINE},0 30px 70px rgba(14,17,22,.18)"><img id="tour-img{i}" src="assets/{img}" '
                     f'style="display:block;width:{w}px;height:{h}px;object-fit:cover" /></div>')
            ty = y + h + 34
        else:
            frame = (f'<div style="width:{w}px;height:{h}px;border-radius:46px;background:#101218;padding:10px;'
                     f'box-shadow:0 30px 80px rgba(14,17,22,.28)"><div style="width:{w-20}px;height:{h-20}px;border-radius:37px;overflow:hidden">'
                     f'<img id="tour-img{i}" src="assets/{img}" style="display:block;width:{w-20}px;height:{h-20}px;object-fit:cover;object-position:top" /></div></div>')
            ty = y + h + 26
        body.append(f'<div id="tour-dev{i}" style="position:absolute;left:{x}px;top:{y}px">{frame}</div>')
        tw = w if key == "desk" else 330
        body.append(f'<div id="tour-txt{i}" style="position:absolute;left:{x}px;top:{ty}px;width:{tw}px">'
                    f'<div class="kicker">{esc(k)}</div><div style="font-size:22px;font-weight:700;margin-top:6px">{esc(sub)}</div>'
                    f'<div style="font-size:{27 if key == "desk" else 22}px;color:{MUTED};line-height:1.3;margin-top:8px">{esc(why)}</div></div>')
        a = 0.5 + i * 1.6
        js.append(f'tl.fromTo("#tour-dev{i}",{{opacity:0,y:60,scale:.94}},{{opacity:1,y:0,scale:1,duration:.8,ease:"power3.out"}},{a});')
        js.append(f'tl.fromTo("#tour-txt{i}",{{opacity:0,y:20}},{{opacity:1,y:0,duration:.55,ease:"power3.out"}},{a + .35});')
        js.append(f'tl.fromTo("#tour-img{i}",{{scale:1}},{{scale:1.05,duration:{dur - a:.1f},ease:"none"}},{a});')
    body += [f'<div class="foot">Real screens from firstdose.vercel.app · Synthetic patients & pharmacy events · DocUpdate concept, not affiliated</div>', '</div>']
    return template(sid, dur, "\n".join(body), "\n".join(js))


def index():
    t, slots, audios = 0.0, [], []
    for i, (sid, dur, clip) in enumerate(SCENES):
        slots.append(f'<div id="el-{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" '
                     f'data-start="{t:.2f}" data-duration="{dur}" data-track-index="1" data-width="1920" data-height="1080"></div>')
        if clip:
            audios.append(f'<audio id="a-{sid}" src="assets/voice/{clip}.m4a" data-start="{t:.2f}" data-duration="{dur}" '
                          f'data-media-start="0" data-track-index="{10 + i % 2}" data-volume="1"></audio>')
        t += dur
    total = round(t, 2)
    audios.append(f'<audio id="a-bgm" src="assets/music/bed.mp3" data-start="0" data-duration="{total}" '
                  f'data-media-start="0" data-track-index="12" data-volume="0.2"></audio>')
    return total, f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ margin: 0; background: {BG}; overflow: hidden; }}
#root {{ position: relative; width: 100%; height: 100%; overflow: hidden; background: {BG}; }}
[data-composition-id="main"] > div[data-composition-src] {{ position: absolute; inset: 0; }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1920" data-height="1080">
{chr(10).join(slots)}
{chr(10).join(audios)}
</div>
<script>
window.__timelines["main"] = gsap.timeline({{ paused: true }});
</script>
</body>
</html>
"""


if __name__ == "__main__":
    (ROOT / "compositions").mkdir(exist_ok=True)
    files = {
        "hook": hook_scene(),
        "pitch": pitch_scene(),
        "tour": tour_scene(),
        "maria": demo_scene("maria", 53.6, "vinh-1", "vinh", MARIA_SEGS, MARIA_STEPS, MARIA_CUES, FOOT,
                             qr=dict(svg="assets/qr-patient.svg", kicker="Sent to Maria", label="Scan → her savings card", pop=35.1, zoom=36.55, to_x=320, to_y=60)),
        "james": demo_scene("james", 46.2, "minh-1", "minh", JAMES_SEGS, JAMES_STEPS, JAMES_CUES, FOOT),
        "market": market_scene(),
        "endcard": endcard_scene(),
    }
    for k, v in files.items():
        (ROOT / "compositions" / f"{k}.html").write_text(v, encoding="utf-8")
    total, idx = index()
    (ROOT / "index.html").write_text(idx, encoding="utf-8")
    print("total", total, "s")
