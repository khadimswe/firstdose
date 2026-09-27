"""Record the live FirstDose demo on production for the video.

User-authorized (Sep 26): reset the shared run, seed, run Maria + James, reset to zero at the end.
Outputs capture/out/{desk,doctor,patient}.webm + marks.json (seconds since t0, plus each video's start offset).
"""
import json, os, re, shutil, time, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ORIGIN = "https://firstdose.vercel.app"
HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
TOKEN = os.environ.get("FIRSTDOSE_DEMO_TOKEN")
if not TOKEN:
    raise SystemExit("Set FIRSTDOSE_DEMO_TOKEN (the production demo access code). This script RESETS the shared live run.")

CURSOR = """
(() => {
  const add = () => {
    if (document.getElementById('__fd_cursor')) return;
    const c = document.createElement('div'); c.id = '__fd_cursor';
    Object.assign(c.style, {position:'fixed', left:'-100px', top:'-100px', width:'26px', height:'26px',
      marginLeft:'-13px', marginTop:'-13px', borderRadius:'50%', background:'rgba(37,99,235,.28)',
      border:'2.5px solid rgba(37,99,235,.9)', zIndex:2147483647, pointerEvents:'none',
      transition:'transform .12s ease'});
    document.documentElement.appendChild(c);
    addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { c.style.transform = 'scale(.7)'; }, true);
    addEventListener('mouseup', () => { c.style.transform = 'scale(1)'; }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', add); else add();
})();
"""

marks = {"events": []}
t0 = time.time()
now = lambda: round(time.time() - t0, 2)


def mark(label):
    marks["events"].append({"t": now(), "label": label})
    print(f"[{now():7.2f}] {label}", flush=True)


def glide(page, locator, click=True):
    locator.scroll_into_view_if_needed()
    box = locator.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(x, y, steps=18)
    page.wait_for_timeout(350)
    if click:
        locator.click()


def fire(sim, ev):
    row = sim.locator(f'[data-beat="{ev}"]')
    row.get_by_role("button", name="Fire", exact=True).click()
    expect(row.get_by_role("button", name="Fired", exact=True)).to_be_disabled()
    mark(f"fired {ev}")


def api(ctx, path):
    r = ctx.request.get(ORIGIN + path)
    return r.status, r.json()


def reset(sim):
    sim.goto(ORIGIN + "/sim"); sim.wait_for_timeout(1500)
    sim.get_by_role("button", name="Reset", exact=True).click()
    sim.get_by_role("button", name="Confirm reset", exact=True).click()
    expect(sim.get_by_text("0 committed events", exact=True)).to_be_visible()


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        expect.set_options(timeout=30000)

        def ctx(name, w, h, dsf, size):
            c = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf,
                                    record_video_dir=str(OUT / name), record_video_size=size)
            c.add_init_script(CURSOR)
            r = c.request.post(ORIGIN + "/api/demo-login", headers={"Origin": ORIGIN},
                               data={"token": TOKEN, "next": "/coordinator"})
            assert r.status == 200, f"login {name} {r.status}"
            return c

        control = browser.new_context(viewport={"width": 1440, "height": 1000})
        r = control.request.post(ORIGIN + "/api/demo-login", headers={"Origin": ORIGIN},
                                 data={"token": TOKEN, "next": "/sim"})
        assert r.status == 200
        sim = control.new_page()

        # --- setup (not on camera) ---
        reset(sim); mark("reset before recording")
        sim.get_by_role("button", name="Seed", exact=True).click()
        expect(sim.get_by_role("button", name="Seeded", exact=True)).to_be_disabled()
        mark("seeded week")

        desk_c = ctx("desk", 1440, 810, 2, {"width": 1920, "height": 1080})
        doc_c = ctx("doctor", 390, 844, 3, {"width": 780, "height": 1688})
        pat_c = ctx("patient", 390, 844, 3, {"width": 780, "height": 1688})
        pages = {}
        try:
            desk = desk_c.new_page(); marks["desk_start"] = now()
            doctor = doc_c.new_page(); marks["doctor_start"] = now()
            patient = pat_c.new_page(); marks["patient_start"] = now()
            pages.update(desk=desk, doctor=doctor, patient=patient, sim=sim)

            patient.goto(ORIGIN + "/patient/rx_001")
            doctor.goto(ORIGIN + "/doctor")
            desk.goto(ORIGIN + "/coordinator")
            expect(desk.get_by_role("tab", name=re.compile(r"^Needs you\s+3$"))).to_be_visible()
            desk.wait_for_timeout(2500)

            # ===== MARIA =====
            mark("B1 queue monday 3/2/8")
            desk.mouse.move(700, 300, steps=30); desk.wait_for_timeout(3500)
            desk.mouse.move(900, 520, steps=30); desk.wait_for_timeout(3000)

            # coordinator asks the prescriber to link
            desk.goto(ORIGIN + "/coordinator/prescribers"); desk.wait_for_timeout(2500)
            demo = desk.get_by_role("row").filter(has_text="Okafor")
            mark("B1b prescribers: Okafor not linked")
            glide(desk, desk.get_by_role("button", name=re.compile(r"^Request .*Okafor.* approval$")))
            expect(demo).to_contain_text("Pending approval")
            mark("B1c request sent: pending approval"); desk.wait_for_timeout(3000)

            # doctor signs and sends
            doctor.goto(ORIGIN + "/doctor/new"); doctor.wait_for_timeout(2500)
            mark("B2 doctor new rx: Maria Otezla + label")
            doctor.mouse.move(195, 500, steps=20); doctor.wait_for_timeout(1500)
            doctor.mouse.wheel(0, 500); doctor.wait_for_timeout(2500)
            doctor.mouse.wheel(0, -500); doctor.wait_for_timeout(1200)
            glide(doctor, doctor.get_by_role("button", name="Sign and send", exact=True))
            expect(doctor.locator("p").filter(has_text="Sent to pharmacy")).to_be_visible()
            mark("B2b sent to pharmacy"); doctor.wait_for_timeout(3000)

            # pharmacy: not dispensed (ev_04), reason (ev_05)
            doctor.goto(ORIGIN + "/doctor"); doctor.wait_for_timeout(1500)
            fire(sim, "ev_04"); fire(sim, "ev_05")
            expect(doctor.get_by_role("button", name="Send to my coordinator", exact=True)).to_be_visible()
            mark("B3 doctor alert: not dispensed + reason (watch push sent)")
            doctor.wait_for_timeout(4500)

            # one tap handoff; first time -> approve coordinator
            glide(doctor, doctor.get_by_role("button", name="Send to my coordinator", exact=True))
            mark("B4 tapped send to my coordinator")
            doctor.wait_for_timeout(1200)
            dlg = doctor.get_by_role("dialog")
            if dlg.count():
                approve = dlg.get_by_role("button", name=re.compile(r"^Approve( and send)?$"))
                if approve.count() and approve.is_visible():
                    mark("B4b approval sheet"); doctor.wait_for_timeout(2500)
                    glide(doctor, approve)
                    mark("B4c approved")
                doctor.wait_for_function("""() => { const d = document.querySelector('[role="dialog"]');
                  return !d || [...d.querySelectorAll('button')].some(b => b.textContent.trim()==='Send to coordinator' && !b.disabled); }""")
                send = doctor.get_by_role("dialog").get_by_role("button", name="Send to coordinator", exact=True)
                if send.count() and send.is_visible():
                    glide(doctor, send)
            expect(demo).to_contain_text("Linked")
            mark("B4d desk prescribers linked")
            desk.wait_for_timeout(3000)

            # queue: Maria on top with one fix
            desk.goto(ORIGIN + "/coordinator")
            expect(desk.get_by_role("tab", name=re.compile(r"^Needs you\s+4$"))).to_be_visible()
            mark("B5 queue: needs you 4, Maria in"); desk.wait_for_timeout(3500)
            glide(desk, desk.get_by_role("button", name="Maria Lopez", exact=True))
            sheet = desk.get_by_role("dialog", name=re.compile(r"^Maria Lopez"))
            mark("B5b Maria sheet: reason + one fix"); desk.wait_for_timeout(4000)
            glide(desk, sheet.get_by_role("button", name="Re-send copay card", exact=True))
            expect(sheet.get_by_text(re.compile(r"^Sent at "))).to_be_visible()
            mark("B5c copay card sent"); desk.wait_for_timeout(2500)
            glide(desk, sheet.get_by_role("button", name="Approve and send", exact=True))
            expect(sheet.get_by_text("Sent to the patient", exact=False)).to_be_visible()
            mark("B5d message approved and sent"); desk.wait_for_timeout(2500)

            # patient
            patient.reload(); patient.wait_for_timeout(2500)
            message = patient.get_by_role("region", name="Practice message", exact=True)
            expect(message).to_be_visible()
            mark("B6 patient card + message"); patient.wait_for_timeout(3500)
            glide(patient, message.get_by_role("button", name="Acknowledge message", exact=True))
            expect(sheet.get_by_text("Message acknowledged", exact=True)).to_be_visible()
            mark("B6b message acknowledged"); patient.wait_for_timeout(2000)
            glide(patient, patient.get_by_role("button", name="Use at pharmacy", exact=True))
            expect(patient.get_by_text("Savings card acknowledged. Pharmacy fill confirmation is still pending.", exact=True)).to_be_visible()
            mark("B6c use at pharmacy: still pending"); patient.wait_for_timeout(4500)
            glide(desk, sheet.get_by_role("button", name="Close", exact=True))
            expect(desk.get_by_role("tab", name=re.compile(r"^Fill confirmed\s+8$"))).to_be_visible()
            mark("B6d queue still fill confirmed 8"); desk.wait_for_timeout(3000)

            # independent pharmacy confirmation
            fire(sim, "ev_11")
            expect(patient.get_by_text("The pharmacy confirmed your fill. This does not confirm a first dose.", exact=True)).to_be_visible()
            mark("B7 patient: pharmacy confirmed fill")
            expect(desk.get_by_role("tab", name=re.compile(r"^Fill confirmed\s+9$"))).to_be_visible()
            mark("B7b queue fill confirmed 9"); desk.wait_for_timeout(3000)
            doctor.goto(ORIGIN + "/doctor/patients/pt_maria"); doctor.wait_for_timeout(3000)
            mark("B7c doctor past rx: fill confirmed"); doctor.wait_for_timeout(4000)

            # ===== JAMES =====
            doctor.goto(ORIGIN + "/doctor/new"); doctor.wait_for_timeout(2000)
            glide(doctor, doctor.get_by_role("button", name=re.compile("James")))
            doctor.wait_for_timeout(2500)
            mark("C1 doctor new rx: James Humira")
            glide(doctor, doctor.get_by_role("button", name="Sign and send", exact=True))
            expect(doctor.locator("p").filter(has_text="Sent to pharmacy")).to_be_visible()
            mark("C1b james sent"); doctor.wait_for_timeout(2000)
            doctor.goto(ORIGIN + "/doctor"); doctor.wait_for_timeout(1000)
            for ev in ["ev_16", "ev_17", "ev_18"]:
                fire(sim, ev)
            expect(doctor.get_by_role("button", name="Send to my coordinator", exact=True)).to_be_visible()
            mark("C2 doctor alert: james PA / unable to reach"); doctor.wait_for_timeout(4500)
            doctor.mouse.wheel(0, 400); doctor.wait_for_timeout(3000)
            mark("C2b doctor home scrolled (before-visit note?)"); doctor.mouse.wheel(0, -400)
            doctor.goto(ORIGIN + "/doctor/concierge"); doctor.wait_for_timeout(2500)
            mark("C3 concierge: help my patient start")
            glide(doctor, doctor.get_by_role("button", name="Submit", exact=True))
            doctor.wait_for_function("""() => { const d = document.querySelector('[role="dialog"]');
              return !d || [...d.querySelectorAll('button')].some(b => b.textContent.trim()==='Send to coordinator' && !b.disabled); }""")
            confirm = doctor.get_by_role("dialog").get_by_role("button", name="Send to coordinator", exact=True)
            if confirm.count() and confirm.is_visible():
                glide(doctor, confirm)
            expect(doctor.get_by_text("Sent to your coordinator:", exact=False)).to_be_visible()
            mark("C3b james sent to coordinator"); doctor.wait_for_timeout(2500)

            expect(desk.get_by_role("tab", name=re.compile(r"^Needs you\s+4$"))).to_be_visible()
            desk.wait_for_timeout(1500)
            glide(desk, desk.get_by_role("button", name="James Carter", exact=True))
            jsheet = desk.get_by_role("dialog")
            mark("C4 james sheet: reason + access support"); desk.wait_for_timeout(4500)
            glide(desk, jsheet.get_by_role("button", name="Connect to access support", exact=True))
            expect(jsheet.get_by_text(re.compile("^Sent at "))).to_be_visible()
            mark("C4b access support sent"); desk.wait_for_timeout(3500)
            glide(desk, jsheet.get_by_role("button", name="Close", exact=True))

            # ===== ACCESS / ANALYTICS =====
            desk.goto(ORIGIN + "/access"); desk.wait_for_timeout(4000)
            mark("D1 access summary (Tiger)")
            desk.mouse.move(700, 400, steps=30); desk.wait_for_timeout(3000)
            desk.mouse.wheel(0, 500); desk.wait_for_timeout(4000)
            desk.mouse.wheel(0, 500); desk.wait_for_timeout(4000)
            mark("D1b access scrolled")
            st, ev = api(desk_c, "/api/events")
            st2, summary = api(desk_c, f"/api/access/summary?run_id={ev['run_id']}&revision={ev['revision']}")
            marks["access_summary"] = {"status": st2, "body": summary}
            desk.goto(ORIGIN + "/board"); desk.wait_for_timeout(5000)
            mark("D2 board"); desk.wait_for_timeout(3000)
            mark("END")
            marks["status"] = "PASS"
        except Exception as e:
            marks["status"] = "FAIL"; marks["error"] = str(e); marks["traceback"] = traceback.format_exc()
            print(traceback.format_exc(), flush=True)
            for n, pg in pages.items():
                try: pg.screenshot(path=str(OUT / f"fail-{n}.png"))
                except Exception: pass
        finally:
            for c in (desk_c, doc_c, pat_c):
                c.close()  # flushes videos
            # final reset to zero (authorized)
            try:
                reset(sim)
                for _ in range(30):
                    st, cur = api(control, "/api/events")
                    if not cur.get("events"): break
                    sim.wait_for_timeout(500)
                final = {pth: api(control, pth)[1] for pth in ["/api/events", "/api/coordinator", "/api/patient/message"]}
                marks["final_state"] = {"events": len(final["/api/events"].get("events", [])),
                                        "links": len(final["/api/coordinator"].get("links", [])),
                                        "messages": len(final["/api/patient/message"].get("messages", []))}
            except Exception as e:
                marks["final_state"] = {"error": str(e)}
            print("final", marks.get("final_state"), flush=True)
            browser.close()
            for name in ("desk", "doctor", "patient"):
                vids = list((OUT / name).glob("*.webm"))
                if vids:
                    vids[0].rename(OUT / f"{name}.webm")
            (OUT / "marks.json").write_text(json.dumps(marks, indent=1))


if __name__ == "__main__":
    main()
