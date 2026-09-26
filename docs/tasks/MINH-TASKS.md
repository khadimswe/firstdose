# Minh tasks

Approved allocation: backend and AI. Work in separate module branches, then reviewed PRs into main. See [workflow](../branch-workflow.md). No task below is marked complete.

## First: verified labels - data/verified-labels

- [ ] Task 1.10: verify Otezla/Humira identity, source/version and exact display text; preserve provenance and test altered-text rejection.
- [ ] Agree payload/fidelity method with Vinh and Deem before editing shared mock files; coordinate label endpoint and schema requirements with Vinh.
- [ ] Supply real labels to Deem; unknown source and absent boxed warning are different states.

## Second: classification - backend/reason-classifier

- [ ] Task 2.5: actual Gemini response validated against the reason enum; bounded note, unknown/timeout/malformed handling.
- [ ] Pin a verified available model; record real-call evidence. Vinh integrates output; deterministic router remains action authority.

## Third: analytics - data/access-metrics

- [ ] Task 2.3: define event/run/time semantics with Vinh; implement Tiger projection with durable retry and deduplication, then summary endpoint.
- [ ] Validate freshness, duplicate delivery, unresolved cases and outage behavior. Supabase is authoritative; partner view receives only permitted aggregates.

## Demo and release

- [ ] Operate the disclosed separate pharmacy simulator confirmation; patient acknowledgment must not create a fill.
- [ ] Verify source/model/metric claims before recording and submission. Report what is pending; no invented provider evidence.

Own label/classifier/analytics modules and their handlers/tests. Vinh coordinates shared Supabase migrations, packages and workflow handlers; Deem owns components/hook wiring. Branch names are planned until created.
