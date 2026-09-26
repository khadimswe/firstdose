# Phase 5 claims and release audit

**Historical audit:** Findings below describe commits `158b5a9` and `22b78f0`, not the current deployment. The later [deployed acceptance record](handoffs/deployed-acceptance.md) supersedes the old `demo_not_configured`, missing-integration and deployed-check pending observations. The original evidence is preserved; claims freeze still requires the listed human/owner checks as reconciled in the current record.

Vinh, September 26, 2026. Initial audit 13:25–13:31 ET at `158b5a9`; publication review around 13:53 ET updates the audited application commit to **`22b78f0643f0300866afa9b6177a1394cf3eb9b7`**, fetched `origin/main`. Audit branch: `audit/vinh-phase5`. `PLAN.md` remains the execution dashboard; this is evidence for task 5.1, not another schedule.

**Claims freeze is not cleared.** The source audit and history scan are complete, but deployed live configuration, physical-device checks, owner review and presentation corrections remain open. Code presence, local tests, historical user reports and fresh deployed observations are distinguished below. Later merges require a delta audit before recording.

## Initial verification record (`158b5a9`)

| Check | Result and scope |
|---|---|
| Clean application baseline | New isolated worktree from `158b5a9`; no application or shared-contract edits in this audit |
| Dependencies | `npm ci --ignore-scripts`: 700 packages installed; npm reported zero vulnerabilities. This is the lockfile installation result, not a complete security assessment |
| Unit tests | `npm test`: **498 passed in 33 files**, no skipped tests reported |
| Lint | `npm run lint`: exit 0 |
| Live-mode build | PowerShell: `$env:NEXT_PUBLIC_DATA_SOURCE='supabase'; npm run build`: exit 0, including offline Otezla source/identity/receipt/fixture verification and TypeScript |
| Mock-mode CI | [Main CI run 36258930874](https://github.com/khadimswe/firstdose/actions/runs/36258930874) passed at `158b5a9`: lint, mock build, tests, Gitleaks, tracked-file and mock JSON gates |
| Database permissions/concurrency | `node scripts/test-database.mjs`: exit 0; final summary **20 database checks passed** on disposable `postgres:16-alpine`, including browser-role denial, concurrent commands/reset, notification deduplication and coordinator guards. No hosted database changes |
| Full-history secrets | Gitleaks **8.30.1**, `gitleaks git . --log-opts=--all --redact --no-banner --report-format json --report-path <outside-repository-report>`: exit 0, **179 commits scanned**, about 3.17 MB, **no leaks found**. Repository is not shallow; `--all` includes fetched and local refs, not just the latest diff. The scanner's commit count is not a count of all merge commits |
| Scanner integrity | Official release ZIP checksum matched published SHA-256 `d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e`; executable and redacted report remain outside the repo |
| Tracked private paths | No tracked environment file other than `.env.example`, `CLAUDE.md`, `.claude/`, or `notes/` found |

No live xAI request, watch notification, shared-run reset or hosted migration was performed here. The database suite uses a disposable Docker container with no host port or hosted credentials. A clean secret scan does not establish role separation or provider privacy.

## Publication delta (`22b78f0`)

Main added microphone/confirmation UI (#25), the fictional Dr. Rivera seed assignment and template separator correction (#27), and Stephen's TestFlight instructions (#24). The audit branch was rebased onto this main commit. The new voice helpers are covered by five added unit tests; these are not browser microphone or reset-race tests. Fresh `npm test`: **503 passed in 34 files**. [Main CI run 36260033873](https://github.com/khadimswe/firstdose/actions/runs/36260033873) passes at `22b78f0`. Full-history Gitleaks rerun: **190 commits scanned, no leaks**, exit 0. Earlier database evidence remains tied to `158b5a9`; no persistence/migration code changed in this delta.

Fresh local lint and the Supabase-mode production build also passed, including the Otezla prebuild verification and TypeScript. These checks validate the source snapshot; they do not clear the voice finding below or establish deployed device behavior.

**Voice release blocker, source-reviewed independently:** `VoiceHandoff.tsx` fetches the run after recording and discards it from the proposal. Confirmation passes only a case ID through `DoctorHome.tsx` and `ApproveSheet.tsx`; `lib/realtime.ts` attaches the current run when the eventual handoff executes. A proposal from run A can open the approval sheet, survive a remote reset, and be approved against actionable same-ID case B in a new run. The persistent approval sheet is not cleared by unmounting the voice component. Server stale-run checks cannot reject a command carrying the new run's identity. This is a source-derived failure path, not a reproduced browser test. Deem + Vinh must preserve the recording-start run through final confirmation, clear stale proposals/approvals and add reset-race coverage before claiming a verified voice handoff. See the existing contract in [voice handoff](voice-handoff.md).

The seed now distinguishes fictional Dr. Rivera from Dr. Demo. This is catalog separation, not proof of a persisted verified staff link; the coordinator API still uses its fixed fictional identity. The [TestFlight handoff](handoffs/stephen-testflight.md) contains instructions and unchecked acceptance criteria, not an installed wrapper.

## Fresh deployed observations

Read-only unauthenticated HTTPS requests to **`https://firstdose.vercel.app`**, September 26 around 13:28–13:30 ET. All four API observations below were reconfirmed around 13:54 ET, including exact Otezla artifact equality; `/demo` was not rechecked:

| Path | Observed result | What it establishes |
|---|---|---|
| `/demo` | HTTP 200 | Public setup page responds; not a workflow/device proof |
| `/api/events` | HTTP 503, `demo_not_configured`, `Cache-Control: no-store` | Live workflow access is not configured at the inspected origin |
| `/api/coordinator` | HTTP 503, `demo_not_configured`, `Cache-Control: no-store` | Coordinator backend access is not configured at the inspected origin |
| `/api/access/summary` | HTTP 404 | No deployed Tiger summary endpoint at the check |
| `/api/label/drug_otezla` | HTTP 200, `byte_exact: true`, `Cache-Control: no-store`; parsed JSON exactly equals the audited committed label artifact | The deployed endpoint serves the verified Otezla artifact |

The deployed build SHA was **not independently identified**. Matching one label artifact does not bind the entire deployment to the audited commit. README describes production as mock; this HTTP probe does not independently establish the frontend's build-time mode. Deem must record the deployed SHA and visible mode before the live gate. The 503 responses do not prove that every other provider setting is missing.

## Product and integration evidence

| Product / claim | Evidence at audited SHA | Permitted wording and remaining limit |
|---|---|---|
| Supabase | `lib/server/supabase-workflow.ts`, `supabase/migrations/*`, guarded command routes | Supabase Postgres persists the scripted workflow using server REST RPCs and atomic transitions. Browser synchronization is **authenticated polling**, normally every 1.5 seconds (`lib/realtime.ts`), not Supabase Realtime/WebSocket subscriptions |
| Source modes/reset | `components/data/mode.ts`, `components/data/live.ts`, `lib/realtime.ts` | Build-time mock or Supabase mode; run-aware reset, stale-command guards and reconnect logic tested locally. Mock uses browser storage. Local/browser tests do not close the deployed physical-device gate |
| RxNorm / DailyMed | `scripts/labels/*`, `lib/server/labels/*`, `data/labels/drug_otezla/*`, prebuild verifier | Cached **Otezla** narratives are verified against saved SPL sections and RxNorm identity. The deployed endpoint matches. No runtime DailyMed fetch; Humira remains a placeholder. Do not claim every UI sentence is checked against FDA text |
| ntfy / iPhone / Garmin | `lib/server/ntfy.ts`, notification worker/outbox; [Phase 1 handoff](handoffs/deem-phase1.md) | Real transport and duplicate-send guards exist. Prior user-confirmed iPhone/Garmin receipt of both alerts is documented. HTTP acceptance is not wrist receipt, and claimed/unknown deliveries are not automatically retried. No new physical receipt verified in this audit; Apple Watch C8 remains separate |
| Grok / xAI | `lib/server/voice.ts`, `voice-http.ts`, `/api/voice`, doctor `VoiceHandoff.tsx` and `voice.ts`; [trial record](voice-handoff.md) | Backend transcription, microphone capture, format conversion and confirmation UI are implemented. Historical synthetic-audio and local HTTP trials succeeded. Human browser/device success remains unverified, and the reset/approval defect above blocks a verified voice-handoff claim. Both keyterm and baseline trials were correct; no demonstrated accuracy improvement |
| Cursor / SpaceXAI evidence | No reviewed development-use record in this audit | The actual Cursor user must supply truthful development evidence. Grok backend presence alone does not establish the complete selected-entry demonstration |
| Gemini | No classifier implementation at this SHA; PR #23 (`440eaad`) was open at publication review | Main uses scripted reasons; do not call them Gemini inference. Review and rerun evidence if that PR lands |
| Tiger Data | No Tiger implementation or `/api/access/summary` route | Access counts derive from practice events or mock events; live summary failure is explicitly disclosed. No stored Tiger run/query or freshness proof here |
| ElevenLabs | No provider call or audio asset in this SHA; PR #21 (`d690857`) was open when checked | Current board audio is a WebAudio chime. Generated patient-message playback requires merged code/assets and playback evidence |
| Ascend / DocUpdate / Wallet / pharmacy / QPharma / Medvantx | Concept screens, stand-ins and simulated events | A standalone prototype of a **proposed** Ascend workflow with DocUpdate-inspired screens; no real partner integration, production prescription, payment or dispensing connection |
| Coordinator approval / NPI | `lib/server/coordinator-*`, migration 004; `components/data/local.ts`, `npi.ts` | Fixed fictional identities and shared demo login. UI profile/contact state remains local; NPI input is format/check-digit validation, not professional identity verification. Backend API presence is not completed UI wiring or hosted migration proof |
| Seeded week / RxFill | `data/demo-week.json`, seed endpoint/hook wiring; [RxFill handoff](handoffs/vinh-rxfill.md) | Prepared fictional history and a simulated RxFill-shaped projection. Counts/times are scenario data, not measured clinical outcomes or certified NCPDP wire traffic |
| .Tech / Notability / TestFlight | No verification obtained in this audit | Do not imply registration, process use, screenshots or an installed wrapper from plans alone. MLH prize pursuit was deferred; these do not block the core by themselves |

## Corrections for the presentation owner

These refer to the **audited SHA**, so line numbers may move. Deem owns presentation publication. This audit supplies corrections without overwriting concurrent presentation edits.

| Source | Required correction before reuse |
|---|---|
| `docs/submission.md:20–36` | Already labelled superseded/not publishable. Replace completed Gemini/Tiger/ElevenLabs claims, Supabase Realtime wording, unimplemented-Grok wording and “Started / recovered” outcomes using the evidence table above |
| `docs/presentation/claims-and-evidence.md:16–17` | Register is pinned to older main `4c80650`: Grok backend and seed-week code are now merged. Keep provider, UI and physical proof qualified; refreshing the register is not blanket approval of all claims |
| `README.md:69,111` | Seed-week and live-mode code are present; stop saying they still await #17/#9. Preserve separate deployed-live readiness caveats |
| `README.md:16,18`; `docs/presentation/pitch-and-qa.md:7,68` | Qualify “inside Ascend/DocUpdate” as a proposed integration/standalone concept |
| `docs/presentation/pitch-and-qa.md:36,81` | Simulated coordinator approval and NPI format checking are not real staff verification or proven profile-link synchronization |
| `docs/presentation/pitch-and-qa.md:58,83`; `docs/who-sees-what.md` | Aggregate display is not a buyer authorization/export boundary. The shared practice demo loads case data. ntfy carries fictional notification text and optional xAI receives fictional spoken names; do not say “only the practice” sees names without those qualifications |
| `README.md:27`; `docs/presentation/pitch-and-qa.md:58` | “Pays per confirmed first fill” is a proposed business model, not evidence of paying customers |
| `docs/presentation/pitch-and-qa.md:98` | Obtain actual Notability-use evidence or omit the completed-use claim |

Use **“separate simulated pharmacy confirmation”**, **“first fill observed/confirmed”**, and **“patient acknowledgment”**. Neither a patient tap nor a pharmacy signal proves ingestion, recovery, causal impact or real savings. Scripted prices and seeded elapsed times must stay labelled. Existing source material about third-party products/statistics has not been re-researched by this code audit; its owner must preserve the original source/denominator and date.

## Configuration parity

All directly referenced **application** settings are documented in `.env.example`: `NEXT_PUBLIC_DATA_SOURCE`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `FIRSTDOSE_DEMO_TOKEN`, `NTFY_TOPIC`, `NTFY_SERVER`, optional `NTFY_TOKEN`, and optional voice `XAI_API_KEY`. `NODE_ENV` is framework-provided. No private `.env` values were read or copied for this audit.

Test-only settings absent from the example are `FIRSTDOSE_TEST_ORIGIN`, `FIRSTDOSE_TEST_TOKEN`, `FIRSTDOSE_TEST_ALLOW_RESET`, and `FIRSTDOSE_TEST_POSTGRES_IMAGE`. Browser smoke settings are documented in the Phase 1 handoff; the image override defaults in `scripts/test-database.mjs`. They are not missing deployment requirements.

The example also reserves unused/maintenance settings: Supabase publishable key, `SUPABASE_DB_URL`, Gemini/Tiger/ElevenLabs/OpenAI settings and `NEXT_PUBLIC_APP_URL`. Their presence is not integration proof. QR code construction uses the current origin. Deployment credentials stay server-only; the public Supabase URL is not a secret. Do not expose the shared demo token in a QR, URL, screenshot or public browser bundle.

## Remaining freeze gates and owner handoff

1. **Deem + Vinh:** identify the reviewed deployment SHA and intended origin, configure live demo access, verify required hosted migrations/catalog, then demonstrate the workflow on two physical devices. The inspected origin currently fails live access before authentication.
2. **Vinh + device operator:** record both alert receipts from that deployed run. Keep the confirmed Garmin evidence distinct from Apple Watch C8, which requires its own locked-iPhone check.
3. **Team:** run twice after reset and once with an unavailable optional provider. Record mode, acknowledgment remaining pending, separate fill, duplicates, reload/reconnect and remote reset. Do not run the destructive browser workflow smoke against a shared run without coordinating its reset and alerts.
4. **Minh:** sign off on Otezla provenance and any newly merged classifier/analytics evidence. **Deem:** update the claims register and all recording copy; inspect phone/desktop disclosures, real audio playback if added, and visible source/failure mode.
5. **Vinh + Deem:** fix the voice proposal/approval run-binding defect, then demonstrate microphone/confirmation/handoff and reset-race behavior. Describe current voice as implemented but not verified end to end. Get actual Cursor-use evidence before asserting the selected entry is complete.
6. **Affected owner:** review this audit and material release changes. Re-run the affected checks and scan any new history before freezing a later SHA.

Task 5.3 editing can follow the backend/claims freeze and Deem's actual footage; no video was supplied or edited here. Submission, publication and deployment remain with their named owners. Task 5.1 stays in progress until the release evidence and corrections above are reconciled.
