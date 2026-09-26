# Deem handoff: Phase 1 closure on the coordinator pivot

September 26, 2026. `PLAN.md` remains the execution dashboard.

## Branch to review

`integration/coordinator-pivot` combines the backend foundation from PR #9, Deem's screen stack through `63e24cf`, pivot docs through `5ea44fb`, and Minh's label branch through `9241b61`, with the closure fixes below. This is an integration candidate; the existing PRs and main have not been merged or rewritten by this work.

## What is ready

- Maria's v2 flow: New Rx -> pharmacy barrier -> doctor alert -> approve-and-send handoff -> coordinator case-sheet fix -> patient acknowledgment -> separate pharmacy confirmation.
- Otezla's full cached DailyMed sections and RxCUI `1492746` are in the shared catalog. New Rx displays the actual artifact before signing; it does not fabricate `label_shown`. Humira remains a red placeholder.
- The label verifier checks the saved artifact, XML identity/version, RxNorm identity, exact section content/order/titles and hashes. `npm run build` runs this check first, including catalog equality. The public drug-label endpoint checks a bundled verification receipt and fails closed on mismatch. The original XML bytes match a fresh official DailyMed download.
- The separate pharmacy event `ev_11` queues the truthful `wrist.fill_confirmed` message through the existing atomic, claim-once outbox. Patient acknowledgment remains silent; retries cannot duplicate the notification.
- Login now returns safely to the exact v2 routes. New Rx keeps Maria selected after signing instead of switching to the next unordered patient.

The shared contract changes are the Otezla label content/RxCUI and the label parser/build tooling; JSON shapes and event IDs are unchanged. Keep Vitest 5 and `vitest.config.mts`; do not restore the duplicate older config from PR #8.

## Evidence

- 339 application tests, lint and the live-mode production build pass.
- 14 disposable PostgreSQL checks pass, including concurrent writes/reset and the second notification's outbox deduplication.
- Direct unauthenticated login succeeds at phone/tablet sizes on the new doctor/coordinator routes.
- The rendered v2 workflow passes in three independent browser contexts against hosted Supabase: exact label text, default patient selection, handoff/fix, acknowledgment still pending, separate pharmacy confirmation, count one after reload, and reset to empty.
- Both hosted notification rows are `accepted`, with one attempt each. The user confirmed the new pharmacy-confirmation alert on BOTH iPhone and Garmin; the earlier reason alert was also physically confirmed.
- The production label endpoint returns the exact verified artifact, and production-mode login passes for the new routes at both viewport sizes. Private-value scans of changes, outgoing history and browser bundles pass.

These browser contexts do not establish the final physical two-device HTTPS gate.

## Deployment and final checkpoint

1. Review the integration candidate, including Minh's corrected label verification and Deem's New Rx behavior. Coordinate which reviewed PRs carry the changes into main; do not overwrite the integrated hook with the closed PR #6.
2. Build/deploy with `NEXT_PUBLIC_DATA_SOURCE=supabase`. Configure the intended project's `NEXT_PUBLIC_SUPABASE_URL`, server-only `SUPABASE_SECRET_KEY`, private `FIRSTDOSE_DEMO_TOKEN`, and `NTFY_TOPIC`/`NTFY_SERVER` (plus `NTFY_TOKEN` only if used). Existing ignored `.env` values stay private. `SUPABASE_DB_URL` is not required by the running app.
3. For Phase 1 (C5 option B), use a pre-signed spare phone with the current demo-code login. On a judge's own phone, a team member enters the private code once. The QR contains only the patient URL. Patient-only access remains a separate Phase 6 follow-up; no per-run short code is implemented.
4. On two physical devices at the deployed HTTPS origin, sign in and reset. Prescribe Maria, trigger the barrier, hand off, send the card, and acknowledge it. Confirm fill/count remain pending/zero. Then fire `ev_11`; confirm fill/count one, both wrist notifications, reload and remote reset. Verify the cached Otezla card on the doctor device.
5. Record the physical result in a separate PLAN status commit. Phase 1 is complete only after reviewed integration/deployment and this checkpoint.

Prescriber profile approvals and contact marks remain local UI state pending Phase 6 C7/C2. This handoff does not claim those new features persist across devices. Gemini, Tiger and Grok are not Phase 1 blockers.

For repeatable checks, use `scripts/browser-login-smoke.py` and `scripts/browser-workflow-smoke.py`. Both use `FIRSTDOSE_TEST_ORIGIN` and a private `FIRSTDOSE_TEST_TOKEN`. The workflow additionally requires `FIRSTDOSE_TEST_ALLOW_RESET=1`; it resets the target demo, sends two alerts, and leaves a fresh empty run on success. Regenerating label sources is an explicit maintenance operation: run fetch, publish and verify successfully before using or committing a new artifact.
