# Patient message delivery, Phase 6.8 / C3

**Current checkpoint, September 26:** This module is merged. Hosted browser acceptance is recorded in [deployed acceptance](deployed-acceptance.md); it supersedes the implementation-time merge/deployment pending notes below. Physical-device acceptance remains separate. [PR #40](https://github.com/khadimswe/firstdose/pull/40) contains the subsequent frontend repairs and is awaiting review/merge. Original implementation evidence and setup instructions are retained below; do not repeat hosted setup merely because an older checklist says pending.

This branch builds on main `47eb5ea` and reuses the two feature commits from Deem's PR #21 (`af8dcb3`, `560d864`), without importing its PLAN statuses. The user authorized implementing the proposed C3 addition locally for review. The English/Spanish templates and committed ElevenLabs recordings are unchanged from that proposal. This is in-app delivery to the existing fictional patient card; no SMS, email, new synthesis or external message provider is called.

## Behavior

The coordinator can preview and explicitly approve one message for `rx_001`, in `en` or `es`, after a committed `fix_sent` with `RESEND_COPAY_CARD` in the active run. The exact proposed `patient_message` template substitutes Otezla's catalog brand; clients supply no text, timestamp, actor or template identifier. The recording plays only after a tap, with the full transcript visible and a playback failure/retry message.

Live mode persists the approval so the patient's separately signed-in browser can load it. The patient can acknowledge the message separately from the existing "Use at pharmacy" action. Acknowledgment is not a card-use event, pharmacy claim, dispensing confirmation, dose or notification. Existing fill transitions and wrist alerts are unchanged.

Approval is immutable within a run: repeating the same language preserves the original timestamp; requesting another language returns `invalid_transition`. Acknowledgment also inserts once and preserves its original timestamp. Mock mode keeps approvals/acknowledgments in the local store with no network; reset clears that view as before. Contact marks remain local and the case sheet says "Only visible on this device" (C2).

## Protected API and database

- `GET /api/patient/message`: active `{ run_id, revision, messages }` snapshot, `Cache-Control: no-store`, run/revision headers. Each message contains `case_id`, `lang`, `template_id: "patient_message_v1"`, `approved_at`, and nullable `acknowledged_at`.
- `POST /api/patient/message`, JSON, observed `X-FirstDose-Run`: `{ action: "approve", case_id: "rx_001", lang: "en" | "es" }` or `{ action: "acknowledge", case_id: "rx_001" }`. Returns the same full snapshot.
- Both methods require the existing demo session or private bearer; session writes require same-origin Origin. The bounded JSON reader rejects extra fields. Missing run is 428, malformed inputs 400, stale run/state conflicts 409, and sanitized provider failures 503.
- Migration `202609260005_patient_messages.sql` adds `patient_messages`, `patient_message_acknowledgments`, `fd_patient_message_snapshot()` and `fd_patient_message_command(p_run_id uuid, p_action text, p_case_id text, p_lang text DEFAULT NULL)`.
- Commands lock the shared `active_run` row before checking state or writing; changes increment its revision, so stale workflow plans retry normally. Browser database roles have no table/RPC access and both tables enable RLS. Service role gets only SELECT/INSERT on the new tables.
- Reset requires no special deletion: snapshots select the active run while prior approval/acknowledgment rows remain auditable. No message action writes fill events or the notification outbox.

The demo login is shared between staff/patient surfaces under existing C5; these receipts do not authenticate a real coordinator, patient or professional identity. This is not a production patient-authorization system.

## Client integration

`usePatientMessage` selects local mode or the separate polling message store. In live mode it observes the existing shared fill adapter's explicit `onRunChange` callback, including empty runs. The message snapshot must match that observed run before it can render or enable commands. Reset invalidates in-flight reads/writes and clears the active message immediately; retired-run responses are ignored. A message endpoint ahead of the fill endpoint stays unready until both agree. Commands keep the run observed at click time and never automatically retry onto a new run.

Polling reloads after mount, every 1.5 seconds, on online/visibility events, and after commands. Loading, saving, errors, retries and acknowledgment updates have live status regions. Expired sessions link back to the current patient/coordinator destination after sign-in. The language picker uses native keyboard-operable select controls. Neither `EventSource` nor `FillEvent` changes.

## Verification and remaining evidence

`npm test`, `npm run lint`, `npm run build`, and `node scripts/test-patient-messages.mjs` are the checks for this branch. The disposable PostgreSQL script creates its own network-isolated container, applies migrations/seed, verifies approval eligibility, immutable/concurrent retries, acknowledgment without fill/outbox effects, strict inputs, reset retention and denied browser access, then removes the container. Unit tests cover cookie/bearer/origin/body guards, safe RPC transport, invalid provider responses and delayed/reset cross-endpoint races.

Local checkpoint, September 26: 550 unit tests (47 message-specific), six disposable PostgreSQL checks, lint and production build pass. The initial standalone typecheck required Next's generated `PageProps`/`LayoutProps`; the normal build generated them and completed TypeScript verification. Exact PR #21 template/audio comparison is unchanged. Reviewer findings about cross-endpoint run identity and expired-session return paths were addressed before the final checks.

Affected-owner review, audible asset verification, native Spanish review, hosted migration/apply and a physical cross-device delivery/acknowledgment demonstration remain pending. The existing Spanish text is proposed copy; this work does not claim it has been reviewed by a native speaker. No hosted database, private environment, deployment, push or PR was modified by this implementation.
