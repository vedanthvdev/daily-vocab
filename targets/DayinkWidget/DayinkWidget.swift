import SwiftUI
import WidgetKit

struct DayinkEntry: TimelineEntry {
  let date: Date
  let word: String
  let oneLiner: String
  let level: String
}

struct DayinkProvider: TimelineProvider {
  func placeholder(in context: Context) -> DayinkEntry {
    DayinkEntry(
      date: Date(),
      word: "happy",
      oneLiner: "Feeling joy or pleasure.",
      level: "beginner"
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (DayinkEntry) -> Void) {
    completion(makeEntry(at: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DayinkEntry>) -> Void) {
    let now = Date()
    let midnight = DailyWordStore.nextMidnight(from: now)
    let timeline = Timeline(entries: [makeEntry(at: now)], policy: .after(midnight))
    completion(timeline)
  }

  private func makeEntry(at date: Date) -> DayinkEntry {
    let snapshot = DailyWordStore.resolveForWidget(now: date)
    return DayinkEntry(
      date: date,
      word: snapshot?.word ?? "Dayink",
      oneLiner: snapshot?.oneLiner ?? "Pick a level in the app",
      level: snapshot?.level ?? "beginner"
    )
  }
}

struct DayinkWidgetView: View {
  @Environment(\.widgetFamily) var family
  @Environment(\.colorScheme) var colorScheme
  var entry: DayinkEntry

  var body: some View {
    let padded = content
      .padding(familyIsAccessory ? 0 : 14)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

    if #available(iOS 17.0, *) {
      padded
        .containerBackground(for: .widget) {
          widgetBackdrop
        }
    } else {
      padded.background(legacyBackdrop)
    }
  }

  private var familyIsAccessory: Bool {
    switch family {
    case .accessoryInline, .accessoryCircular, .accessoryRectangular:
      return true
    default:
      return false
    }
  }

  @ViewBuilder
  private var widgetBackdrop: some View {
    switch family {
    case .accessoryInline, .accessoryCircular, .accessoryRectangular:
      Color.clear
    default:
      softAccentFill
    }
  }

  private var softAccentFill: Color {
    if colorScheme == .dark {
      return Color(red: 0.12, green: 0.16, blue: 0.14).opacity(0.88)
    }
    return Color(red: 0.90, green: 0.93, blue: 0.88).opacity(0.90)
  }

  private var legacyBackdrop: Color {
    switch family {
    case .accessoryInline, .accessoryCircular, .accessoryRectangular:
      return .clear
    default:
      return softAccentFill
    }
  }

  @ViewBuilder
  private var content: some View {
    switch family {
    case .accessoryInline:
      Text("\(entry.word) — \(entry.oneLiner)")
        .font(.system(.body, design: .rounded).weight(.medium))
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        Text(String(entry.word.prefix(6)))
          .font(.system(.caption2, design: .rounded).weight(.semibold))
          .minimumScaleFactor(0.5)
          .multilineTextAlignment(.center)
          .padding(2)
      }
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text(entry.word)
          .font(.system(.headline, design: .rounded).weight(.semibold))
          .minimumScaleFactor(0.7)
          .lineLimit(1)
        Text(entry.oneLiner)
          .font(.system(.caption, design: .rounded))
          .foregroundStyle(.secondary)
          .lineLimit(2)
          .minimumScaleFactor(0.8)
      }
    default:
      VStack(alignment: .leading, spacing: 7) {
        Text(levelLabel)
          .font(.system(.caption2, design: .rounded).weight(.bold))
          .foregroundStyle(levelTint)
        Text(entry.word)
          .font(.system(.title2, design: .serif).weight(.bold))
          .foregroundStyle(primaryText)
          .minimumScaleFactor(0.7)
          .lineLimit(2)
        Text(entry.oneLiner)
          .font(.system(.subheadline, design: .rounded))
          .foregroundStyle(secondaryText)
          .lineLimit(3)
          .minimumScaleFactor(0.85)
        Spacer(minLength: 0)
      }
    }
  }

  private var levelLabel: String {
    switch entry.level.lowercased() {
    case "beginner": return "BEGINNER"
    case "intermediate": return "INTERMEDIATE"
    case "hard": return "HARD"
    default: return entry.level.uppercased()
    }
  }

  private var levelTint: Color {
    switch entry.level.lowercased() {
    case "beginner":
      return colorScheme == .dark
        ? Color(red: 0.66, green: 0.83, blue: 0.72)
        : Color(red: 0.56, green: 0.75, blue: 0.63)
    case "intermediate":
      return colorScheme == .dark
        ? Color(red: 0.92, green: 0.75, blue: 0.60)
        : Color(red: 0.88, green: 0.70, blue: 0.55)
    case "hard":
      return colorScheme == .dark
        ? Color(red: 0.90, green: 0.68, blue: 0.72)
        : Color(red: 0.86, green: 0.64, blue: 0.68)
    default:
      return .secondary
    }
  }

  private var primaryText: Color {
    colorScheme == .dark ? Color.white.opacity(0.95) : Color.black.opacity(0.86)
  }

  private var secondaryText: Color {
    colorScheme == .dark ? Color.white.opacity(0.70) : Color.black.opacity(0.55)
  }
}

@main
struct DayinkWidget: Widget {
  let kind = "DayinkWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: DayinkProvider()) { entry in
      DayinkWidgetView(entry: entry)
        .widgetURL(URL(string: "dayink://today"))
    }
    .configurationDisplayName("Dayink")
    .description("One word a day with a short meaning.")
    .supportedFamilies([
      .accessoryRectangular,
      .accessoryInline,
      .accessoryCircular,
      .systemSmall,
      .systemMedium,
    ])
    .contentMarginsDisabled()
  }
}
