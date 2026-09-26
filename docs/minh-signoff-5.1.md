# Minh's sign-off: label provenance, Gemini, Tiger (task 5.1)

Minh, Sat Sep 26, 2026, ~6:45 PM ET. This is the owner sign-off listed as
"Freeze still open" item 3 in `docs/claims-audit.md`. Every claim below is
tied to a commit, PR or command another owner can re-run. Where a check is
still branch-local (pending review), the commit and PR are named so it can be
re-verified at merge time.

## 1. Label provenance — signed off

### Otezla (drug_otezla) — merged, live

- Pipeline: PR #8 (merged via Vinh's c51b23f), offline gate in the prebuild.
- Identity: RxNorm SBD 1492746 `30 MG apremilast Oral Tablet [Otezla]`;
  DailyMed setid `f6b1f516-4972-4d82-bced-113e47b41cc5`.
- Verification: `scripts/labels/verify.ts --drug drug_otezla` re-derives
  everything from the committed `data/labels/drug_otezla/source.xml` bytes —
  setid, labeler (Celgene), presentation (brand + ingredient + 30 mg + form),
  the full four sections in order, and the RxNorm selection from the committed
  `rxnorm.json`. The saved `verification.json` receipt must match. A
  one-character edit to any published text fails the gate (observed by Vinh,
  5.1 audit; re-checkable locally with `node --import tsx
  scripts/labels/verify.ts --drug drug_otezla`).
- Endpoint: `GET /api/label/drug_otezla` → 200 `byte_exact: true` on the
  production build; unknown drug → 404; the 503 branch is covered by tests.

**Sign-off: Otezla label text is verbatim from DailyMed, proven by committed
bytes + hash + offline re-verification at every build.** Permitted wording:
"Verbatim from DailyMed, verified."

### Humira (drug_humira) — PR #43 (branch `data/humira-label`, pending review)

- Identity is harder than Otezla and each hazard is closed by a check:
  - RxNorm `getDrugs?name=Humira` returns 12 BPCK starter packs, prefilled
    syringes and two Auto-Injector pens. The selector derives the
    concentration token (40 mg / 0.4 mL → `100 MG/ML`) and requires
    ingredient + concentration + `Auto-Injector` + the `0.4 ML` volume token,
    which selects exactly one SBD: **1872980** `0.4 ML adalimumab 100 MG/ML
    Auto-Injector [Humira]` — the same RxCUI already in `mock/patients.json`.
    Rejected deterministically: BPCK packs (brace rows), the 0.8 mL pen
    (1921240), prefilled syringes (1726846).
  - The SPL is a KIT (formCode KIT/CARTON); the real presentations live in
    nested `containerPackagedProduct > asContent` with ACTIB quantities
    (`numerator 40 mg / denominator 0.4 mL`). `parseSplEvidence` descends the
    KIT and records the volume; `assertSplIdentity` requires the 40 mg /
    0.4 mL presentation to be explicitly present (the same SPL legitimately
    contains other presentations — this label's one is proven, not assumed).
  - Document: setid `608d4f0d-b19f-46d3-749a-7159aa5f933d`, document
    `8bf84b15-6763-41cf-bfa4-bcee9ad4ef9a`, version `2154`, effective
    `20251223`, labeler AbbVie Inc.
    source.xml sha256
    `06b13f288416565f3c781b85462751338a7df379d9036f10570bb1c0582e729a`
    (914,756 bytes).
- Live evidence (production build, `npm run start`, branch head):
  - `GET /api/label/drug_humira` → 200 `byte_exact: true`; sections
    34066-1 (2,710 chars), 34067-9 (2,332), 43685-7 (17,306), 34068-7
    (7,547); `GET /api/label/drug_unknown` → 404.
  - Doctor → New Rx → James Carter: the boxed warning renders verbatim
    ("SERIOUS INFECTIONS … MALIGNANCY …"), no PLACEHOLDER badge.
- Tests: `tests/labels/humira.test.ts` (4) + updated
  `tests/label-catalog.test.ts`; suite **728 passed in 54 files** at branch
  head, `tsc --noEmit`, eslint and `git diff --check` clean; `npm run build`
  green with the prebuild gate verifying **both** drugs.

**Sign-off: Humira label provenance is complete on `data/humira-label`
(PR #43). It clears the claims-register caveat "Humira still shows the
placeholder" once merged. Until the PR merges, keep the audit's current
wording; after merge, permitted wording becomes "Verbatim from DailyMed,
verified" for both drugs.** Contract note for Vinh + Deem: the PR touches
`mock/labels.json` (placeholder → verified artifact, byte-identical to the
committed one) and `package.json` (prebuild verifies both drugs) — same
pattern as the Otezla integration c51b23f.

## 2. Gemini — signed off

- Pipeline: PR #23 (classifier), wired into the simulator by Vinh's #39.
  Hosted runs at 4:23 and 4:28 PM (Vinh's audit) recorded `DECLINED_AT_PRICE`
  and `UNABLE_TO_REACH` — real hosted classifications, in my lane scope.
- Live smoke I ran (PR #23 branch, key in `.env`, never committed):
  **4/4 PASS** — including the prompt-injection probe returning the
  sanctioned null ("case stays unclassified, no doctor alert"), and the
  scripted-reason restore check (never restores a scripted reason).
- Model pin: `gemini-3.8-flash` blew the 4-second interactive deadline in
  Vinh's #39 test; the deploy pin should be **`gemini-3.1-flash-lite`**
  (704–3,838 ms in his recorded timings). Set `GEMINI_MODEL=gemini-3.1-flash-lite`
  in the Vercel environment. The current `.env` I will hand over via AirDrop
  carries `GEMINI_API_KEY` (prepaid key under a fresh project; the first key
  hit "402 prepaid depleted" and was replaced) and this model pin.
- Tests: 17 classifier tests on main (parse + Gemini contract + null
  behavior); `require()` is banned by lint — the SDK is loaded with a dynamic
  `await import('@google/genai')` and thinking is forced off
  (`thinkingConfig: { thinkingBudget: 0 }`) so responses stay interactive.

**Sign-off: Gemini maps a pharmacy note to a reason code or null; on failure
the case stays unclassified; it never writes label text or restores scripted
reasons.** Permitted wording per Vinh's audit row ("Gemini") stands.

## 3. Tiger Data — signed off

- Pipeline: PR #37 (merged), wired by #39. `lib/server/analytics/**` +
  `app/api/access/summary/route.ts`; the access screen reads a run-scoped
  Tiger summary.
- Live smoke I ran against the hosted Tiger Cloud hypertable (credentials in
  `.env`, handed over via AirDrop): **6/6 PASS** — idempotent init (×2),
  projection SQL matches the independent oracle
  (`{"recovered":2,"median_ttff_seconds":90,"reason_tally":{"DECLINED_AT_PRICE":1,"UNABLE_TO_REACH":1}}`),
  summary reads, replay.
- TLS note for ops: the service serves a Google Trust Services public cert;
  the Node trust store with `rejectUnauthorized: true` is used (no custom CA
  file). Connection-string SSL params are stripped before the pg `Pool` is
  constructed (`stripSslParams`) because pg merges URL params over config.
- Tests: 51 analytics tests on main; `isDeepStrictEqual` for SQL==oracle
  parity (object key order is not guaranteed), a summary pre-pass so a
  zero-second fill under a smaller script id still counts, and single final
  median rounding to match `percentile_cont`.

**Sign-off: the access summary is a direct query over a hosted Tiger
hypertable; SQL==oracle parity was proven live. No continuous aggregate is
claimed (per the audit's "Not claimed" row).**

## Hand-off to Vinh for the freeze

- AirDrop `.env` (never git): `TIGER_DATABASE_URL`, `ANALYTICS_HMAC_KEY`,
  `GEMINI_API_KEY`, `GEMINI_MODEL` — Vercel env vars for the deployed run.
- Set the Vercel `GEMINI_MODEL` to **`gemini-3.1-flash-lite`** (timing
  evidence above; the repo default 3.8-flash missed the 4s interactive
  deadline).
- Merge PR #43 before freezing, or keep the "Humira placeholder" caveat in
  the claims register until it lands.
- Re-run for the delta after merge: `npm test`, prebuild gate
  (`verify.ts --drug drug_otezla && verify.ts --drug drug_humira`), and the
  deployed `/api/label/drug_humira` 200 check.

*Everything here is re-checkable; nothing depends on my say-so. PLAN.md stays
the execution dashboard; this file is 5.1 evidence.*