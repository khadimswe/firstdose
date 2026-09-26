import Foundation

public struct NavigationPolicy {
    public enum Destination: Equatable { case internalPage, externalPage, blocked }
    private let host: String
    private let port: Int
    public let homeURL: URL

    public init?(origin: URL) {
        guard let parts = URLComponents(url: origin, resolvingAgainstBaseURL: false),
              parts.scheme?.lowercased() == "https",
              let host = parts.host, !host.isEmpty,
              parts.user == nil, parts.password == nil,
              parts.query == nil, parts.fragment == nil,
              parts.path.isEmpty || parts.path == "/" else { return nil }
        self.host = host.lowercased()
        self.port = parts.port ?? 443
        self.homeURL = origin.appendingPathComponent("doctor")
    }

    public func isTrustedOrigin(scheme: String, host: String, port: Int) -> Bool {
        scheme.lowercased() == "https" && host.lowercased() == self.host
            && (port == 0 ? 443 : port) == self.port
    }

    public func destination(_ url: URL?) -> Destination {
        guard let url, let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let scheme = parts.scheme?.lowercased(), ["http", "https"].contains(scheme),
              let host = parts.host, !host.isEmpty,
              parts.user == nil, parts.password == nil else { return .blocked }
        guard isTrustedOrigin(scheme: scheme, host: host, port: parts.port ?? (scheme == "https" ? 443 : 80)) else {
            return .externalPage
        }
        let path = parts.percentEncodedPath
        // These routes have ASCII path segments. Reject ambiguous decoding and traversal.
        guard !path.contains("%"), !path.contains("\\"), !path.contains("//"),
              !path.split(separator: "/").contains(where: { $0 == "." || $0 == ".." }) else { return .blocked }
        if path == "/api/demo-login" || path == "/doctor" || path.hasPrefix("/doctor/")
            || path == "/coordinator" || path.hasPrefix("/coordinator/") {
            return .internalPage
        }
        return .externalPage
    }
}
