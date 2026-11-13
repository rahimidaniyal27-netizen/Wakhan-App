package app.wakhan.music;
import android.os.LocaleList;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name = "WakhanLocale")
public class WakhanLocalePlugin extends Plugin {
    @PluginMethod public void orientation(PluginCall call) {
        final boolean fullscreen = Boolean.TRUE.equals(call.getBoolean("fullscreen", false));
        getActivity().runOnUiThread(() -> {
            getActivity().setRequestedOrientation(fullscreen
                ? android.content.pm.ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR
                : android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            call.resolve();
        });
    }
    @PluginMethod public void preferred(PluginCall call) {
        LocaleList locales = LocaleList.getDefault(); JSArray tags = new JSArray();
        for (int i = 0; i < locales.size(); i++) tags.put(locales.get(i).toLanguageTag());
        JSObject result = new JSObject(); result.put("languages", tags);
        result.put("country", java.util.Locale.getDefault().getCountry()); call.resolve(result);
    }
    /** Basic compatibility information; no account data or device identifier. */
    @PluginMethod public void device(PluginCall call) {
        android.app.ActivityManager manager = (android.app.ActivityManager) getContext().getSystemService(android.content.Context.ACTIVITY_SERVICE);
        android.app.ActivityManager.MemoryInfo memory = new android.app.ActivityManager.MemoryInfo();
        manager.getMemoryInfo(memory);
        JSObject info = new JSObject();
        info.put("model", android.os.Build.MODEL);
        info.put("manufacturer", android.os.Build.MANUFACTURER);
        info.put("android", android.os.Build.VERSION.RELEASE);
        info.put("sdk", android.os.Build.VERSION.SDK_INT);
        info.put("totalRamBytes", memory.totalMem);
        info.put("lowRam", manager.isLowRamDevice());
        if (android.os.Build.VERSION.SDK_INT >= 26) {
            android.content.pm.PackageInfo provider = android.webkit.WebView.getCurrentWebViewPackage();
            if (provider != null) info.put("webView", provider.versionName);
        }
        call.resolve(info);
    }
    /** colour behind the status / navigation bars, and dark or light bar icons to match */
    @PluginMethod public void bars(PluginCall call) {
        final String hex = call.getString("color", "#071019");
        getActivity().runOnUiThread(() -> {
            try {
                int c = Color.parseColor(hex);
                Window w = getActivity().getWindow();
                View decor = w.getDecorView();
                decor.setBackgroundColor(c);
                View web = getBridge().getWebView();
                if (web.getParent() instanceof View) ((View) web.getParent()).setBackgroundColor(c);
                double lum = (0.299 * Color.red(c) + 0.587 * Color.green(c) + 0.114 * Color.blue(c)) / 255.0;
                WindowInsetsControllerCompat ctl = WindowCompat.getInsetsController(w, decor);
                ctl.setAppearanceLightStatusBars(lum > 0.6);
                ctl.setAppearanceLightNavigationBars(lum > 0.6);
                call.resolve();
            } catch (Exception e) { call.reject("bad colour"); }
        });
    }
}
