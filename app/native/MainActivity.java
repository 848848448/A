package com.musicdirectory.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // Render at 100% regardless of the device's system font-size setting,
        // so the app always looks the right size.
        try {
            android.webkit.WebView wv = this.bridge.getWebView();
            if (wv != null) {
                wv.getSettings().setTextZoom(100);
            }
        } catch (Exception e) {
            // ignore
        }
    }
}
