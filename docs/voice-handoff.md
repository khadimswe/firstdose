# Voice handoff backend

Task 4.1 is implemented on `backend/voice-handoff`, temporarily based on `backend/maria-core` at `cafadf2`. Retarget onto reviewed main after the backend prerequisite lands. `PLAN.md` remains the execution dashboard. This slice adds transcription and a proposed handoff; microphone capture and confirmation UI belong to Deem.

## Provider contract

Verified against the [official xAI speech-to-text documentation](https://docs.x.ai/developers/model-capabilities/audio/speech-to-text) on September 26, 2026: `POST https://api.x.ai/v1/stt`, model `grok-voice-transcribe-2.0`, repeated `keyterm` fields, and `file` as the final multipart field. The response's `text` is the transcript. The server uses native fetch and the server-only `XAI_API_KEY`; there is no new package dependency. Redirects and automatic retries are disabled. A 20-second deadline covers the upload and response body.

Names in keyterms are the two fictional demo patients. Record only the short fictional command, never chart details or real patient information. Audio goes to xAI; this is an external transcription integration, separate from the proposed practice/Ascend data boundary. FirstDose neither writes audio to disk nor logs transcripts in the request path. The trial CLI prints transcripts deliberately for local evidence; provider-side retention is not controlled by this code.

## Contract for Deem

`POST /api/voice` requires the same private demo authentication as the existing commands:

- `Authorization: Bearer <FIRSTDOSE_DEMO_TOKEN>`; at least 32 characters, never `NEXT_PUBLIC_*`, a URL, or a committed/public bundle. The existing browser session integration is still pending.
- `X-FirstDose-Run: <run UUID>` captured when recording starts.
- `multipart/form-data` with exactly one file field named `audio`. Let the browser set the boundary. Optional `keyterms` is the literal string `true` or `false`; default is `true`. No user-supplied prompt, URL, case ID, or confirmation field is accepted.

Supported MIME types are WAV (`audio/wav`, `audio/x-wav`, `audio/wave`), MP3 (`audio/mpeg`, `audio/mp3`), M4A/MP4 (`audio/mp4`, `audio/x-m4a`), AAC, OGG and FLAC (`audio/flac`, `audio/x-flac`). Codec parameters are accepted. WebM is not in the inspected xAI batch-format list and is rejected; do not assume Chrome's default MediaRecorder format works. Use a supported recorder format or add a separately reviewed conversion path. MIME checking is an allowlist, not codec validation; xAI may still reject malformed audio.

Maximum audio size is 4,000,000 bytes; the entire multipart request is bounded at 4,100,000 bytes. Upload reads time out after 10 seconds. Keep recordings short (a single command). The backend does not decode audio to enforce duration. Provider JSON is bounded at 128 KiB and transcript text at 4,000 UTF-16 code units.

A successful response has `Cache-Control: no-store` and echoes `X-FirstDose-Run`:

```json
{"transcript":"send maria to my coordinator","intent":"SEND_TO_COORDINATOR","case_id":"rx_001"}
```

The parser accepts only an entire explicit command naming one known patient, with optional politeness and terminal punctuation. Both the first name and full fixture name work. It leaves unknown names, multiple patients, negation, questions and extra clauses unresolved (`intent: null`, `case_id: null`). The raw transcript is untrusted transcription for review, not verified patient copy; render it as plain text.

1. Capture the selected case and run at recording start. Show the returned transcript alongside the proposed case. A voice response is not evidence that the case is currently actionable.
2. Discard a response if the selection or run changed, and require the proposal's case to equal the case the user is reviewing. Null intent means retry or use the existing tap path.
3. Only a deliberate confirmation calls the existing `POST /api/handoff` with JSON `{"case_id":"rx_001"}`, the same authorization and **the proposal's original run header**. Do not replace that identity with a newly active run. No additional voice-confirm endpoint is needed.
4. The handoff command rechecks current run/state atomically. Handle `409 stale_run` by clearing the proposal and reloading; handle `409 invalid_transition` as an unavailable action. Reset cannot turn an old voice proposal into a handoff in a new run.

`/api/voice` performs no database lookup or mutation and sends no watch notification. A validly shaped stale run can produce a proposal, but the confirmation route rejects it. Workflow notifications remain the responsibility of the existing workflow/outbox integration.

Errors return only `{"error":"code"}` and are not cached: 400 for malformed fields/audio, 401/403 for authentication/origin, 413 for byte limits, 415 for media type, 428 for missing run identity, 408 for upload timeout/cancellation, 503 for missing configuration or provider rate limiting, 502 for provider/response failures, and 504 for provider timeout. Keep the tap path available and show the failure; do not silently report success.

## Live comparison

From this worktree, configure `XAI_API_KEY` in an ignored `.env`. Use a real recording of a fictional demo command and keep recordings/results in the ignored `media/raw/` directory or outside the repository. Do not use generated audio as evidence of microphone capture.

```powershell
# Local format/size validation; no network.
node --env-file-if-exists=.env --import tsx scripts/voice-smoke.ts --audio media/raw/voice-maria.wav

# Two actual xAI calls for the identical clip; never executes a handoff.
node --env-file-if-exists=.env --import tsx scripts/voice-smoke.ts --audio media/raw/voice-maria.wav --send
```

The CLI records audio hash, model, byte count, timestamps, elapsed time and both actual results, without printing keys or local paths. The baseline runs first, then the keyterm version. A trial failure remains visible and produces a nonzero exit; both successful baselines and successful keyterm trials count as valid observations. This is a single comparison, not proof that keyterms improve accuracy. Save the actual output before making any provider-success or accuracy claim.

No live trial was performed in this implementation session: the inspected backend environment had no `XAI_API_KEY`. Browser capture/confirmation, real-provider trials, a confirmed live handoff and workflow-driven physical watch receipt remain integration checks. The optional Connect IQ widget is outside this voice slice; the physical ntfy path remains core.
