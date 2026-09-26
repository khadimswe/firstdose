import SwiftUI
import WebKit
import FirstDoseNavigation

struct DoctorWebView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> DoctorViewController { DoctorViewController() }
    func updateUIViewController(_ controller: DoctorViewController, context: Context) {}
}

@MainActor
final class DoctorViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private var webView: WKWebView!
    private var policy: NavigationPolicy?
    private let failure = UIStackView()
    private let failureTitle = UILabel()
    private let spinner = UIActivityIndicatorView(style: .large)
    private var unavailable = false
    private let navy = UIColor(red: 28/255, green: 33/255, blue: 80/255, alpha: 1)

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = navy
        if let raw = Bundle.main.object(forInfoDictionaryKey: "FirstDoseOrigin") as? String,
           let origin = URL(string: raw) {
            policy = NavigationPolicy(origin: origin)
        }
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = false
        webView.backgroundColor = navy
        webView.scrollView.backgroundColor = navy
        // The existing web viewport and PhoneShell own the notch/home-indicator insets.
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        configureFailure()
        spinner.color = .white
        spinner.accessibilityLabel = "Loading FirstDose"
        spinner.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(spinner)
        NSLayoutConstraint.activate([
            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        retry()
    }

    private func configureFailure() {
        failure.axis = .vertical
        failure.spacing = 20
        failure.alignment = .center
        failure.translatesAutoresizingMaskIntoConstraints = false
        failureTitle.text = "Can't reach FirstDose"
        failureTitle.font = .preferredFont(forTextStyle: .title2)
        failureTitle.adjustsFontForContentSizeCategory = true
        failureTitle.textColor = .white
        failureTitle.numberOfLines = 0
        failureTitle.textAlignment = .center
        failureTitle.accessibilityTraits.insert(.header)
        let detail = UILabel()
        detail.text = "Check your connection and try again."
        detail.textColor = .white
        detail.font = .preferredFont(forTextStyle: .body)
        detail.adjustsFontForContentSizeCategory = true
        detail.numberOfLines = 0
        detail.textAlignment = .center
        let retryButton = UIButton(type: .system)
        retryButton.setTitle("Retry", for: .normal)
        retryButton.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        retryButton.titleLabel?.adjustsFontForContentSizeCategory = true
        retryButton.tintColor = .white
        retryButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
        retryButton.addTarget(self, action: #selector(retry), for: .touchUpInside)
        [failureTitle, detail, retryButton].forEach(failure.addArrangedSubview)
        view.addSubview(failure)
        NSLayoutConstraint.activate([
            failure.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
            failure.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 28),
            failure.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -28)
        ])
    }

    @objc private func retry() {
        guard let policy else {
            showFailure(title: "FirstDose configuration unavailable")
            return
        }
        unavailable = false
        failure.isHidden = true
        webView.isHidden = false
        spinner.startAnimating()
        // A fresh GET avoids replaying a failed login/form submission.
        var request = URLRequest(url: policy.homeURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30)
        request.httpMethod = "GET"
        webView.load(request)
    }

    private func showFailure(title: String = "Can't reach FirstDose") {
        unavailable = true
        spinner.stopAnimating()
        webView.isHidden = true
        failureTitle.text = title
        failure.isHidden = false
        UIAccessibility.post(notification: .screenChanged, argument: failureTitle)
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let destination = policy?.destination(action.request.url) ?? .blocked
        // Subframes cannot launch Safari or navigate the shell.
        if let frame = action.targetFrame, !frame.isMainFrame {
            decisionHandler(destination == .internalPage ? .allow : .cancel)
            return
        }
        switch destination {
        case .internalPage:
            if action.targetFrame == nil {
                decisionHandler(.cancel)
                webView.load(action.request)
            } else {
                decisionHandler(.allow)
            }
        case .externalPage:
            decisionHandler(.cancel)
            if action.navigationType == .linkActivated, let url = action.request.url {
                UIApplication.shared.open(url)
            } else {
                showFailure(title: "FirstDose navigation unavailable")
            }
        case .blocked:
            decisionHandler(.cancel)
            if action.navigationType != .linkActivated {
                showFailure(title: "FirstDose navigation unavailable")
            }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        if response.isForMainFrame,
           let http = response.response as? HTTPURLResponse,
           http.statusCode >= 500 || http.statusCode == 404 {
            showFailure()
            decisionHandler(.cancel)
        } else {
            decisionHandler(.allow)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        spinner.stopAnimating()
        if !unavailable { failure.isHidden = true }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        handleFailure(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        handleFailure(error)
    }

    private func handleFailure(_ error: Error) {
        let native = error as NSError
        if native.domain == NSURLErrorDomain && native.code == NSURLErrorCancelled { return }
        showFailure()
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { showFailure() }

    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        let trusted = policy?.isTrustedOrigin(scheme: origin.protocol, host: origin.host, port: origin.port) == true
        let trustedPage = policy?.destination(frame.request.url) == .internalPage
        decisionHandler(type == .microphone && frame.isMainFrame && trusted && trustedPage ? .prompt : .deny)
    }
}
