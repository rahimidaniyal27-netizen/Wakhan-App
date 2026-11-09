import UIKit
import WebKit
import Capacitor

/// Wakhan's page lives inside the visible part of every iPhone
/// (below the Dynamic Island / notch, above the home bar).
/// The Capacitor screen is placed as a child inside the safe area.
class WakhanBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WakhanLocalePlugin())
    }
}

class MainViewController: UIViewController {
    private let child = WakhanBridgeViewController()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 7/255, green: 16/255, blue: 25/255, alpha: 1)
        addChild(child)
        let web = child.view!
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        let g = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: g.topAnchor),
            web.bottomAnchor.constraint(equalTo: g.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: g.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: g.trailingAnchor)
        ])
        child.didMove(toParent: self)
    }

    override var childForStatusBarStyle: UIViewController? { child }
    override var childForStatusBarHidden: UIViewController? { child }
}
