package app.wakhan.music;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WakhanVaultPlugin.class);
        registerPlugin(WakhanLocalePlugin.class);
        registerPlugin(WakhanAudioSessionPlugin.class);
        super.onCreate(savedInstanceState);
        View web = getBridge().getWebView();
        web.setBackgroundColor(android.graphics.Color.rgb(7, 16, 25));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getBridge().getWebView().setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            // On older Android, the window owns IME resizing. Never subtract it again.
            WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
            getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            return;
        }

        // Android 11+: consume edge-to-edge and IME insets in exactly one place.
        // Capacitor's resizeOnFullScreen must be false with this configuration.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
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
            // The WebView has already been resized by the margins above. Pass
            // explicit zero insets so Chromium does not subtract them again.
            // CONSUMED can leave stale CSS safe-area values in recent WebViews.
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime(),
                    Insets.of(0, 0, 0, 0)
                )
                .build();
        });
        ViewCompat.requestApplyInsets(web);
    }
}
