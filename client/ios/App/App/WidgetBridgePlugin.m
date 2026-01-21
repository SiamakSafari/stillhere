#import <Capacitor/Capacitor.h>

CAP_PLUGIN(WidgetBridgePlugin, "WidgetBridge",
    CAP_PLUGIN_METHOD(updateWidget, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getWidgetData, CAPPluginReturnPromise);
)
