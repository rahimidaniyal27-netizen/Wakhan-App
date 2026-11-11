import UIKit
import Capacitor

/// Same plugin name as on Android: phone languages, and the colour behind the bars.
@objc(WakhanLocalePlugin)
public class WakhanLocalePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WakhanLocalePlugin"
    public let jsName = "WakhanLocale"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "preferred", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "orientation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "bars", returnType: CAPPluginReturnPromise)
    ]

    @objc func preferred(_ call: CAPPluginCall) {
        call.resolve(["languages": Locale.preferredLanguages, "country": Locale.current.regionCode ?? ""])
    }

    @objc func orientation(_ call: CAPPluginCall) {
        let fullscreen = call.getBool("fullscreen") ?? false
        DispatchQueue.main.async {
            WakhanOrientation.fullscreen = fullscreen
            let controller = self.bridge?.viewController
            if #available(iOS 16.0, *) {
                controller?.setNeedsUpdateOfSupportedInterfaceOrientations()
                controller?.parent?.setNeedsUpdateOfSupportedInterfaceOrientations()
                controller?.view.window?.windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: WakhanOrientation.mask))
            } else {
                UIViewController.attemptRotationToDeviceOrientation()
            }
            call.resolve()
        }
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
}
