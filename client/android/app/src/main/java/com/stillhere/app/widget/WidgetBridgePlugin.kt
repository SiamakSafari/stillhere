package com.stillhere.app.widget

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Capacitor plugin that bridges JavaScript calls to native Android widget functionality
 */
@CapacitorPlugin(name = "WidgetBridge")
class WidgetBridgePlugin : Plugin() {

    /**
     * Updates the widget with new data from the JavaScript layer
     */
    @PluginMethod
    fun updateWidget(call: PluginCall) {
        val streak = call.getInt("streak", 0) ?: 0
        val lastCheckIn = call.getString("lastCheckIn")
        val hasCheckedInToday = call.getBoolean("hasCheckedInToday", false) ?: false
        val checkInWindowStart = call.getString("checkInWindowStart")
        val checkInWindowEnd = call.getString("checkInWindowEnd")
        val isOnVacation = call.getBoolean("isOnVacation", false) ?: false

        // Save data to SharedPreferences
        val dataStore = WidgetDataStore(context)
        val data = WidgetDataStore.WidgetData(
            streak = streak,
            lastCheckIn = lastCheckIn,
            hasCheckedInToday = hasCheckedInToday,
            checkInWindowStart = checkInWindowStart,
            checkInWindowEnd = checkInWindowEnd,
            isOnVacation = isOnVacation
        )
        dataStore.save(data)

        // Refresh all widget instances
        StillHereWidget.refreshAllWidgets(context)

        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    /**
     * Gets the current widget data (for debugging/sync purposes)
     */
    @PluginMethod
    fun getWidgetData(call: PluginCall) {
        val dataStore = WidgetDataStore(context)
        val data = dataStore.load()

        val ret = JSObject()
        ret.put("streak", data.streak)
        ret.put("lastCheckIn", data.lastCheckIn)
        ret.put("hasCheckedInToday", data.hasCheckedInToday)
        ret.put("checkInWindowStart", data.checkInWindowStart)
        ret.put("checkInWindowEnd", data.checkInWindowEnd)
        ret.put("isOnVacation", data.isOnVacation)
        call.resolve(ret)
    }
}
