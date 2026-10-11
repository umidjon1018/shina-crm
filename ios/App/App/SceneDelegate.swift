import UIKit
import WebKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = SicrmViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

// Web ilova uchun ko'prik (src/utils/nativeBridge.js) — Android'dagi window.SicrmNative bilan bir xil:
// printHtml → iOS chop etish oynasi (AirPrint yoki PDF), saveFile → "Ulashish" oynasi. Faqat *.sicrm.uz sahifalarida.
class SicrmViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private var printJob: PrintJob?

    private static func trusted(_ url: URL?) -> Bool {
        guard let url = url, url.scheme == "https", let host = url.host else { return false }
        return host == "sicrm.uz" || host.hasSuffix(".sicrm.uz")
    }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        let js = """
        (function () {
          var h = location.hostname;
          if (location.protocol !== 'https:' || !(h === 'sicrm.uz' || h.endsWith('.sicrm.uz'))) return;
          var post = function (m) { window.webkit.messageHandlers.sicrmNative.postMessage(m) };
          window.SicrmNative = {
            printHtml: function (html, title) { post({ type: 'print', html: String(html || ''), title: String(title || 'SICRM') }) },
            saveFile: function (data, name, mime) { post({ type: 'save', data: String(data || ''), name: String(name || 'fayl'), mime: String(mime || '') }) }
          };
        })();
        """
        guard let controller = webView?.configuration.userContentController else { return }
        controller.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        controller.add(self, name: "sicrmNative")
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, SicrmViewController.trusted(message.frameInfo.request.url),
              let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        if type == "print", let html = body["html"] as? String {
            let base = message.frameInfo.request.url.flatMap { URL(string: "\($0.scheme ?? "https")://\($0.host ?? "")/") }
            printJob = PrintJob(html: html, baseURL: base, title: (body["title"] as? String) ?? "SICRM") { [weak self] in self?.printJob = nil }
        } else if type == "save", let b64 = body["data"] as? String, let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters) {
            var name = (body["name"] as? String) ?? "fayl"
            name = name.components(separatedBy: CharacterSet(charactersIn: "/\\:*?\"<>|")).joined(separator: "_")
            if name.isEmpty || name.count > 120 { name = "fayl" }
            let dir = FileManager.default.temporaryDirectory.appendingPathComponent("shared", isDirectory: true)
            try? FileManager.default.removeItem(at: dir)
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            let file = dir.appendingPathComponent(name)
            do { try data.write(to: file) } catch { return }
            let share = UIActivityViewController(activityItems: [file], applicationActivities: nil)
            share.popoverPresentationController?.sourceView = view
            share.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            present(share, animated: true)
        }
    }
}

// HTML hujjatni yashirin WKWebView'da ochib (SVG barkod, rasmlar to'g'ri chiqishi uchun) chop etish oynasini ko'rsatadi
final class PrintJob: NSObject, WKNavigationDelegate {
    private let webView: WKWebView
    private let title: String
    private let done: () -> Void

    init(html: String, baseURL: URL?, title: String, done: @escaping () -> Void) {
        self.webView = WKWebView(frame: CGRect(x: 0, y: 0, width: 800, height: 1100))
        self.title = title
        self.done = done
        super.init()
        webView.navigationDelegate = self
        webView.loadHTMLString(html, baseURL: baseURL)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let info = UIPrintInfo(dictionary: nil)
        info.outputType = .general
        info.jobName = title
        let pc = UIPrintInteractionController.shared
        pc.printInfo = info
        pc.printFormatter = webView.viewPrintFormatter()
        pc.present(animated: true) { [weak self] _, _, _ in self?.done() }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { done() }
}
