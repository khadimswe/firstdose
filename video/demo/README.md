# FirstDose demo video (HyperFrames)

The 2:43 submission video, built as a [HyperFrames](https://github.com/heygen-com/hyperframes) composition. The team's talking heads drive the timeline, and the product footage comes from crisp stills of the real app. All motion is authored in the composition: pans, zooms, the sheet slide-ins, taps and highlights. That keeps text sharp and the playback smooth.

| Time | Speaker | What's on screen |
|---|---|---|
| 0:00 | Khadim | DocUpdate's real article: the headline, highlighted and credited, then Surescripts' 27% |
| 0:18 | Khadim | FirstDose title, the DocUpdate-style phone (New · FirstDose tags), Spark vs FirstDose, Market Access |
| 0:35 | Vinh | Maria, end to end: the queue, New Rx and the verbatim DailyMed label, the alert and watch, the approve sheet, the handoff landing on the desktop, her card, acknowledgment ≠ fill, Fill confirmed |
| 1:27 | Minh | James: the messy notes, then Gemini's reason code, then the rule-picked fix, the verbatim label, Tiger Data counts, who sees what |
| 2:14 | Khadim | 467,000 medical assistants, the partners FirstDose routes to, the close |
| 2:37 | — | End card and disclosure |

## Rebuild

Everything regenerates from the repo. Requirements: Node 22+, ffmpeg, and the raw clips via `git lfs pull`.

```sh
cd video/demo
python3 tools/prep_heads.py     # trim, splice, grade and loudness-match (-16 LUFS) the clips in video/*.mov → media/heads/
python3 tools/captions.py       # caption cues + word anchors from tools/transcripts (whisper.cpp output)
python3 tools/build.py          # writes index.html from the shot list, anchored to spoken words
npx hyperframes lint            # 0 errors expected
npx hyperframes snapshot --at 3.5,46.8,67.3,101   # review frames
npx hyperframes render -q standard -w 2 -o renders/firstdose-demo.mp4
```

**Recapturing the app screens:** run the offline build with `NEXT_PUBLIC_DATA_SOURCE=mock npx next build && npx next start -p 3100`. Then run `cd tools/capture && npm i && npx playwright install chromium && node stills.mjs`. `article.mjs` recaptures DocUpdate's article; it declines any non-essential cookie banner.

## Rules this video keeps

- **Screens:** the product screens are the real app on synthetic data (PLAN D3), and the footer disclosure appears throughout. Label text is shown only as the app renders it from DailyMed, and nothing on screen rewords it.
- **DocUpdate:** it appears only as the credited article and the "Concept · not affiliated" phone view (D9). The "New · FirstDose" tags mark everything added to DocUpdate's screens (6.14, the Impiricus rule).
- **Numbers:** every number on screen is in `docs/presentation/claims-and-evidence.md`. 27% is from Surescripts, about 467,000 is from BLS, and the article title and date are from docupdate.io (July 9, 2026).
- **No SMS anywhere:** the patient message lives on the patient's card page, and the wrist alert is an ntfy push.
