# Architecture and frontend contract

Owners: Vinh (workflow/integration), Minh (labels/classifier/analytics), Deem (screens/hook wiring). Use PLAN.md for current work and priorities. This document records the frontend seam and the intended API; no backend routes are implemented yet at main `b11a01e`.

## Source of truth

- `components/data/types.ts`: `EventSource`, `ScreenAction`, `FillEvent`, `RxCase`, `FixKey`, `AccessSummary`.
- `components/data/useEvents.ts`: actual screen-facing `EventsApi`.
- `mock/*.json`: existing shared fixtures. Behavioral corrections require coordinated review; prose does not change them.
- Deem reports `feat/live-source` ready locally against a stand-in source. It has not been fetched or independently verified here. Main remains mock-only until that wiring and Vinh's adapter land.

## Frontend seam

Vinh builds `lib/realtime.ts` against this existing interface, imported from `components/data/types.ts`:

```ts
interface EventSource {
  load(): Promise<FillEvent[]>;
  subscribe(onInsert: (event: FillEvent) => void): () => void;
  act(action: ScreenAction, rx: RxCase, fix: FixKey | null): Promise<void>;
  fire(ids: string[]): Promise<void>;
  reset(): Promise<void>;
  accessSummary(): Promise<AccessSummary>;
}
```

Agree the module export with Deem's prepared importer before landing it; the implementation reference currently specifies a default export. Do not duplicate types or build another screen store. `subscribe` returns cleanup. `load` plus subscription must handle reconnect and duplicate delivery without losing events.

The current hook returns:

```text
{ mode, override, script, beats, fired, firedIds, cases, catalog, access,
  fire(ids), act(action, caseId), canAct(action, caseId), reset() }
```

The hook resolves a screen's case ID into the `RxCase` passed to the source. Buttons are now enabled by derived case state, not just by whether a script ID fired. These frontend checks do not replace server transition validation.

`override` represents a frozen/replay tab. Main implements `?upto=`, `?replay=1` and `/sim` Autoplay. Replays are mock behavior, not evidence of live backend synchronization. `NEXT_PUBLIC_DATA_SOURCE=supabase` alone is insufficient before adapter/hook integration.

## HTTP mapping

Keep the four existing command routes; they can share one server command implementation. A new public `/api/act` route is not needed to satisfy the existing frontend contract.

| Source method / action | HTTP request | Intended response / effect |
|---|---|---|
| `act("prescribe", rx, fix)` | POST `/api/rx` with `{ patient_id, drug_id }` | Create/find fictional case and append agreed prescription beats |
| `act("handoff", rx, fix)` | POST `/api/handoff` with `{ case_id }` | Validate case state; determine allowed fix server-side; append handoff |
| `act("fix", rx, fix)` | POST `/api/fix` with `{ case_id, fix }` | Validate requested fix against authoritative case/rules; append resource-sent beat |
| `act("use_card", rx, fix)` | POST `/api/patient/use` with `{ case_id }` | Target: acknowledgment only; current mock auto-advances the outcome and needs correction |
| `fire(ids)` | POST `/api/sim/fire` with `{ ids: string[] }` | Validate the complete list, preserve order, append the selected scripted events and return `FillEvent[]` |
| `reset()` | POST `/api/sim/reset` | Target: new run, with all participating clients moved to it; protocol still needs joint agreement |
| `accessSummary()` | GET `/api/access/summary` | Existing `AccessSummary` shape; actual Tiger result only after verified integration |
| Label retrieval | GET `/api/label/[drug_id]` | Verified cached label payload from Minh |
| Optional voice | POST `/api/voice` with audio | Transcript and proposed case/intent; explicit confirmation invokes the same handoff command |

**Simulator body decision:** use `{ ids: string[] }`, not `{ event_id }`. A single event uses `{ "ids": ["ev_01"] }`. The adapter sends one ordered batch; screens already call `fire(ids)`. The old type comment mentioning one HTTP request per ID is descriptive text, not a different TypeScript signature. Deem should align that comment in his next data-layer change. The adapter should throw/report failed requests so wiring can display errors; it must not silently pretend a command succeeded.

Server commands validate state and append events atomically. Unique event keys prevent duplicate rows; notification delivery must also avoid running twice for the same committed event. Keep provider credentials server-side and restrict client database writes. Full production identity/eligibility systems are out of scope for this fictional demo.

## Event identity and reset

Preserve each fixture ID (`ev_01`, etc.) as the `FillEvent.id` returned to the frontend so `/sim` recognizes fired beats. Buttons no longer require those exact IDs, but the simulator still benefits from them.

Storage must distinguish runs: use run identity plus script identity for uniqueness, then map the script ID to `FillEvent.id` at the adapter boundary. Never use a globally unique `ev_01` key that prevents a second run. A run filter isolates the replay being displayed; it is not an authorization policy.

The existing `subscribe(onInsert)` interface cannot tell a hook to clear an old run just by inserting no events. Before implementing reset, Vinh and Deem must agree a run-change signal and hook reload/reset behavior, including reconnect. Do not assume that adding a `run_id` column alone broadcasts the new active run.

## Data and providers

Supabase is authoritative for case/event state. Align frontend fields with the existing fixtures; map database timestamps and storage-only fields explicitly rather than claiming identical wire/storage types. Minimal tables and migrations are implementation work, not a completed schema.

Minh owns cached RxNorm/DailyMed identity/source verification, then Gemini classification and Tiger analytics. A supplied reason keeps the core independent of Gemini availability. The deterministic router selects administrative actions, with UNKNOWN/review handling and a government-coverage card block. Prepared eligibility evidence is still required; commercial coverage alone does not establish program eligibility.

The reviewed target separates patient acknowledgment from a later simulated pharmacy confirmation. Existing `started`/`recovered` field names do not establish ingestion, clinical recovery or causal effectiveness. Correct behavior/copy and metrics together through the contract review.

The physical watch path is ntfy -> iPhone -> Garmin, owned by Vinh. Record real receipt; a wrist-mirror component is not proof. Deem owns optional microphone capture/confirmation and ElevenLabs playback. Provider IDs, API options and source identities must be verified during implementation, not copied from untested historical examples.

## Contract items still requiring agreement

1. Acknowledgment versus dispensing beats; unknown/eligibility routing; the universal-$0 template and James sample inference.
2. Run-change signaling, storage uniqueness and timestamp mapping, compatible with Deem's prepared live hook.
3. Label fidelity definition: exact extracted section text versus raw XML substring, with source/version/hash evidence. Do not silently change the meaning of `byte_exact`.

The already merged `ev_21b` supplies a James action; it does not prove that action is appropriate. No mock edits are made by this documentation update.
