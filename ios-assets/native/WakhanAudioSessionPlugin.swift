import AVFoundation
import Capacitor

/// Configures the iOS audio session for actual WebKit playback or hall voice.
/// It never records, creates a silent player, or requests microphone permission.
@objc(WakhanAudioSessionPlugin)
public class WakhanAudioSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WakhanAudioSessionPlugin"
    public let jsName = "WakhanAudioSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    private var active = false
    private var requestedActive = false
    private var hall = false
    private var microphone = false
    private var interrupted = false
    private var observers: [NSObjectProtocol] = []

    public override func load() {
        let center = NotificationCenter.default
        observers.append(center.addObserver(forName: AVAudioSession.interruptionNotification,
                                            object: nil, queue: .main) { [weak self] notification in
            guard let self = self,
                  let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
            if type == .began {
                guard self.active && self.requestedActive else { return }
                self.interrupted = true
                self.notifyListeners("unavailable", data: ["reason": "interruption"])
            } else {
                self.interrupted = false
                guard self.active && self.requestedActive else { return }
                if let options = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt,
                   AVAudioSession.InterruptionOptions(rawValue: options).contains(.shouldResume) {
                    do {
                        try AVAudioSession.sharedInstance().setActive(true)
                        self.notifyListeners("unavailable", data: ["reason": "resume"])
                    } catch {
                        self.active = false
                        self.notifyListeners("unavailable", data: ["reason": "session_unavailable"])
                    }
                } else {
                    self.notifyListeners("stop", data: ["reason": "interruption_ended"])
                }
            }
        })
        observers.append(center.addObserver(forName: AVAudioSession.routeChangeNotification,
                                            object: nil, queue: .main) { [weak self] notification in
            guard let self = self, self.active && self.requestedActive,
                  let raw = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
                  AVAudioSession.RouteChangeReason(rawValue: raw) == .oldDeviceUnavailable else { return }
            // Do not unexpectedly play a private conversation over the speaker
            // when headphones disconnect. JS stops the real tracks and player.
            self.notifyListeners("stop", data: ["reason": "output_disconnected"])
        })
    }

    @objc func update(_ call: CAPPluginCall) {
        let wantsActive = call.getBool("active") ?? false
        let wantsHall = call.getBool("hall") ?? false
        let wantsMicrophone = call.getBool("microphone") ?? false
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { call.reject("audio_session_unavailable"); return }
            self.requestedActive = wantsActive
            let session = AVAudioSession.sharedInstance()
            do {
                if wantsActive && self.interrupted {
                    call.resolve(["active": false, "interrupted": true])
                    return
                }
                if wantsActive {
                    if !self.active || self.hall != wantsHall || self.microphone != wantsMicrophone {
                        if wantsHall || wantsMicrophone {
                            try session.setCategory(.playAndRecord, mode: wantsHall ? .voiceChat : .default,
                                                    options: [.defaultToSpeaker, .allowBluetooth])
                        } else {
                            try session.setCategory(.playback, mode: .default, options: [])
                        }
                        try session.setActive(true)
                    }
                } else if self.active {
                    try session.setActive(false, options: .notifyOthersOnDeactivation)
                }
                self.active = wantsActive
                self.hall = wantsActive && wantsHall
                self.microphone = wantsActive && wantsMicrophone
                call.resolve(["active": self.active, "hall": self.hall, "microphone": self.microphone])
            } catch {
                call.reject("audio_session_unavailable")
            }
        }
    }

    deinit {
        for observer in observers { NotificationCenter.default.removeObserver(observer) }
    }
}
