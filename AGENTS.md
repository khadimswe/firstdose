# Notes for coding agents

Read these before changing anything in FirstDose.

1. **This is Next.js 16**, which differs from most training data: route `params` are Promises, `PageProps` / `LayoutProps` are global helpers, and Turbopack is the default. Read the relevant guide in `node_modules/next/dist/docs/` before writing route code.
2. **`PLAN.md`** holds status, owners, decisions and hard rules. Change status only in separate `status: <task#> <emoji> <description>` commits.
3. **Specs:**
   - `docs/IMPLEMENTATION.md`: reference task steps; current priorities and ownership are in PLAN.md.
   - `docs/architecture.md`: routes, tables, external services.
   - `docs/frontend-plan.md`: the screens and the `useEvents()` data layer.
   - `docs/who-sees-what.md`: what may cross from the practice side to Ascend.
4. **Lanes:**
   - Deem owns screens, components/hook wiring, optional mic capture/confirmation, UI styling, frontend CI and presentation publication. Documentation is updated by the relevant module owner; coordinate root README/PLAN edits.
   - Vinh owns workflow/router/schema, simulator and command APIs, `lib/realtime.ts`, ntfy/watch and optional voice backend. Vinh coordinates shared migrations and package changes.
   - Minh owns label source/verification modules and endpoint, classifier, analytics projection/summary and their scripts/tests. These modules are exceptions to Vinh's broad backend directories; agree concrete paths before starting.
   - `mock/*.json` and `package.json` are shared contracts: tell the other person before committing.
5. **Rules that make the demo trustworthy:**
   - Label text is verbatim from DailyMed.
   - Every sentence about a patient comes from `mock/templates.json`.
   - Every stand-in is labelled with `<StandIn>`.
   - Patients are fictional, with no PHI.
   - No secrets in git.
   - Stage named paths only; never `git add -A`.

6. **Working flow:** separate module branches, one affected-owner reviewer, reviewed PRs into main. PLAN.md is the only active execution dashboard; phase/audit documents are frozen references. Keep the physical watch notification path; custom Connect IQ is optional.
