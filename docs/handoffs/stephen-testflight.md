# Stephen: wrapping the doctor's phone view for TestFlight (6.13)

Sat Sep 26, 2026 · Deem. **Last in line:** start this only after the web frontend is done, and don't test phones until then. PLAN row 6.13.

## What you're wrapping

The doctor's screen is a web app at `https://firstdose.vercel.app/doctor`. It's built for an iPhone: 390 wide, a bottom tab bar, and safe-area padding. The TestFlight build is a thin native shell around that page, not a rewrite. The web app keeps all the logic; the shell makes it an installed app with its own icon and full screen.

| Route | Tab | What it is |
|---|---|---|
| `/doctor` | Prescriber | Home: Rx Alerts, the before-visit card, Recent Patients with fill status, the "New Rx" button |
| `/doctor/new` | Prescriber | New Rx: patient → medication → pharmacy → savings card → Sign and send, then the DailyMed label |
| `/doctor/patients/[id]` | Prescriber | Patient Details and Past Prescriptions (`pt_maria`, `pt_james`) |
| `/doctor/concierge` | Concierge | Request types, including "Help my patient start" |
| `/doctor/profile` | Profile | "My coordinator": approve the coordinator |

- **Layout already handled.** `viewport-fit=cover` and theme color `#1c2150` are set in `app/(screens)/doctor/layout.tsx`. `env(safe-area-inset-top/bottom)` padding is in `PhoneShell.tsx`, and the content is capped at 430 px wide.
- **Home-screen metadata** (`appleWebApp`) is already set, so "Add to Home Screen" in Safari works today as a fallback.

## The native shell

- **A `WKWebView`** loading `https://firstdose.vercel.app/doctor`, full screen, with no browser chrome. Keep it inside the web view for links under `/doctor`, `/api/demo-login` and `/coordinator`; open anything else in Safari.
- **Sign-in:**
  - live mode uses an HttpOnly session cookie set by `/api/demo-login?next=/doctor`;
  - use the default persistent `WKWebsiteDataStore`, so the team signs in once on the demo phone;
  - never ship or hard-code the access code or any key in the app.
- **Status bar:** a light style over the navy header. Match the background `#1c2150`, so there's no white flash while the page loads.
- **Microphone** (only if the voice handoff ships, 4.1): add `NSMicrophoneUsageDescription` and allow `getUserMedia` in the web view (iOS 14.3+). The web app shows the mic button only in live mode.
- **Offline:** show a simple "Can't reach FirstDose" screen with Retry. No cached fake data.
- **App name and icon:** "FirstDose Rx", with our own icon. **Never DocUpdate's name, logo or icon** (PLAN D9). The in-app screens keep their "Concept: FirstDose inside DocUpdate · Not affiliated" line.

## The watch

The Apple Watch alerts don't come from this app. They come from the **ntfy** app on the same iPhone, subscribed to the team topic (private; Vinh has it). iOS mirrors them to the watch **only while the phone is locked**, so the demo locks the phone after Sign and send. Native push (APNs) is out of scope for the weekend.

## Don't

- Don't add analytics, crash reporters or third-party SDKs that send data off the phone.
- Don't put patient data in logs or local storage outside the web view.
- Don't submit to the App Store: TestFlight internal testing only.

## Done when

- [ ] The TestFlight build installs on the demo iPhone, opens `/doctor` full screen, and stays signed in after a relaunch.
- [ ] Every tab and route above works, the back buttons work, and nothing is cut off by the notch or the home indicator.
- [ ] After live mode is on: Sign and send, lock the phone, and the Apple Watch buzzes (C8), then the Rx Alert shows when you unlock.
- [ ] Record the build number in PLAN.md (6.13) with a `status:` commit.
