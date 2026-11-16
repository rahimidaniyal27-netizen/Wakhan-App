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

/// Portrait everywhere; landscape only while a film is full screen.
enum WakhanOrientationState { static var landscape = false }

class MainViewController: UIViewController {
    static weak var current: MainViewController?
    private let child = WakhanBridgeViewController()
    private var inside: [NSLayoutConstraint] = []
    private var edges: [NSLayoutConstraint] = []
    private var full = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 7/255, green: 16/255, blue: 25/255, alpha: 1)
        addChild(child)
        let web = child.view!
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        let g = view.safeAreaLayoutGuide
        inside = [
            web.topAnchor.constraint(equalTo: g.topAnchor),
            web.bottomAnchor.constraint(equalTo: g.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: g.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: g.trailingAnchor)
        ]
        edges = [
            web.topAnchor.constraint(equalTo: view.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ]
        NSLayoutConstraint.activate(inside)
        child.didMove(toParent: self)
        MainViewController.current = self
    }

    /// true: the page fills the whole screen (its own design keeps clear of the clock and the home bar).
    func setEdge(_ on: Bool) {
        guard isViewLoaded, on != full else { return }
        full = on
        if on {
            NSLayoutConstraint.deactivate(inside)
            NSLayoutConstraint.activate(edges)
        } else {
            NSLayoutConstraint.deactivate(edges)
            NSLayoutConstraint.activate(inside)
        }
        view.setNeedsLayout()
        view.layoutIfNeeded()
    }

    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { WakhanOrientationState.landscape ? .landscape : .portrait }
    override var shouldAutorotate: Bool { true }
    override var childForStatusBarStyle: UIViewController? { child }
    override var childForStatusBarHidden: UIViewController? { child }
}
