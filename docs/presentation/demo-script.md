# FirstDose demo script

Prepared September 26, 2026. Two-minute and four-minute formats are internal rehearsal targets; the official cap remains unconfirmed. This is a script and capture plan, not a recording or evidence that the target build works.

## Roles and setup

Vinh narrates and operates the doctor view/watch. Deem operates the coordinator and patient views and owns recording. Minh operates the disclosed pharmacy simulator and, in the expanded cut, demonstrates model/analytics evidence. Use fictional cases only. Keep a small visible "Fictional case / simulated pharmacy and partner services" disclosure throughout. Never place private keys, development consoles with credentials, or real patient data in frame.

Target setup: reviewed build on laptop board, coordinator tablet and patient phone, all in the same demo run. Use this setup only after cross-device verification. Current mock mode uses same-origin tabs on one browser; do not imply that it synchronizes separate phones. Deem selects the verified label card before starting. Reset once, confirm all devices show the same run, then stop touching setup controls.

## Target short cut: 1:55 plus 5-second buffer

**Blocked until the target gates in [claims and evidence](claims-and-evidence.md) pass.** Read the quoted text verbatim; allow the remaining beat time for actions. The displayed copy must match this script before recording.

| Time | Verbatim narration by Vinh | Visible action / operator |
|---|---|---|
| 0:00-0:15 | "Maria leaves her appointment with a prescription. Then cost stalls her first fill. Who owns the next step? FirstDose puts the reason and the handoff in front of her care team." | Start on fictional Maria, then barrier visible. No logo montage. |
| 0:15-0:30 | "Maria is fictional; pharmacy and partner services are simulated. Watch what happens when the barrier arrives: the doctor gets the reason on their wrist." | Minh fires barrier; board changes. Vinh shows actual wrist arrival. If physical delivery fails, use fallback narration. |
| 0:30-0:48 | "One tap sends the task to the coordinator. They review the evidence and eligibility before sending this case's prepared resource. An unknown reason stays open for review." | Vinh taps handoff; Deem shows coordinator evidence and recorded eligibility, then sends. |
| 0:48-1:03 | "Maria opens the resource. That acknowledgment does not count as a fill. The case is still waiting for a pharmacy response." | Deem opens patient resource; pause on unchanged pending status. Optional judge tap only if ready. |
| 1:03-1:20 | "Now the separate pharmacy confirmation arrives. The board records the first fill, and the office can see the status after follow-up." | Minh explicitly fires simulated pharmacy confirmation; board updates on another verified device. Persistent simulation disclosure remains visible. |
| 1:20-1:38 | "The label text comes from a verified source. AI can classify a supplied note, while deterministic rules control the action. The coordinator remains responsible for review." | Deem shows source/version. Minh briefly shows actual classifier result only if verified; otherwise use alternate line below. |
| 1:38-1:55 | "We propose this as an Impiricus workflow: a useful doctor alert, an accountable coordinator task, and a visible follow-up status. One missed fill. One accountable next step." | Return to completed timeline; finish with product name and visible simulation disclosure. |

If Gemini is absent, replace its sentence with: "This demo uses a supplied reason and deterministic routing, with the coordinator responsible for review." Do not show a fixture as a live inference. If watch delivery is absent, replace the wrist sentence with: "The doctor sees the reason here. Physical watch delivery is not available in this run." Do not cover a failure with an unrelated watch clip.

## Expanded cut: 3:50 plus 10-second buffer

Run the short script through 1:38, then use these beats. Only include implemented, verified capabilities. Unused time can become questions; do not fill it with unbuilt claims.

| Time | Verbatim narration / cue | Action |
|---|---|---|
| 1:38-2:03 | "James shows the other outcome. When contact or eligibility is unresolved, FirstDose leaves a task for the coordinator. It does not infer that he qualifies for a bridge sample, and it does not declare success." | Deem shows corrected unresolved case and before-visit source card. Current automatic bridge routing must be corrected first. |
| 2:03-2:28 | "Here is the note and the reason returned by Gemini. We validate that response against a fixed list. With insufficient evidence or a failed request, the case goes to review. The model never writes a drug claim." | Minh shows one actual response and one reproducible unknown/failure result. If absent, explain supplied reasons in ten seconds and skip. |
| 2:28-2:48 | "This event history lets us inspect what happened. The summary counts subsequent fill signals and reports its data freshness. These are simulated cases, not evidence of improved clinical outcomes." | Minh shows actual Tiger-backed query if verified; otherwise explicitly say "mock summary" and skip Tiger attribution. |
| 2:48-3:08 | "The practice needs case details to coordinate care. The partner view receives only the allowed aggregate result. We keep that boundary explicit instead of sending the whole patient event downstream." | Vinh shows verified allowlisted response. If enforcement is absent, say "This is the proposed boundary; it is not enforced by the mock prototype." |
| 3:08-3:30 | "Voice is an optional shortcut. I say, 'Send Maria to my coordinator,' review the transcript and selected case, then confirm. The button remains available." | Use only if actual Grok capture/backend works. Otherwise demonstrate a duplicate action being safely rejected or deduplicated and describe exactly that result. |
| 3:30-3:50 | "Our next test is whether this reduces coordinator effort and helps an office follow up on stalled prescriptions. We propose it for Impiricus, with pharmacy and partner services simulated here. One missed fill. One accountable next step." | Finish on timeline and next pilot question. No unsupported ROI or effectiveness claim. |

## Safe walkthrough of the currently verified mock build

Use this version until target gates pass. At `7113203`, placeholders and automatic ev_10-13 advancement make the target short script inaccurate. Source execution was checked; browser rehearsal is still required.

1. Say: "This is our frontend prototype. It runs scripted fictional cases in one browser; backend and provider integrations are still pending."
2. Show Maria's prescription and advance the simulated barrier. Say: "The intended workflow gives the doctor a reason and a coordinator handoff."
3. Show handoff, coordinator action and patient card. Say: "This button currently advances the scripted sequence, including its simulated pharmacy result. We are separating acknowledgment from independent pharmacy confirmation in the live contract."
4. Show the board. Say: "This is a scripted fill outcome. The current 'started' wording is being corrected because a fill does not prove ingestion."
5. Show the label placeholder only if asked. Say: "The renderer is built; the source-verified label data is not complete." Do not hide the red badge in an edited clip.
6. Close: "The proposed value is the accountable follow-up workflow. Cross-device delivery, verified sources and the backend are the next proof gates."

This is a progress demonstration, not a competitive finished submission. Replacing its narration with the target story cannot substitute for completing the build.

## Capture, trimming and fallback

- Record real reviewed app footage. Use readable close crops and captions; preserve source, mode and simulation labels. Title cards may explain architecture, but label future components as proposed.
- Capture the barrier, actual watch delivery, handoff, acknowledgment still pending, separate confirmation and board result from the same run. Record any narration pickups without changing the represented event order.
- Do not fabricate a voice failure without keyterms. Compare actual trials only; a successful baseline is a valid result.
- Trim the second case, voice and analytics explanations before cutting the core action sequence or disclosures. The short cut intentionally contains no lengthy sponsor roll call.
- If Wi-Fi fails, announce the switch to a recorded verified run or the mock replay. Keep the recording date/mode visible. A recording proves the recorded run, not that devices are currently synchronized.
- Offer one optional judge interaction, with a spare phone ready. If QR or the judge's device delays the demo, Deem performs the action and proceeds immediately.
- Measure the exported runtime, check intelligible audio/captions, then verify the actual event limit before submission.

Our provisional presentation priorities are problem clarity, useful HCP workflow, observable technical work, honest boundaries and reliable delivery. They are not the official HackGT rubric.
