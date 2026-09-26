# Notes for coding agents

Read these before changing anything in FirstDose.

1. **This is Next.js 16**, which differs from most training data: route `params` are Promises, `PageProps` / `LayoutProps` are global helpers, and Turbopack is the default. Read the relevant guide in `node_modules/next/dist/docs/` before writing route code.
2. **`PLAN.md`** holds status, owners, decisions and hard rules. Change status only in separate `status: <task#> <emoji> <description>` commits.
3. **Specs:**
   - `docs/IMPLEMENTATION.md`: task-level steps for both lanes.
   - `docs/architecture.md`: routes, tables, external services.
   - `docs/frontend-plan.md`: the screens and the `useEvents()` data layer.
   - `docs/who-sees-what.md`: what may cross from the practice side to Ascend.
4. **Lanes:**
   - Deem owns `app/(screens)/**`, `components/**`, `app/{page,layout,globals}`, `docs/**` (except `architecture.md`), `README.md` and `.github/workflows/**`.
   - Vihn owns `lib/server/**`, `lib/realtime.ts`, `app/api/**`, `supabase/**`, `scripts/**` and `garmin/**`.
   - `mock/*.json` and `package.json` are shared contracts: tell the other person before committing.
5. **Rules that make the demo trustworthy:**
   - Label text is verbatim from DailyMed.
   - Every sentence about a patient comes from `mock/templates.json`.
   - Every stand-in is labelled with `<StandIn>`.
   - Patients are fictional, with no PHI.
   - No secrets in git.
   - Stage named paths only; never `git add -A`.
