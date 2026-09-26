"""Opt-in live UI check: resets the configured demo and sends one reason alert."""
import os
from playwright.sync_api import sync_playwright, expect

origin = os.environ.get("FIRSTDOSE_TEST_ORIGIN", "http://localhost:3117")
token = os.environ.get("FIRSTDOSE_TEST_TOKEN")
if not token or os.environ.get("FIRSTDOSE_TEST_ALLOW_RESET") != "1":
    raise SystemExit("Set FIRSTDOSE_TEST_TOKEN and FIRSTDOSE_TEST_ALLOW_RESET=1 for the target demo.")

def login(page, path):
    page.goto(origin + path)
    page.get_by_role("link", name="Sign in to demo").click()
    page.get_by_label("Demo access code").fill(token)
    page.get_by_role("button", name="Open demo").click()
    page.wait_for_url(origin + path)
    expect(page.get_by_role("link", name="Sign in to demo")).to_have_count(0)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        tablet = browser.new_context(viewport={"width": 1180, "height": 820})
        phone = browser.new_context(viewport={"width": 390, "height": 844})
        doctor = tablet.new_page()
        patient = phone.new_page()
        login(doctor, "/doctor")
        login(patient, "/patient/rx_001")
        sim = tablet.new_page()
        sim.goto(origin + "/sim")
        sim.get_by_role("button", name="Reset", exact=True).click()
        expect(sim.get_by_text("0 committed events", exact=True)).to_be_visible()
        board = tablet.new_page()
        board.goto(origin + "/board")
        access = phone.new_page()
        access.goto(origin + "/access")
        coordinator = phone.new_page()
        coordinator.goto(origin + "/coordinator")
        expect(coordinator.get_by_text("No handoffs yet.", exact=True)).to_be_visible()
        expect(sim.get_by_role("button", name="Next beat", exact=True)).to_be_disabled()
        doctor.get_by_role("button", name="Prescribe Otezla 30 mg tablet", exact=True).click()
        expect(sim.get_by_text("2 committed events", exact=True)).to_be_visible(timeout=15000)

        def beat(event_id):
            return sim.locator("ol > li").filter(has=sim.get_by_text(event_id, exact=True)).get_by_role("button", name="Fire", exact=True)

        beat("ev_04").click()
        beat("ev_05").click()
        expect(doctor.get_by_text("Maria Lopez: Otezla first fill pending", exact=True)).to_be_visible(timeout=15000)
        doctor.get_by_role("button", name="Send to my coordinator", exact=True).click()
        coordinator.get_by_role("button", name="Re-send copay card", exact=True).click(timeout=15000)
        patient.get_by_role("button", name="Use at pharmacy", exact=True).click(timeout=15000)
        expect(patient.get_by_text("Savings card acknowledged. Pharmacy fill confirmation is still pending.", exact=True)).to_be_visible()
        expect(board.get_by_role("status")).to_have_text("Pharmacy fills confirmed: 0")
        expect(access.get_by_text("Tiger summary unavailable. Showing practice event counts.", exact=True)).to_be_visible()
        expect(sim.get_by_text("9 committed events", exact=True)).to_be_visible(timeout=15000)
        print("PASS rendered screens: prescribe, reason alert, handoff, fix, acknowledgment stays pending")

        beat("ev_11").click()
        expect(board.get_by_role("status")).to_have_text("Pharmacy fills confirmed: 1", timeout=15000)
        expect(patient.get_by_text("The pharmacy confirmed your fill. This does not confirm a first dose.", exact=True)).to_be_visible(timeout=15000)
        count_card = access.locator('[data-slot="card"]').filter(has=access.get_by_text("First fills confirmed", exact=True))
        expect(count_card.locator('[data-slot="card-content"]')).to_have_text("1", timeout=15000)
        expect(sim.get_by_text("10 committed events", exact=True)).to_be_visible()
        doctor.reload()
        expect(doctor.get_by_role("list").get_by_text("Maria Lopez: Otezla pharmacy fill confirmed. This does not confirm treatment start.", exact=True)).to_be_visible(timeout=15000)
        print("PASS independent pharmacy confirmation updates board, patient, access and reload")

        sim.get_by_role("button", name="Reset", exact=True).click()
        expect(sim.get_by_text("0 committed events", exact=True)).to_be_visible()
        expect(board.get_by_role("status")).to_have_text("Pharmacy fills confirmed: 0", timeout=15000)
        expect(count_card.locator('[data-slot="card-content"]')).to_have_text("0", timeout=15000)
        expect(coordinator.get_by_text("No handoffs yet.", exact=True)).to_be_visible(timeout=15000)
        expect(patient.get_by_text("Not prescribed", exact=True)).to_be_visible(timeout=15000)
        expect(doctor.get_by_role("button", name="Prescribe Otezla 30 mg tablet", exact=True)).to_be_enabled(timeout=15000)
        print("PASS remote reset clears both browser sessions; fresh run is empty")
    finally:
        browser.close()
