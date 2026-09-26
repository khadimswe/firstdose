// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FirstDoseNavigation",
    products: [.library(name: "FirstDoseNavigation", targets: ["FirstDoseNavigation"])],
    targets: [
        .target(name: "FirstDoseNavigation", path: "Navigation"),
        .testTarget(name: "NavigationTests", dependencies: ["FirstDoseNavigation"], path: "NavigationTests")
    ]
)
