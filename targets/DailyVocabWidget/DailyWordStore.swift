import Foundation

struct DailySnapshot: Codable, Equatable {
  let level: String
  let localDate: String
  let wordId: String
  let word: String
  let oneLiner: String
}

struct CatalogWord: Codable {
  let id: String
  let word: String
  let oneLiner: String
}

struct CatalogFile: Codable {
  let version: Int
  let level: String
  let words: [CatalogWord]
}

/// Shared with the React Native host via App Group `group.com.dailyvocab.app`.
enum DailyWordStore {
  static let suiteName = "group.com.dailyvocab.app"
  static let snapshotKey = "dailySnapshot"
  static let levelKey = "activeLevel"
  static let shownKey = "shownYearByWordId"

  static var defaults: UserDefaults {
    UserDefaults(suiteName: suiteName) ?? .standard
  }

  static func localDateString(now: Date = Date(), timeZone: TimeZone = .current) -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = timeZone
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: now)
  }

  static func yearDigit(now: Date = Date()) -> Int {
    Calendar.current.component(.year, from: now) % 10
  }

  static func loadShownYears() -> [String: Int] {
    guard let json = defaults.string(forKey: shownKey),
          let data = json.data(using: .utf8),
          let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      return [:]
    }
    var map: [String: Int] = [:]
    for (key, value) in object {
      if let number = value as? Int {
        map[key] = number
      } else if let number = value as? NSNumber {
        map[key] = number.intValue
      }
    }
    return map
  }

  static func saveShownYears(_ map: [String: Int]) {
    guard let data = try? JSONSerialization.data(withJSONObject: map),
          let json = String(data: data, encoding: .utf8) else { return }
    defaults.set(json, forKey: shownKey)
    defaults.synchronize()
  }

  static func loadSnapshot() -> DailySnapshot? {
    guard let json = defaults.string(forKey: snapshotKey),
          let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(DailySnapshot.self, from: data)
  }

  static func saveSnapshot(_ snapshot: DailySnapshot) {
    guard let data = try? JSONEncoder().encode(snapshot),
          let json = String(data: data, encoding: .utf8) else { return }
    defaults.set(json, forKey: snapshotKey)
    defaults.synchronize()
  }

  static func loadCatalog(level: String, bundle: Bundle = .main) -> [CatalogWord] {
    if let url = bundle.url(forResource: level, withExtension: "json"),
       let data = try? Data(contentsOf: url),
       let file = try? JSONDecoder().decode(CatalogFile.self, from: data) {
      return file.words
    }
    return []
  }

  static func ensureTodaysWord(
    level: String,
    words: [CatalogWord],
    state: DailySnapshot?,
    now: Date = Date(),
    randomInt: (Int) -> Int = { Int.random(in: 0..<$0) }
  ) -> DailySnapshot? {
    let today = localDateString(now: now)
    if let state, state.localDate == today {
      var shown = loadShownYears()
      shown[state.wordId] = yearDigit(now: now)
      saveShownYears(shown)
      return state
    }
    guard !words.isEmpty else { return nil }

    var shown = loadShownYears()
    let current = yearDigit(now: now)
    let previous = (current + 9) % 10
    var pool = words.filter { word in
      guard let stamp = shown[word.id] else { return true }
      return stamp != current && stamp != previous
    }
    if pool.isEmpty {
      pool = words.filter { $0.id != state?.wordId }
      if pool.isEmpty { pool = words }
    }

    var index = randomInt(pool.count)
    if pool.count > 1, let previousId = state?.wordId {
      var guardCount = 0
      while pool[index].id == previousId && guardCount < 8 {
        index = randomInt(pool.count)
        guardCount += 1
      }
      if pool[index].id == previousId {
        index = (index + 1) % pool.count
      }
    }

    let entry = pool[index]
    shown[entry.id] = current
    saveShownYears(shown)
    return DailySnapshot(
      level: level,
      localDate: today,
      wordId: entry.id,
      word: entry.word,
      oneLiner: entry.oneLiner
    )
  }

  static func resolveForWidget(now: Date = Date(), bundle: Bundle = .main) -> DailySnapshot? {
    let existing = loadSnapshot()
    let today = localDateString(now: now)
    if let existing, existing.localDate == today {
      var shown = loadShownYears()
      shown[existing.wordId] = yearDigit(now: now)
      saveShownYears(shown)
      return existing
    }
    let level = defaults.string(forKey: levelKey) ?? existing?.level ?? "beginner"
    let words = loadCatalog(level: level, bundle: bundle)
    guard let next = ensureTodaysWord(level: level, words: words, state: existing, now: now) else {
      return existing
    }
    if next != existing {
      saveSnapshot(next)
    }
    return next
  }

  static func nextMidnight(from date: Date = Date(), calendar: Calendar = .current) -> Date {
    let start = calendar.startOfDay(for: date)
    return calendar.date(byAdding: .day, value: 1, to: start) ?? date.addingTimeInterval(86_400)
  }
}
