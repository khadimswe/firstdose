"""Local rendered voice/approval regression; fake microphone and intercepted APIs.

Build with NEXT_PUBLIC_DATA_SOURCE=supabase, serve locally on port 3137.
No hosted requests, real audio, provider calls or shared-run resets.
"""
import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "http://localhost:3137"
A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
FIXTURES = json.loads((ROOT / "mock/events.json").read_text(encoding="utf-8"))["events"]
BASE = [dict(e, at="2026-09-26T19:00:00Z") for e in FIXTURES if e["id"] in {"ev_01", "ev_03", "ev_04", "ev_05", "ev_06"}]
MIC = """
Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {value: async () => ({getTracks: () => [{stop() {}}]})});
window.MediaRecorder = class {
  static isTypeSupported(type) { return type === 'audio/mp4'; }
  constructor(stream) { this.stream = stream; this.mimeType = 'audio/mp4'; this.state = 'inactive'; }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; setTimeout(() => { this.ondataavailable?.({data: new Blob(['test'], {type: 'audio/mp4'})}); this.onstop?.(); }, 0); }
};
"""


def check(browser, stage):
    context = browser.new_context()
    context.add_init_script(MIC)
    state = {"run": A, "revision": 1, "events": list(BASE), "linked": False, "assigned": False}
    writes = []
    voices = []
    def intercept(route):
        req = route.request
        path = urlparse(req.url).path
        headers = {"Content-Type": "application/json", "X-FirstDose-Run": state["run"], "X-FirstDose-Revision": str(state["revision"])}
        if path == "/api/events":
            result = {"run_id": state["run"], "revision": state["revision"], "events": state["events"]}
        elif path == "/api/voice":
            voices.append(req.headers.get("x-firstdose-run"))
            result = {"transcript": "Send Maria Lopez to my coordinator", "intent": "SEND_TO_COORDINATOR", "case_id": "rx_001"}
        elif path == "/api/coordinator":
            if req.method == "POST":
                body = req.post_data_json
                writes.append((path, req.headers.get("x-firstdose-run"), body["action"]))
                assert req.headers.get("x-firstdose-run") == state["run"]
                state["revision"] += 1
                if body["action"] == "approve": state["linked"] = True
                if body["action"] == "assign": state["assigned"] = True
            result = {"run_id": state["run"], "revision": state["revision"], "events": [],
                      "links": [{"prescriber_id": "prescriber_demo", "coordinator_id": "coord_demo", "status": "linked"}] if state["linked"] else [],
                      "cases": [{"case_id": "rx_001", "coordinator_id": "coord_demo" if state["assigned"] else None}]}
            # An invite has to return pending to match the coordinator API contract.
            if req.method == "POST" and req.post_data_json["action"] == "invite":
                result["links"] = [{"prescriber_id": "prescriber_demo", "coordinator_id": "coord_demo", "status": "pending"}]
        elif path == "/api/handoff":
            writes.append((path, req.headers.get("x-firstdose-run"), "handoff"))
            assert req.headers.get("x-firstdose-run") == state["run"]
            result = [dict(e, at="2026-09-26T19:01:00Z") for e in FIXTURES if e["id"] in {"ev_07", "ev_08"}]
            state["events"] += result
            state["revision"] += 1
        elif path == "/api/access/summary":
            result = {"recovered": 0, "median_ttff_seconds": None, "reason_tally": {}}
        else:
            route.fulfill(status=404, json={"error": "test_endpoint_unavailable"})
            return
        route.fulfill(status=200, headers=headers, body=json.dumps(result))
    context.route("**/api/**", intercept)
    page = context.new_page()
    try:
        page.goto(ORIGIN + "/doctor")
        page.get_by_role("button", name="Tap to speak", exact=True).click()
        stop = page.get_by_role("button", name="Listening… tap to stop", exact=True)
        expect(stop).to_be_visible()
        if stage == "recording":
            state["run"] = B
            expect(page.get_by_text("This case changed after you spoke. Tap to speak again.", exact=True)).to_be_visible()
            assert voices == [] and writes == []
        else:
            stop.click()
            proposal = page.locator('[role="status"]').filter(has_text="You said:")
            expect(proposal).to_contain_text("Maria Lopez")
            assert voices == [A]
            if stage == "proposal":
                state["run"] = B
                expect(page.get_by_text("This case changed after you spoke. Tap to speak again.", exact=True)).to_be_visible()
                assert writes == []
            else:
                proposal.get_by_role("button", name="Send to my coordinator", exact=True).click()
                dialog = page.get_by_role("dialog", name="Approve your access coordinator?", exact=True)
                expect(dialog).to_be_visible()
                if stage == "approval":
                    state["run"] = B
                    expect(dialog).to_have_count(0)
                    assert writes == []
                else:
                    dialog.get_by_role("button", name="Approve and send", exact=True).click()
                    expect(dialog).to_have_count(0)
                    assert [w[2] for w in writes] == ["invite", "approve", "assign", "handoff"]
                    assert all(w[1] == A for w in writes)
        print("PASS voice " + stage)
    finally:
        context.close()


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        expect.set_options(timeout=15000)
        for stage in ("recording", "proposal", "approval", "normal"):
            check(browser, stage)
    finally:
        browser.close()
