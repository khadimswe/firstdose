# Build the FirstDose preparation PDFs

The source snapshot described by these documents is main `015c3429a12518ed67753a47db9eaae308e82b13` (September 26, 2026). These scripts do not contact production services or change application state.

From the repository root, with Python 3.11+ and dependencies from `requirements.txt` installed:

```text
python scripts/presentation/export_script.py
python scripts/presentation/build_master.py
python scripts/presentation/build_full_personal_prep.py
python scripts/presentation/verify_pdfs.py
python scripts/presentation/build_live_runbook.py
```

Outputs are the Markdown scripts, four preparation PDFs and a 12-page live-demo companion in `docs/presentation`. Temporary plots, rendered pages and contact sheets go in ignored `.presentation-build/`. Fonts use Arial on Windows, or system DejaVu Sans under `/usr/share/fonts/truetype/dejavu` on Linux. Fonts are embedded in PDFs; font files are not distributed in this repository.

`build_live_runbook.py` builds and checks the separate click-by-click guide, readable companion and page renders. Its operator sequence puts James after Maria and supersedes the earlier suggestion to prepare James in the background. It includes the user-reported rehearsal outcomes without treating them as new automated deployment or device tests.

`pitch_script.json` is the shared source for the team script and each personal script. `deep_qa.py` holds the detailed questioning material. `build_master.py`, `master_pages_aligned.py`, `feature_appendix.py`, `speaker_pages.py` and `revision_pages.py` draw the master; `business_sources_page.py` supplies source links. The personal builder reuses the master drawing helpers and appends the complete master while preserving navigation.

The two PNGs under `assets/` are saved hosted-audit screenshots of fictional demo data after PR #39. They illustrate that recorded state, not a freshly captured deployment at this document's newer source snapshot. Diagrams are explanatory, and economic charts use explicitly hypothetical inputs. Application checks quoted in the PDFs are recorded evidence, not tests performed by these generators.

Before updating the source SHA or presenting a stronger claim, inspect the relevant code and dated evidence. Render and visually inspect changed pages. Update all personal PDFs after changing the master.
