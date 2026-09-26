# Notes for Vinh

Updated September 26, 2026. Deem's frontend/backend coordination notes; [PLAN.md](../PLAN.md) remains the execution dashboard.

## Resolved

- Shared live workflow, polling/reset, guarded routes, Otezla verification and current synthetic catalog are deployed.
- The seeded week uses a separate background prescriber and opens 3 needing a fix, 2 waiting, 8 confirmed.
- Profile-only coordinator approval persists before handoff; assignment and messages are shared server state. Contact marks intentionally remain local and disclosed.
- The suggested-fix template uses `{fix_label}` and `{fix_via}` separated by a middle dot, resolving the nested stand-in copy request. Synthetic-data changes are merged.
- The deployed frontend audit passed actual Maria/James workflows, hosted summaries and reset. See [acceptance](handoffs/deployed-acceptance.md).

## Open handoff

- [ ] Deem reviews [PR #40](https://github.com/khadimswe/firstdose/pull/40): responsive layouts, simulator status, focus/search, contrast, QR labels, keyboard scrolling and landmarks. Local tests and CI/preview pass; merge and deployed acceptance remain.
- [ ] Vinh and Deem record the physical two-device workflow and intended-watch alerts, plus audible phone/native Spanish checks.
- [ ] The Mac operator builds/signs/installs the merged iOS wrapper. No TestFlight install has been established.
- [ ] Complete claims sign-off, rehearsal, footage and submission. Tasks 6.6/6.7 remain cut.

No new backend setup, migration or private environment change is needed for the frontend repairs. Coordinate resets of the shared run; the prior audit cleared events, links and messages.
