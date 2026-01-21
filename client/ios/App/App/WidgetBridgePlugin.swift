import Foundation
import Capacitor
import WidgetKit

/// Capacitor plugin that bridges JavaScript calls to native iOS widget functionality
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin {

    /// Updates the widget with new data from the JavaScript layer
    @objc func updateWidget(_ call: CAPPluginCall) {
        let streak = call.getInt("streak") ?? 0
        let lastCheckIn = call.getString("lastCheckIn")
        let hasCheckedInToday = call.getBool("hasCheckedInToday") ?? false
        let checkInWindowStart = call.getString("checkInWindowStart")
        let checkInWindowEnd = call.getString("checkInWindowEnd")
        let isOnVacation = call.getBool("isOnVacation") ?? false

        // Save data to shared App Group storage
        let data = WidgetDataStore.WidgetData(
            streak: streak,
            lastCheckIn: lastCheckIn,
            hasCheckedInToday: hasCheckedInToday,
            checkInWindowStart: checkInWindowStart,
            checkInWindowEnd: checkInWindowEnd,
            isOnVacation: isOnVacation
        )

        WidgetDataStore.shared.save(data)

        // Request widget refresh
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        call.resolve(["success": true])
    }

    /// Gets the current widget data (for debugging/sync purposes)
    @objc func getWidgetData(_ call: CAPPluginCall) {
        let data = WidgetDataStore.shared.load()

        call.resolve([
            "streak": data.streak,
            "lastCheckIn": data.lastCheckIn ?? NSNull(),
            "hasCheckedInToday": data.hasCheckedInToday,
            "checkInWindowStart": data.checkInWindowStart ?? NSNull(),
            "checkInWindowEnd": data.checkInWindowEnd ?? NSNull(),
            "isOnVacation": data.isOnVacation
        ])
    }
}
