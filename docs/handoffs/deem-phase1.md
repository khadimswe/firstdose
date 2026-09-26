# Deem handoff: Phase 1 frontend wiring

September 26, 2026. `PLAN.md` remains the status dashboard.

Deem — I wired the frontend to the backend after the user asked us to finish the integration now. I built on your PR #6 hook/store/banner work and kept your screen designs. The changes are in [PR #9](https://github.com/khadimswe/firstdose/pull/9), branch `backend/maria-core`: implementation `43ca67b`, verification/status `7f7a460`. They are pushed, with CI green, but not merged into main.

## What is already wired

- Doctor prescription → simulated pharmacy barrier → doctor alert → coordinator handoff → resource sent → patient acknowledgment → separate pharmacy confirmation.
- The board reaches **Fill confirmed**, uses the confirmation timestamp/color/chime, and access counts one distinct confirmed case. A patient tap alone does neither.
- All screens share the live source through `useEvents()`. Polling runs every 1.5 seconds, with run/revision ETags and immediate refresh after commands.
- Remote reset clears events, pending actions and access state. Late responses cannot restore the previous run. Reload recovers persisted state.
- Unauthenticated screens show a login link that returns to the current screen, including `/patient/rx_001`. The server issues an HttpOnly cookie; no token is placed in browser JavaScript or URLs.
- Live simulator controls expose only valid, prerequisite-ready inputs. Autoplay stays in mock mode.
- Access explicitly shows **practice event counts / Tiger unavailable** when Minh's summary is unavailable. This is not a Tiger integration claim.

The previously failing doctor-alert, board-final-stop and access-count checks are fixed. You do not need to reimplement this wiring.

## Review and integration

1. Review PR #9 against your current UI work. PR #6 is still open at `63ae988`; its older hook does not contain the new reset/login behavior. Reconcile the overlap rather than overwriting the integrated files. Choose which PR carries the overlapping changes after review; neither PR has been merged by this work.
2. Preserve `subscribe(onInsert, onRunChange, onError, onSync)`. Run changes clear state before inserts; `onSync` also fires after 304 so connection errors can recover without new events. Keep command failures visible and never automatically replay a stale click.
3. Review the shared copy and fixture changes already announced on PR #6: **first fill pending / fill confirmed**, acknowledgment-only wording, and James `ACCESS_SUPPORT` rather than bridge support without eligibility evidence. Event IDs and JSON shapes are unchanged. Offline previews suppress synthetic started/recovered milestones and unsupported provider-success notes. The watch image is labeled as a notification preview, not proof of receipt.
4. Retain the backend foundation's Vitest/tsx dependencies alongside your frontend dependencies. This frontend follow-up adds no packages. Coordinate any merge conflicts in shared package files and regenerate the lockfile with npm rather than hand-editing it.

The detailed contract and implementation locations are in [backend-core](../backend-core.md).

## Your remaining work

- Review the integrated screens/shared contract, then complete the reviewed merge and deployment flow.
- Before building the live deployment, set `NEXT_PUBLIC_DATA_SOURCE=supabase`. `mock` intentionally selects the offline preview. Configure the server's Supabase secret, private demo access token and ntfy settings privately; do not place secrets in `NEXT_PUBLIC_*`. `SUPABASE_DB_URL` is a migration credential and is not needed by the running app. Use HTTPS on real devices for the production session cookie.
- Reconcile the patient QR work with this login return path and the deployed origin. Do not encode the access token in a QR code. Verify the destination on a phone without an existing session.
- Integrate Minh's reviewed Otezla artifact. PR #8 was last checked at `95e6f2f`; placeholder labels are not verification evidence. The current order card is gated by `label_shown`, which the backend intentionally does not synthesize. Agree a real verified-artifact display path rather than restoring a fake simulator success beat.
- Review the truthful `wrist.fill_confirmed` template with Vinh. Vinh still needs to connect the second notification to the independent pharmacy confirmation and verify receipt.

## Evidence and final checkpoint

At `43ca67b`: 252 application tests, 14 PostgreSQL checks, workflow smoke, lint and the live-mode production build pass. Production-mode login passes at phone/tablet sizes. Private-value scans cover the changes, outgoing history and browser bundles; no environment file is tracked.

The actual rendered screens completed Maria against hosted Supabase in two independent browser contexts. Patient acknowledgment stayed pending; the separate pharmacy signal completed the board and access total; reload and remote reset passed. The hosted run was left empty afterward. Browser contexts do not establish a physical two-device test.

The earlier workflow reason alert reached both iPhone and Garmin by the user's confirmation. The second pharmacy-confirmation wrist alert is still outstanding.

For the final run, use two physical devices on the intended live HTTPS origin:

1. Sign in, reset once, and confirm both screens are empty.
2. Prescribe Maria; fire the quote and reason inputs; verify the doctor alert and actual first watch notification.
3. Hand off, send the resource and tap **Use at pharmacy** on the phone. Confirm the fill is still pending and the count is zero.
4. Fire the separate pharmacy confirmation. Confirm the final board stop, access count one and, once implemented, the second watch notification.
5. Verify the reviewed label card, patient QR entry, reload and remote reset across both devices.

Record results in `PLAN.md`. Phase 1 is complete only after the remaining review, verified-label, second-alert and physical-device gates pass. Gemini, Tiger analytics and Grok are not extra Phase 1 blockers.

The repeatable browser check is `scripts/browser-workflow-smoke.py`; it requires Python Playwright, `FIRSTDOSE_TEST_TOKEN` and explicit `FIRSTDOSE_TEST_ALLOW_RESET=1`. It resets the target demo and triggers a reason notification, so use it only against the intended fictional demo project.
