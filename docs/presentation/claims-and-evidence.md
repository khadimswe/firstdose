# Presentation claims and evidence

Updated September 26, 2026. This register governs factual wording in the proposal, slides, scripts, poster, and submission. Historical README prose is not proof of implementation. Each new verification records the commit, mode, date, input and result; no checked box is inferred from a screenshot alone.

## Current verified state

| Claim | Evidence now | Allowed wording |
|---|---|---|
| Deem built all six screen routes | Source at `origin/design/board` `7113203`; includes doctor/coordinator/patient/board/access/sim | Implemented frontend screens, now included in main at `80646f7`; browser usability still needs checking |
| Current screen/design CI is green | All 11 branch-head SHAs matched successful runs; [latest run](https://github.com/khadimswe/firstdose/actions/runs/36215521342) | CI lint/build and configured gates pass; no behavioral test suite is configured |
| Maria and James mock actions work | Actual hook/derivation execution with stubbed React hook plumbing | Maria's patient action fires ev_10–13; James fires ev_21b and reaches before-visit state; not a browser/device test |
| Mock synchronization | Source uses localStorage/storage events | Same-origin browser-tab replay; not independent-device synchronization |
| Live backend and provider integration | No implemented API/schema/Realtime adapter/provider clients at inspected commit | Planned; never describe current screens as connected to real pharmacy or Ascend |
| Label cards | Renderer exists; fixtures still `byte_exact: false`, RxCUIs unresolved | Placeholder UI; source-backed display is a blocking implementation task |
| Audio | WebAudio chime code exists; board does not consume ElevenLabs MP3 | Chime implemented, physical playback untested; ElevenLabs integration planned |

Deem's subsequent push integrated the screen stack into main at `80646f7`, plus a dashboard, implementation plan and task trackers. This planning branch is rebased onto it. App behavior is unchanged from the checked mock implementation. The earlier [screen-stack CI](https://github.com/khadimswe/firstdose/actions/runs/36216874893) passed; record new branch checks separately. Historical audit snapshots remain dated evidence, not current absence-of-screens claims.

## Claims that must change before the target recording

| Current risk | Target behavior/copy | Pre-record check |
|---|---|---|
| Patient button creates a fill/success | Acknowledgment followed by separate pharmacy confirmation | Click patient button, inspect event rows, verify no dispensing or success; then fire authorized pharmacy event |
| “Started” / “Patients recovered” | “First fill observed” / “Demo cases with a subsequent fill signal” | Match UI, voice, board and aggregates to the observed event; no ingestion claim |
| Commercial means eligible | Explicit prepared-case eligibility review | Verify unknown/ineligible/government fixtures cannot issue a manufacturer card |
| Unreachable → bridge sample | Outreach/access review unless separately justified | James has contact evidence; router does not invent sample approval |
| Every completion says $0 | Case-specific disclosed simulated amount, or omit price | Compare notification, source event, card and board; no universal savings promise |
| Patient data in Ascend-styled thread | Practice-side panel clearly identified; restricted partner payload | Inspect outbound DTOs and subscriptions; no names/case IDs/raw notes on partner side |
| One env var implies live | Hook actually wired, mode/failure visible | Inspect data source and two independent devices; mock fallback never masquerades as Supabase |
| “Byte exact” badge on placeholders | Reproducible source-text verification | Source URL/version/bytes saved; altered text fails; actual card uses verified output |

Until these pass, use the **current mock walkthrough** in the demo script, not the target success narration. Contract changes require the team's reviewed PR; a presentation document cannot correct behavior by itself.

## Integration evidence

Physical watch delivery is part of the core demo. Only the custom watch widget is optional; the remaining provider additions follow their phase gates.

| Feature | Owner | Proof before saying it works |
|---|---|---|
| Watch delivery | Vinh | Physical phone/watch received the correct notification from this run; record time/device, not just HTTP success |
| Gemini | Minh | Real API response for a supplied note; validated enum; unknown and malformed/timeout handling; no fixture result presented as inference |
| Tiger | Minh | Query stored run events and compare summary; duplicate delivery does not double count; freshness/failure is disclosed |
| Grok | Vinh backend, Deem capture | Record actual audio, see transcript/selected case, confirm handoff; report with/without-keyterm results honestly |
| ElevenLabs | Deem playback, assigned generation owner | Generated local asset is played by the app; corrected statement only; no “started” line over a fill event |
| Domain | Vinh/Deem | Actual URL resolves to the reviewed app |

## Numbers and language policy

- No headline prevalence statistic is needed for the pitch. If added, verify the exact denominator from the original report; do not reuse an unsourced percentage from a PDF.
- `$410 → $0` is a scripted price scenario, never measured savings or a program guarantee. Do not infer a change in this patient's abandonment probability from an aggregate cost ladder.
- The mock's `80 seconds` is a scenario offset, not measured real-world therapy initiation or product latency. Prefer omitting it in the short pitch.
- A subsequent fill is temporally after follow-up; causation and clinical benefit remain unproven.
- Winner research establishes public awards, not why judges selected them or a probability FirstDose will win.
- Impiricus integration, sponsor approval, customer validation, HIPAA compliance, and deployment readiness cannot be claimed from this prototype.
- Credit frameworks and coding/AI tools actually used. Sponsor-name repetition and SDK-file counts are not established judging requirements. The legacy AGENTS rule requesting those remains a team-contract discrepancy to resolve; do not manufacture code usage or evidence to satisfy it.

## Recording approval record

Current status: **target recording gates not passed**. Script and presentation copy are drafted; footage has not been recorded or certified.

- [ ] Vinh records the reviewed build SHA, deployed origin, selected mode and physical-device result.
- [ ] Minh signs off on label provenance, model behavior and claimed analytics source.
- [ ] Deem verifies every visible screen and disclosure, including phone width and the practice/partner distinction.
- [ ] Team runs the whole sequence twice after reset and once with an unavailable optional provider.
- [ ] Deem checks the actual event time cap and removes optional beats if needed.
- [ ] Claims are frozen before recording. After a material code change, rerun the affected gate.
