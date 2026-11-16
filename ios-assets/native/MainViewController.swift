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
        // The page is not resized for the keyboard (Keyboard resize: none). Instead it is told exactly how much of it the
        // keyboard covers, with the keyboard's own timing, so message bars can sit right on top of the keyboard.
        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(keyboardFrame(_:)), name: UIResponder.keyboardWillChangeFrameNotification, object: nil)
        nc.addObserver(self, selector: #selector(keyboardFrame(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
        nc.addObserver(self, selector: #selector(keyboardGone(_:)), name: UIResponder.keyboardDidHideNotification, object: nil)
        // Nothing of the page is ever drawn behind the clock or the home bar, even for a moment.
        web.clipsToBounds = true
        child.webView?.clipsToBounds = true
        child.webView?.scrollView.clipsToBounds = true
    }

    /// iPhone pushes the whole page up to show a text field, and with «resize: none» it does not always bring it back when the
    /// keyboard closes: the next pages then sit under the clock. The page's position from before the keyboard is kept and put
    /// back exactly when the keyboard has gone.
    private var beforeKeyboard: CGPoint?
    private func restoreScroll(animated: Bool) {
        guard let sv = child.webView?.scrollView, let p = beforeKeyboard else { return }
        let maxY = max(0, sv.contentSize.height - sv.bounds.height)
        let target = CGPoint(x: p.x, y: min(max(0, p.y), maxY))
        if abs(sv.contentOffset.y - target.y) > 0.5 || abs(sv.contentOffset.x - target.x) > 0.5 { sv.setContentOffset(target, animated: animated) }
    }
    @objc private func keyboardGone(_ note: Notification) {
        restoreScroll(animated: false)
        beforeKeyboard = nil
    }

    @objc private func keyboardFrame(_ note: Notification) {
        guard let web = child.webView, let info = note.userInfo else { return }
        let end = (info[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue)?.cgRectValue ?? .zero
        let duration = (info[UIResponder.keyboardAnimationDurationUserInfoKey] as? NSNumber)?.doubleValue ?? 0.25
        let curve = (info[UIResponder.keyboardAnimationCurveUserInfoKey] as? NSNumber)?.intValue ?? 7
        var overlap: CGFloat = 0
        if note.name != UIResponder.keyboardWillHideNotification, let win = web.window {
            let kb = win.convert(end, from: nil)
            let page = web.convert(web.bounds, to: win)
            if kb.height > 0 && kb.minY < win.bounds.maxY { overlap = max(0, page.maxY - kb.minY) }
        }
        if overlap > 0 && beforeKeyboard == nil { beforeKeyboard = web.scrollView.contentOffset }
        if note.name == UIResponder.keyboardWillHideNotification || overlap == 0 { restoreScroll(animated: true) }
        let js = "window.dispatchEvent(new CustomEvent('wakhanKeyboardFrame',{detail:{overlap:\(Double(overlap)),duration:\(duration),curve:\(curve)}}))"
        web.evaluateJavaScript(js, completionHandler: nil)
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
