# Architecture and frontend contract

Updated September 26, 2026. Owners: Vinh (workflow/integration), Minh (labels/classifier/analytics), Deem (screens/hook wiring). [PLAN.md](../PLAN.md) owns status. The live backend and integrations are merged; [deployed acceptance](handoffs/deployed-acceptance.md) records the actual browser proof.

## Frontend data boundary

- `components/data/types.ts` defines the shared event, case and summary types; `components/data/useEvents.ts` exports the current `EventsApi`.
- `useEvents()` supplies script/beats, committed events/IDs, derived cases, catalog, summary/source/error, readiness/busy flags, guarded actions, simulator controls, seed and reset. Coordinator links and patient messages use their run-aware data modules alongside it.
- Mock mode reads fixed fixtures/local state and supports frozen/replay/autoplay rehearsal. Live mode uses cookie-authenticated application routes. Production is configured for live mode; local default remains mock.
- `lib/realtime.ts` polls every 1.5 seconds while subscribed, with run/revision ETags, non-overlapping requests, visibility refresh and immediate post-command refresh. This is server polling, not a Supabase Realtime channel.
- Its additive `subscribe(onInsert, onRunChange?, onError?, onSync?)` clears old-run state before new inserts. Late results and stale commands cannot silently apply to the new run. Screen permissions never replace server validation.

## Authoritative workflow and HTTP

Supabase holds the fixture catalog, immutable run/event history, active-run pointer and claim-once notification outbox. Commands validate against committed history and atomically compare run/revision. Script IDs are unique within a run, not globally. Reset starts a new run and retains historical records.

The [backend contract](backend-core.md) documents authentication, headers, payloads, error codes, atomicity and delivery boundaries. Browsers use the private demo sign-in and a signed seven-day session cookie; no credential belongs in a URL, QR or public bundle. This is shared fictional-demo access, not patient/role identity.

| Route | Purpose |
|---|---|
| `GET /api/events` | Authorized active-run snapshot and revision |
| `POST /api/rx`, `/api/handoff`, `/api/fix`, `/api/patient/use` | Prescribe, reviewed handoff, allowed resource, acknowledgment |
| `POST /api/sim/fire`, `/api/sim/reset`, `/api/sim/seed` | Simulated pharmacy/hub inputs, new run, fixed background week |
| `/api/coordinator` | Run-scoped link request/approval and case assignment |
| `/api/patient/message` | Approved template message and acknowledgment, separate from card/fill |
| `GET /api/label/[drug_id]` | Verified cached label, failing closed on unavailable/unverified data |
| `POST /api/voice` | Transcription/proposed handoff; explicit confirmation still required |
| `GET /api/access/summary` | Authorized run/revision-aware Tiger fill summary |

See [coordinator](handoffs/vinh-coordinator-links.md), [patient messages](handoffs/vinh-patient-messages.md), [RxFill](handoffs/vinh-rxfill.md), [seed](handoffs/vinh-seed-week.md) and [voice](voice-handoff.md) for their concrete schemas and rules.

## Providers and claims

- Verified Otezla label content is bundled for display and checked against saved source/identity/provenance; Humira stays an explicit placeholder.
- Gemini classifies only the existing source note into a reason enum or null. It has no routing authority, does not write patient/drug text and does not restore a scripted reason after provider failure.
- The deterministic router applies eligibility and government-coverage constraints. James uses access support; commercial coverage alone does not prove program eligibility.
- Retained committed events feed a pseudonymous, practice-controlled Tiger projection. Summary reads reconcile replay and checkpoint freshness before returning aggregate fill metrics. Errors stay visible. See [Phase 2 integration](handoffs/vinh-phase2-live.md).
- ntfy provider acceptance is distinct from physical receipt. Patient/card acknowledgment cannot confirm a fill or trigger its confirmation alert; only independent pharmacy evidence does that.
- English/Spanish patient message audio is generated from approved templates. Browser playback proof is distinct from native language/physical-phone review.
- [Who sees what](who-sees-what.md) governs the privacy boundary. No real Ascend/Wallet/pharmacy partner integration is claimed.

## Current frontend follow-up

[Draft PR #40](https://github.com/khadimswe/firstdose/pull/40) repairs responsive sizing, simulator state copy, keyboard focus, search feedback, contrast, QR names and page structure. Its shared `ScreenNavigation` targets `main-content`; sheets return focus to a connected enabled opener or main. See [tests and limitations](handoffs/frontend-audit-fixes.md). These changes await owner review/merge and deployed acceptance; they require no schema or environment change.

NPPES lookup and coordinator-specific analytics are cut tasks 6.6/6.7. The merged iOS wrapper is documented in the [Mac/TestFlight handoff](handoffs/stephen-testflight.md); source readiness is not device acceptance.
