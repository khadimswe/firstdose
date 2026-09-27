# Build the FirstDose preparation PDFs

The source snapshot described by these documents is main `015c3429a12518ed67753a47db9eaae308e82b13` (September 26, 2026). These scripts do not contact production services or change application state.

From the repository root, with Python 3.11+ and dependencies from `requirements.txt` installed:

```text
python scripts/presentation/export_script.py
python scripts/presentation/build_master.py
python scripts/presentation/build_full_personal_prep.py
python scripts/presentation/verify_pdfs.py
python scripts/presentation/build_live_runbook.py
python scripts/presentation/build_vinh_technical.py
python scripts/presentation/build_vinh_judge_qa.py
python scripts/presentation/build_vinh_visuals.py
```

Outputs are the Markdown scripts, four preparation PDFs and a 12-page live-demo companion in `docs/presentation`. Temporary plots, rendered pages and contact sheets go in ignored `.presentation-build/`. Fonts use Arial on Windows, or system DejaVu Sans under `/usr/share/fonts/truetype/dejavu` on Linux. Fonts are embedded in PDFs; font files are not distributed in this repository.

`build_live_runbook.py` builds and checks the separate click-by-click guide, readable companion and page renders. Its operator sequence puts James after Maria and supersedes the earlier suggestion to prepare James in the background. It includes the user-reported rehearsal outcomes without treating them as new automated deployment or device tests.

`vinh_technical_content.py` and `build_vinh_technical.py` produce Vinh's focused technical demo guide with a backend diagram, CMS snapshot charts, short spoken script and deeper judge answers. The confirmed September 27 track selections are Oracle of the Deep, Impiricus and SpaceXAI. The user's submitted Devpost story is context; source-code checks govern implementation details.

`vinh_judge_qa.json` contains the 30 spoken answers requested after the Maria-only v4 run sheet. `build_vinh_judge_qa.py` builds the standalone 10-page Q&A PDF, readable Markdown and page renders, and checks bounds, question count and bookmarks. The last page contains six script wording corrections.

`build_vinh_visuals.py` produces the 10-page diagram-first cheat sheet and a ZIP of individual PNGs. `vinh_simple_audio.json` and `build_vinh_simple_audio.py` produce the shorter, plain-language Maria demo/Q&A episode using the same explicitly invoked ElevenLabs engine and process-only key. This separate generation consumes credits for uncached chapters and leaves the earlier detailed podcast intact.

Audio is a separate, explicit generation step: `python scripts/presentation/build_vinh_audio.py`. It requires Python `requests`, FFmpeg/ffprobe and `ELEVENLABS_API_KEY` in the process environment, and consumes ElevenLabs credits for uncached chapters. It uses the premade George voice, not a clone. `vinh_audio_script.json` is the editable script. Exact cached chapters are reused from ignored `.presentation-build/vinh-audio`; final MP3s, chapter timings and a timestamped transcript go in `docs/presentation`. Rebuild the technical PDF afterward to include the chapter index. The study podcast is a preparation artifact; it does not change the app's pre-generated patient audio or establish runtime audio generation.

`pitch_script.json` is the shared source for the team script and each personal script. `deep_qa.py` holds the detailed questioning material. `build_master.py`, `master_pages_aligned.py`, `feature_appendix.py`, `speaker_pages.py` and `revision_pages.py` draw the master; `business_sources_page.py` supplies source links. The personal builder reuses the master drawing helpers and appends the complete master while preserving navigation.

The two PNGs under `assets/` are saved hosted-audit screenshots of fictional demo data after PR #39. They illustrate that recorded state, not a freshly captured deployment at this document's newer source snapshot. Diagrams are explanatory, and economic charts use explicitly hypothetical inputs. Application checks quoted in the PDFs are recorded evidence, not tests performed by these generators.

Before updating the source SHA or presenting a stronger claim, inspect the relevant code and dated evidence. Render and visually inspect changed pages. Update all personal PDFs after changing the master.
