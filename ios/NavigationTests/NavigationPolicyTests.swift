import Foundation
import XCTest
@testable import FirstDoseNavigation

final class NavigationPolicyTests: XCTestCase {
    let policy = NavigationPolicy(origin: URL(string: "https://firstdose.vercel.app")!)!

    func testInternalRoutesAndLoginQuery() {
        for path in ["/doctor", "/doctor/new", "/doctor/profile", "/doctor/patients/pt_maria", "/coordinator", "/coordinator/prescribers", "/api/demo-login?next=%2Fdoctor"] {
            XCTAssertEqual(policy.destination(URL(string: "https://firstdose.vercel.app" + path)), .internalPage)
        }
        XCTAssertEqual(policy.destination(URL(string: "https://FIRSTDOSE.vercel.app:443/doctor")), .internalPage)
    }

    func testOtherPagesLeaveShell() {
        for value in ["https://firstdose.vercel.app/access", "https://firstdose.vercel.app/doctors", "https://firstdose.vercel.app/doctor-evil", "https://firstdose.vercel.app/api/demo-login/evil", "https://example.com/doctor", "https://firstdose.vercel.app.evil.com/doctor", "http://firstdose.vercel.app/doctor", "https://firstdose.vercel.app:444/doctor"] {
            XCTAssertEqual(policy.destination(URL(string: value)), .externalPage, value)
        }
    }

    func testUnsafeSchemesAndCredentialsAreBlocked() {
        for value in ["javascript:alert(1)", "data:text/html,test", "file:///doctor", "about:blank", "firstdose://doctor", "https://user:secret@firstdose.vercel.app/doctor"] {
            XCTAssertEqual(policy.destination(URL(string: value)), .blocked, value)
        }
        XCTAssertEqual(policy.destination(nil), .blocked)
    }

    func testAmbiguousPathsAreBlocked() {
        for path in ["/doctor/../access", "/doctor/%2e%2e/access", "/doctor/%252e%252e/access", "/doctor%2F..%2Faccess", "/doctor//new", "/doctor/%5caccess"] {
            XCTAssertEqual(policy.destination(URL(string: "https://firstdose.vercel.app" + path)), .blocked, path)
        }
    }

    func testConfigurationRequiresAnExactHTTPSOrigin() {
        for value in ["http://firstdose.vercel.app", "https://firstdose.vercel.app/doctor", "https://firstdose.vercel.app?key=secret", "https://user@firstdose.vercel.app", "https://firstdose.vercel.app#doctor"] {
            XCTAssertNil(NavigationPolicy(origin: URL(string: value)!))
        }
    }

    func testMicrophoneOriginHasNoSuffixOrPortBypass() {
        XCTAssertTrue(policy.isTrustedOrigin(scheme: "https", host: "firstdose.vercel.app", port: 443))
        XCTAssertTrue(policy.isTrustedOrigin(scheme: "https", host: "firstdose.vercel.app", port: 0))
        XCTAssertFalse(policy.isTrustedOrigin(scheme: "http", host: "firstdose.vercel.app", port: 80))
        XCTAssertFalse(policy.isTrustedOrigin(scheme: "https", host: "firstdose.vercel.app.evil.com", port: 443))
        XCTAssertFalse(policy.isTrustedOrigin(scheme: "https", host: "firstdose.vercel.app", port: 444))
    }
}
