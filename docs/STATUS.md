# FirstDose current status

Updated September 26, 2026 after Deem's push. Planning branch: `plan/vinh-minh-phases`, rebased onto `origin/main` at `80646f7`. Documentation prepared for the user-authorized branch push; no merge into main, deployment or submission performed by this session.

## Repository evidence

- Main now includes the full screen stack plus `3f4a509` (coordination dashboard, implementation plan and task trackers) and `80646f7` (frontend completion statuses and EventSource documentation).
- Earlier `18e4e30` only renamed the submission document; this subsequent main push is the material integration update.
- All six screens are now on main. Our branch preserves Deem's dashboard/task IDs and completed UI work while adding Minh's ownership and the phase/presentation package.
- Mock hook/derivation execution at `7113203` completed Maria's ev_10-13 scripted flow and James's ev_21b before-visit path. It was not a browser/device test. Subsequent commits changed documentation, not that behavior.
- Main `80646f7` [CI passed](https://github.com/khadimswe/firstdose/actions/runs/36217378464). This establishes configured lint/build/gates, not behavior/device verification. Planning-branch checks are separate; no behavior suite is configured.

## Working versus pending

Working in source/mock: doctor, coordinator, patient, board, access and simulator views; same-browser storage synchronization; scripted cases; WebAudio chime implementation.

Pending: authoritative backend/API/schema; live Realtime adapter/hook wiring; verified RxCUIs/SPL labels; real provider calls; physical watch delivery; independent-device synchronization; source/eligibility/outcome/privacy contract corrections; actual demo recording and submission.

The watch remains core through ntfy -> iPhone -> Garmin. The custom Connect IQ widget is optional. A physical buzz smoke test is required before claiming delivery.

## Decisions and next actions

- Vinh approved Vinh/workflow-watch, Minh/labels-AI-analytics, Deem/screens-presentation. See [ownership](phases/team-build-plan.md).
- Separate module branches and reviewed PRs are required. See [branch workflow](branch-workflow.md). Existing mocks remain unchanged pending joint review.
- First gate: reviewed contract plus watch smoke test; then Maria across independent devices with sourced label and separate simulated pharmacy confirmation.
- Primary fit: Impiricus and A Marina's Mission. Other entries depend on actual integrations and confirmed category limits. See [requirements](research/tracks-and-requirements.md).
- All six [phase playbooks](phases/README.md) and the [presentation package](presentation/README.md) are drafted. No rendered deck/video is claimed.
- The login mentioned in conversation concerned the organizer's live site. No login page was found or assigned in Deem's audited work; no login feature/change is requested.

## Deem handoff validation

The requested adapter is the right integration seam. Extend its contract review to run identity, reset propagation, scoped reads, idempotency and invalid action order. Insert-only updates cannot propagate destructive resets safely across devices by themselves.

The ev_21b addition supplies a James coordinator action, but does not justify bridge-sample eligibility. The replacement wrist template avoids an undefined placeholder but introduces an unjustified universal $0 statement. The proposed `fix_line` separator is a sensible formatting correction, pending the existing shared-contract review. Deem owns optional mic capture/confirmation; Vinh owns voice backend.

Use [winning conditions](winning-conditions.md) to protect the useful, inspectable loop before extra integrations. Use [claims and evidence](presentation/claims-and-evidence.md) to distinguish targets from verified behavior.

## Documentation verification

All relative Markdown links resolve; all six phase files exist. The short script contains seven timed beats totaling 115 seconds and 191 narration words, leaving action time and a five-second buffer; actual rehearsal timing remains required. `git diff --check` passed. A separate reader checked strategy/presentation coherence and the required watch wording was clarified. No application, mock or dependency file was changed, so application tests were not rerun for this documentation-only update.
