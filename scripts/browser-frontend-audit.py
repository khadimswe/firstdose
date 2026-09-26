"""Local frontend regressions for the September 26 audit; never writes to a server.

Run a NEXT_PUBLIC_DATA_SOURCE=supabase build locally, then:
  python scripts/browser-frontend-audit.py --origin http://localhost:3136 --axe /path/to/axe.min.js
Requires Python Playwright/Chromium and a local axe-core 4.10.3 distribution.
All /api requests are fulfilled with fixed browser fixtures; no credentials needed.
"""
import argparse
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--browser", choices=["chromium", "webkit", "firefox"], default="chromium")
parser.add_argument("--match", default="", help="Only run checks whose names contain this text")
parser.add_argument("--origin", default="http://localhost:3136")
parser.add_argument("--axe", type=Path, required=True)
parser.add_argument("--output", type=Path, default=Path("notes/frontend-regressions"))
args = parser.parse_args()
if urlsplit(args.origin).hostname not in {"localhost", "127.0.0.1"}:
    parser.error("Use a local build; this check is not a hosted workflow test.")
args.output.mkdir(parents=True, exist_ok=True)
run = "11111111-1111-4111-8111-111111111111"
root = Path(__file__).resolve().parents[1]
cases = json.loads((root / "mock/patients.json").read_text(encoding="utf-8-sig"))["cases"]
script = json.loads((root / "mock/events.json").read_text(encoding="utf-8-sig"))["events"]
script = [{**e, "at": (datetime(2026, 9, 26, tzinfo=timezone.utc) + timedelta(seconds=e["at"])).isoformat()} for e in script]
events = []
results = []


def fixture(route):
    path = urlsplit(route.request.url).path
    data = {"error": "unexpected_test_request"}
    status = 405
    if route.request.method == "GET":
        status = 200
        if path == "/api/events":
            data = {"run_id": run, "revision": len(events), "events": events}
        elif path == "/api/coordinator":
            data = {"run_id": run, "revision": 0, "events": [],
                    "links": [{"prescriber_id": "prescriber_demo", "coordinator_id": "coord_demo", "status": "pending"}],
                    "cases": [{"case_id": c["id"], "coordinator_id": None} for c in cases]}
        elif path == "/api/patient/message":
            data = {"run_id": run, "revision": 0, "messages": []}
        elif path == "/api/access/summary":
            data = {"recovered": 0, "median_ttff_seconds": None, "reason_tally": {}}
        else:
            status = 404
    route.fulfill(status=status, content_type="application/json", body=json.dumps(data),
                  headers={"X-FirstDose-Run": run, "X-FirstDose-Revision": str(len(events))})


def visit(page, path):
    response = page.goto(args.origin.rstrip("/") + path)
    assert response.status == 200
    page.wait_for_timeout(500)


def check(name, action):
    if args.match.lower() not in name.lower():
        return
    try:
        action()
        result = {"test": name, "status": "PASS"}
    except Exception as error:
        result = {"test": name, "status": "FAIL", "error": str(error)[:2500]}
    results.append(result)
    (args.output / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(result), flush=True)


with sync_playwright() as p:
    browser = getattr(p, args.browser).launch(headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    context.route("**/api/**", fixture)
    page = context.new_page()
    expect.set_options(timeout=5000)

    def layout(path, width):
        page.set_viewport_size({"width": width, "height": 844})
        visit(page, path)
        if path == "/demo":
            # Exercise long deployment origins, not just the short localhost URL.
            page.locator("span.truncate").evaluate_all("els => els.forEach(e => e.textContent = 'https://firstdose-long-preview-deployment.example.com/patient/rx_001')")
        measured = page.evaluate("document.documentElement.scrollWidth")
        state = "populated-" if events else "empty-"
        page.screenshot(path=str(args.output / (state + str(width) + path.replace("/", "-") + ".png")), full_page=True)
        assert measured <= width + 1, f"{measured}px document exceeds {width}px viewport"

    for width in [320, 390, 1440]:
        for path in ["/demo", "/sim", "/coordinator", "/board", "/qr"]:
            check(f"No horizontal page overflow: {path} at {width}px", lambda path=path, width=width: layout(path, width))

    def blocked_run():
        visit(page, "/sim")
        expect(page.get_by_text("0 committed events", exact=True)).to_be_visible()
        expect(page.get_by_text("Every scripted event has fired.", exact=True)).to_have_count(0)
        expect(page.get_by_role("status").filter(has_text="Waiting for")).to_be_visible()
    check("Empty live run explains blocked prerequisites", blocked_run)

    def dialog_focus():
        visit(page, "/doctor/profile")
        trigger = page.get_by_role("button", name="Review request", exact=True)
        expect(trigger).to_be_enabled()
        trigger.focus()
        trigger.press("Enter")
        dialog = page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        for _ in range(6):
            page.keyboard.press("Tab")
            assert page.evaluate("Boolean(document.activeElement.closest('[role=dialog]'))")
        page.keyboard.press("Escape")
        expect(dialog).to_have_count(0)
        expect(trigger).to_be_focused()
    check("Approval dialog traps and returns keyboard focus", dialog_focus)

    def search_feedback():
        visit(page, "/doctor")
        search = page.get_by_role("textbox", name="Search patients")
        search.focus()
        assert search.evaluate("e => [e,e.parentElement].some(x=>{const s=getComputedStyle(x);return (s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0)||s.boxShadow!=='none'})"), "No visible focus treatment"
        search.fill("mArIa")
        expect(page.get_by_role("link", name=re.compile("Maria Lopez"))).to_be_visible()
        expect(page.get_by_role("link", name=re.compile("James Carter"))).to_have_count(0)
        expect(page.get_by_role("status").filter(has_text="1 matching patient")).to_be_visible()
        search.fill("no-such-patient")
        expect(page.get_by_role("status").filter(has_text="No matching patients")).to_be_visible()
    check("Search focus and announced result/empty state", search_feedback)

    def skip_and_navigation():
        visit(page, "/doctor")
        page.keyboard.press("Tab")
        skip = page.get_by_role("link", name="Skip to main content", exact=True)
        expect(skip).to_be_focused()
        skip.press("Enter")
        assert page.evaluate("Boolean(document.activeElement.closest('main'))")
        page.get_by_role("link", name="Concierge", exact=True).click()
        expect(page.get_by_role("heading", name="Concierge", exact=True)).to_be_visible()
        page.wait_for_function("Boolean(document.activeElement.closest('main'))")
    check("Skip link and route change focus main content", skip_and_navigation)

    def detached_trigger():
        visit(page, "/doctor/profile")
        trigger = page.get_by_role("button", name="Review request", exact=True)
        trigger.focus()
        trigger.press("Enter")
        expect(page.get_by_role("dialog")).to_be_visible()
        page.get_by_role("button", name="Review request", exact=True, include_hidden=True).evaluate("e => e.remove()")
        page.keyboard.press("Escape")
        expect(page.get_by_role("dialog")).to_have_count(0)
        expect(page.locator("#main-content")).to_be_focused()
    check("Dialog falls back to main when its opener disappears", detached_trigger)

    def table_keyboard():
        visit(page, "/coordinator/prescribers")
        page.set_viewport_size({"width": 320, "height": 844})
        region = page.get_by_role("region", name="Prescriber links", exact=True)
        region.focus()
        expect(region).to_be_focused()
        region.press("ArrowRight")
        page.wait_for_function("document.querySelector('[aria-label=\"Prescriber links\"]').scrollLeft > 0")
    check("Prescriber table scrolls with the keyboard", table_keyboard)

    def completed_run():
        visit(page, "/sim")
        expect(page.get_by_text(f"{len(script)} committed events", exact=True)).to_be_visible()
        expect(page.get_by_role("status").filter(has_text="Every scripted event has fired.")).to_be_visible()
    events = script
    check("Completed run reports completion", completed_run)
    for width in [320, 390, 1440]:
        check(f"Populated board fits at {width}px", lambda width=width: layout("/board", width))
    events = []

    for width in [390, 1440]:
        for path in ["/demo", "/coordinator/prescribers", "/doctor", "/doctor/new", "/doctor/profile", "/board", "/sim", "/qr"]:
            def accessibility(path=path, width=width):
                page.set_viewport_size({"width": width, "height": 844})
                visit(page, path)
                page.add_script_tag(path=str(args.axe.resolve()))
                violations = page.evaluate("""async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}""")
                name = ("populated-" if events else "empty-") + str(width) + path.replace("/", "-")
                (args.output / (name + "-axe.json")).write_text(json.dumps(violations, indent=2), encoding="utf-8")
                assert not violations, json.dumps(violations)
            check(f"axe audit: {path} at {width}px", accessibility)
    events = script
    for path in ["/board", "/doctor", "/coordinator/prescribers"]:
        check(f"Populated axe audit: {path} at 390px", lambda path=path: accessibility(path, 390))
    browser.close()

raise SystemExit(1 if any(row["status"] == "FAIL" for row in results) else 0)
