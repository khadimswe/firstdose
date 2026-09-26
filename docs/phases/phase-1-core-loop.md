# Phase 1: Maria core loop

Internal target: Saturday 4 AM. Prerequisite: Phase 0 contract review. If missed, rebaseline and stop optional work immediately.

## Work and handoffs

- Vinh: schema and scoped access; validated prescription, handoff, fix and acknowledgment commands; separate pharmacy confirmation; eligibility-aware deterministic router; simulator and run reset.
- Vinh: `lib/realtime.ts` against Deem's `EventSource`, with load/subscribe ordering, deduplication, reconnect and run reset. Preserve fixture script IDs with run identity; supply adapter to Deem.
- Minh: verify Otezla identity/SPL version, cache source and exact display text, implement fidelity verification and label payload. No `byte_exact` without evidence.
- Deem: wire adapter into existing views; show errors/mode; distinguish acknowledgment from fill; preserve source and simulation disclosures.
- Vinh: test ntfy with the actual phone/watch, including correct run/patient notification.

## Gate

Two independent devices complete Maria twice after reset. Patient acknowledgment leaves the case pending until separate simulated pharmacy confirmation. Duplicate/out-of-order actions cannot create success. Reviewed eligibility and real label provenance are visible. Practice/patient data scopes pass adversarial checks.

Record SHA, origin, run, devices and results. Record physical watch receipt separately; CI or HTTP success cannot prove it.

## Cut decision

Use supplied reasons before Gemini and tap before voice. Do not block on Tiger/audio. Live failures remain visible; no silent mock fallback.
