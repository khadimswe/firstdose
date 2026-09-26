"""Run against an already running test server with Python Playwright installed."""
import os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

origin = os.environ.get("FIRSTDOSE_TEST_ORIGIN", "http://localhost:3117").rstrip("/")
token = os.environ.get("FIRSTDOSE_TEST_TOKEN")
if not token:
    raise SystemExit("Set FIRSTDOSE_TEST_TOKEN to the test server's private demo token.")

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    try:
        expect.set_options(timeout=15000)
        for width, height in [(390, 844), (1180, 820)]:
            for path in (
                "/patient/rx_001",
                "/doctor/new",
                "/doctor/profile",
                "/doctor/patients/pt_maria",
                "/coordinator/prescribers",
            ):
                # Fresh cookies/localStorage ensure every route exercises login.
                context = browser.new_context(viewport={"width": width, "height": height})
                try:
                    page = context.new_page()
                    page.goto(origin + path)
                    page.get_by_role("link", name="Sign in to demo", exact=True).click()
                    page.get_by_label("Demo access code").fill(token)
                    page.get_by_role("button", name="Open demo").click()
                    page.wait_for_url(origin + path)
                    expect(page.get_by_role("link", name="Sign in to demo", exact=True)).to_have_count(0)
                    assert page.url == origin + path, "Login did not preserve the requested route"
                    cookie = next(c for c in context.cookies() if c["name"] in ["firstdose_demo", "__Host-firstdose_demo"])
                    assert cookie["httpOnly"] and cookie["sameSite"] == "Strict"
                    if urlparse(origin).scheme == "https":
                        assert cookie["secure"] and cookie["name"] == "__Host-firstdose_demo"
                    assert "firstdose_demo" not in page.evaluate("document.cookie")
                    assert token not in page.url
                    print(f"PASS {width}px browser: unauthenticated {path}, exact login return, HttpOnly session")
                finally:
                    context.close()
    finally:
        browser.close()
