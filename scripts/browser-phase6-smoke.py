"""Opt-in live Phase 6 UI check. Resets its target demo; use a disposable database.

Set FIRSTDOSE_TEST_ORIGIN, FIRSTDOSE_TEST_TOKEN, FIRSTDOSE_TEST_ALLOW_RESET=1.
Rendered/browser evidence only: no physical notification, audio, or hosted proof.
"""
import json
import os
import re
from playwright.sync_api import sync_playwright, expect

origin = os.environ.get("FIRSTDOSE_TEST_ORIGIN", "http://localhost:3126").rstrip("/")
token = os.environ.get("FIRSTDOSE_TEST_TOKEN")
if not token or os.environ.get("FIRSTDOSE_TEST_ALLOW_RESET") != "1":
    raise SystemExit("Set FIRSTDOSE_TEST_TOKEN and FIRSTDOSE_TEST_ALLOW_RESET=1 for the target demo.")


def login(page, path):
    page.goto(origin + "/api/demo-login?next=" + path)
    page.get_by_label("Demo access code").fill(token)
    page.get_by_role("button", name="Open demo", exact=True).click()
    page.wait_for_url(origin + path)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        expect.set_options(timeout=20000)
        desktop = browser.new_context(viewport={"width": 1440, "height": 1000})
        phone = browser.new_context(viewport={"width": 390, "height": 844})
        patient_context = browser.new_context(viewport={"width": 390, "height": 844})
        sim = desktop.new_page()
        login(sim, "/sim")
        sim.get_by_role("button", name="Reset", exact=True).click()
        sim.get_by_role("button", name="Confirm reset", exact=True).click()
        expect(sim.get_by_text("0 committed events", exact=True)).to_be_visible()
        sim.get_by_role("button", name="Seed", exact=True).click()
        expect(sim.get_by_role("button", name="Seeded", exact=True)).to_be_disabled()

        coordinator = desktop.new_page()
        coordinator.goto(origin + "/coordinator")
        for name, count in [("Needs you", 3), ("Waiting", 2), ("Fill confirmed", 8)]:
            expect(coordinator.get_by_role("tab", name=re.compile(rf"^{name}\s+{count}$"))).to_be_visible()
        prescribers = desktop.new_page()
        prescribers.goto(origin + "/coordinator/prescribers")
        rivera = prescribers.get_by_role("row").filter(has_text="Dr. Rivera (demo)")
        demo = prescribers.get_by_role("row").filter(has_text="Dr. Demo (judge 1)")
        expect(rivera).to_contain_text("Linked")
        expect(demo).to_contain_text("Pending approval")
        print("PASS seeded 3/2/8 queue belongs to Rivera; live doctor still pending")

        beat = sim.locator('[data-beat="ev_04"]')
        beat.locator("button").first.click()
        summary = sim.locator("summary").filter(has_text="Raw pharmacy message (simulated)")
        summary.focus()
        summary.press("Enter")
        raw = sim.get_by_label("Simulated pharmacy message JSON")
        expect(raw).to_be_visible()
        preview = json.loads(raw.inner_text())[0]
        assert preview["event_state"] == "script_preview" and preview["wire_payload"] is False
        assert preview["RxFill"] is None and preview["dispensing_status"] is None
        assert "NotDispensed" in preview["synthetic_example"]["RxFill"]["FillStatus"]
        expect(summary.locator("..").locator('[data-standin="pharmacy"]')).to_be_visible()

        doctor = phone.new_page()
        login(doctor, "/doctor/new")
        doctor.get_by_role("button", name="Sign and send", exact=True).click()
        expect(doctor.locator("p").filter(has_text="Sent to pharmacy")).to_be_visible()
        beat.get_by_role("button", name="Fire", exact=True).click()
        expect(beat.get_by_role("button", name="Fired", exact=True)).to_be_disabled()
        expect(raw).to_contain_text('"event_state": "committed"')
        committed = json.loads(raw.inner_text())[0]
        assert isinstance(committed["source_event"]["at"], str)
        assert "T" in committed["source_event"]["at"]
        assert committed["source_event"]["id"] == "ev_04"
        print("PASS keyboard RxFill disclosure preserves claim distinction and committed ISO event")
    finally:
        browser.close()
