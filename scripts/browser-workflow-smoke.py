"""Opt-in live UI check: resets the demo and sends reason + fill wrist alerts.

Run against the intended Supabase-mode build. These assertions prove rendered
state, not physical phone/watch receipt or label-source authenticity.
"""
import json
import os
from pathlib import Path
import re

from playwright.sync_api import sync_playwright, expect

origin = os.environ.get("FIRSTDOSE_TEST_ORIGIN", "http://localhost:3117").rstrip("/")
token = os.environ.get("FIRSTDOSE_TEST_TOKEN")
if not token or os.environ.get("FIRSTDOSE_TEST_ALLOW_RESET") != "1":
    raise SystemExit("Set FIRSTDOSE_TEST_TOKEN and FIRSTDOSE_TEST_ALLOW_RESET=1 for the target demo.")

# Refuse to reset a live run if this checkout still has a placeholder artifact.
labels_path = Path(__file__).resolve().parents[1] / "mock" / "labels.json"
labels = json.loads(labels_path.read_text(encoding="utf-8-sig"))["labels"]
otezla = next(label for label in labels if label["drug_id"] == "drug_otezla")
sections = [section for section in otezla["sections"] if section["text"] is not None]
if not otezla["byte_exact"] or not otezla["fetched_at"] or not sections or any(
    not section["text"].strip() or "PLACEHOLDER" in section["text"] for section in sections
):
    raise SystemExit("Integrate and verify the cached Otezla label before running this smoke test.")
expected_label_text = [
    section["text"]
    for section in sorted(sections, key=lambda section: section["loinc"] != "34066-1")
]


def login(page, path):
    page.goto(origin + path)
    page.get_by_role("link", name="Sign in to demo").click()
    page.get_by_label("Demo access code").fill(token)
    page.get_by_role("button", name="Open demo").click()
    page.wait_for_url(origin + path)
    expect(page.get_by_role("link", name="Sign in to demo")).to_have_count(0)


def verify_label(page):
    card = page.locator('[data-slot="card"]').filter(has_text=f"DailyMed {otezla['setid']}")
    expect(card.locator('[data-standin="label"]')).to_be_visible()
    expect(card.get_by_text("PLACEHOLDER, not label text", exact=True)).to_have_count(0)
    for summary in card.locator("details > summary").all():
        summary.click()
    paragraphs = card.locator("p")
    expect(paragraphs).to_have_count(len(expected_label_text))
    for paragraph in paragraphs.all():
        expect(paragraph).to_be_visible()
    assert paragraphs.all_text_contents() == expected_label_text, "Rendered label differs from verified fixture"


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        expect.set_options(timeout=15000)
        tablet = browser.new_context(viewport={"width": 1180, "height": 820})
        desk = browser.new_context(viewport={"width": 1440, "height": 900})
        phone = browser.new_context(viewport={"width": 390, "height": 844})
        for context in (tablet, desk, phone):
            context.set_default_timeout(15000)
        doctor = tablet.new_page()
        coordinator = desk.new_page()
        patient = phone.new_page()
        login(doctor, "/doctor")
        login(coordinator, "/coordinator")
        login(patient, "/patient/rx_001")

        sim = tablet.new_page()
        sim.goto(origin + "/sim")
        sim.get_by_role("button", name="Reset", exact=True).click()
        expect(sim.get_by_text("0 committed events", exact=True)).to_be_visible()
        board = tablet.new_page()
        board.goto(origin + "/board")
        access = phone.new_page()
        access.goto(origin + "/access")
        count_card = access.locator('[data-slot="card"]').filter(
            has=access.get_by_text("First fills confirmed", exact=True)
        )
        fill_count = count_card.locator('[data-slot="card-content"]')
        expect(coordinator.get_by_role("tab", name=re.compile(r"^Needs you\s+0$"))).to_be_visible()
        expect(sim.get_by_role("button", name="Next beat", exact=True)).to_be_disabled()

        doctor.get_by_role("link", name="New Rx", exact=True).click()
        doctor.wait_for_url(origin + "/doctor/new")
        maria_choice = doctor.get_by_role("button", name=re.compile(r"^Maria Lopez,"))
        expect(maria_choice).to_have_attribute("aria-pressed", "true")
        verify_label(doctor)
        doctor.get_by_role("button", name="Sign and send", exact=True).click()
        expect(doctor.locator("p").filter(has_text="Sent to pharmacy")).to_be_visible()
        expect(maria_choice).to_have_attribute("aria-pressed", "true")
        expect(maria_choice).to_contain_text("Sent")
        doctor.get_by_role("link", name="Prescriber", exact=True).click()
        doctor.wait_for_url(origin + "/doctor")

        def beat(event_id):
            return sim.locator("ol > li").filter(has=sim.get_by_text(event_id, exact=True))

        def fire(event_id):
            row = beat(event_id)
            row.get_by_role("button", name="Fire", exact=True).click()
            expect(row.get_by_role("button", name="Fired", exact=True)).to_be_disabled()

        fire("ev_04")
        fire("ev_05")
        expect(doctor.get_by_text("Maria Lopez: Otezla first fill pending", exact=True)).to_be_visible()
        expect(beat("ev_11").get_by_role("button", name="Fire", exact=True)).to_be_disabled()
        doctor.get_by_role("button", name="Send to my coordinator", exact=True).click()
        approval = doctor.get_by_role("dialog", name="Approve your access coordinator?", exact=True)
        expect(approval).to_be_visible()
        approval.get_by_role("button", name="Approve and send", exact=True).click()
        expect(approval).to_have_count(0)

        # Handoff arrives in another context, with no shared localStorage.
        expect(coordinator.get_by_role("tab", name=re.compile(r"^Needs you\s+1$"))).to_be_visible()
        coordinator.get_by_role("button", name="Maria Lopez", exact=True).click()
        case_sheet = coordinator.get_by_role("dialog", name=re.compile(r"^Maria Lopez"))
        expect(case_sheet).to_be_visible()
        case_sheet.get_by_role("button", name="Re-send copay card", exact=True).click()
        expect(case_sheet.get_by_text(re.compile(r"^Sent at "))).to_be_visible()
        expect(case_sheet.get_by_role("button", name="Re-send copay card", exact=True)).to_have_count(0)
        case_sheet.get_by_role("button", name="Close", exact=True).click()
        expect(coordinator.get_by_role("tab", name=re.compile(r"^Waiting\s+1$"))).to_be_visible()
        expect(beat("ev_11").get_by_role("button", name="Fire", exact=True)).to_be_disabled()

        patient.get_by_role("button", name="Use at pharmacy", exact=True).click()
        pending_copy = "Savings card acknowledged. Pharmacy fill confirmation is still pending."
        expect(patient.get_by_text(pending_copy, exact=True)).to_be_visible()
        expect(patient.get_by_role("button", name="Use at pharmacy", exact=True)).to_have_count(0)
        expect(board.get_by_role("status")).to_have_text("Pharmacy fills confirmed: 0")
        expect(fill_count).to_have_text("0")
        expect(access.get_by_text("Tiger summary unavailable. Showing practice event counts.", exact=True)).to_be_visible()
        expect(coordinator.get_by_role("tab", name=re.compile(r"^Fill confirmed\s+0$"))).to_be_visible()
        expect(beat("ev_11").get_by_role("button", name="Fire", exact=True)).to_be_enabled()
        patient.reload()
        expect(patient.get_by_text(pending_copy, exact=True)).to_be_visible()
        expect(fill_count).to_have_text("0")
        print("PASS verified label, order, approval, handoff and case-sheet fix; acknowledgment stays pending after reload")

        fire("ev_11")
        expect(board.get_by_role("status")).to_have_text("Pharmacy fills confirmed: 1")
        confirmed_copy = "The pharmacy confirmed your fill. This does not confirm a first dose."
        expect(patient.get_by_text(confirmed_copy, exact=True)).to_be_visible()
        expect(fill_count).to_have_text("1")
        confirmed_tab = coordinator.get_by_role("tab", name=re.compile(r"^Fill confirmed\s+1$"))
        expect(confirmed_tab).to_be_visible()
        confirmed_tab.click()
        coordinator.get_by_role("button", name="Maria Lopez", exact=True).click()
        expect(case_sheet.get_by_text("Fill confirmed", exact=True)).to_be_visible()
        case_sheet.get_by_role("button", name="Close", exact=True).click()
        doctor.reload()
        expect(doctor.get_by_text("Maria Lopez: Otezla pharmacy fill confirmed. This does not confirm treatment start.", exact=True)).to_be_visible()
        patient.reload()
        expect(patient.get_by_text(confirmed_copy, exact=True)).to_be_visible()
        access.reload()
        expect(fill_count).to_have_text("1")
        expect(beat("ev_11").get_by_role("button", name="Fired", exact=True)).to_be_disabled()
        print("PASS independent pharmacy confirmation updates all screens; reload still counts once")

        sim.get_by_role("button", name="Reset", exact=True).click()
        expect(sim.get_by_text("0 committed events", exact=True)).to_be_visible()
        expect(board.get_by_role("status")).to_have_text("Pharmacy fills confirmed: 0")
        expect(fill_count).to_have_text("0")
        for tab in ("Needs you", "Waiting", "Fill confirmed"):
            expect(coordinator.get_by_role("tab", name=re.compile(rf"^{tab}\s+0$"))).to_be_visible()
        expect(coordinator.get_by_role("button", name="Maria Lopez", exact=True)).to_have_count(0)
        expect(patient.get_by_text("Not prescribed", exact=True)).to_be_visible()
        expect(doctor.get_by_text("No alerts. FirstDose tells you only when a new prescription needs you.", exact=True)).to_be_visible()
        doctor.get_by_role("link", name="New Rx", exact=True).click()
        doctor.get_by_role("button", name=re.compile(r"^Maria Lopez,")).click()
        expect(doctor.get_by_role("button", name="Sign and send", exact=True)).to_be_enabled()
        expect(sim.get_by_role("button", name="Next beat", exact=True)).to_be_disabled()
        print("PASS remote reset clears all three independent browser sessions; fresh run is empty")
    finally:
        browser.close()
