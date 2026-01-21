package com.stillhere.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.stillhere.app.widget.WidgetBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before super.onCreate
        registerPlugin(WidgetBridgePlugin.class);

        super.onCreate(savedInstanceState);
    }
}
