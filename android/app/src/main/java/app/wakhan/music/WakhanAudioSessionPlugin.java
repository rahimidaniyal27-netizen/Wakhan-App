package app.wakhan.music;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.lang.ref.WeakReference;

@CapacitorPlugin(name = "WakhanAudioSession")
public class WakhanAudioSessionPlugin extends Plugin {
    private static WeakReference<WakhanAudioSessionPlugin> current = new WeakReference<>(null);

    @Override public void load() { current = new WeakReference<>(this); }

    @PluginMethod public void update(PluginCall call) {
        final boolean active = Boolean.TRUE.equals(call.getBoolean("active", false));
        final boolean requestedMic = Boolean.TRUE.equals(call.getBoolean("microphone", false));
        final boolean hall = Boolean.TRUE.equals(call.getBoolean("hall", false));
        getActivity().runOnUiThread(() -> {
            boolean visible = getActivity().hasWindowFocus();
            if (!active) {
                getContext().stopService(new Intent(getContext(), WakhanAudioSessionService.class));
                call.resolve();
                return;
            }
            if (!visible && !WakhanAudioSessionService.running) {
                call.reject("MEDIA_START_REQUIRES_FOREGROUND");
                return;
            }
            boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
            if (requestedMic && (!granted || (!visible && !WakhanAudioSessionService.microphone))) {
                call.reject("MICROPHONE_REQUIRES_FOREGROUND_PERMISSION");
                return;
            }
            Intent intent = new Intent(getContext(), WakhanAudioSessionService.class);
            intent.putExtra("microphone", requestedMic);
            intent.putExtra("hall", hall);
            try {
                ContextCompat.startForegroundService(getContext(), intent);
                call.resolve();
            } catch (RuntimeException error) {
                call.reject("MEDIA_SERVICE_UNAVAILABLE");
            }
        });
    }

    @PluginMethod public void state(PluginCall call) {
        JSObject value = new JSObject();
        value.put("active", WakhanAudioSessionService.running);
        value.put("microphone", WakhanAudioSessionService.microphone);
        call.resolve(value);
    }

    static void stopPlayback() {
        WakhanAudioSessionPlugin plugin = current.get();
        if (plugin != null) {
            plugin.getActivity().runOnUiThread(() -> plugin.notifyListeners("stop", new JSObject()));
        }
    }

    static void unavailable() {
        WakhanAudioSessionPlugin plugin = current.get();
        if (plugin != null) {
            plugin.getActivity().runOnUiThread(() -> {
                JSObject value = new JSObject();
                value.put("code", "MEDIA_SERVICE_UNAVAILABLE");
                plugin.notifyListeners("unavailable", value);
            });
        }
    }

    @Override protected void handleOnDestroy() {
        if (current.get() == this) {
            current.clear();
            getContext().stopService(new Intent(getContext(), WakhanAudioSessionService.class));
        }
    }
}
