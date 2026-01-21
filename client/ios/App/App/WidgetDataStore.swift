import Foundation

/// Shared data store for widget data using App Groups
/// This file should be included in BOTH the main app target AND the widget extension target
/// Both the main app and widget extension can access this data
class WidgetDataStore {
    static let shared = WidgetDataStore()

    // App Group identifier - must match the one configured in Xcode
    // To set up App Groups:
    // 1. Go to your app target's Signing & Capabilities
    // 2. Add "App Groups" capability
    // 3. Create a new group with identifier "group.app.stillhere"
    // 4. Repeat for the widget extension target
    private let appGroupId = "group.app.stillhere"

    private var userDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }

    // Keys for stored values
    private enum Keys {
        static let streak = "widget_streak"
        static let lastCheckIn = "widget_last_check_in"
        static let hasCheckedInToday = "widget_has_checked_in_today"
        static let checkInWindowStart = "widget_check_in_window_start"
        static let checkInWindowEnd = "widget_check_in_window_end"
        static let isOnVacation = "widget_is_on_vacation"
    }

    struct WidgetData {
        var streak: Int
        var lastCheckIn: String?
        var hasCheckedInToday: Bool
        var checkInWindowStart: String?
        var checkInWindowEnd: String?
        var isOnVacation: Bool
    }

    /// Save widget data from the main app
    func save(_ data: WidgetData) {
        guard let defaults = userDefaults else {
            print("[WidgetDataStore] Failed to access App Group UserDefaults")
            return
        }

        defaults.set(data.streak, forKey: Keys.streak)
        defaults.set(data.lastCheckIn, forKey: Keys.lastCheckIn)
        defaults.set(data.hasCheckedInToday, forKey: Keys.hasCheckedInToday)
        defaults.set(data.checkInWindowStart, forKey: Keys.checkInWindowStart)
        defaults.set(data.checkInWindowEnd, forKey: Keys.checkInWindowEnd)
        defaults.set(data.isOnVacation, forKey: Keys.isOnVacation)

        defaults.synchronize()
    }

    /// Load widget data for display
    func load() -> WidgetData {
        guard let defaults = userDefaults else {
            print("[WidgetDataStore] Failed to access App Group UserDefaults")
            return WidgetData(
                streak: 0,
                lastCheckIn: nil,
                hasCheckedInToday: false,
                checkInWindowStart: nil,
                checkInWindowEnd: nil,
                isOnVacation: false
            )
        }

        return WidgetData(
            streak: defaults.integer(forKey: Keys.streak),
            lastCheckIn: defaults.string(forKey: Keys.lastCheckIn),
            hasCheckedInToday: defaults.bool(forKey: Keys.hasCheckedInToday),
            checkInWindowStart: defaults.string(forKey: Keys.checkInWindowStart),
            checkInWindowEnd: defaults.string(forKey: Keys.checkInWindowEnd),
            isOnVacation: defaults.bool(forKey: Keys.isOnVacation)
        )
    }
}
