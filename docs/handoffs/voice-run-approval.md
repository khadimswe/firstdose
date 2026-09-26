# Voice approval and reset handoff

September 26, 2026. Branch `fix/voice-run-approval`, based on main `734ee64`. Deem reviews the doctor/coordinator UI; Vinh owns the command adapter. PLAN.md remains the execution dashboard.

## Change

Previously the voice component checked the active run before its first confirmation, then passed only a case ID into the approval sheet. Resetting while that sheet was open could retarget the old selection to the same case ID in the new run. The recording itself acquired a run only after recording stopped.

The capture now records its run before requesting microphone access. Reset invalidates the capture and late transcription results. The confirmed choice retains both case and run through the approval sheet. Reset closes that sheet; coordinator commands reject a mismatched expected run before writing. The final handoff uses a run-bound polling-adapter method, so an unobserved reset is also rejected atomically by the existing server guard. The shared EventSource contract and mock JSON remain unchanged.

## Verify locally

- Full unit suite, lint and live-mode build.
- `scripts/browser-voice-reset.py`: four rendered checks using a fake microphone and intercepted APIs. It checks reset during capture, proposal review, and open approval, plus normal invite/approve/assign/handoff with the original run header.
- Build with `NEXT_PUBLIC_DATA_SOURCE=supabase`, serve on `http://localhost:3137`, then run `python scripts/browser-voice-reset.py`. Requires Python Playwright and Chromium. These checks make no provider requests, send no watch notifications and never reset hosted data.

The unchanged-run production rehearsal on September 26 is separate evidence: Vinh reported using voice; read-only authenticated production checks confirmed Maria's `handoff` and `fix_chosen`, a linked coordinator and persisted assignment. This establishes the resulting workflow state, not raw microphone/audio quality or deployment of this patch.

## Phone walkthrough after owner review and deployment

1. Coordinate a fresh run with the operator; Maria must be prescribed and have a classified barrier. Keep other operators from resetting mid-take.
2. On the doctor phone, open `/doctor`, sign in, tap **Tap to speak**, and allow microphone access.
3. Say **Send Maria Lopez to my coordinator**, then tap stop.
4. Review both the transcript and matched patient. Cancel if either is wrong.
5. Tap **Send to my coordinator**. If unlinked, review permissions and tap **Approve and send**. If already linked, the handoff can proceed directly.
6. On the laptop's `/coordinator`, Maria should offer **Re-send copay card**. A pending pharmacy fill is expected; handoff is not dispensing.
7. In a separate coordinated test, reset while the approval sheet is open. It must close; neither approval nor handoff from that old choice may write to the new run. Record again for the new run.

Garmin delivery remains a separate gate. The production reason attempt in the recording rehearsal had outbox status `unknown` and Vinh reported no receipt; fixing voice does not fix or verify ntfy. Deem is checking Vercel configuration. Do not claim either pharmacy confirmation or physical watch receipt from a successful voice handoff alone.
