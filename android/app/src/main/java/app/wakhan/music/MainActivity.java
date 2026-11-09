package app.wakhan.music;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WakhanVaultPlugin.class);
        registerPlugin(WakhanLocalePlugin.class);
        super.onCreate(savedInstanceState);
        View web = getBridge().getWebView();
        web.setBackgroundColor(android.graphics.Color.rgb(7, 16, 25));
        // Android 15+ draws apps under the status and navigation bars. Keep Wakhan's page
        // inside the visible area on every phone (notch, gesture bar, keyboard).
        ViewCompat.setOnApplyWindowInsetsListener(web, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            ViewGroup.LayoutParams lp = v.getLayoutParams();
            if (lp instanceof ViewGroup.MarginLayoutParams) {
                ViewGroup.MarginLayoutParams m = (ViewGroup.MarginLayoutParams) lp;
                int bottom = Math.max(bars.bottom, ime.bottom);
                if (m.topMargin != bars.top || m.bottomMargin != bottom || m.leftMargin != bars.left || m.rightMargin != bars.right) {
                    m.setMargins(bars.left, bars.top, bars.right, bottom);
                    v.setLayoutParams(m);
                }
            }
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(web);
    }
}
