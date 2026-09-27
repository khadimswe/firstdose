"""Builds video/demo/index.html: the FirstDose demo as a HyperFrames composition.

Talking heads drive the timeline (their own audio). Screens are crisp stills
from the real app (captured by capture/stills.mjs); all motion is authored here
(camera pans/zooms, sheet slides, taps, highlights), anchored to spoken words.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # repo root (video/demo/tools → repo)
DEMO = ROOT / "video" / "demo"
MEDIA = DEMO / "media"
CAP = json.loads((MEDIA / "heads/captions.json").read_text())
MAN = json.loads((MEDIA / "screens/manifest.json").read_text())
ART = json.loads((MEDIA / "docupdate-article.json").read_text())

W, H = 1920, 1080
GAP = [0.35, 0.40, 0.45, 0.40]
ORDER = ["k1-hook", "k2-intro", "v-maria", "m-james", "k3-close"]
S = {}
t = 0.0
for i, seg in enumerate(ORDER):
    S[seg] = round(t, 3)
    t += CAP[seg]["duration"] + (GAP[i] if i < len(GAP) else 0)
END_START = round(t, 3)
END_DUR = 6.0
TOTAL = round(END_START + END_DUR, 3)

html, js, init = [], [], []


def T(x):
    return f"{x:.3f}"


def word(seg, phrase, nth=0):
    """Global start time of `phrase` (first word) in a segment's aligned words."""
    words = CAP[seg]["words"]
    target = [re.sub(r"[^a-z0-9]", "", w.lower()) for w in phrase.split()]
    norm = [re.sub(r"[^a-z0-9]", "", w["w"].lower()) for w in words]
    hits = [i for i in range(len(norm)) if norm[i:i + len(target)] == target]
    if len(hits) <= nth:
        raise KeyError(f"{seg}: {phrase!r}")
    return S[seg] + words[hits[nth]]["start"]


def word_end(seg, phrase, nth=0):
    words = CAP[seg]["words"]
    target = [re.sub(r"[^a-z0-9]", "", w.lower()) for w in phrase.split()]
    norm = [re.sub(r"[^a-z0-9]", "", w["w"].lower()) for w in words]
    hits = [i for i in range(len(norm)) if norm[i:i + len(target)] == target]
    return S[seg] + words[hits[nth] + len(target) - 1]["end"]


def seg_end(seg):
    return S[seg] + CAP[seg]["duration"]


# ——————————————————————————————————————— camera frames ———————————————————————————————————————

class Frame:
    """A browser window or phone with a camera over stacked app stills."""

    def __init__(self, fid, kind, x, y, vw, vh, css_w, url=None):
        self.id, self.kind, self.x, self.y, self.vw, self.vh, self.css_w = fid, kind, x, y, vw, vh, css_w
        self.base = vw / css_w
        self.imgs = []  # (img id, name, css height)
        self.cam_h = 0
        self.state = {"x": 0.0, "y": 0.0, "s": self.base}
        self.current = None
        self.inner = []

    # camera ---------------------------------------------------------------
    def cam_for(self, cx, cy, z, css_h):
        s = self.base * z
        x = self.vw / 2 - cx * s
        y = self.vh / 2 - cy * s
        x = min(0, max(self.vw - self.css_w * s, x))
        y = min(0, max(self.vh - css_h * s, y)) if css_h * s >= self.vh else 0
        return {"x": x, "y": y, "s": s}

    def fit(self, rect, pad=24, zmax=2.2, css_h=None):
        x, y, w, h = rect
        z = min(self.vw / (w + 2 * pad), self.vh / (h + 2 * pad)) / self.base
        z = max(1.0, min(zmax, z))
        return self.cam_for(x + w / 2, y + h / 2, z, css_h or self.cam_h)

    def cam(self, t, state, dur=0.9, ease="power2.inOut"):
        js.append(f'tl.to("#{self.id}-cam",{{x:{state["x"]:.1f},y:{state["y"]:.1f},scale:{state["s"]:.4f},duration:{dur},ease:"{ease}"}},{T(t)});')
        self.state = state

    def cam_set(self, t, state):
        if t <= 0:
            init.append(f'gsap.set("#{self.id}-cam",{{x:{state["x"]:.1f},y:{state["y"]:.1f},scale:{state["s"]:.4f},transformOrigin:"0 0"}});')
            self.state = state
            return
        js.append(f'tl.set("#{self.id}-cam",{{x:{state["x"]:.1f},y:{state["y"]:.1f},scale:{state["s"]:.4f}}},{T(t)});')
        self.state = state

    # stills ---------------------------------------------------------------
    def add(self, name, url=None):
        m = MAN[name]
        iid = f"{self.id}-{name}"
        self.imgs.append((iid, name, m["height"], url))
        self.cam_h = max(self.cam_h, m["height"])
        return iid

    def show_img(self, t, name, fade=0.22):
        iid = f"{self.id}-{name}"
        if not any(i[0] == iid for i in self.imgs):
            raise KeyError(iid)
        js.append(f'tl.to("#{iid},#{iid}-url",{{autoAlpha:1,duration:{fade},ease:"none"}},{T(t)});')
        if self.current and self.current != iid:
            js.append(f'tl.to("#{self.current},#{self.current}-url",{{autoAlpha:0,duration:{fade},ease:"none"}},{T(t + fade * 0.6)});')
        self.current = iid

    def scroll_swap(self, t, name, dist=420, dur=0.85):
        """Pseudo-scroll: the old still slides up and the new still (the scrolled page) rises into place."""
        iid = f"{self.id}-{name}"
        old = self.current
        js.append(f'tl.fromTo("#{iid}",{{autoAlpha:0,y:{dist}}},{{autoAlpha:1,y:0,duration:{dur},ease:"power2.inOut",immediateRender:false}},{T(t)});')
        js.append(f'tl.to("#{iid}-url",{{autoAlpha:1,duration:0.2}},{T(t)});')
        if old and old != iid:
            js.append(f'tl.to("#{old}",{{y:{-dist},duration:{dur},ease:"power2.inOut"}},{T(t)});')
            js.append(f'tl.to("#{old},#{old}-url",{{autoAlpha:0,duration:{dur * 0.5},ease:"none"}},{T(t + dur * 0.35)});')
            js.append(f'tl.set("#{old}",{{y:0}},{T(t + dur + 0.05)});')
        self.current = iid

    def box(self, name, key):
        b = MAN[name]["boxes"][key]
        return (b["x"], b["y"], b["w"], b["h"])

    # overlays inside the camera ------------------------------------------
    def ring(self, t, rect, dur, color="var(--purple)", pad=6, radius=14):
        rid = f"{self.id}-ring{len(self.inner)}"
        x, y, w, h = rect
        bw = 3 / self.state["s"] * self.base * (1 if self.kind == "browser" else 1)
        bw = max(1.5, 3.2 / self.state["s"])
        self.inner.append(
            f'<div id="{rid}" class="ring" style="left:{x - pad:.1f}px;top:{y - pad:.1f}px;width:{w + 2 * pad:.1f}px;'
            f'height:{h + 2 * pad:.1f}px;border-width:{bw:.2f}px;border-radius:{radius}px;border-color:{color};'
            f'box-shadow:0 0 0 {bw * 2.5:.1f}px color-mix(in oklab,{color} 22%,transparent)"></div>')
        js.append(f'tl.fromTo("#{rid}",{{autoAlpha:0,scale:1.04}},{{autoAlpha:1,scale:1,duration:0.35,ease:"power2.out",immediateRender:false}},{T(t)});')
        js.append(f'tl.to("#{rid}",{{autoAlpha:0,duration:0.3,ease:"none"}},{T(t + dur)});')

    def tap(self, t, rect):
        x, y, w, h = rect
        cx, cy = x + w / 2, y + h / 2
        rid = f"{self.id}-tap{len(self.inner)}"
        size = 64 / self.state["s"] * (1.0 if self.kind == "phone" else 0.9)
        self.inner.append(f'<div id="{rid}" class="tap" style="left:{cx - size / 2:.1f}px;top:{cy - size / 2:.1f}px;width:{size:.1f}px;height:{size:.1f}px"></div>')
        js.append(f'tl.fromTo("#{rid}",{{autoAlpha:0,scale:0.4}},{{autoAlpha:0.55,scale:0.9,duration:0.12,ease:"power2.out",immediateRender:false}},{T(t)});')
        js.append(f'tl.to("#{rid}",{{autoAlpha:0,scale:1.7,duration:0.45,ease:"power2.out"}},{T(t + 0.12)});')

    def slide_in(self, t, el_name, final_name, direction="up", dim=0.42):
        """Slide an element still (a sheet) over a dim layer, then settle on the full state still."""
        b = MAN[el_name]["box"]
        eid = f"{self.id}-{el_name}"
        did = f"{self.id}-dim{len(self.inner)}"
        self.inner.append(f'<div id="{did}" class="dim" style="height:{self.cam_h}px"></div>')
        radius = "22px 22px 0 0" if direction == "up" else "0"
        self.inner.append(
            f'<img id="{eid}" class="el" src="media/screens/{el_name}.png" style="left:{b["x"]:.1f}px;top:{b["y"]:.1f}px;'
            f'width:{b["w"]:.1f}px;height:{b["h"]:.1f}px;border-radius:{radius}" />')
        off = ("y", b["h"] + 20) if direction == "up" else ("x", b["w"] + 20)
        js.append(f'tl.fromTo("#{did}",{{autoAlpha:0}},{{autoAlpha:{dim},duration:0.3,ease:"none",immediateRender:false}},{T(t)});')
        js.append(f'tl.fromTo("#{eid}",{{autoAlpha:1,{off[0]}:{off[1]:.1f}}},{{{off[0]}:0,duration:0.42,ease:"power3.out",immediateRender:false}},{T(t)});')
        self.show_img(t + 0.45, final_name, fade=0.18)
        js.append(f'tl.to("#{eid},#{did}",{{autoAlpha:0,duration:0.18,ease:"none"}},{T(t + 0.62)});')

    # html -----------------------------------------------------------------
    def camera_html(self):
        imgs = "".join(
            f'<img id="{iid}" class="shot" src="media/screens/{name}.png" style="width:{self.css_w}px" />'
            for iid, name, _, _ in self.imgs)
        return (f'<div id="{self.id}-cam" class="cam" style="width:{self.css_w}px;height:{self.cam_h}px">'
                f'{imgs}{"".join(self.inner)}</div>')


class Browser(Frame):
    BAR = 44

    def __init__(self, fid, x, y, vw, css_w=1440, css_h=810):
        super().__init__(fid, "browser", x, y, vw, vw * css_h / css_w, css_w)

    def html(self):
        urls = "".join(f'<span id="{iid}-url" class="url-text">{url or ""}</span>' for iid, _, _, url in self.imgs)
        return (
            f'<div id="{self.id}" class="browser" style="left:{self.x}px;top:{self.y}px;width:{self.vw}px;height:{self.vh + self.BAR:.1f}px">'
            f'<div class="bar"><i class="dot r"></i><i class="dot y"></i><i class="dot g"></i>'
            f'<div class="url"><svg viewBox="0 0 16 16" width="13" height="13"><path d="M4.5 7V5.5a3.5 3.5 0 0 1 7 0V7h.5a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm1.5 0h4V5.5a2 2 0 0 0-4 0z" fill="currentColor"/></svg>{urls}</div></div>'
            f'<div class="vp" style="width:{self.vw}px;height:{self.vh:.1f}px">{self.camera_html()}</div></div>')


class Phone(Frame):
    SCALE = 1.0  # pt → px

    def __init__(self, fid, x, y, theme="dark"):
        s = self.SCALE
        self.theme = theme
        super().__init__(fid, "phone", x, y, 402 * s, 778 * s, 402)
        self.bar, self.home = 62 * s, 34 * s

    def html(self):
        s = self.SCALE
        sw, sh = 402 * s, 874 * s
        dark = self.theme == "dark"
        ink = "#fff" if dark else "#111"
        bg = "var(--navy)" if dark else "#fff"
        status = (
            f'<div class="status" style="height:{self.bar:.1f}px;background:{bg};color:{ink}">'
            f'<span class="clock">9:41</span><span class="island"></span>'
            f'<span class="sys"><svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>'
            f'<svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.5 6.9a6.4 6.4 0 0 1 9 0l-1.4 1.4a4.4 4.4 0 0 0-6.2 0zM1 4.4a10 10 0 0 1 14 0L13.6 5.8a8 8 0 0 0-11.2 0z" fill="currentColor"/></svg>'
            f'<span class="batt"><i></i></span></span></div>')
        home = f'<div class="homebar" style="height:{self.home:.1f}px;background:{bg}"><i style="background:{ink}"></i></div>'
        return (
            f'<div id="{self.id}" class="phone" style="left:{self.x}px;top:{self.y}px;width:{sw + 24:.1f}px;height:{sh + 24:.1f}px">'
            f'<div class="screen" style="width:{sw:.1f}px;height:{sh:.1f}px;background:{bg}">{status}'
            f'<div class="vp" style="top:{self.bar:.1f}px;width:{self.vw:.1f}px;height:{self.vh:.1f}px">{self.camera_html()}{self.fixed_html()}</div>{home}</div></div>')

    def fixed_html(self):
        if self.theme != "dark":
            return ""
        b = MAN["p-tabbar-el"]["box"]
        return (f'<img id="{self.id}-tabbar" class="fixed-ov" src="media/screens/p-tabbar-el.png" '
                f'style="left:{b["x"] * self.base:.1f}px;top:{b["y"] * self.base:.1f}px;width:{b["w"] * self.base:.1f}px;height:{b["h"] * self.base:.1f}px" />')


# ——————————————————————————————————————— layout helpers ———————————————————————————————————————

def show(t, sel, dur=0.45, frm=None, ease="power3.out"):
    frm = frm or {"opacity": 0, "y": 18}
    frm = {("autoAlpha" if k == "opacity" else k): v for k, v in frm.items()}
    f = ",".join(f"{k}:{v}" for k, v in frm.items())
    to = ",".join(f"{k}:{0 if k in ('x', 'y') else 1}" for k in frm)
    js.append(f'tl.fromTo("{sel}",{{{f}}},{{{to},duration:{dur},ease:"{ease}",immediateRender:false}},{T(t)});')


def hide(t, sel, dur=0.35, to=None):
    to = to or {"autoAlpha": 0}
    f = ",".join(f"{k}:{v}" for k, v in to.items())
    js.append(f'tl.to("{sel}",{{{f},duration:{dur},ease:"power2.in"}},{T(t)});')


def move(t, sel, x=None, y=None, scale=None, dur=0.7, ease="power3.inOut"):
    parts = [f"{k}:{v}" for k, v in (("x", x), ("y", y), ("scale", scale)) if v is not None]
    js.append(f'tl.to("{sel}",{{{",".join(parts)},duration:{dur},ease:"{ease}"}},{T(t)});')


chips = []


def chip(t, dur, text, x, y, kind="note", w=None, anchor="left"):
    cid = f"chip{len(chips)}"
    style = f"left:{x}px;top:{y}px;" + (f"width:{w}px;" if w else "")
    if anchor == "right":
        style = f"right:{W - x}px;top:{y}px;" + (f"width:{w}px;" if w else "")
    chips.append(f'<div id="{cid}" class="chip {kind}" style="{style}">{text}</div>')
    show(t, f"#{cid}", 0.4, {"opacity": 0, "y": 10})
    hide(t + dur, f"#{cid}", 0.3)
    return cid


# ——————————————————————————————————————— build ———————————————————————————————————————

# Talking-head wrappers: one per speaker segment, animated between layouts.
HEAD_LAYOUTS = {
    "full": dict(x=330, y=48, w=1260, h=840),
    "pip": dict(x=1598, y=44, w=282, h=188),
    "left": dict(x=90, y=150, w=900, h=600),
}
NAMES = {
    "k1-hook": ("Khadim", "Product & design"),
    "k2-intro": ("Khadim", "Product & design"),
    "v-maria": ("Vinh", "Backend & watch"),
    "m-james": ("Minh", "Labels, AI & analytics"),
    "k3-close": ("Khadim", "Product & design"),
}

heads_html = []


def head_state(seg, layout):
    L = HEAD_LAYOUTS[layout]
    return {"x": L["x"], "y": L["y"], "w": L["w"], "h": L["h"]}


def head(seg, layouts):
    """layouts: list of (time, layout). First entry is the entry layout."""
    hid = f"head-{seg}"
    L0 = HEAD_LAYOUTS[layouts[0][1]]
    name, role = NAMES[seg]
    dur = CAP[seg]["duration"]
    heads_html.append(
        f'<div id="{hid}" class="head" style="left:0;top:0;width:{L0["w"]}px;height:{L0["h"]}px">'
        f'<video id="{hid}-v" class="clip" src="media/heads/{seg}.mp4" data-start="{T(S[seg])}" data-duration="{T(dur)}" '
        f'data-track-index="1" muted playsinline></video>'
        f'<div class="tag"><b>{name}</b><span>{role}</span></div></div>'
        f'<audio id="{hid}-a" src="media/heads/{seg}.wav" data-start="{T(S[seg])}" data-duration="{T(dur)}" data-track-index="10" data-volume="1"></audio>')
    init.append(f'gsap.set("#{hid}",{{x:{L0["x"]},y:{L0["y"]},width:{L0["w"]},height:{L0["h"]},opacity:0}});')
    js.append(f'tl.to("#{hid}",{{opacity:1,duration:0.35,ease:"none"}},{T(S[seg] - 0.05)});')
    for tt, lay in layouts[1:]:
        L = HEAD_LAYOUTS[lay]
        js.append(f'tl.to("#{hid}",{{x:{L["x"]},y:{L["y"]},width:{L["w"]},height:{L["h"]},duration:0.7,ease:"power3.inOut"}},{T(tt)});')
    js.append(f'tl.to("#{hid}",{{opacity:0,duration:0.3,ease:"none"}},{T(seg_end(seg))});')


# Frames ---------------------------------------------------------------
ART_B = Browser("art", 70, 36, 1480, 1440, 900)
MAN["docupdate-article"] = {"height": 900, "boxes": {}}
ART_B.add("docupdate-article", "docupdate.io/articles/prescription-abandonment-…")

BF = Browser("bf", 48, 44, 1520)          # full desktop
BS = Browser("bs", 578, 118, 986)          # desktop in split view (zoomed camera)
PD = Phone("pd", 640, 34, "dark")          # doctor's phone
PP = Phone("pp", 640, 34, "light")         # Maria's phone
PHONE_LEFT_X = 70

# Register stills per frame (with the URL shown in the browser bar).
for n in ["d-queue-seeded", "d-queue-cleared", "d-queue-maria", "d-case-maria", "d-queue-after-fix", "d-waiting-patient",
          "d-waiting-pharmacy", "d-confirmed", "d-queue-james", "d-case-james", "d-prescribers"]:
    BF.add(n, "firstdose.vercel.app/coordinator" + ("/prescribers" if n == "d-prescribers" else ""))
BF.add("d-access-full", "firstdose.vercel.app/access")
for n in ["d-queue-cleared", "d-queue-maria", "d-queue-after-fix", "d-waiting-patient", "d-waiting-pharmacy"]:
    BS.add(n, "firstdose.vercel.app/coordinator")
BS.add("d-access-full", "firstdose.vercel.app/access")
for n in ["p-home-alert", "p-profile", "p-newrx", "p-newrx-sent", "p-newrx-label", "p-newrx-scroll-full", "p-home-quiet", "p-home-sheet", "p-home-sent",
          "p-home-confirmed", "p-home-james", "p-home-james-sent"]:
    PD.add(n)
for n in ["t-card", "t-card-used"]:
    PP.add(n)

# Camera starting states
for f in (BF, BS, PD, PP):
    f.cam_set(0, {"x": 0, "y": 0, "s": f.base})
ART_B.cam_set(0, {"x": 0, "y": 0, "s": ART_B.base})

overlay = []  # full-canvas overlays (cards, rails, watch, pills)


def frame_show(t, f, dur=0.5, dy=24):
    show(t, f"#{f.id}", dur, {"opacity": 0, "y": dy})


def frame_hide(t, f, dur=0.35):
    if f.kind == "phone":
        js.append(f'tl.to("#{f.id}",{{autoAlpha:0,x:"-=40",duration:{dur},ease:"power2.in"}},{T(t)});')
        js.append(f'tl.set("#{f.id}",{{x:"+=40"}},{T(t + dur + 0.01)});')
    else:
        hide(t, f"#{f.id}", dur)


def orient(t, dur, text):
    """Top-right 'now showing' label under the speaker PIP."""
    return chip(t, dur, text, 1598, 262, "orient", w=282)


# ════════════════════════ 1 · HOOK (Khadim) ════════════════════════
k = "k1-hook"
head(k, [(S[k], "pip"), (word(k, "And a patient") - 0.1, "full")])
js.append(f'tl.fromTo("#fadein",{{opacity:1}},{{opacity:0,duration:0.6,ease:"none"}},0);')
frame_show(0.05, ART_B, 0.6, 0)
ART_B.show_img(0.0, "docupdate-article", 0.01)
h1 = ART["h1"]
ART_B.cam(word(k, "published") , ART_B.fit((h1["x"], h1["y"] - 30, h1["width"], h1["height"] + 60), pad=40, zmax=1.45, css_h=900), 1.4)
# Highlighter sweeps over the two headline lines, word-for-word unaltered.
line_h = h1["height"] / 2
for i, (key, lw) in enumerate([("The prescription", 0.93), ("The patient still", 0.87)]):
    hid = f"hl{i}"
    lx = h1["x"] + h1["width"] * (1 - lw) / 2
    ART_B.inner.append(f'<div id="{hid}" class="hl" style="left:{lx:.1f}px;top:{h1["y"] + i * line_h + line_h * 0.52:.1f}px;width:{h1["width"] * lw:.1f}px;height:{line_h * 0.42:.1f}px"></div>')
    js.append(f'tl.fromTo("#{hid}",{{scaleX:0}},{{scaleX:1,duration:0.9,ease:"power2.inOut",immediateRender:false}},{T(word(k, key) - 0.05)});')
chip(word(k, "The prescription") , word(k, "Surescripts") - word(k, "The prescription") + 0.2,
     '<b>DocUpdate</b> · Sana Khateeb, PharmD · July 9, 2026', 110, 890, "credit")
# Stat card: Surescripts.
sc = "stat27"
overlay.append(f'<div id="{sc}" class="stat"><div class="num">27%</div><div class="lbl">of new prescriptions are never dispensed</div>'
               f'<div class="src">Surescripts, First-Fill Abandonment · 2026</div></div>')
t_s = word(k, "Surescripts")
overlay.insert(0, '<div id="scrim" class="scrim"></div>')
show(t_s - 0.1, "#scrim", 0.45, {"opacity": 0})
hide(word(k, "And a patient") - 0.1, "#scrim", 0.4)
show(t_s, f"#{sc}", 0.5, {"opacity": 0, "y": 30})
hide(word(k, "And a patient") - 0.15, f"#{sc}", 0.35)
frame_hide(word(k, "And a patient") - 0.1, ART_B, 0.4)
chip(word(k, "The person who can fix"), seg_end(k) - word(k, "The person who can fix") - 0.2,
     "The person who can fix it: <b>the practice's access coordinator</b>", 330, 905, "lower")

# ════════════════════════ 2 · WHAT IT IS (Khadim) ════════════════════════
k = "k2-intro"
head(k, [(S[k], "pip")])
title = "titlecard"
overlay.append(f'<div id="{title}" class="title"><div class="mark">FirstDose</div>'
               f'<div class="sub">Catches the prescriptions that stall, says why, routes the one fix, and confirms the fill.</div></div>')
show(S[k] + 0.1, f"#{title}", 0.6, {"opacity": 0, "y": 20})
hide(word(k, "It's a new") - 0.15, f"#{title}", 0.3)
t_p = word(k, "It's a new")
t_ma = word(k, "and Market Access")
PD.show_img(t_p - 0.3, "p-home-alert", 0.01)
frame_show(t_p, PD, 0.6, 40)
orient(t_p + 0.2, t_ma - t_p - 0.7, "Doctor · iPhone · <b>inside DocUpdate</b>")
chip(t_p + 0.3, 2.3, 'An <b>Impiricus Ascend</b> skill, shown inside DocUpdate<br><small>Concept · not affiliated with DocUpdate</small>', 1120, 170, "note", w=440)
chip(t_p + 0.9, t_ma - t_p - 1.4, '<span class="tag-demo">New · FirstDose</span> marks what we add. Everything untagged is DocUpdate today.', 1120, 300, "note", w=440)
PD.ring(t_p + 0.9, PD.box("p-home-alert", "card"), 2.2)
t_sp = word(k, "Spark")
t_fd = word(k, "FirstDose fires")
cmp = "compare"
overlay.append(f'<div id="{cmp}" class="compare"><div id="cmp1" class="row muted"><b>Impiricus Spark</b><span>fires when a prescription is <i>written</i></span></div>'
               f'<div id="cmp2" class="row hot"><b>FirstDose</b><span>fires when it <i>isn\'t filled</i></span></div></div>')
show(t_sp, "#compare", 0.01, {"opacity": 0})
show(t_sp, "#cmp1", 0.45, {"opacity": 0, "x": 24})
show(t_fd, "#cmp2", 0.45, {"opacity": 0, "x": 24})
t_staff = word(k, "It gives DocUpdate")
hide(t_staff - 0.1, "#compare", 0.3)
PD.show_img(t_staff, "p-profile", 0.25)
PD.ring(t_staff + 0.4, PD.box("p-profile", "coord"), 2.4)
chip(t_staff + 0.4, t_ma - t_staff - 0.9, "Its first <b>staff account</b>: the doctor approves their coordinator", 1120, 460, "note", w=440)
frame_hide(t_ma - 0.1, PD, 0.35)
BF.show_img(t_ma - 0.2, "d-access-full", 0.01)
BF.cam_set(t_ma - 0.2, {"x": 0, "y": 0, "s": BF.base})
BF.ring(t_ma + 0.5, BF.box("d-access-full", "fills"), seg_end(k) - t_ma - 0.8)
frame_show(t_ma, BF, 0.55, 30)
chip(t_ma + 0.5, seg_end(k) - t_ma - 0.5, "Market Access would pay per <b>confirmed first fill</b>, never per prescription", 90, 800, "note", w=620)
frame_hide(seg_end(k), BF, 0.3)

# ════════════════════════ 3 · MARIA (Vinh) ════════════════════════
k = "v-maria"
head(k, [(S[k], "pip")])
t0 = S[k]
BF.show_img(t0 - 0.2, "d-queue-seeded", 0.01)
BF.cam_set(t0 - 0.2, {"x": 0, "y": 0, "s": BF.base})
frame_show(t0, BF, 0.55, 30)
o1 = orient(t0 + 0.2, word(k, "Maria is a fictional") - t0 - 0.4, "Access coordinator · <b>desktop</b>")
BF.ring(word(k, "She's the person"), BF.box("d-queue-seeded", "summary"), 2.4)
BF.ring(word(k, "and she opens"), BF.box("d-queue-seeded", "table"), 2.0)
BF.cam(word(k, "and she opens"), BF.cam_for(760, 330, 1.12, 810), 1.6)
chip(word(k, "and she opens") + 0.2, 1.9, "Every morning: stuck, waiting, and confirmed first fills", 90, 812, "note", w=640)
# — New Rx on the doctor's phone
t_m = word(k, "Maria is a fictional")
frame_hide(t_m - 0.1, BF, 0.35)
PD.show_img(t_m - 0.3, "p-newrx", 0.01)
PD.cam_set(t_m - 0.3, {"x": 0, "y": 0, "s": PD.base})
frame_show(t_m, PD, 0.55, 40)
orient(t_m + 0.1, word(k, "Maria jumps") - t_m - 0.3, "Doctor · iPhone · <b>DocUpdate</b>")
chip(t_m + 0.3, 1.9, "<b>Maria Lopez</b> · synthetic patient · Otezla 30 mg", 1120, 170, "note", w=420)
t_sign = word(k, "signs")
PD.tap(t_sign + 0.2, PD.box("p-newrx", "sign"))
PD.show_img(t_sign + 0.4, "p-newrx-sent", 0.2)
t_lab = word(k, "with the label verbatim")
sf = "p-newrx-scroll-full"
js.append(f'tl.to("#pd-tabbar",{{autoAlpha:1,duration:0.01}},{T(t_lab - 0.42)});')
PD.show_img(t_lab - 0.4, sf, 0.06)
lab_y = PD.box(sf, "label")[1]
PD.cam(t_lab - 0.3, PD.cam_for(201, lab_y - 16 + 778 / 2, 1.0, MAN[sf]["height"]), 1.15, "power2.inOut")
PD.ring(t_lab + 0.85, PD.box(sf, "badge"), 1.7, color="var(--green)", pad=5, radius=10)
chip(t_lab + 0.4, 2.0, "Label text shown <b>verbatim from DailyMed</b>", 1120, 300, "note", w=420)
t_today = word(k, "Today, that's where")
PD.show_img(t_today, "p-home-quiet", 0.25)
PD.cam(t_today + 0.25, {"x": 0, "y": 0, "s": PD.base}, 0.01)
js.append(f'tl.to("#pd-tabbar",{{autoAlpha:0,duration:0.2}},{T(t_today)});')
chip(t_today + 0.2, 1.7, "Today the signal stops at <b>Sent</b>", 1120, 300, "note", w=420)
t_ph = word(k, "Here, the pharmacy")
PD.show_img(t_ph + 0.2, "p-home-alert", 0.22)
PD.ring(t_ph + 0.5, PD.box("p-home-alert", "card"), 3.6)
chip(t_ph + 0.5, 3.4, "Pharmacy: <b>Not dispensed / returned to stock</b><br><small>Reason: patient declined at quoted price ($410)</small>", 1120, 170, "note", w=440)
# Watch
t_w = word(k, "The doctor's watch")
wid = "watch1"
overlay.append(
    f'<div id="{wid}" class="watch" style="left:1120px;top:360px"><div class="face"><div class="app"><i></i><b>FirstDose</b><span>now</span></div>'
    f'<p>Maria: Otezla first fill pending. Declined at price ($410).</p></div><div class="crown"></div></div>')
show(t_w, f"#{wid}", 0.45, {"opacity": 0, "x": 30})
js.append(f'tl.fromTo("#{wid} .face",{{x:-3}},{{x:3,duration:0.06,repeat:7,yoyo:true,ease:"none",immediateRender:false}},{T(t_w + 0.4)});')
chip(t_w + 0.45, 1.7, "Wrist alert via <b>ntfy</b> push", 1120, 650, "note", w=330)
hide(word(k, "One tap") + 0.8, f"#{wid}", 0.35)
t_tap = word(k, "Send to my")
PD.tap(t_tap, PD.box("p-home-alert", "send"))
t_first = word(k, "The first time")
PD.slide_in(t_first - 0.35, "p-sheet-el", "p-home-sheet")
chip(t_first + 0.3, 5.6, "First time only: the doctor <b>approves their coordinator</b>, the CoverMyMeds way", 1120, 170, "note", w=440)
PD.ring(t_first + 0.6, PD.box("p-home-sheet", "sheet"), 4.8, pad=2, radius=20)
t_app = word(k, "inside the app")
PD.tap(t_app + 0.7, PD.box("p-home-sheet", "approve"))
PD.show_img(t_app + 0.95, "p-home-sent", 0.22)
# — Split: the handoff lands on the coordinator's desktop
t_j = word(k, "Maria jumps")
move(t_j - 0.2, "#pd", x=PHONE_LEFT_X - PD.x, dur=0.7)
BS.show_img(t_j - 0.3, "d-queue-cleared", 0.01)
tbl = BF.box("d-queue-maria", "row")
BS.cam_set(t_j - 0.3, BS.cam_for(860, 300, 1.25, 810))
frame_show(t_j + 0.2, BS, 0.5, 20)
orient(t_j, word(k, "Maria opens her card") - t_j - 0.3, "Doctor's iPhone → coordinator's <b>desktop</b>")
pill = "pill1"
overlay.append(f'<div id="{pill}" class="pill">handoff · Maria Lopez</div>')
js.append(f'tl.fromTo("#{pill}",{{autoAlpha:0,x:330,y:360}},{{autoAlpha:1,x:470,y:330,duration:0.35,ease:"power2.out",immediateRender:false}},{T(t_j + 0.35)});')
js.append(f'tl.to("#{pill}",{{x:880,y:250,duration:0.6,ease:"power2.inOut"}},{T(t_j + 0.7)});')
js.append(f'tl.to("#{pill}",{{autoAlpha:0,duration:0.25,ease:"none"}},{T(t_j + 1.3)});')
BS.show_img(t_j + 1.2, "d-queue-maria", 0.25)
BS.ring(t_j + 1.45, BS.box("d-queue-maria", "row"), 3.4)
t_fix = word(k, "re-send the copay")
BS.tap(t_fix + 0.6, BS.box("d-queue-maria", "fix"))
BS.show_img(t_fix + 0.85, "d-queue-after-fix", 0.25)
chip(t_j + 1.5, t_fix + 0.8 - t_j - 1.5, "One fix, picked by rule: <b>Re-send copay card</b> · Impiricus Wallet", 578, 790, "note", w=700)
# — Maria's phone: card, Use at pharmacy
t_o = word(k, "Maria opens her card")
PP.show_img(t_o - 0.4, "t-card", 0.01)
js.append(f'tl.set("#pp",{{x:{PHONE_LEFT_X - PP.x}}},{T(t_o - 0.4)});')
hide(t_o - 0.1, "#pd", 0.3)
show(t_o, "#pp", 0.45, {"opacity": 0, "y": 30})
BS.show_img(t_o - 0.1, "d-waiting-patient", 0.25)
BS.cam(t_o, BS.fit(BS.box("d-waiting-patient", "row"), pad=40, zmax=1.45), 0.8)
orient(t_o, word(k, "Only when the pharmacy") - t_o - 0.3, "Maria's phone → coordinator's <b>desktop</b>")
t_use = word(k, "and taps Use")
PP.tap(t_use + 0.5, PP.box("t-card", "use"))
PP.show_img(t_use + 0.7, "t-card-used", 0.22)
pill2 = "pill2"
overlay.append(f'<div id="{pill2}" class="pill">acknowledged · not a fill</div>')
js.append(f'tl.fromTo("#{pill2}",{{autoAlpha:0,x:330,y:760}},{{autoAlpha:1,x:470,y:720,duration:0.35,ease:"power2.out",immediateRender:false}},{T(t_use + 0.9)});')
js.append(f'tl.to("#{pill2}",{{x:880,y:560,duration:0.6,ease:"power2.inOut"}},{T(t_use + 1.25)});')
js.append(f'tl.to("#{pill2}",{{autoAlpha:0,duration:0.25,ease:"none"}},{T(t_use + 1.85)});')
BS.show_img(t_use + 1.7, "d-waiting-pharmacy", 0.25)
t_ack = word(k, "That's an acknowledgment")
BS.ring(t_ack, BS.box("d-waiting-pharmacy", "row"), 3.4)
chip(t_ack + 0.1, 3.4, "Tap = <b>acknowledgment</b>, not a fill. Now waiting on the <b>pharmacy</b>.", 578, 790, "note", w=700)
# — Fill confirmed (desktop full)
t_c = word(k, "Only when the pharmacy")
hide(t_c - 0.1, "#pp,#bs", 0.35)
BF.show_img(t_c - 0.3, "d-confirmed", 0.01)
BF.cam_set(t_c - 0.3, {"x": 0, "y": 0, "s": BF.base})
frame_show(t_c, BF, 0.5, 20)
orient(t_c + 0.1, word(k, "The doctor heard") - t_c - 0.2, "Access coordinator · <b>desktop</b>")
row = BF.box("d-confirmed", "row")
BF.cam(t_c + 0.6, BF.fit((row[0], row[1] - 330, row[2], row[3] + 360), pad=30, zmax=1.35), 1.2)
BF.ring(word(k, "Fill confirmed", 0) - 0.2, row, 2.6, color="var(--green)")
chip(word(k, "Fill confirmed", 0), word(k, "The doctor heard") - word(k, "Fill confirmed", 0) - 0.3, "Only the pharmacy's confirmation (RxFill <b>Dispensed</b>) says <b>Fill confirmed</b>", 90, 812, "note", w=700)
# — The doctor hears it twice (phone + watch)
t_h = word(k, "The doctor heard")
frame_hide(t_h - 0.1, BF, 0.35)
PD.show_img(t_h - 0.3, "p-home-confirmed", 0.01)
js.append(f'tl.set("#pd",{{x:0,autoAlpha:0}},{T(t_h - 0.3)});')
show(t_h, "#pd", 0.5, {"opacity": 0, "y": 30})
PD.ring(t_h + 0.5, PD.box("p-home-confirmed", "card"), seg_end(k) - t_h - 0.8, color="var(--green)")
wid2 = "watch2"
overlay.append(
    f'<div id="{wid2}" class="watch" style="left:1120px;top:360px"><div class="face"><div class="app"><i></i><b>FirstDose</b><span>now</span></div>'
    f'<p>Maria: Otezla pharmacy fill confirmed.</p></div><div class="crown"></div></div>')
show(word(k, "when it broke"), f"#{wid2}", 0.45, {"opacity": 0, "x": 30})
js.append(f'tl.fromTo("#{wid2} .face",{{x:-3}},{{x:3,duration:0.06,repeat:7,yoyo:true,ease:"none",immediateRender:false}},{T(word(k, "when it was fixed"))});')
chip(t_h + 0.2, seg_end(k) - t_h - 0.4, "Twice: <b>when it broke</b>, and <b>when it was fixed</b>. Silence means it worked.", 1120, 170, "note", w=440)
hide(seg_end(k), f"#{wid2},#pd", 0.3)

# ════════════════════════ 4 · JAMES (Minh) ════════════════════════
k = "m-james"
head(k, [(S[k], "pip")])
t0 = S[k]
PD.show_img(t0 - 0.3, "p-home-james", 0.01)
show(t0, "#pd", 0.5, {"opacity": 0, "y": 30})
orient(t0 + 0.1, word(k, "Then a rule") - t0 - 0.3, "Doctor · iPhone · <b>DocUpdate</b>")
PD.ring(t0 + 0.4, PD.box("p-home-james", "card"), 2.4)
# Messy notes → Gemini → reason code
t_note = word(k, "His pharmacy note")
notes = "notes"
overlay.append(
    f'<div id="{notes}" class="notes">'
    f'<div id="n1" class="raw"><em>Pharmacy · claim</em><code>NCPDP reject 75 · Prior Authorization Required<br>Not dispensed / returned to stock</code></div>'
    f'<div id="n2" class="raw"><em>Hub · status</em><code>Unable to Reach Patient<br>3 attempts, no callback, VM full</code></div>'
    f'<div id="n3" class="arrow"><span>Gemini API</span></div>'
    f'<div id="n4" class="reason"><em>Reason code</em><b>UNABLE_TO_REACH</b><span>Unable to reach patient after 3 calls</span><small>or <b>unknown</b> → a person reviews it</small></div>'
    f'</div>')
show(t_note, "#notes", 0.01, {"opacity": 0})
show(t_note, "#n1", 0.45, {"opacity": 0, "x": 30})
show(word(k, "and he couldn't"), "#n2", 0.45, {"opacity": 0, "x": 30})
t_g = word(k, "Gemini reads")
show(t_g, "#n3", 0.4, {"opacity": 0, "y": -10})
show(t_g + 1.4, "#n4", 0.45, {"opacity": 0, "y": 16})
js.append(f'tl.to("#n4 small",{{autoAlpha:1,duration:0.35}},{T(word(k, "or unknown"))});')
t_rule = word(k, "Then a rule")
hide(t_rule - 0.15, "#notes,#pd", 0.35)
# Rule-picked fix on the coordinator's desktop
BF.show_img(t_rule - 0.3, "d-queue-james", 0.01)
BF.cam_set(t_rule - 0.3, BF.fit(BF.box("d-queue-james", "row"), pad=60, zmax=1.4))
frame_show(t_rule, BF, 0.5, 20)
orient(t_rule + 0.1, word(k, "No model") - t_rule - 0.2, "Access coordinator · <b>desktop</b>")
BF.ring(t_rule + 0.5, BF.box("d-queue-james", "fix"), 2.2)
t_conn = word(k, "connect to access")
BF.cam(t_conn - 0.4, {"x": 0, "y": 0, "s": BF.base}, 0.6)
BF.slide_in(t_conn - 0.2, "d-case-james-el", "d-case-james", direction="right", dim=0.3)
BF.ring(t_conn + 0.6, BF.box("d-case-james", "fix"), 2.4)
chip(t_conn + 0.5, 2.6, "<b>Rule, not AI:</b> a router table picks the fix. Gemini only names the reason.", 90, 812, "note", w=640)
# No model writes drug or patient text
t_nm = word(k, "No model")
frame_hide(t_nm - 0.1, BF, 0.3)
PD.show_img(t_nm - 0.3, "p-newrx-label", 0.01)
PD.cam_set(t_nm - 0.3, {"x": 0, "y": 0, "s": PD.base})
show(t_nm, "#pd", 0.45, {"opacity": 0, "y": 30})
PD.ring(t_nm + 0.4, PD.box("p-newrx-label", "badge"), 3.8, color="var(--green)", pad=5, radius=10)
chip(t_nm + 0.3, 4.2, "Drug text: <b>verbatim DailyMed</b><br>Patient and doctor text: <b>fixed templates</b><br><small>No model writes either.</small>", 1120, 250, "note", w=440)
# Tiger Data · counts only
t_ev = word(k, "Every step")
hide(t_ev - 0.1, "#pd", 0.3)
BF.show_img(t_ev - 0.3, "d-access-full", 0.01)
acc_h = MAN["d-access-full"]["height"]
BF.cam_set(t_ev - 0.3, BF.cam_for(720, 405, 1.0, acc_h))
frame_show(t_ev, BF, 0.5, 20)
orient(t_ev + 0.1, seg_end(k) - t_ev - 0.3, "Market Access view · <b>counts only</b>")
chip(t_ev + 0.3, 4.0, "Every event lands in <b>Tiger Data</b> (TimescaleDB): the history behind these counts", 90, 812, "note", w=680)
BF.cam(word(k, "so the office"), BF.fit((176, 136, 1088, 266), pad=40, zmax=1.25, css_h=acc_h), 1.2)
BF.ring(word(k, "confirmed first"), BF.box("d-access-full", "fills"), 2.6)
BF.ring(word(k, "time to first"), BF.box("d-access-full", "reasons"), 1.8)
t_ph2 = word(k, "Pharma sees")
who = BF.box("d-access-full", "who")
BF.cam(t_ph2 - 0.4, BF.fit(who, pad=30, zmax=1.2, css_h=acc_h), 1.2)
BF.ring(t_ph2 + 0.4, who, seg_end(k) - t_ph2 - 0.7)
chip(t_ph2 + 0.4, seg_end(k) - t_ph2 - 0.5, "<b>Counts only</b>, never a name, never a prescription count per doctor", 90, 812, "note", w=680)
frame_hide(seg_end(k), BF, 0.3)

# ════════════════════════ 5 · WHY IT MATTERS (Khadim) ════════════════════════
k = "k3-close"
head(k, [(S[k], "left"), (word(k, "None of") - 0.25, "full"), (word(k, "And it routes") - 0.2, "pip"),
         (word(k, "Impiricus reaches") - 0.2, "full")])
st = "stat467"
overlay.append(f'<div id="{st}" class="stat side"><div class="num">≈467,000</div><div class="lbl">medical assistants work in physicians\' offices</div>'
               f'<div class="src">BLS Occupational Outlook · 2025</div></div>')
show(S[k] + 0.3, f"#{st}", 0.5, {"opacity": 0, "x": 30})
hide(word(k, "None of") - 0.25, f"#{st}", 0.3)
t_r = word(k, "And it routes")
rails = "rails"
overlay.append(
    f'<div id="{rails}" class="rails"><div class="hub">FirstDose<small>routes the fix</small></div>'
    + "".join(f'<div id="r{i}" class="rail"><b>{a}</b><span>{b}</span></div>' for i, (a, b) in enumerate([
        ("Impiricus Wallet", "copay card"), ("Concierge", "access requests"), ("QPharma", "samples"), ("Medvantx", "patient access")]))
    + '<div class="rails-note">Fixes Impiricus already runs. FirstDose rebuilds none of them.</div></div>')
show(t_r, f"#{rails}", 0.4, {"opacity": 0})
for i, wtxt in enumerate(["Wallet", "Concierge", "QPharma", "Medvantx"]):
    show(word(k, wtxt) - 0.1, f"#r{i}", 0.35, {"opacity": 0, "x": 24})
hide(word(k, "Impiricus reaches") - 0.25, f"#{rails}", 0.3)

# ════════════════════════ END CARD ════════════════════════
end = "endcard"
overlay.append(
    f'<div id="{end}" class="endcard"><div class="mark">FirstDose</div>'
    f'<div class="tagline">Impiricus reaches the doctor who writes the prescription.<br><b>FirstDose reaches the person who gets the patient on it.</b></div>'
    f'<div class="url">firstdose.vercel.app</div>'
    f'<div class="team">Khadim · Vinh · Minh — HackGT 13 · Impiricus challenge</div>'
    f'<div class="stack">Gemini API · Tiger Data · ElevenLabs · Grok · ntfy · Next.js on Vercel</div>'
    f'<div class="disc">Concept: FirstDose inside DocUpdate · not affiliated with DocUpdate or Impiricus. Synthetic patients and pharmacy activity; '
    f'Impiricus, Wallet and partner names shown as a concept.</div></div>')
show(END_START + 0.1, f"#{end}", 0.7, {"opacity": 0, "y": 16})

# ════════════════════════ CAPTIONS ════════════════════════
caps = []
for seg in ORDER:
    for i, c in enumerate(CAP[seg]["cues"]):
        cid = f"cap-{seg}-{i}"
        caps.append(f'<div id="{cid}" class="cap"><span>{c["text"]}</span></div>')
        a, b = S[seg] + c["start"], S[seg] + c["end"]
        js.append(f'tl.to("#{cid}",{{autoAlpha:1,duration:0.1,ease:"none"}},{T(a)});')
        js.append(f'tl.to("#{cid}",{{autoAlpha:0,duration:0.1,ease:"none"}},{T(max(a + 0.2, b - 0.05))});')

# ════════════════════════ HTML ════════════════════════
CSS = (Path(__file__).resolve().parent / "demo.css").read_text()
frames_html = ART_B.html() + BF.html() + BS.html() + PD.html() + PP.html()
doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width={W}, height={H}" />
<script src="vendor/gsap.min.js"></script>
<style>{CSS}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{T(TOTAL)}" data-width="{W}" data-height="{H}">
<div class="bg"></div>
{frames_html}
{"".join(overlay)}
{"".join(heads_html)}
{"".join(chips)}
<div class="disclose">Concept · synthetic patients and pharmacy activity · not affiliated with DocUpdate or Impiricus</div>
{"".join(caps)}
<div id="fadein" class="fade"></div>
</div>
<script>
const tl = gsap.timeline({{ paused: true }});
gsap.set(".cam",{{transformOrigin:"0 0"}});
gsap.set(".fixed-ov,#scrim,#art,#bf,#bs,#pd,#pp,.stat,.title,.compare,.compare .row,.watch,.pill,.notes,.notes > div,.rails,.rail,.endcard,.cap,.chip,.shot,.url-text,.ring,.tap,.dim,.el",{{autoAlpha:0}});
gsap.set(".hl",{{scaleX:0,transformOrigin:"0 50%"}});
gsap.set("#n4 small",{{autoAlpha:0}});
gsap.set("#art .shot,#art .url-text",{{autoAlpha:1}});
{chr(10).join(init)}
{chr(10).join(js)}
tl.to("#root .disclose",{{opacity:0,duration:0.3}},{T(END_START)});
tl.to({{}},{{duration:0.01}},{T(TOTAL - 0.01)});
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
"""
(DEMO / "index.html").write_text(doc)
print(f"segments: {json.dumps(S)}  end card at {END_START}  total {TOTAL}s")
