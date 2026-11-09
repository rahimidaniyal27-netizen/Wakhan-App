package app.wakhan.music;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WakhanVaultPlugin.class);
        registerPlugin(WakhanLocalePlugin.class);
        super.onCreate(savedInstanceState);
        getBridge().getWebView().setBackgroundColor(android.graphics.Color.rgb(7, 16, 25));
    }
}
