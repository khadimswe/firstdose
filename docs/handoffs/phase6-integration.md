# Phase 6 web integration

**Current checkpoint, September 26:** This module is merged. Hosted browser acceptance is recorded in [deployed acceptance](deployed-acceptance.md); it supersedes the implementation-time merge/deployment pending notes below. Physical-device acceptance remains separate. [PR #40](https://github.com/khadimswe/firstdose/pull/40) contains the subsequent frontend repairs and is awaiting review/merge. Original implementation evidence and setup instructions are retained below; do not repeat hosted setup merely because an older checklist says pending.

September 26, 2026. `PLAN.md` remains the execution dashboard. This change connects the merged coordinator backend and RxFill projection to the web UI, incorporates PR #21's exact patient-message templates/audio, and adds private run-scoped message persistence. Gemini, Tiger analytics and NPPES remain outside this integration; the user asked us to leave Minh's work separate.

## Behavior to review

- Seeded background cases belong to **Dr. Colin Mercer**; the interactive prescriber is **Dr. Nadia Okafor**, matching main's synthetic practice data. Seed opens 3 needing a fix, 2 waiting and 8 pharmacy-confirmed fills; it does not approve the interactive prescriber.
- The desktop requests the interactive prescriber's approval; approval on the phone's Profile persists across browser sessions. Approval can happen before any prescription. A handoff waits for persisted approval and assignment before sending the existing workflow command. Arbitrary real NPI linking is unavailable in this fixed-identity live demo.
- `/sim` shows the full simulated RxFill projection alongside the original event, with distinct script-preview, mock-fired and committed states. Claim payment remains separate from dispensing evidence.
- After Maria's savings-card fix, the coordinator approves an existing English or Spanish message. The patient phone reads that approval and can acknowledge the message. Message acknowledgment is separate from the savings-card action and never confirms a pharmacy fill. Polling, reload and reset follow the active run.
- Contact marks remain local and say **Only visible on this device**. Patient messages and coordinator approval are shared server state in live mode. Offline mock mode keeps local behavior.

The `mock/templates.json` addition and existing MP3s are reused from PR #21, not regenerated. The Spanish text/audio still need native-speaker and audible phone review. The patient device uses the existing private demo login (C5 option B); this is not a new patient identity system or an SMS/email delivery integration.

## Deploy after affected-owner review

1. Review and merge the web integration PR. It incorporates the functionality from PR #21; coordinate that PR's disposition with Deem rather than merging a second divergent version.
2. On the team's Supabase project, apply missing repository migrations in order, including `202609260003_read_run.sql` if absent, `202609260004_coordinator_links.sql`, `202609260005_patient_messages.sql`, and `202609260006_coordinator_identity.sql`. The last migration removes dependence on a display name when assigning the fixed interactive cases. Check the applied migration history before running migrations; existing migrations are not intended to be blindly reapplied.
3. Generate the catalog SQL with `node --import tsx scripts/seed.ts --output <private-local-path>/firstdose-seed.sql`, review it, then apply it through the established private database connection. This updates the seeded prescriber labels and catalog; it does not reset the active run. Do not check credentials or generated SQL containing credentials into Git.
4. In the Vercel project's private environment settings, verify `NEXT_PUBLIC_SUPABASE_URL`, server-only `SUPABASE_SECRET_KEY`, `FIRSTDOSE_DEMO_TOKEN` (at least 32 characters), `NTFY_SERVER`, private `NTFY_TOPIC` and any required `NTFY_TOKEN`. Keep `NEXT_PUBLIC_APP_URL` equal to the deployed HTTPS origin. Set `NEXT_PUBLIC_DATA_SOURCE=supabase` and rebuild/redeploy so the browser bundle uses live mode. No new message-provider key is needed for the committed audio.
5. Sign in independently on desktop, doctor phone and patient phone. In a coordinated fresh demo run, seed the week, request/approve the link, prescribe, fire pharmacy/reason beats, hand off, resend the card, approve the Spanish message, acknowledge it on the patient phone, acknowledge the card, then fire the separate pharmacy confirmation. Verify reload and reset. Reset is intentionally a demo-wide action; do it when the team is ready.
6. Confirm both intended notifications on the actual Apple Watch with the paired iPhone locked. Server acceptance, browser tests and earlier Garmin receipt do not establish this check. Review Spanish pronunciation on the phone.

No authenticated Vercel CLI session was available during implementation. No hosted migrations, hosted reset, private environment updates or physical-device checks are claimed by this change. GitHub's preview deployment is also subject to its configured environment and access controls.

## Reproduce checks

```text
npm test
npm run lint
npm run build
node scripts/test-database.mjs
node scripts/test-patient-messages.mjs
node scripts/test-coordinator-identity.mjs
```

The database scripts use disposable local PostgreSQL containers. `scripts/browser-phase6-smoke.py` exercises independent desktop/phone browser contexts against a running live-mode application. It requires `FIRSTDOSE_TEST_ORIGIN`, private `FIRSTDOSE_TEST_TOKEN` and explicit `FIRSTDOSE_TEST_ALLOW_RESET=1`; it resets its target run. The implementation check used actual Next routes and migration SQL with a local test transport replacing Supabase HTTP. Hosted Supabase transport and physical devices remain separate acceptance checks.

Main's PRs #28/#31 were merged during integration. Their public reference data, synthetic practice identities, Price component and footer disclosures are preserved. The overlapping coordinator hooks are consolidated into the implementation with workflow-run matching and stale-response guards. Migration 006 allows only the two fixed interactive case IDs; changing or copying a display name does not grant access to another case.

The TestFlight shell is a separate module/PR. Its source and Mac build/signing instructions are in [the iOS handoff](stephen-testflight.md); a Mac, Apple Developer team and internal TestFlight installation are still required.
