import UIKit
import WebKit
import Capacitor

enum WakhanOrientation {
    static var fullscreen = false
    static var mask: UIInterfaceOrientationMask { fullscreen ? .allButUpsideDown : .portrait }
}

/// Wakhan's page lives inside the visible part of every iPhone
/// (below the Dynamic Island / notch, above the home bar).
/// The Capacitor screen is placed as a child inside the safe area.
class WakhanBridgeViewController: CAPBridgeViewController {
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { WakhanOrientation.mask }
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WakhanLocalePlugin())
        bridge?.registerPluginInstance(WakhanAudioSessionPlugin())
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardFrame(_:)), name: UIResponder.keyboardWillChangeFrameNotification, object: nil)
    }

    deinit { NotificationCenter.default.removeObserver(self) }

    @objc private func keyboardFrame(_ notification: Notification) {
        guard let web = bridge?.webView, let window = web.window,
              let frame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect else { return }
        let inWindow = window.convert(frame, from: window.screen.coordinateSpace)
        let inWeb = web.convert(inWindow, from: window)
        let intersection = web.bounds.intersection(inWeb)
        let overlap = intersection.isNull ? 0 : intersection.height
        let duration = (notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? NSNumber)?.doubleValue ?? 0.25
        let curve = (notification.userInfo?[UIResponder.keyboardAnimationCurveUserInfoKey] as? NSNumber)?.intValue ?? 0
        let data: [String: Any] = ["overlap": overlap, "duration": duration, "curve": curve]
        guard let encoded = try? JSONSerialization.data(withJSONObject: data),
              let json = String(data: encoded, encoding: .utf8) else { return }
        bridge?.triggerWindowJSEvent(eventName: "wakhanKeyboardFrame", data: json)
    }
}

class MainViewController: UIViewController {
    private let child = WakhanBridgeViewController()
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { WakhanOrientation.mask }

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
