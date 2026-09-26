# Deployed acceptance and frontend follow-up

September 26, 2026. This is an evidence record; [PLAN.md](../../PLAN.md) remains the execution dashboard. The hosted audit used `https://firstdose.vercel.app` after PR #39 merged at `2ebc3ed`. Subsequent main `ba3c439` adds the PR #38 status documentation. The frontend repairs are in [draft PR #40](https://github.com/khadimswe/firstdose/pull/40), application commit `c1fd445`; they are not yet merged or claimed live.

## Hosted browser acceptance

The user authorized a full workflow test, alerts and reset. The audit exercised actual authenticated routes against the deployed app, using independent browser sessions:

- Maria: coordinator request and Profile approval before prescribing, exact verified Otezla label, pharmacy barrier, handoff, fix, Spanish patient message, audio playback, message acknowledgment, card acknowledgment, independent pharmacy confirmation, reload and reset.
- James: prescription, pharmacy/hub status and reason, Concierge handoff, and access-support routing. Humira's label remains an explicit placeholder.
- Seeded opening: 3 cases needing a fix, 2 waiting, 8 confirmed fills, with a separate background prescriber.
- Tiger: hosted summary returned 8 fills, median 60 seconds and three reason counts of 2; reset returned zero fills, null median and empty reasons. Earlier unconfigured/unavailable notes are superseded for this audited deployment.
- 48 Chromium route/viewport checks and 14 WebKit/Firefox route checks loaded successfully without uncaught page errors. Search, microphone permission denial, network recovery, API failure behavior and label/audio behavior were checked.
- Final hosted state was verified empty: zero workflow events, coordinator links and patient messages. Request and approve the interactive coordinator link again before the next demonstration. This is the recorded reset result, not a promise that the shared run stays empty after others use it.

English and Spanish Otezla audio decoded and played in the browser. This does not establish native Spanish pronunciation quality or audible physical-phone acceptance. Browser sessions at phone dimensions are not two physical phones. The user confirmed an earlier direct notification on both devices; the latest confirmation did not identify the watch model or establish receipt of every workflow alert.

## Frontend repairs awaiting merge

The audit found eight groups: narrow-screen overflow; false simulator completion; dialog/route focus; search focus and feedback; contrast; unnamed QR images; keyboard-inaccessible table scrolling; and missing landmarks/headings/skip links. PR #40 fixes these. See [repair details and reproduction](frontend-audit-fixes.md).

At application commit `c1fd445`: 724 tests across 53 files, lint, live and mock builds passed. Chromium and Firefox passed all 44 local browser checks each. WebKit passed 43 initially; its skip-link failure was fixed and that check passed again in all three engines. All 57 axe scans passed. Independent code review had no outstanding findings, and both GitHub CI runs plus the Vercel preview passed. These repair checks used local API fixtures and made no hosted writes.

Automated accessibility checks do not establish complete accessibility conformance. Merge and deployed acceptance of PR #40 remain separate from its local and preview verification.

## Remaining human and release checks

1. Frontend owner reviews PR #40; merge through the normal reviewed-PR process, then verify the affected interactions on the deployed build.
2. Record the physical two-device HTTPS workflow, intended watch model and both workflow alerts. Apple Watch C8 requires its own locked-iPhone check.
3. Review audible phone playback and native Spanish pronunciation; verify human microphone/confirmation behavior if demonstrating voice.
4. A Mac operator builds/signs/installs the merged PR #30 wrapper and records TestFlight acceptance. Source and six Swift policy tests do not prove an installed iOS build. Stephen is not on this project.
5. Finish owner claim sign-off, rehearsal, recording and submission. This audit does not close the overall Phase 6 or claims-freeze gate.

NPPES lookup (6.6) and coordinator-specific analytics (6.7) are explicitly cut in PLAN.md. The existing Tiger fill summary is implemented and distinct from the cut coordinator rollup. No database migration or environment change is required by PR #40.

Detailed raw audit artifacts and device screenshots remain in the local ignored audit output. Credentials, personal memory and vault paths are excluded from this repository evidence record.
