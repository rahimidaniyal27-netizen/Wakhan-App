package app.wakhan.music;
import android.os.LocaleList;
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
}
