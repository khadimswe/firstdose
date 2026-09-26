# Vinh Tasks

Updated September 26, 2026. [PLAN.md](../../PLAN.md) is the execution dashboard. [Implementation steps](../IMPLEMENTATION.md) and [backend contract](../backend-core.md) are references; the old PR #9 checklist has been superseded by merged and deployed work.

## Implemented and verified

- Supabase schema, deterministic router, guarded commands, polling/reset, Otezla display and notification outbox are merged. Hosted Maria and James browser workflows passed after PR #39.
- Seeded week and separate background prescriber: 3 needing a fix, 2 waiting, 8 confirmed. Interactive approval remains explicit.
- Coordinator request/approval/assignment and patient messages persist across independent sessions. RxFill inspection is merged. The audit exercised English/Spanish message playback and reset.
- Gemini/Tiger are integrated in #39; the hosted summary and reset were verified. Minh owns those modules and final claim review.
- Voice backend and capture/confirmation UI are merged; synthetic-provider and permission-denial checks do not establish a human microphone demonstration.
- TestFlight wrapper source is merged in #30. Mac signing/build/install remain.
- Frontend repairs are implemented in draft [PR #40](https://github.com/khadimswe/firstdose/pull/40). 724 tests, lint, live/mock builds and browser checks pass; CI/preview are green at the application commit. Deem's review/merge and deployed repair acceptance remain.

Full evidence and boundaries: [deployed acceptance](../handoffs/deployed-acceptance.md).

## Remaining work

- [ ] Coordinate affected frontend-owner review of #40, merge through the normal PR process, and verify the deployed fixes.
- [ ] Record the physical two-device HTTPS workflow and both alerts on the intended watch; Apple Watch C8 needs its own locked-iPhone check. Earlier notification confirmations do not establish this whole run.
- [ ] Review human voice capture/confirmation if demonstrated, and complete the native Spanish/audible-phone check with Deem.
- [ ] A Mac operator builds/signs/installs the wrapper and records TestFlight acceptance. Stephen is not on the project.
- [ ] Complete claim sign-off, rehearsal, footage and submission checks with the team. No completed release or Phase 6 closure is claimed.

The audit ended with zero events/links/messages. For the next demo, request and approve the interactive coordinator link again; coordinate any reset of a shared run. No new migration or environment change is required by #40. NPPES (6.6) and coordinator analytics (6.7) are cut.

## Hard rules

1. Stage named paths only. Status commits (`status: <task#> <emoji> …`) are separate from code.
2. Gemini outputs a reason enum only; the router picks the fix. No AI-written drug or patient text.
3. Nothing that identifies a patient or counts prescriptions leaves the practice side.
4. Never a token in a URL, a QR code or a `NEXT_PUBLIC_*` variable.
5. A skipped test is a false green.
