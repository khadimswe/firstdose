---
workflow: general-video
flow: companion
storyboard: no
message: "Impiricus reaches the doctor who writes the prescription. FirstDose reaches the person who gets the patient on it, every day."
destination: devpost-youtube
aspect: 16:9
language: en
length: 3:00 hard cap (built 2:43)
---

# FirstDose hackathon demo video

## Intent
Demo + pitch for HackGT judges. Smooth "product review" feel: animated landing page, real live-production
footage, team face cams cropped to circles beside the demo, captions throughout (Minh's section uses
script wording timed to his speech).

## Assets
- Face clips: `firstdose/video/*.mov` (Khadim 1-3, Minh 1, Vinh 1) -> `assets/faces/*.mp4`, levelled to -16 LUFS.
- Live footage: recorded on firstdose.vercel.app, Sep 26 2026 (user-authorized reset/seed/run/reset-to-zero);
  `capture/record_live.py`, marks in `capture/out/marks.json`. Final hosted state verified 0 events/links/messages.
- Fonts: Geist + Geist Mono (the app's own). Palette from app/globals.css (stuck red, confirmed green, practice blue).

## Customizations
- Layout in demo scenes: face circle + step titles + karaoke captions left; phone/desktop stage right with
  focus handoffs and punch-ins (coordinate-target-zoom, depth-of-field-blur).
- Registry patterns adapted: caption-pill-karaoke (per-word highlight), transitions-blur (scene handoffs),
  zoom-through-transition (QR -> Maria's phone; end-card QR -> live queue preview).
- DocUpdate article cited in the hook and on the landing hero.

## Notes
- No music bed: HeyGen catalog not signed in, local MusicGen deps missing. Options offered to the user.
- Higgsfield: not available in this environment.
- Khadim says "one in four"; on-screen stat shows Surescripts' 27% with "more than 1 in 4".
