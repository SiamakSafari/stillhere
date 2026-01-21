import WidgetKit
import SwiftUI

struct StillHereEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let hasCheckedInToday: Bool
    let isOnVacation: Bool
    let timeUntilWindow: String?
}

struct StillHereProvider: TimelineProvider {
    func placeholder(in context: Context) -> StillHereEntry {
        StillHereEntry(
            date: Date(),
            streak: 7,
            hasCheckedInToday: false,
            isOnVacation: false,
            timeUntilWindow: nil
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (StillHereEntry) -> ()) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StillHereEntry>) -> ()) {
        let entry = loadEntry()

        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }

    private func loadEntry() -> StillHereEntry {
        let data = WidgetDataStore.shared.load()

        // Calculate time until check-in window if applicable
        var timeUntilWindow: String? = nil
        if !data.hasCheckedInToday && !data.isOnVacation {
            if let windowStart = data.checkInWindowStart {
                timeUntilWindow = calculateTimeUntilWindow(windowStart: windowStart)
            }
        }

        return StillHereEntry(
            date: Date(),
            streak: data.streak,
            hasCheckedInToday: data.hasCheckedInToday,
            isOnVacation: data.isOnVacation,
            timeUntilWindow: timeUntilWindow
        )
    }

    private func calculateTimeUntilWindow(windowStart: String) -> String? {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"

        guard let startTime = formatter.date(from: windowStart) else { return nil }

        let now = Date()
        let calendar = Calendar.current

        // Create today's window start time
        var components = calendar.dateComponents([.year, .month, .day], from: now)
        let startComponents = calendar.dateComponents([.hour, .minute], from: startTime)
        components.hour = startComponents.hour
        components.minute = startComponents.minute

        guard let todayStart = calendar.date(from: components) else { return nil }

        // If window hasn't started yet, calculate time until
        if now < todayStart {
            let diff = calendar.dateComponents([.hour, .minute], from: now, to: todayStart)
            if let hours = diff.hour, let minutes = diff.minute {
                if hours > 0 {
                    return "\(hours)h \(minutes)m"
                } else {
                    return "\(minutes)m"
                }
            }
        }

        return nil
    }
}
