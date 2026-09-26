# FirstDose repository audit

Reviewed September 25, 2026. Repository: `khadimswe/firstdose`. Main snapshot: `7183b1e`. Frontend branch: `origin/screen/foundation` at `c4adf95`. Remote refs were refreshed with `git fetch origin`. Planning work is on `plan/vinh-minh-phases`.

Scope: tracked app source/configuration, CI, mock contracts, project documents, the frontend foundation branch, the supplied ten-page `FirstDose-Spec.md.pdf`, and the prior FirstDose review/coding handoff. The PDF was extracted with pypdf; its embedded instructions were treated as reference material. This is a source/contract audit with baseline checks, not a production security certification or proof of a deployed app.

## Verdict

There is a useful frontend foundation and a detailed product concept, but the end-to-end application is not implemented. The first engineering task is a coordinated contract correction, followed by one working Maria case. Building every planned service immediately would spread Vinh across too many dependencies and preserve misleading state transitions.

## What exists

| Area | Main | Frontend foundation branch |
|---|---|---|
| Framework | Next.js 16.3.6, React 19.2.8, TypeScript strict mode, Tailwind 4, lockfile | Same foundation plus UI dependencies/components |
| Routes | Starter root page/layout | Route-directory homepage and shared screen layout; linked screen pages are still absent |
| Data | Five mock JSON files, two fictional patients, 22 scripted events | Catalog/types, localStorage-backed mock store, `useEvents()`, scripted actions and derived views |
| Labels | Explicit placeholder text, `byte_exact: false`, unresolved RxCUIs | Label display component with placeholder disclosure; no real retrieval/verifier |
| Backend/providers | Architecture documentation and empty env placeholders | `EventSource` interface and backend handoff notes; no live adapter/API/schema/provider implementations |
| Quality | CI lint/build, full-history gitleaks action, tracked-file check, JSON parse check | No automated behavioral test suite added |

Good decisions to retain: disclosed fictional fixtures; server-secret names are not public-prefixed; `.env` patterns are ignored; committed dependency lockfile; deterministic routing intention; one frontend data seam; explicit label placeholders; and Deem's separate foundation branch.

## Findings

Severity here means implementation/demo impact. Design gaps are labeled as such; no live data leak is asserted where no backend exists.

### A01 — High: patient acknowledgment fabricates a successful fill outcome

Evidence: `docs/architecture.md:58` says `/api/patient/use` writes the claim, dispensing, started, and recovered events. On `screen/foundation`, `components/data/useEvents.ts:45` maps `use_card` to both `copay_card_used` and `started`; its beat expansion includes the adjacent successful claim/recovery events. `mock/events.json:33` through the succeeding events encode this same path.

Impact: a patient click can turn the demonstration green without independent pharmacy evidence. Even a dispensing event does not establish dose ingestion or clinical recovery.

Fix plan: acknowledgment only changes acknowledgment state. A separate simulated pharmacy event confirms dispensing. Update fixtures, types, labels/copy, derivation and analytics in one reviewed contract change. Owner: Vinh + Deem. Gate: Phase 0/1.

### A02 — High: routing lacks uncertainty and program-review inputs

Evidence: `mock/reasons.json` defines six reasons with no unknown/needs-review option. Its router only uses reason and insurance; line 26 maps commercial + unreachable directly to bridge sample. `mock/patients.json:10` and `:20` set a boolean eligibility flag, but the router does not consume it. `mock/events.json:23` equates commercial coverage with eligibility.

Impact: a generic unfilled event cannot be represented honestly, and insurance alone selects an action without establishing the applicable program conditions. James's contact failure does not establish sample suitability. His stream also contains PA rejection and unreachable status without an explicit barrier-priority policy.

Fix plan: unknown reason/eligibility, preserved evidence, coordinator review, government-coverage hard guard, access/outreach fallback, and explicit handling of multiple barriers. [The manufacturer's program page](https://www.otezla.com/plaque-psoriasis/cost-and-copay) states additional eligibility criteria and limits. Owner: Vinh; Deem reviews the UI contract.

### A03 — High design gap: the privacy boundary is a label, not an enforced projection

Evidence: five `side: ascend` records in `mock/events.json` still contain `case_id`, including `ev_13` at line 36 described as aggregate-only. `docs/architecture.md:46` proposes mirroring whole events without patient names, although `note`, `wrist`, and stable IDs can still be identifying. The foundation hook exposes the entire catalog and event script to any consumer.

Impact: filtering only by `side`, omitting the visible name, or hiding columns would not enforce `docs/who-sees-what.md`. Current data is fictional and no remote integration exists, so this is a contract/export risk, not a demonstrated production incident.

Fix plan: practice-side operational storage, role/case-scoped reads and subscriptions, restricted patient sessions, aggregate-only access endpoint, and explicit allowlisted Ascend payloads. Define Tiger as practice-side processing with a minimal projection; never export whole records as partner data. Owner: Vinh, with Minh implementing the projection and Deem wiring scoped views.

### A04 — High integration gap: live mode does not exist yet

Evidence: foundation `components/data/mode.ts:9` sets `DATA_MODE` to `mock` unconditionally. `useEvents.ts:24` logs a browser warning when Supabase is requested but still serves mock data. `store.ts` synchronizes through localStorage/storage events. `docs/for-vihn.md` on that branch explicitly requests `lib/realtime.ts`.

Impact: multiple tabs on one browser can replay the story, but two independent phones cannot share state through this implementation. This is unfinished work, not proof that Supabase is faulty.

Fix plan: Vinh implements the agreed `EventSource`; Deem connects the hook and displays connection/failure state. Owner: Vinh + Deem. Gate: Phase 1 two-device run.

### A05 — High: no real label evidence exists yet

Evidence: `mock/patients.json:35` and `:52` contain `TODO_VIHN` RxCUIs. `mock/labels.json` explicitly labels its content as placeholder with `byte_exact: false`. Yet `ev_02` and `ev_15` announce a successful exact-label check in the script, and README line 29 describes labels as live.

Impact: the source-backed label is a never-cut requirement and has not been satisfied. Hardcoded set IDs alone do not verify drug/form/version or section correctness.

Fix plan: Minh verifies identity/source, stores public source evidence, implements the exact-text check and negative tests, then provides the approved payload to Deem. Do not flip the boolean to satisfy the demo. Raw XML substring versus parsed display-text fidelity must be resolved explicitly with the existing repo rule. Gate: first case label before the core milestone is declared complete.

### A06 — Medium: mock actions do not enforce workflow order

Evidence: foundation `useEvents.ts:98` enables actions based on whether an event of the requested type remains unfired. `act()` selects that remaining event and its beat without checking case status. It can therefore execute handoff/fix/use before their prerequisites when called directly. The mock action also does not accept/validate the fix value that the live `EventSource.act` signature includes.

Impact: screens can show impossible sequences, and mock/live behavior can diverge. UI button disabling alone would not secure future APIs.

Fix plan: define validated commands and allowed transitions; use matching rules in mock/live paths. Server revalidates selected fixes. Test out-of-order and repeated actions. Owner: Vinh for authority; Deem for mock hook parity.

### A07 — Medium: reset, replay identity and concurrent writes need a contract

Evidence: foundation `types.ts:223` subscribes only to inserts; `reset()` is documented as clearing events. `docs/for-vihn.md` requests stable `ev_01` IDs for stored rows. Local mock `store.ts:56` replaces the whole fired-ID array.

Impact: delete-based reset will not notify insert-only subscribers; fixed primary IDs collide across runs unless reset perfectly clears every store; concurrent tabs can overwrite each other's localStorage snapshot. The mock store is adequate for sequential rehearsal, not authoritative concurrent writes.

Fix plan: run/session identity, composite uniqueness and idempotency, explicit run-change/reset notifications, subscribe/load/reconnect reconciliation, and server-side transactional changes. Preserve fixture IDs as script IDs for Deem's operator display. Owner: Vinh + Deem.

### A08 — Medium: metric definitions disagree and freshness is unspecified

Evidence: `docs/architecture.md:46` defines TTFF as started minus prescribed. The foundation's `derive.ts` computes first successful claim minus prescribed, producing the scripted 80 seconds rather than 81. Its summary counts recovered event rows rather than deduplicated cases and ignores standalone `dispensed` events when calculating TTFF. The James fixture embeds a historical prescription date but replays prescription at offset 100.

Impact: backends and views can show different metrics; retries can inflate naïve counts; a storyboard clock can be mistaken for real elapsed time. Direct dual-write also has no specified partial-failure behavior.

Fix plan: one first-dispensing definition, run-aware timestamps, deduplicated projection, authoritative Supabase plus retryable Tiger writes, visible freshness, and a direct summary before continuous aggregation. [Tiger documents configuration-dependent aggregate freshness](https://www.tigerdata.com/docs/use-timescale/latest/continuous-aggregates/real-time-aggregates/). Owner: Minh, with Vinh supplying reliable events.

### A09 — Medium: documentation overstates completed capabilities

Evidence: `README.md:29` calls seven integrations live; line 65 says every screen works. Main contains only the starter, and the foundation branch lacks the linked screen routes. The PDF's team and some responsibilities disagree with the current request; `PLAN.md` and `AGENTS.md` still name a two-person team.

Fix plan: after reviewing this proposal, update capability status, team ownership, and canonical planning references together. Keep “planned,” “mock,” “cached,” and “verified live” distinct. Retain Deem's product ownership. Owner: Vinh/Deem for shared plan; Deem for public narrative.

### A10 — Medium: CI can succeed with no behavioral tests

Evidence: `package.json` has no test script. `.github/workflows/ci.yml:19` uses `npm test --if-present`; lines 36–39 only parse mock JSON. No router, source-fidelity, event-order, role-boundary, or integration tests exist in the inspected trees.

Impact: syntactically valid but contradictory contracts pass the current gates. CI's gitleaks configuration is useful but its presence does not prove a scan passed.

Fix plan: require a meaningful test command as core code lands and add the contract/routing/state/label/access cases in the phase plan. Keep lint/build. Owner: Vinh, Minh contributes label/analytics tests.

### A11 — Medium demo credibility: scenario and commercial claims require review

The PDF uses a $10 re-run while current fixtures use $0; neither is a measured claim response. `mock/patients.json` models Otezla as retail, whereas the [manufacturer's page](https://www.otezla.com/plaque-psoriasis/cost-and-copay) describes specialty-pharmacy delivery with exceptions. Keep Maria's barrier event-driven and explicitly simulated; verify or revise the walk-in retail story rather than treating the fixture channel as a product fact.

The PDF's competitor exclusions, buyer willingness to pay, figures, sponsor constraints, and deadlines are proposals/claims requiring confirmation. Its “same production interface” language is unsupported by any supplied partner API contract. Do not repeat those as verified facts. The repo's sponsor-name repetition/SDK-file-count rule and requested no-keyterm voice “miss” also need review: describe actual usage and actual experimental results, with cohesive code, rather than manufacturing evidence. These remain proposed changes to the existing contract, not silently edited rules.

## PDF reconciliation

| Topic | PDF | Current plan |
|---|---|---|
| Team | Stephen + Deem; Vinh on SpotCheck | Vinh + Deem + Minh per user's current request |
| Ownership | Stephen UI, Deem simulator/labels plus product | Deem keeps current UI/product territory; backend/data split between Vinh and Minh |
| Main loop | Stuck status → doctor → coordinator → pharmacy re-run | Retained, with independent confirmation and eligibility review |
| AI | Gemini can pick visible fixes | Repo's deterministic router retained; Gemini proposes a validated reason only |
| Outcome | Filled becomes started/recovered | First fill observed; no ingestion or clinical-outcome inference |
| Watch | Optional; cut before voice | Current repo prioritizes ntfy mirror; custom widget is stretch; physical result remains required evidence |
| Labels | Exact source words, never cut | Retained, source and verification not yet implemented |
| Data boundary | Names/status stay practice-side | Enforce payload/query/subscription boundaries, not just a slide |

## Verification record

- Remote fetch completed; audited main and foundation commit IDs recorded above.
- Initial worktree was clean. Planning branch created successfully. No branch was merged or pushed.
- All five mock JSON files parse; 22 events have 22 unique IDs; five Ascend-tagged events carry case IDs.
- Dependency installation from the existing lockfile completed: 358 packages, lifecycle scripts disabled for the audit. No dependency versions or lockfile were changed.
- `npm run lint`: passed (exit 0) on the main-based planning branch.
- `npm run build`: passed (exit 0), including TypeScript; output routes are `/` and `/_not-found`. The first sandboxed attempt failed to download the starter's Google Fonts; the approved network-enabled rerun succeeded. Tests of source reviewed on `screen/foundation` are not implied by this baseline build.
- `git diff --check`: passed. All relative links in the four planning documents resolve. Only the four documentation files changed; application source, mocks, dependencies, and lockfile are unchanged.
- Gitleaks is not installed locally; full-history secret scanning was not executed here. CI config inspected only. No real cloud credentials, production data, physical watch, live provider request, two-phone run, or deployment were tested.
- Parallel reviewers were requested, but did not initialize; this report is the primary agent's source review, not a completed independent multi-reviewer sign-off.

## Next action

Review the [three-person phase plan](../phases/team-build-plan.md), then perform [Phase 0](../phases/phase-0-contract-and-readiness.md). Close A01–A05 at their designated gates before describing the core as complete. Preserve the current fixtures until their coordinated contract PR is reviewed.


## September 26 follow-up

The original verification record above describes the earlier audit, not this expanded documentation pass. All six screen routes now exist on Deem's unmerged stack. Latest fetch: `design/board` `18e4e30`, a rename of `ABOUT.md` to `docs/submission.md` from `7113203`; no new application changes. Main remains `7183b1e`. Latest remote CI passed. Mock hook/derivation execution separately verified Maria's ev_10-13 advancement and James's ev_21b path, not a browser/device run.

See [current status](../STATUS.md) for remaining backend/contract gaps, [all phases](../phases/README.md), [branch workflow](../branch-workflow.md) and the [presentation package](../presentation/README.md). Vinh approved the three-person split. Current documentation includes README, PLAN and AGENTS updates; application source, fixtures and dependencies remain unchanged. One independent research agent produced the winner synthesis; the earlier code-audit agents did not complete an independent review.

Subsequent push integration: main advanced to `80646f7`, bringing in the full screen stack and Deem's coordination documents. Planning branch rebased onto it; PLAN conflict resolved by preserving the new dashboard and updating approved roles. Main CI passed. See current status for this newer snapshot.
