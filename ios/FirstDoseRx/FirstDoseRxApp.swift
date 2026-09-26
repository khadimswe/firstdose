import SwiftUI

@main
struct FirstDoseRxApp: App {
    var body: some Scene {
        WindowGroup {
            DoctorWebView()
                .ignoresSafeArea(.container)
        }
    }
}
