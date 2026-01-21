import WidgetKit
import SwiftUI

@main
struct StillHereWidgetBundle: WidgetBundle {
    var body: some Widget {
        StillHereWidget()
    }
}

struct StillHereWidget: Widget {
    let kind: String = "StillHereWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StillHereProvider()) { entry in
            StillHereWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Still Here")
        .description("Check your streak and check-in status at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemSmall) {
    StillHereWidget()
} timeline: {
    StillHereEntry(date: Date(), streak: 7, hasCheckedInToday: true, isOnVacation: false, timeUntilWindow: nil)
    StillHereEntry(date: Date(), streak: 0, hasCheckedInToday: false, isOnVacation: false, timeUntilWindow: "2h 30m")
    StillHereEntry(date: Date(), streak: 14, hasCheckedInToday: false, isOnVacation: true, timeUntilWindow: nil)
}
