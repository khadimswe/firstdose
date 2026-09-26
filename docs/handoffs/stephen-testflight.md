# FirstDose Rx: build the doctor's TestFlight shell (6.13)

Updated September 26, 2026. Stephen is not on this project. This is now a self-service handoff for whoever has the team's Mac and Apple Developer account. The filename stays stable for existing links. PLAN.md remains the execution dashboard.

The wrapper source is in [`ios/`](../../ios/). It loads `https://firstdose.vercel.app/doctor` in a persistent `WKWebView`, with the existing web interface and its fictional-data disclosures. The app is named **FirstDose Rx** and has an original navy “FD” icon generated locally. It has no third-party SDKs, native push, native analytics, or embedded access code.

**Readiness:** source and reproducible XcodeGen configuration are prepared. Six Swift navigation-policy tests passed in a disposable Swift 6 Linux container. Swift syntax parsing and plist/asset-JSON/YAML parsing passed on Windows. These checks do **not** establish an iOS build, visual layout, microphone capture, session persistence on an iPhone, App Store Connect acceptance, or a TestFlight installation. Those require the Mac/device steps below. Finish the live web deployment before the phone acceptance check.

## Behavior and boundaries

- `/doctor` and its descendants, `/coordinator` and its descendants, and the exact `/api/demo-login` path stay in the shell only on the configured HTTPS origin. Query strings are supported, including `/api/demo-login?next=/doctor`.
- Other ordinary HTTP(S) links tapped by the user open in the default browser. Automatic external redirects, subframe escapes, custom schemes, credentials in URLs, and ambiguous internal paths are blocked. The native wrapper does not follow arbitrary incoming deep links.
- The default persistent website data store retains the existing HttpOnly demo-session cookie. Enter the private demo access code on the web sign-in page. Never put it in the project, plist, URL, or build settings. Cookie expiry and server sign-out still apply; Safari has a separate session.
- Navy launch/loading/background and light status text match the web header. WebKit uses the full viewport; the existing `PhoneShell` CSS owns the notch and home-indicator insets. Native back-swipe is enabled, alongside the web back buttons.
- Network failures, main-frame 404/5xx, and WebKit process termination show “Can't reach FirstDose” with Retry. Retry issues a fresh GET to `/doctor`, so it cannot resubmit an old form. The wrapper has no native fake-data fallback. The deployed app must itself use live mode; the wrapper does not override server configuration.
- Microphone requests prompt the user only for a main frame on the configured origin and allowed page. Camera and combined camera/microphone requests are denied. The plist explains handoff recording; recording still begins only through the web button. No audio is stored by native code.

## Prepare on a Mac

Install Xcode, its iOS simulator runtime, and [XcodeGen](https://github.com/yonaskolb/XcodeGen). The project targets iOS 16 or newer and an iPhone. Use an Xcode version currently accepted by App Store Connect.

From the repository root:

```sh
cd ios
brew install xcodegen
swift test
swift scripts/make-icon.swift
xcodegen generate --spec project.yml
xcodebuild -list -project FirstDoseRx.xcodeproj
open FirstDoseRx.xcodeproj
```

The icon generator uses only AppKit and produces a 1024px opaque PNG. Inspect that icon before archiving. Generated projects, icons, Swift build products, archives, and personal configuration are ignored by `ios/.gitignore`; regenerate them after a fresh checkout.

In Xcode's **Signing & Capabilities**, select your Apple Developer team and a bundle identifier registered to that team. `app.firstdose.rx` in `project.yml` is a proposed identifier, not an assertion that the team owns it. Change that setting in `project.yml` before regenerating. Never commit certificates, provisioning profiles, account tokens, or a personal team configuration. Automatic signing is enabled; no capabilities or entitlements need adding.

The production origin is a public, non-secret value in `ios/FirstDoseRx/Info.plist` under `FirstDoseOrigin`. To test a deployed HTTPS preview, replace that value with its exact origin (no path, query, or fragment), then rebuild. Do not disable App Transport Security or add blanket host exceptions. Restore the production origin for the demo archive.

Build on an installed iPhone simulator, selected through Xcode, or list destinations and use its concrete ID:

```sh
xcodebuild -showdestinations -project FirstDoseRx.xcodeproj -scheme FirstDoseRx
xcodebuild -project FirstDoseRx.xcodeproj -scheme FirstDoseRx \
  -destination 'platform=iOS Simulator,id=YOUR_SIMULATOR_UUID' \
  -derivedDataPath DerivedData CODE_SIGNING_ALLOWED=NO build
```

`swift test` compiles the exact navigation policy imported by the app. It covers allowed routes/login, path boundaries, scheme/host/port checks, credential-bearing URLs, encoded traversal, and microphone-origin matching. UIKit/WebKit behavior is verified separately on the simulator and real iPhone.

## Archive and invite an internal tester

1. Confirm the live web deployment and private sign-in work in Safari. In App Store Connect, create/select the FirstDose Rx app using the registered bundle identifier.
2. In Xcode, select **Any iOS Device**, then **Product → Archive**. Fix any compile or validation errors before distributing. Increase `CURRENT_PROJECT_VERSION` in `project.yml` for each subsequent upload and regenerate the project.
3. In Organizer, validate the archive and choose **Distribute App → App Store Connect** for internal TestFlight testing. Complete Apple's current signing, privacy, and export-compliance questions truthfully for the deployed app and wrapper; do not assume answers from this source preparation.
4. After processing finishes, add the build to the team's internal TestFlight group and install it on the demo iPhone. Do not submit this weekend shell for public App Store release.
5. Record the actual build number and observed acceptance results in a separate `status: 6.13 ...` PLAN.md commit. Source readiness alone does not complete that row.

## Phone acceptance

- [ ] Install the uploaded TestFlight build; launch full screen with the correct icon and no white launch flash.
- [ ] Sign in through the web form. Force quit and relaunch; verify the valid session persists. Verify expired/invalid sessions return to sign-in without bundling the code.
- [ ] Test `/doctor`, `/doctor/new`, `/doctor/patients/pt_maria`, `/doctor/patients/pt_james`, `/doctor/concierge`, `/doctor/profile`, and the coordinator handoff. Check tabs, back buttons, native back-swipe, keyboard, notch, home indicator, and larger text.
- [ ] Tap an external DailyMed/source link; it opens in the default browser. Return to the app and confirm its session and route remain usable.
- [ ] Launch without connectivity; confirm Retry appears. Restore connectivity and retry. Also check a server-error response; no stale page is presented as a new success.
- [ ] In live mode, allow and deny microphone permission in separate runs. Confirm handoff review works when allowed and the existing text path works when denied. No camera prompt should appear.
- [ ] Exercise the real Sign and send → coordinator → pharmacy-fill flow across devices. Confirm current events after backgrounding and resuming.
- [ ] Separately verify the physical Apple Watch notification, then record the device/build evidence.

## Watch receipt remains separate

The wrapper does not register for APNs. Watch notifications come from the **ntfy** app on the paired iPhone subscribed to the team's private topic. Configure iPhone/Watch notification mirroring and test with the phone locked; do not assume a successful server delivery proves wrist receipt. Confirm on the actual Apple Watch and then verify the updated Rx Alert after unlocking. The existing Garmin evidence does not substitute for this check.

## API references checked

- Apple's [default website data store](https://developer.apple.com/documentation/webkit/wkwebsitedatastore/default()) persists WebKit data to disk.
- Apple's [media-capture permission delegate](https://developer.apple.com/documentation/webkit/wkuidelegate/webview(_:requestmediacapturepermissionfor:initiatedbyframe:type:decisionhandler:)) provides the origin, frame, requested device type, and prompt/deny decision (iOS 15+).
- [XcodeGen project specification](https://github.com/yonaskolb/XcodeGen/blob/master/Docs/ProjectSpec.md) defines the local Swift package, app target, scheme, and build settings used here.
- Apple's [internal TestFlight testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/) guide covers internal groups and build access after upload.
