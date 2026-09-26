"""Run against an already running test server with Python Playwright installed."""
import os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

origin = os.environ.get("FIRSTDOSE_TEST_ORIGIN", "http://localhost:3117")
token = os.environ.get("FIRSTDOSE_TEST_TOKEN")
if not token:
    raise SystemExit("Set FIRSTDOSE_TEST_TOKEN to the test server's private demo token.")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    try:
        for width, height in [(390, 844), (1180, 820)]:
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            page.goto(origin + "/api/demo-login?next=%2Fpatient%2Frx_001")
            page.wait_for_load_state("networkidle")
            page.get_by_label("Demo access code").fill(token)
            page.get_by_role("button", name="Open demo").click()
            page.wait_for_url("**/patient/rx_001")
            page.wait_for_load_state("networkidle")
            cookie = next(c for c in context.cookies() if c["name"] in ["firstdose_demo", "__Host-firstdose_demo"])
            assert cookie["httpOnly"] and cookie["sameSite"] == "Strict"
            if urlparse(origin).scheme == "https":
                assert cookie["secure"] and cookie["name"] == "__Host-firstdose_demo"
            assert "firstdose_demo" not in page.evaluate("document.cookie")
            assert token not in page.url
            print(f"PASS {width}px browser: form login, patient return, HttpOnly session")
            context.close()
    finally:
        browser.close()
