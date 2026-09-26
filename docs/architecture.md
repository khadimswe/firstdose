# Architecture

How the pieces connect. Owner: Vihn (backend). Deem's screens only talk to `useEvents()` and the `/api/*` routes below. Shapes are defined in `mock/`; this file says how data moves.

## Flow

```
/doctor ──prescribe──▶ POST /api/rx ──▶ Supabase rx_cases + fill_events
   │                        │
   │                        ├─▶ RxNorm lookup ─▶ DailyMed SPL ─▶ label card (byte-exact check)
   │                        └─▶ copay_card_sent event (Wallet stand-in)
   │
/sim (operator) ──▶ POST /api/sim/fire { event_id }
                        │
                        ▼
              fill_events insert ──dual-write──▶ Tiger Data fill_events (hypertable)
                        │                              └─▶ daily_ttff (continuous aggregate)
                        ▼
              Gemini: note text ─▶ reason enum     (only if event has free text, no reason)
                        ▼
              router(reason, insurance) ─▶ fix     (deterministic, mock/reasons.json)
                        ▼
              ntfy POST ─▶ iPhone ntfy app ─▶ Garmin FR55 buzz

iPhone mic ─▶ POST /api/voice ─▶ Grok STT (keyterms) ─▶ intent SEND_TO_COORDINATOR ─▶ handoff event

/coordinator ─tap fix─▶ POST /api/fix ─▶ fix_sent event ─▶ /patient/[id] shows Wallet card
/patient/[id] ─"Use at pharmacy"─▶ POST /api/patient/use ─▶ claim re-run ─▶ dispensed ─▶ started ─▶ ntfy "started"

Every insert into fill_events ──Supabase Realtime──▶ /board, /doctor, /coordinator, /patient, /access
/access ◀── GET /api/access/summary ◀── Tiger daily_ttff
```

## Tables (Supabase Postgres)

Field names match `mock/` exactly, so `useEvents()` switches source with one env var.

| Table | Source shape | Notes |
|---|---|---|
| `patients` | `mock/patients.json → patients[]` | Practice side only. Fictional. |
| `drugs` | `mock/patients.json → drugs[]` | Real RxCUI, setid, WAC, copay program |
| `rx_cases` | `mock/patients.json → cases[]` | `status` from `case_status_enum` |
| `fill_events` | `mock/events.json → event_shape` | Insert-only. Realtime channel `fill_events`. `at` is `timestamptz` here |
| `labels` | `mock/labels.json → label_shape` | Cached SPL sections, `byte_exact` flag |

Tiger Data mirrors `fill_events` (without patient names) as a hypertable on `at`. `daily_ttff` = continuous aggregate of `started.at - prescribed.at` per day, plus reason counts.

## API routes (Next.js, `app/api/**`)

| Route | Method | Body / returns | Writes |
|---|---|---|---|
| `/api/rx` | POST | `{ patient_id, drug_id }` → `{ case_id, label }` | `rx_cases`, `prescribed`, `label_shown`, `copay_card_sent` |
| `/api/sim/fire` | POST | `{ event_id }` → event | replays one event from `mock/events.json` |
| `/api/sim/reset` | POST | — | clears events, resets cases (for rehearsal) |
| `/api/voice` | POST | audio blob → `{ intent, case_id, transcript }` | `handoff` |
| `/api/handoff` | POST | `{ case_id }` (tap fallback, ntfy action) | `handoff`, `fix_chosen` |
| `/api/fix` | POST | `{ case_id, fix }` | `fix_sent` |
| `/api/patient/use` | POST | `{ case_id }` | `copay_card_used`, `claim_run`, `dispensed`, `started`, `recovered` |
| `/api/access/summary` | GET | `{ recovered, median_ttff_seconds, reason_tally }` | reads Tiger `daily_ttff` |
| `/api/label/[drug_id]` | GET | label sections | reads/fills `labels` |

## External services

| Service | Call | Rule |
|---|---|---|
| RxNorm | `rxnav.nlm.nih.gov/REST/drugs.json?name=` and `rxcui/{id}/related.json?tty=IN+BN+SCD+DF` | real lookup |
| DailyMed | `spls.json?rxcui=`, `spls/{setid}.xml` | hardcode manufacturer setids: Otezla `f6b1f516-4972-4d82-bced-113e47b41cc5`, Humira `608d4f0d-b19f-46d3-749a-7159aa5f933d`. LOINC 34066-1, 34067-9, 43685-7, 34068-7 |
| Byte-exact check | every sentence shown ⊂ fetched SPL XML text | fail = red badge, never show edited text |
| Gemini API | `responseSchema` enum = keys of `reasons.json → reasons` | note ≤ 140 chars, no free text out. List models at startup; don't hardcode the name |
| Router | pure function over `reasons.json → router.rows` | no AI. Unit-tested every reason × insurance |
| Grok STT | `POST api.x.ai/v1/stt`, `grok-voice-transcribe-2.0`, keyterms `[Maria, James, Otezla, Humira, coordinator]` | only intent: SEND_TO_COORDINATOR |
| ntfy | `POST {NTFY_SERVER}/{NTFY_TOPIC}` with headers `Title`, `Priority`, `Tags`, `Click`, `Actions` (action → `/api/handoff`) | body ≤ 200 chars from `templates.json → wrist` |
| Garmin FR55 | mirrors iPhone notifications via Garmin Connect | iOS: view/dismiss only. Connect IQ widget polling `/pending` is the stretch |
| ElevenLabs | TTS for "Maria started Otezla" on the `started` event | table speaker |

## Frontend contract

- `useEvents()` returns `{ cases, events, fire(event_id), reset() }`.
- `NEXT_PUBLIC_DATA_SOURCE=mock` → reads `mock/*.json`, `fire` advances locally, zero network.
- `NEXT_PUBLIC_DATA_SOURCE=supabase` → subscribes to Realtime `fill_events`, `fire` calls `/api/sim/fire`.
- Screens never call Supabase, Gemini, Grok or ntfy directly.

## Offline fallback

If WiFi dies: switch to `mock`, `/sim` still drives every screen from `mock/events.json`. Watch buzz won't fire; show the ntfy screenshot.
