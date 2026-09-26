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
        expect(demo).to_contain_text("Not linked")
        print("PASS seeded 3/2/8 queue belongs to Rivera; live doctor still pending")

        prescribers.get_by_role("button", name="Request Dr. Demo approval", exact=True).click()
        expect(demo).to_contain_text("Pending approval")
        doctor = phone.new_page()
        login(doctor, "/doctor/profile")
        doctor.get_by_role("button", name="Review request", exact=True).click()
        approval = doctor.get_by_role("dialog", name="Approve your access coordinator?", exact=True)
        approval.get_by_role("button", name="Approve", exact=True).click()
        expect(approval).to_have_count(0)
        expect(demo).to_contain_text("Linked")
        doctor.reload()
        prescribers.reload()
        expect(doctor.get_by_text("Linked", exact=True)).to_be_visible()
        expect(demo).to_contain_text("Linked")
        print("PASS Profile approval persists across independent phone/desktop sessions and reload")

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

        doctor.goto(origin + "/doctor/new")
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

        sim.locator('[data-beat="ev_05"]').get_by_role("button", name="Fire", exact=True).click()
        doctor.goto(origin + "/doctor")
        doctor.get_by_role("button", name="Send to my coordinator", exact=True).click()
        # On a fresh navigation the link poll can finish after the fill poll.
        # The UI then asks for confirmation while it loads the saved approval.
        doctor.wait_for_function("""() => {
          const dialog = document.querySelector('[role="dialog"]');
          return !dialog || [...dialog.querySelectorAll('button')].some(button =>
            button.textContent.trim() === 'Send to coordinator' && !button.disabled);
        }""")
        send = doctor.get_by_role("dialog").get_by_role("button", name="Send to coordinator", exact=True)
        if send.is_visible():
            send.click()
        expect(coordinator.get_by_role("tab", name=re.compile(r"^Needs you\s+4$"))).to_be_visible()
        coordinator.get_by_role("button", name="Maria Lopez", exact=True).click()
        sheet = coordinator.get_by_role("dialog", name=re.compile(r"^Maria Lopez"))
        fix = sheet.get_by_role("button", name="Re-send copay card", exact=True)
        expect(fix).to_be_enabled()
        fix.click()
        expect(sheet.get_by_text(re.compile(r"^Sent at "))).to_be_visible()
        expect(sheet.get_by_text("Only visible on this device", exact=True)).to_be_visible()
        sheet.get_by_role("combobox", name="Language", exact=True).select_option("es")
        sheet.get_by_role("button", name="Approve and send", exact=True).click()
        expect(sheet.get_by_text("Sent to the patient", exact=False)).to_be_visible()
        patient = patient_context.new_page()
        login(patient, "/patient/rx_001")
        message = patient.get_by_role("region", name="Practice message", exact=True)
        expect(message.get_by_text("Su tarjeta de ahorro para Otezla está lista. Muéstrela en la farmacia.", exact=True)).to_be_visible()
        message.get_by_role("button", name=re.compile(r"^Play message")).click()
        patient.wait_for_function("document.querySelector('audio')?.readyState >= 2")
        assert message.locator("audio").evaluate("audio => audio.error === null")
        message.get_by_role("button", name="Acknowledge message", exact=True).click()
        expect(sheet.get_by_text("Message acknowledged", exact=True)).to_be_visible()
        patient.reload()
        expect(message.get_by_text("Message acknowledged", exact=True)).to_be_visible()
        expect(patient.get_by_role("button", name="Use at pharmacy", exact=True)).to_be_enabled()
        sheet.get_by_role("button", name="Close", exact=True).click()
        expect(coordinator.get_by_role("tab", name=re.compile(r"^Fill confirmed\s+8$"))).to_be_visible()
        print("PASS approved Spanish message and receipt synchronize across devices; receipt is not card use or fill")

        patient.get_by_role("button", name="Use at pharmacy", exact=True).click()
        expect(patient.get_by_text("Savings card acknowledged. Pharmacy fill confirmation is still pending.", exact=True)).to_be_visible()
        sim.locator('[data-beat="ev_11"]').get_by_role("button", name="Fire", exact=True).click()
        expect(patient.get_by_text("The pharmacy confirmed your fill. This does not confirm a first dose.", exact=True)).to_be_visible()
        expect(coordinator.get_by_role("tab", name=re.compile(r"^Fill confirmed\s+9$"))).to_be_visible()
        print("PASS independent pharmacy confirmation updates the patient and queue")

        sim.get_by_role("button", name="Reset", exact=True).click()
        sim.get_by_role("button", name="Confirm reset", exact=True).click()
        expect(sim.get_by_text("0 committed events", exact=True)).to_be_visible()
        expect(demo).to_contain_text("Not linked")
        expect(message).to_have_count(0)
        patient.reload()
        expect(message).to_have_count(0)
        doctor.goto(origin + "/doctor/profile")
        doctor.get_by_role("button", name="Review coordinator access", exact=True).click()
        approval.get_by_role("button", name="Approve", exact=True).click()
        expect(approval).to_have_count(0)
        expect(demo).to_contain_text("Linked")
        expect(sim.get_by_text("0 committed events", exact=True)).to_be_visible()
        print("PASS reset removes old approvals/messages; new Profile approval works before any prescription")
    finally:
        browser.close()
