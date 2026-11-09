import UIKit
import WebKit
import Capacitor

/// Keeps Wakhan's page inside the visible part of every iPhone
/// (below the Dynamic Island / notch, above the home bar).
class MainViewController: CAPBridgeViewController {
    private let holder = UIView()

    override func loadView() {
        super.loadView()                       // Capacitor makes the web view the main view
        guard let web = view else { return }
        holder.backgroundColor = UIColor(red: 7/255, green: 16/255, blue: 25/255, alpha: 1)
        view = holder
        holder.addSubview(web)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        guard let web = webView else { return }
        let g = holder.safeAreaInsets
        web.frame = CGRect(x: g.left, y: g.top,
                           width: holder.bounds.width - g.left - g.right,
                           height: holder.bounds.height - g.top - g.bottom)
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WakhanLocalePlugin())
    }
}
