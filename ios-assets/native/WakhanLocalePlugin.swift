import UIKit
import Capacitor

/// Same plugin name as on Android: phone languages, and the colour behind the bars.
@objc(WakhanLocalePlugin)
public class WakhanLocalePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WakhanLocalePlugin"
    public let jsName = "WakhanLocale"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "preferred", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "bars", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "orientation", returnType: CAPPluginReturnPromise)
    ]

    @objc func preferred(_ call: CAPPluginCall) {
        call.resolve(["languages": Locale.preferredLanguages])
    }

    @objc func bars(_ call: CAPPluginCall) {
        var hex = (call.getString("color") ?? "#071019").trimmingCharacters(in: .whitespaces)
        if hex.hasPrefix("#") { hex.removeFirst() }
        guard hex.count == 6, let n = UInt32(hex, radix: 16) else { call.reject("bad colour"); return }
        let c = UIColor(red: CGFloat((n >> 16) & 255) / 255, green: CGFloat((n >> 8) & 255) / 255, blue: CGFloat(n & 255) / 255, alpha: 1)
        DispatchQueue.main.async {
            let vc = self.bridge?.viewController
            (vc?.parent?.view ?? vc?.view)?.backgroundColor = c
            call.resolve()
        }
    }

    /// Full screen film: the app turns to landscape (and back to portrait) for real, so the keyboard turns with it.
    @objc func orientation(_ call: CAPPluginCall) {
        let full = call.getBool("fullscreen") ?? false
        DispatchQueue.main.async {
            WakhanOrientationState.landscape = full
            let mask: UIInterfaceOrientationMask = full ? .landscape : .portrait
            var root = self.bridge?.viewController
            while let p = root?.parent { root = p }
            if #available(iOS 16.0, *) {
                root?.setNeedsUpdateOfSupportedInterfaceOrientations()
                if let scene = root?.view.window?.windowScene {
                    scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask)) { _ in }
                }
            } else {
                UIDevice.current.setValue((full ? UIInterfaceOrientation.landscapeRight : .portrait).rawValue, forKey: "orientation")
                UIViewController.attemptRotationToDeviceOrientation()
            }
            call.resolve()
        }
    }
}
