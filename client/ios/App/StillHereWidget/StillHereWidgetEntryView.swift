import SwiftUI
import WidgetKit

struct StillHereWidgetEntryView: View {
    var entry: StillHereEntry

    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
    let entry: StillHereEntry

    var statusColor: Color {
        if entry.isOnVacation {
            return .blue
        } else if entry.hasCheckedInToday {
            return .green
        } else {
            return .orange
        }
    }

    var statusText: String {
        if entry.isOnVacation {
            return "On Vacation"
        } else if entry.hasCheckedInToday {
            return "Checked In ✓"
        } else {
            return "Tap to Check In"
        }
    }
    
    // Deep link URL for check-in action
    var checkInURL: URL {
        URL(string: "stillhere://checkin")!
    }

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(Color(.systemBackground))

            VStack(alignment: .leading, spacing: 8) {
                // Status indicator
                HStack {
                    Circle()
                        .fill(statusColor)
                        .frame(width: 8, height: 8)
                    Text(statusText)
                        .font(.caption)
                        .fontWeight(entry.hasCheckedInToday ? .regular : .semibold)
                        .foregroundColor(entry.hasCheckedInToday ? .secondary : statusColor)
                    Spacer()
                }

                Spacer()

                // Streak display
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(entry.streak)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundColor(statusColor)
                    Text("day\(entry.streak == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                // Time until window (if applicable)
                if let timeUntil = entry.timeUntilWindow {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.caption2)
                        Text("Window in \(timeUntil)")
                            .font(.caption2)
                    }
                    .foregroundColor(.secondary)
                }
                
                // Show tap hint when not checked in
                if !entry.hasCheckedInToday && !entry.isOnVacation {
                    HStack(spacing: 4) {
                        Image(systemName: "hand.tap.fill")
                            .font(.caption2)
                        Text("One tap check-in")
                            .font(.caption2)
                    }
                    .foregroundColor(statusColor)
                }
            }
            .padding()
        }
        .widgetURL(entry.hasCheckedInToday || entry.isOnVacation ? nil : checkInURL)
    }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    let entry: StillHereEntry

    var statusColor: Color {
        if entry.isOnVacation {
            return .blue
        } else if entry.hasCheckedInToday {
            return .green
        } else {
            return .orange
        }
    }

    var statusText: String {
        if entry.isOnVacation {
            return "On Vacation"
        } else if entry.hasCheckedInToday {
            return "Checked In Today ✓"
        } else {
            return "Tap to Check In"
        }
    }

    var statusIcon: String {
        if entry.isOnVacation {
            return "airplane"
        } else if entry.hasCheckedInToday {
            return "checkmark.circle.fill"
        } else {
            return "hand.tap.fill"
        }
    }
    
    // Deep link URL for check-in action
    var checkInURL: URL {
        URL(string: "stillhere://checkin")!
    }

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(Color(.systemBackground))

            HStack(spacing: 16) {
                // Left side - Streak
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .foregroundColor(.orange)
                        Text("Streak")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(entry.streak)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundColor(statusColor)
                        Text("days")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Right side - Status
                VStack(alignment: .trailing, spacing: 8) {
                    Image(systemName: statusIcon)
                        .font(.system(size: 28))
                        .foregroundColor(statusColor)

                    Text(statusText)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(entry.hasCheckedInToday ? .primary : statusColor)

                    if let timeUntil = entry.timeUntilWindow {
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.caption)
                            Text("in \(timeUntil)")
                                .font(.caption)
                        }
                        .foregroundColor(.secondary)
                    }
                    
                    // Show one-tap hint when not checked in
                    if !entry.hasCheckedInToday && !entry.isOnVacation {
                        Text("One tap check-in")
                            .font(.caption2)
                            .foregroundColor(statusColor)
                    }
                }
            }
            .padding()
        }
        .widgetURL(entry.hasCheckedInToday || entry.isOnVacation ? nil : checkInURL)
    }
}

// MARK: - Previews

#Preview("Small - Checked In", as: .systemSmall) {
    StillHereWidget()
} timeline: {
    StillHereEntry(date: Date(), streak: 7, hasCheckedInToday: true, isOnVacation: false, timeUntilWindow: nil)
}

#Preview("Small - Pending", as: .systemSmall) {
    StillHereWidget()
} timeline: {
    StillHereEntry(date: Date(), streak: 3, hasCheckedInToday: false, isOnVacation: false, timeUntilWindow: "2h 30m")
}

#Preview("Medium - Vacation", as: .systemMedium) {
    StillHereWidget()
} timeline: {
    StillHereEntry(date: Date(), streak: 14, hasCheckedInToday: false, isOnVacation: true, timeUntilWindow: nil)
}
