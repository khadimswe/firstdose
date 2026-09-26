# FirstDose: task-level implementation detail (TDD steps)

> Companion to `../PLAN.md`. Task numbers match the PLAN.md status dashboard. Wiring overview: `architecture.md`.

> **For agentic workers:** implement one task at a time. Write the failing test first, run it, implement, run it again, commit. Steps use checkbox (`- [ ]`) syntax. Read `AGENTS.md` (Next.js 16 docs) before any route code.

**Goal:** When a new prescription stalls, FirstDose turns the pharmacy/hub status into a reason, buzzes the doctor's wrist, hands the one compliant fix to the coordinator in one tap, re-runs the claim, and proves recovery to Market Access in aggregate.

**Architecture:**
- One Next.js 16 app on Vercel serves six screens and all API routes.
  - Vihn owns `lib/server/**`, `lib/realtime.ts`, `app/api/**`, `supabase/**`, `scripts/**`, `garmin/**`.
  - Deem owns `app/(screens)/**`, `components/**`.
- Supabase Postgres holds cases and events; Realtime pushes every `fill_events` insert to every screen.
- Tiger Data mirrors `fill_events` (no names) for the time-to-first-fill aggregate.
- Screens read only `useEvents()`, which switches between `mock/*.json` and Supabase with one env var.

**Tech stack:** Next.js 16 (App Router, TypeScript, Tailwind v4, shadcn/ui), `@supabase/supabase-js`, `pg` (Tiger Data), `@google/genai`, `zod`, `fast-xml-parser`, vitest.

**Owners:** **V** = Vihn (backend, AI/data, watch). **D** = Deem (frontend, product). Every task has exactly one owner.

## Global Constraints

- Hacking ends **Sun 2026-09-27 8:00 AM ET**. Submit to **Devpost AND expo.hexlabs.org** by 6:30 AM.
- Label text on screen is a byte-exact substring of the DailyMed SPL. No AI rewording, ever.
- Gemini outputs a key of `mock/reasons.json → reasons` and nothing else. The router picks the fix.
- The router is a pure function. Medicare, Medicaid, TRICARE and other government coverage never get `RESEND_COPAY_CARD`.
- Every sentence about a patient comes from `mock/templates.json`.
- Nothing that identifies a patient or counts prescriptions reaches the Ascend side or Tiger Data.
- Every stand-in is labelled on screen. Patients are fictional; no PHI.
- Secrets only in `.env` (gitignored) and Vercel/GitHub secrets. Keys move by AirDrop.
- Stage named paths only. Never `git add -A`.

## Review Focus

1. **Double taps:** tapping "Send to my coordinator", a fix, or "Use at pharmacy" twice must not create two events or two watch buzzes. (Task 1.11.)
2. **Government coverage:** a Medicare patient with `DECLINED_AT_PRICE` routes to `ACCESS_SUPPORT`, never a copay card. (Task 1.8.)
3. **Label drift:** if DailyMed text changes or a fetch fails, the card shows a red PLACEHOLDER badge, never stale or edited text. (Task 1.10.)
4. **Gemini returns junk:** invalid JSON, an unknown reason, or a timeout leaves `reason` null and the event visible as unclassified. It never guesses. (Task 2.5.)
5. **WiFi dies at the table:** switching `NEXT_PUBLIC_DATA_SOURCE=mock` drives every screen from `/sim` with no network. (Tasks 1.1, 1.3.)

---

## File structure

```
firstdose/
  PLAN.md  README.md  AGENTS.md  LICENSE  .env.example  .gitignore  package.json  vitest.config.ts
  .github/workflows/ci.yml
  mock/                         # data contract (both; ⚠️ CONTRACT to change)
  docs/                         # architecture, who-sees-what, IMPLEMENTATION, tasks/
  app/
    (screens)/board|doctor|coordinator|patient/[id]|sim|access   (D)
    api/rx|handoff|fix|patient/use|sim/fire|sim/reset|voice|access/summary|label/[drug_id]   (V)
  components/
    data/types.ts               # EventSource, FillEvent, CaseView, AccessSummary (D defines)
    data/{catalog,store,derive,source-mock,useEvents}.ts   (D)
    copy/{templates,fill}.ts    (D)
    ui/ + StandIn, LabelCard, StatusPill, ReasonChip, SideBadge, WristMirror, WhoSeesWhat   (D)
  lib/
    realtime.ts                 # implements EventSource with Supabase (V)
    server/{env,supabase,router,label,classify,ntfy,tiger,voice,events}.ts   (V)
  supabase/migrations/          (V)
  scripts/{seed,ntfy-smoke}.ts  (V)
  garmin/                       # Connect IQ stretch (V)
  tests/                        # vitest
```

---

### Task 0 (V): Test runner + env contract

**Files:** `vitest.config.ts`, `lib/server/env.ts`, `tests/env.test.ts`, `package.json`

- [ ] **Step 1:** `npm i @supabase/supabase-js pg @google/genai zod fast-xml-parser` and `npm i -D vitest @types/pg`. Add `"test": "vitest run"` to `package.json` (CI picks it up automatically).
- [ ] **Step 2: Failing test.**

```ts
// tests/env.test.ts
import { describe, it, expect } from "vitest";
import { parseEnv } from "@/lib/server/env";
describe("env", () => {
  it("names every missing key", () => {
    expect(() => parseEnv({})).toThrow(/SUPABASE_SERVICE_ROLE_KEY.*GEMINI_API_KEY/s);
  });
});
```

- [ ] **Step 3: Implement** with zod: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TIGER_DATABASE_URL`, `GEMINI_API_KEY`, `XAI_API_KEY`, `NTFY_TOPIC`, `NTFY_SERVER` (default `https://ntfy.sh`), `NEXT_PUBLIC_APP_URL`. `parseEnv` throws listing every missing path; `env()` caches.
- [ ] **Step 4:** `npx vitest run tests/env.test.ts` → PASS. Commit `chore(test): vitest + env contract`.

### Task 0.8 (V): Wrist smoke test (GATE)

**Files:** `scripts/ntfy-smoke.sh`

- [ ] `curl -H "Title: FirstDose" -H "Priority: high" -H "Tags: pill" -d "Maria: Otezla not started. Declined at price." "$NTFY_SERVER/$NTFY_TOPIC"`.
- [ ] Expected: the iPhone ntfy app shows it and the Garmin FR55 buzzes with the text. If not, stop: fix Garmin Connect notification settings before anything else.

### Task 1.1 (D): Frontend foundation ✅ built

Detailed in Deem's approved frontend plan (`docs/frontend-plan.md`). Produces:
- `components/data/types.ts`: `FillEvent` (= `mock/events.json → event_shape`), `CaseView`, `AccessSummary = { recovered: number; median_ttff_seconds: number | null; reason_tally: Record<string, number> }` (no patient fields), and:

```ts
// as built in components/data/types.ts (read that file; it is the source of truth)
export type ScreenAction = "prescribe" | "handoff" | "fix" | "use_card";
export interface EventSource {
  load(): Promise<FillEvent[]>;                                   // fill_events, oldest first
  subscribe(onInsert: (e: FillEvent) => void): () => void;         // Realtime inserts
  act(action: ScreenAction, rx: RxCase, fix: FixKey | null): Promise<void>; // screen buttons → API routes
  fire(ids: string[]): Promise<void>;                              // /sim only
  reset(): Promise<void>;
  accessSummary(): Promise<AccessSummary>;
}
```

`act()` maps: `prescribe` → `POST /api/rx { patient_id, drug_id }`, `handoff` → `POST /api/handoff { case_id }`, `fix` → `POST /api/fix { case_id, fix }`, `use_card` → `POST /api/patient/use { case_id }`. Rows keep the mock event `id` (`ev_01`…) so `/sim` can tick off fired beats.

- `useEvents()` → `{ mode, script, fired, cases, catalog, access, fire, fireNext, reset }`.
- Test: `tests/derive.test.ts`: firing `ev_01..ev_06` gives Maria `status: "stuck"`, `reason: "DECLINED_AT_PRICE"`; firing through `ev_12` gives `status: "started"`; `accessSummary` after `ev_13` returns `recovered: 1` and has no key named `name` or `patient_id`.

### Task 1.7 (V): Supabase schema + seed

**Files:** `supabase/migrations/0001_init.sql`, `scripts/seed.ts`, `tests/seed.int.test.ts`

- [ ] **Step 1: Failing integration test:** after `seed`, `select count(*) from drugs` = 2 and `rx_cases` = 2, and every column name in `fill_events` equals a key of `event_shape`.
- [ ] **Step 2: Implement.**
  - Tables `patients`, `drugs`, `rx_cases`, `fill_events`, `labels`, columns named exactly as in `mock/`. `fill_events.at` is `timestamptz`; `id` text primary key; `case_id` references `rx_cases`.
  - `alter publication supabase_realtime add table fill_events;`
  - RLS on; anon role may `select` only. All writes go through `app/api/**` with the service role.
  - `seed.ts` upserts from `mock/patients.json`. It does not insert events (those are fired).
- [ ] **Step 3:** PASS. Commit `feat(db): schema + seed`.

### Task 1.8 (V): Router

**Files:** `lib/server/router.ts`, `tests/router.test.ts`

**Interface:** `route(reason: ReasonKey, insurance: InsuranceType): FixKey`

- [ ] **Step 1: Failing table test.**

```ts
import { describe, it, expect } from "vitest";
import reasons from "@/mock/reasons.json";
import { route } from "@/lib/server/router";
const R = Object.keys(reasons.reasons) as any[];
describe("router", () => {
  it.each(R)("medicare + %s never gets a copay card", r => expect(route(r, "medicare")).not.toBe("RESEND_COPAY_CARD"));
  it.each(R)("medicaid + %s never gets a copay card", r => expect(route(r, "medicaid")).not.toBe("RESEND_COPAY_CARD"));
  it("commercial + declined at price → copay card", () => expect(route("DECLINED_AT_PRICE", "commercial")).toBe("RESEND_COPAY_CARD"));
  it("commercial + unreachable → bridge sample", () => expect(route("UNABLE_TO_REACH", "commercial")).toBe("BRIDGE_SAMPLE"));
  it("commercial + PA required → access support", () => expect(route("PA_REQUIRED", "commercial")).toBe("ACCESS_SUPPORT"));
  it.each(R)("every commercial reason has a fix (%s)", r => expect(Object.keys(reasons.fixes)).toContain(route(r, "commercial")));
});
```

- [ ] **Step 2: Implement:** first match over `reasons.router.rows`, where `"*"` matches any reason. Throw if nothing matches (a gap in the table is a bug).
- [ ] **Step 3:** PASS. Commit `feat(router): deterministic fix router`.

### Task 1.9 (V): Realtime source + sim routes

**Files:** `lib/realtime.ts`, `app/api/sim/fire/route.ts`, `app/api/sim/reset/route.ts`, `lib/server/events.ts`, `tests/sim.int.test.ts`

**Interfaces:**
- `lib/realtime.ts` default-exports an object implementing `EventSource` (Task 1.1).
- `POST /api/sim/fire { ids: string[] }` inserts those events from `mock/events.json` with `at = now()`, in order. Returns the rows.
- `POST /api/sim/reset` deletes all `fill_events` and resets `rx_cases.status = 'prescribed'`.
- `lib/server/events.ts → insertEvent(e)` is the single write path. It runs side effects: on `alert_sent` or `started`, call `ntfy` (Task 1.12); on every insert, dual-write to Tiger (Task 2.3, no-op until then).

- [ ] **Step 1: Failing integration test:** subscribe via `lib/realtime.ts`, `fire(["ev_01"])`, receive the event within 3 s; `reset()` then `load()` returns zero events.
- [ ] **Step 2: Implement** with `supabase.channel("fill_events").on("postgres_changes", { event: "INSERT", schema: "public", table: "fill_events" }, …)`.
- [ ] **Step 3:** PASS. Commit `feat(realtime): supabase event source + sim routes`. Tell Deem; he flips `NEXT_PUBLIC_DATA_SOURCE=supabase`.

### Task 1.10 (V): Label pipeline + byte-exact check

**Files:** `lib/server/label.ts`, `app/api/label/[drug_id]/route.ts`, `tests/label.test.ts`, `tests/fixtures/*.xml`, `mock/labels.json`

**Interface:** `getLabel(drugId): Promise<Label>` where `Label = mock/labels.json → label_shape`.

- [ ] **Step 1: Failing test.** Using saved SPL XML fixtures for both setids: every returned `sections[].text` is a substring of the fixture's normalized text; Humira has a `34066-1` section whose text begins with the boxed-warning heading; Otezla's `34066-1` is `null`.
- [ ] **Step 2: Implement.**
  - RxCUI: `GET https://rxnav.nlm.nih.gov/REST/drugs.json?name=<brand>`; record the SCD/SBD RxCUI in `mock/patients.json` (replace `TODO_VIHN`, ⚠️ CONTRACT).
  - SPL: `GET https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/<setid>.xml`. Setids are hardcoded (manufacturer, not relabelers).
  - Parse sections by LOINC code (34066-1, 34067-9, 43685-7, 34068-7) with `fast-xml-parser`. Text = the section's text nodes joined with single spaces. **Normalize whitespace only; never change a character.**
  - `byte_exact = sections.every(s => s.text === null || normalizedXml.includes(s.text))`.
  - Cache to the `labels` table and write `mock/labels.json` so mock mode shows real text.
- [ ] **Step 3:** PASS. Commit `feat(label): DailyMed SPL with byte-exact check`.

### Task 1.11 (V): Action routes with guarded transitions

**Files:** `app/api/rx/route.ts`, `app/api/handoff/route.ts`, `app/api/fix/route.ts`, `app/api/patient/use/route.ts`, `lib/server/cases.ts`, `tests/cases.test.ts`

**Interfaces (bodies validated with zod):**
- `POST /api/rx { patient_id, drug_id }` → creates or finds the case and inserts `prescribed`, `label_shown`, `copay_card_sent`.
- `POST /api/handoff { case_id }` → `handoff` + `fix_chosen` (fix from `route()` using the case's insurance).
- `POST /api/fix { case_id, fix }` → `fix_sent`; 409 if `fix` differs from the case's `fix_chosen`.
- `POST /api/patient/use { case_id }` → `copay_card_used`, `claim_run` (Dispensed, `amount_usd: 0`), `started`, `recovered`.

- [ ] **Step 1: Failing tests** with a fake store:
  - `handoff` from `stuck` succeeds once; a second call returns 409 and inserts nothing.
  - `fix` before `handoff` returns 409.
  - `patient/use` on a case whose fix isn't `RESEND_COPAY_CARD` returns 409.
  - A Medicare case's `handoff` inserts `fix_chosen` with `ACCESS_SUPPORT`.
- [ ] **Step 2: Implement:** every transition is `update rx_cases set status = $next where id = $1 and status = $expected returning *`. No row back means 409, with no events and no ntfy.
- [ ] **Step 3:** PASS. Commit `feat(api): guarded case transitions`.

### Task 1.12 (V): ntfy on alert and start

**Files:** `lib/server/ntfy.ts`, `tests/ntfy.test.ts`

**Interface:** `notify({ title, body, priority, click?, actionUrl? }): Promise<void>`

- [ ] **Step 1: Failing test** (fetch mocked): body ≤ 200 chars and taken from `templates.json → wrist`; the `Actions` header is `http, Send to coordinator, <APP_URL>/api/handoff, method=POST, body={"case_id":"rx_001"}`; `started` uses priority `default`, `alert_sent` uses `high`.
- [ ] **Step 2: Implement** and call it from `insertEvent` (Task 1.9).
- [ ] **Step 3:** PASS, then run the live loop once and feel the buzz. Commit `feat(ntfy): wrist alerts`.

**CHECKPOINT Sat 4 AM:** Maria's loop across two devices in `supabase` mode, watch buzzing twice.

### Task 2.3 (V): Tiger Data aggregate

**Files:** `lib/server/tiger.ts`, `scripts/tiger-init.sql`, `app/api/access/summary/route.ts`, `tests/tiger.int.test.ts`

- [ ] **Step 1: Failing test:** after firing Maria's full loop, `GET /api/access/summary` returns `{ recovered: 1, median_ttff_seconds: >0, reason_tally: { DECLINED_AT_PRICE: 1 } }` and the JSON contains no `name`, `patient_id` or `case_id`.
- [ ] **Step 2: Implement.**
  - `tiger-init.sql`: table `fill_events(at timestamptz, case_hash text, type text, reason text, fix text)`; `select create_hypertable('fill_events','at')`; continuous aggregate `daily_ttff` over `started` minus `prescribed` per `case_hash`, by day, plus reason counts.
  - `case_hash` = SHA-256 of `case_id` + a server salt. No names, no drug per doctor.
  - `insertEvent` dual-writes with `pg`. A Tiger failure logs and never blocks the Supabase write.
- [ ] **Step 3:** PASS. Commit `feat(tiger): time-to-first-fill aggregate`.

### Task 2.5 (V): Gemini reason classifier

**Files:** `lib/server/classify.ts`, `tests/classify.test.ts`

**Interface:** `classify(note: string): Promise<ReasonKey | null>`

- [ ] **Step 1: Failing tests** (model mocked): the pharmacy note in `ev_04` → `DECLINED_AT_PRICE`; the hub note in `ev_17` → `UNABLE_TO_REACH`; a note over 140 chars is truncated before sending; a response not in the enum → `null`; a timeout over 4 s → `null`.
- [ ] **Step 2: Implement** with `@google/genai`, `responseMimeType: "application/json"`, `responseSchema: { type: "object", properties: { reason: { type: "string", enum: <reason keys> } }, required: ["reason"] }`. List models at startup and pin one (Q2). Temperature 0. No other output fields.
- [ ] **Step 3:** PASS, plus one live call recorded in the commit message. Commit `feat(ai): gemini reason classifier`.

### Task 4.1 (V): Grok voice handoff

**Files:** `lib/server/voice.ts`, `app/api/voice/route.ts`, `tests/voice.test.ts`

**Interface:** `POST /api/voice` (multipart audio) → `{ transcript, intent: "SEND_TO_COORDINATOR" | null, case_id: string | null }`

- [ ] **Step 1: Failing test** (STT mocked): "send maria to my coordinator" → `{ intent: "SEND_TO_COORDINATOR", case_id: "rx_001" }`; "send james to my coordinator" → `rx_002`; anything else → `intent: null` and no side effect.
- [ ] **Step 2: Implement:** POST audio to xAI STT (`grok-voice-transcribe-2.0`) with keyterms `["Maria", "James", "Otezla", "Humira", "coordinator"]`. Intent = regex on the transcript, not a model. On a match, call the same function as `/api/handoff`.
- [ ] **Step 3:** PASS. Record one live run with keyterms and one without for the video. Commit `feat(voice): grok stt handoff`.

### Task 4.6 (V, stretch): Connect IQ widget

- [ ] Widget (API 3.4) polls `GET /api/pending`, `Attention.vibrate` on a new alert, menu item "Send to coordinator" → `makeWebRequest` POST `/api/handoff`. Sideload `.prg` to `/GARMIN/APPS`. Go/no-go at Sat 2 PM.

### Tasks 1.3–1.6, 2.1, 2.2, 2.4, 2.7, 4.2–4.4 (D): Screens

Detailed in `docs/frontend-plan.md` (the approved frontend plan): file tree, which event changes each screen, build order, verification per screen.

### Task 5.1 (V): Claims audit

- [ ] For each of Supabase, Tiger Data, Gemini, Grok, ElevenLabs, ntfy: `grep -r` shows a real call in `lib/` or `app/`. Record the file and line in `docs/claims-audit.md`. Anything missing is removed from the writeup.
- [ ] `.env.example` has every key `env.ts` reads. `gitleaks detect` on full history is clean.

## Self-review notes

- Type names are consistent across tasks: `FillEvent`, `EventSource`, `AccessSummary`, `route`, `getLabel`, `classify`, `notify`, `insertEvent`.
- Every never-cut item from PLAN.md D5 maps to a task: doctor alert (1.12, 1.4), handoff with one-tap fix (1.11, 1.5), pharmacy re-run (1.11), real label (1.10), who-sees-what (2.4).
