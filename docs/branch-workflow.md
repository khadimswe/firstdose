# Team branch workflow

Confirmed September 26, 2026: work separately, review small PRs, then merge into `main`. Do not develop directly on `main` or change branches underneath another running agent in the same checkout. Use separate clones or worktrees for concurrent local work.

## Ownership and branches

| Owner | Branch sequence | Boundary |
|---|---|---|
| Vinh | `contract/core-loop-v1`, `backend/maria-core`, `backend/realtime-watch`, then optional `backend/voice-handoff` | Workflow authority, schema, router, simulator/API, adapter, physical watch, optional voice backend |
| Minh | `data/verified-labels`, then `backend/reason-classifier`, then `data/access-metrics` | Label sources/verification, constrained classifier, Tiger projection/summary |
| Deem | Existing `screen/*` and `design/*`; subsequent `screen/live-integration`, `presentation/demo-package` | Screens, hook integration, microphone UI, visual/presentation assets |
| Current planning work | `plan/vinh-minh-phases` | Audit, roles, phases, research, README and presentation drafts; later documentation PR |

These names are agreed workflow recommendations; only the current planning branch and already fetched remote branches are confirmed to exist. No backend/data branch or PR was created by this documentation pass.

## Integration order

1. Deem's foundation and screen/design stack are now in `main` at `80646f7`. Start from that integrated base; do not re-merge the already included screen branches.
2. Coordinate the contract correction PR: Vinh leads, Deem approves frontend compatibility, Minh reviews source/metric contracts. Existing rule requires Vinh and Deem to approve `mock/*.json` changes.
3. Once the common contract/foundation base is agreed, each person starts their own module branch from updated `main`. Labels can progress independently after payload agreement; live integration waits for workflow/adapter compatibility.
4. Land small coherent PRs in dependency order. Each PR names the base, behavior, verification and remaining limits. Merge only after affected-owner review and relevant checks.
5. Update the next module branch from `main`, rerun affected checks, then open its PR. Do not mix a second module into a nearly finished PR.

If a dependent branch must start before a prerequisite merges, record that temporary PR base explicitly. Retarget/rebase after the prerequisite lands and inspect the diff for duplicate commits. Never force-push another person's branch.

## Shared files and conflicts

- Vinh coordinates Supabase migrations, package/config changes and backend API contracts. Minh submits requirements rather than editing the same migration simultaneously.
- Deem owns `components/data/*`; Vinh supplies `lib/realtime.ts`. Agree signature changes before either side implements them.
- Label fixtures are shared `mock/` data even though Minh generates them. Use the same contract review.
- Deem owns presentation publication. This branch supplies draft content; reconcile it with Deem's existing `docs/submission.md` before merging. Do not publish two contradictory submission drafts.
- Resolve documentation conflicts using inspected behavior and the claims register, not whichever version promises more features.

## Safe start in a clean personal checkout

First inspect `git status`; preserve unfinished work. Then fetch, update `main` with a fast-forward-only pull and create the assigned module branch. If work is already in progress, use a separate worktree/clone instead of switching underneath it. Never discard changes to make these instructions run.

```text
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c data/verified-labels
```

The example is for Minh after the prerequisite base lands; substitute the correct assigned branch. Keep secrets and personal memory outside commits. No direct push to main; no automatic deployment or submission is implied by opening a PR.
