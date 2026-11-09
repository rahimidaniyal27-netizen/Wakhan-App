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
    @PluginMethod public void preferred(PluginCall call) {
        LocaleList locales = LocaleList.getDefault(); JSArray tags = new JSArray();
        for (int i = 0; i < locales.size(); i++) tags.put(locales.get(i).toLanguageTag());
        JSObject result = new JSObject(); result.put("languages", tags); call.resolve(result);
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
