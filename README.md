# FirstDose

**One missed fill. One accountable next step.**

FirstDose turns a stuck first fill into a reviewed access task, then checks for a later pharmacy fill signal. Built for HackGT 13 by **Vinh, Minh and Deem**, as a proposed Impiricus HCP workflow.

## Current state

This planning branch includes main `b11a01e`: six frontend views, scripted cases, state-based button guards, replay/autoplay and Deem's coordination documents. Backend APIs, cross-device Realtime, real provider clients and verified label data are still pending. See [current status](docs/STATUS.md) for evidence and limits.

Fictional patients, pharmacy events, prices and partner services are explicitly simulated. A fill signal does not prove ingestion, clinical recovery or that our intervention caused the fill. Ascend/Wallet connections are stand-ins, not approved live integrations.

## The target demo

1. A fictional prescription encounters a documented barrier.
2. The doctor receives the reason on screen and through the **ntfy -> iPhone -> Garmin** notification path. Physical delivery is still a required test.
3. The doctor hands off; the coordinator reviews evidence and eligibility before sending a resource.
4. The patient acknowledges the resource; that alone must not mark a fill.
5. A separate simulated pharmacy confirmation records a subsequent fill signal on the board.

The current mock patient action advances the whole scripted outcome. Separating those events is a planned contract correction, not completed behavior. Source-backed DailyMed label content and practice/patient/partner data boundaries are also core gates. The custom watch widget and voice shortcut are optional.

## Team and branches

| Owner | Responsibility | Module branches |
|---|---|---|
| Vinh | Authoritative workflow, schema, router, Realtime, simulator, watch; optional voice backend | `backend/maria-core`, `backend/realtime-watch`, `backend/voice-handoff` |
| Minh | Verified labels, then Gemini classifier, then Tiger analytics | `data/verified-labels`, `backend/reason-classifier`, `data/access-metrics` |
| Deem | Screens, hook integration, optional microphone UI, demo and presentation | Existing `screen/*`, `design/*`; follow-up screen/presentation branches |

These backend/data names are planned branches. Current documentation work lives on `plan/vinh-minh-phases`. Work separately and merge small reviewed PRs into `main`; see the [branch workflow](docs/branch-workflow.md), including shared-contract ownership and stacked-branch integration. No direct development on main.

## Start here

Use [PLAN.md](PLAN.md) for current execution and the presentation pack for demo work. Other planning/audit documents are frozen reference snapshots; do not maintain competing schedules.

- [Objective and product proposal](docs/product-proposal.md)
- [Winning conditions and scope priorities](docs/winning-conditions.md)
- [Current execution, owners and gates](PLAN.md)
- [Tracks, sponsors and unconfirmed requirements](docs/research/tracks-and-requirements.md)
- [Technology owners, implementation gaps and prize evidence](PLAN.md#selected-technology-coverage)
- [Past-winner evidence and lessons](docs/research/winner-lessons.md)
- [Timed demo, slides, poster, Q&A and submission draft](docs/presentation/README.md)
- [Audit](docs/audit/2026-09-25-repository-audit.md) and [claims register](docs/presentation/claims-and-evidence.md)

Primary fit: **Impiricus** and **A Marina's Mission**. Other entries depend on functioning integrations and the current rules. No award outcome is guaranteed.

## Run the checked-out code

```text
npm ci
npm run dev
```

Main and this planning branch now include the screens at `http://localhost:3000`. Routes are `/doctor`, `/coordinator`, `/patient/[id]`, `/board`, `/access` and `/sim`.

The screen stack currently uses mock data and local browser storage. Changing `NEXT_PUBLIC_DATA_SOURCE` alone does not connect Supabase; the adapter and hook wiring are pending. Consult `.env.example` for planned configuration, keep actual credentials untracked, and never put server credentials in public client variables.

## Verification

Configured branch CI passes; mock action logic was exercised separately. Browser rendering, physical watch delivery, source fidelity and two-phone synchronization need their own recorded checks. The six phase playbooks define those gates. Presentation assets are draft copy/scripts; a video and visual deck have not been rendered by this planning pass.
