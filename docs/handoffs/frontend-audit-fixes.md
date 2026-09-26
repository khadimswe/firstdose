# Frontend audit fixes

**Publication:** [draft PR #40](https://github.com/khadimswe/firstdose/pull/40), application commit `c1fd445`, is mergeable. Both GitHub CI runs and the Vercel preview passed. Owner review, merge and deployed repair acceptance remain. The earlier hosted workflow audit is summarized in [deployed acceptance](deployed-acceptance.md).

September 26, 2026. Based on main `2ebc3ed`, following the deployed frontend audit.

## Changes

- Demo setup, simulator, queue tabs, relay board and printable QR fit narrow phones. The populated board stacks its lanes and keeps its QR in normal flow on smaller screens. Long deployment URLs cannot widen setup cards.
- Simulator status distinguishes loading, updating, blocked prerequisites and completion. Status changes use a polite live region.
- Controlled sheets return focus to their opener, or to main content when the opener disappears or becomes disabled. Consumer autofocus overrides remain supported.
- Every screen has a keyboard skip destination; client route changes focus main content. The skip link explicitly participates in WebKit's tab order.
- Patient search has an accessible name, visible focus and announced result/empty states.
- Shared text colors provide stronger contrast; QR images have names; the Prescribers table supports keyboard scrolling; headings and landmarks are identified.

## Verification

- 724 existing tests across 53 files pass; ESLint passes.
- Both `NEXT_PUBLIC_DATA_SOURCE=supabase` and `mock` production builds pass, including the Otezla fixture verification and TypeScript checks.
- The new browser suite covers 44 checks per engine: 18 empty/populated layout checks at 320/390/1440 px, seven behavior checks and 19 axe scans. Chromium and Firefox passed all checks on the local production build. WebKit passed 43 initially; its skip-link failure was fixed and the affected check passed again in all three engines on the local dev server.
- All 57 axe scans passed across Chromium, WebKit and Firefox, including populated board, doctor and prescriber screens. This is automated coverage, not a claim of complete accessibility conformance.
- Independent read-only review found no outstanding issues. Additional keyboard checks covered normal/removed/disabled dialog openers, doctor and coordinator navigation, and browser Back.

The browser suite intercepts all application API calls with fixed browser fixtures and rejects writes. It verifies frontend rendering and interaction without credentials or hosted changes. It does not re-establish backend, physical-device notification, native TestFlight or human screen-reader acceptance. The earlier hosted audit remains the evidence for live workflows.

## Reproduce

Install Python Playwright and its browsers. Provide a local axe-core 4.10.3 `axe.min.js`; it is not vendored here. Start the app in live data mode with no backend credentials required:

```powershell
$env:NEXT_PUBLIC_DATA_SOURCE = 'supabase'
npm run dev -- --port 3136
```

In another terminal, run each browser separately (use distinct output folders):

```powershell
python scripts/browser-frontend-audit.py --origin http://localhost:3136 --browser chromium --axe C:/path/to/axe.min.js --output notes/frontend-chromium
python scripts/browser-frontend-audit.py --origin http://localhost:3136 --browser webkit --axe C:/path/to/axe.min.js --output notes/frontend-webkit
python scripts/browser-frontend-audit.py --origin http://localhost:3136 --browser firefox --axe C:/path/to/axe.min.js --output notes/frontend-firefox
```

`--match 'Skip link'` runs only matching checks. Outputs include JSON results, axe findings and screenshots under ignored `notes/`. The script rejects non-local origins.

## Release

Affected frontend-owner review and merge are still required. After deployment, confirm these layouts and keyboard interactions on the deployed build. No database migration or environment change is required.
