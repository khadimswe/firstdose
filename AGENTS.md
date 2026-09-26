# Current planning update ? September 26, 2026

The user approved the three-person split: **Vinh** owns authoritative workflow, Supabase/Realtime, deterministic routing, watch and optional voice backend; **Minh** owns verified labels, then Gemini classification, then Tiger analytics; **Deem** owns screens, frontend integration, microphone capture/confirmation if retained, and presentation. This supersedes the two-person ownership below. Stephen/Tylin remain a separate team.

Use `docs/STATUS.md`, `docs/phases/team-build-plan.md`, the six phase playbooks and `docs/winning-conditions.md` for current execution context. Main at `80646f7` now includes Deem's screen stack and task dashboard; this planning branch is rebased onto it. Presentation targets are not implementation evidence. Proposed contract corrections still require the existing mock-review process. Historical schedule targets below are internal checkpoints, not confirmed organizer deadlines. The legacy sponsor repetition/file-count instruction is flagged in `docs/presentation/claims-and-evidence.md`; do not fabricate provider use or treat that heuristic as an official rule.

---

# FirstDose — Master Plan

Scaffold-level. Whoever owns a phase plans it deeper in `docs/phases/` as they go. This file is the contract: roles, phases, gates, cut order, and the rules every agent session follows.

Locked Fri 2026-09-25, 9 PM. Team: **Vihn + Deem**. (SecondHand Safe = Stephen + Tylin, separate team.)

---

## 0. The one-paragraph pitch

A dermatologist starts Maria on Otezla. The copay card goes out at prescribing (OptimizeRx, Impiricus Wallet do this today). Maria still never starts: the pharmacy quotes $410 and she walks. Nobody in the office finds out until she's back in six weeks, no better, and the doctor thinks the drug failed. FirstDose is a skill for Impiricus Ascend that watches for stuck statuses, buzzes the doctor's wrist with the **reason**, hands the **one right fix** to the coordinator in one tap, re-runs the claim, and proves recovery to Market Access. *"They tell you it didn't happen. We tell you why, fix it in one tap, and prove it worked."*

## 1. Roles

| | Vihn (AI / data, owns the watch) | Deem (product) |
|---|---|---|
| Owns | Supabase schema + Realtime, pharmacy/hub simulator, reason enum + Gemini classifier, fix router, RxNorm/DailyMed label card + byte-exact check, Tiger Data dual-write + `daily_ttff`, Grok STT, ntfy → Garmin, Connect IQ widget (stretch) | `/doctor`, `/coordinator`, `/patient/[id]`, `/board`, `/access`, `/sim` screens; demo script + table performance (drives coordinator); writeup, video, poster, who-sees-what slide |
| Never touches | UI components | Schema, router, external API clients |
| Shared contract | **`mock/*.json`** — the shapes are frozen once agreed. Change = a PR both approve. | |

Stephen: 10-minute review pass Sat 2 PM and Sat 9 PM if SecondHand Safe allows.

## 2. Phases and gates

### Phase 0 — Setup (Fri, before 9 PM)
- [ ] Repo, `.gitignore`, `.env.example`, `mock/` shapes agreed
- [ ] Keys: Gemini, xAI, Tiger Data, Supabase, ElevenLabs (MLH code), OpenAI (live.hexlabs.org)
- [ ] ntfy app on iPhone, Garmin Connect notifications on, **wrist buzz smoke test passes**
- [ ] `.tech` name reserved (`firstdose.tech` is taken; try `getfirstdose.tech`, `firstdose-rx.tech`)
- [ ] Team registered on HexLabs; ask #qna whether Notability is a challenge or a sponsor track
- **Gate:** watch buzzes from a curl.

### Phase 1 — Core loop (Fri 9 PM → Sat 4 AM)
Vihn: schema, simulator, router, label card. Deem: `/doctor`, `/coordinator`, `/patient`, `/sim` on mock data, then Realtime.
- **Gate (Sat 4 AM):** prescribe → stuck → wrist alert → handoff with fix → patient taps "Use at pharmacy" → re-run → alert clears. End to end, on the deployed URL if possible.

### Phase 2 — The wow (Sat 4 AM → 10 AM)
- `/board` Relay Board with red stop, price counter, chime
- Tiger `daily_ttff` + `/access`
- Gemini classifier (enum only)
- James / Humira case + before-visit card with real boxed warning
- Deploy to Vercel. Staggered sleep.
- **Gate:** deployed loop, both cases.

### Phase 3 — Sponsor check (Sat 11 AM–12 PM, Klaus 1456)
Impiricus workshop. Ask: *"Does Medvantx detect patients who never filled?"* and *"What's a recovered patient worth to Market Access?"*
- Yes, Medvantx detects it → lead with reason routing + before-visit card.
- Full overlap → fall back to "the wrist + the reason feedback loop."
- 2:30 PM Impiricus mini event (1443). 4:30 PM SpaceXAI workshop (1443).

### Phase 4 — Voice, QR, polish (Sat 12 PM → 6 PM)
- Grok voice handoff with keyterms (record the no-keyterm miss for the video)
- ElevenLabs "Maria started Otezla" line
- QR patient flow tested on a stranger's phone
- **Sat 2 PM cut check** (see §4)
- Dry-run with 2 strangers as judges. Raw video footage at 6 PM (wrist close-up, board, judge phone).

### Phase 5 — Ship (Sat 9 PM → Sun 6:30 AM)
- Sat 9 PM: claims frozen; writeup + poster drafted
- Sun 5 AM: video done (loudness + duration checked)
- Sun 6:30 AM: submitted to **Devpost and expo.hexlabs.org**, reload-verified. Boxes: A Marina's Mission, Impiricus, SpaceXAI, Create-X, MLH (Tiger, Gemini, .Tech, ElevenLabs), Notability only if cleared.
- Sun 9:30–11 AM: expo.

## 3. Never cut

The doctor's alert · the handoff with a one-tap fix · the pharmacy re-run · the real DailyMed label · the who-sees-what split.

## 4. Cut order (Sat 2 PM, if behind)

1. Label-change highlighting (keep the verbatim label)
2. Connect IQ watch widget (keep the ntfy watch path)
3. Voice handoff (keep the tap)
4. `/access` screen (use a slide)

## 5. Rules every agent session follows

These go in your personal `CLAUDE.md` too. They are the reason a judge can trust the demo.

1. **No AI-written drug claims.** Label text on screen is a byte-exact substring of the DailyMed SPL. Never paraphrase, summarize, or "clean up" a warning.
2. **Gemini maps text to the enum. The rule picks the fix.** Gemini output is `reason` from `mock/reasons.json`, max 140 chars of note, never clinical advice. The before-visit card is a fixed template.
3. **Router is deterministic** (`mock/reasons.json` → `router`). Medicare/Medicaid never gets a manufacturer copay card.
4. **Every stand-in is labelled on screen**: Ascend, Wallet, QPharma, Medvantx, pharmacy, hub, prices. Patients are fictional. No PHI anywhere, including test data.
5. **Every screen runs on `mock/` with no backend.** `NEXT_PUBLIC_DATA_SOURCE=mock|supabase` switches one hook, `useEvents()`.
6. **Nothing that identifies a patient or counts prescriptions crosses to the Ascend side.** See `docs/who-sees-what.md`.
7. **No secrets in the repo.** `.env` is gitignored from commit 1. Gitleaks on full history before submit.
8. **Name Impiricus Ascend, Grok, Gemini and Tiger Data 3+ times each in the writeup, and touch each SDK in more than one file.**
9. One branch per screen or module. Small PRs into `main`. Commit message says what changed in plain words.

## 6. Prize map

| Box | Entry | Real job in the product |
|---|---|---|
| General | A Marina's Mission | patients who never start their medicine |
| Sponsor 1 | Impiricus | the core |
| Sponsor 2 | SpaceXAI (Grok) | STT with drug/patient keyterms drives the handoff |
| MLH | Tiger Data | `fill_events` hypertable + `daily_ttff` feed `/access` |
| MLH | Gemini API | free-text note → reason enum; before-visit template |
| MLH | .Tech | domain |
| MLH | ElevenLabs | "started" voice line, label read-aloud |
| Create-X | checkbox | Vihn (GT) qualifies |
| Skip | MongoDB, Solana, Backboard, Vultr, Meta, Visa | |

## 7. Verification (Phase 5 checklist)

1. Router table test: every reason × insurance type; Medicare → never a copay card
2. Byte-exact test: every label sentence shown ⊂ fetched SPL XML (Otezla, Humira)
3. ntfy smoke test at H0 and before expo
4. Full loop on the Vercel URL with 2 phones + watch: board red → green, `/access` recovered = 1, TTFF read from Tiger
5. Grok STT: "Send Maria to my coordinator" → correct intent with keyterms; record the miss without
6. Gitleaks clean; `.env` untracked
7. Stills of every judge-facing screen from the deployed origin, desktop and phone width, looked at by a human
8. Devpost and expo.hexlabs.org both show the submission after a reload

## 8. Backup

Recorded full-loop video. Phone hotspot. Board and screens replay cached `mock/events.json` if WiFi dies. If a judge declines the watch or QR, Vihn wears it and a spare phone plays Maria.
