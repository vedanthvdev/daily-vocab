import ExpoModulesCore
#if canImport(WidgetKit)
import WidgetKit
#endif

public class WidgetBridgeModule: Module {
  private let suiteName = "group.com.dayink.app"
  private let snapshotKey = "dailySnapshot"
  private let levelKey = "activeLevel"
  private let shownKey = "shownYearByWordId"

  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    AsyncFunction("syncWidgetState") { (snapshot: [String: String]?, level: String?) in
      let defaults = UserDefaults(suiteName: self.suiteName) ?? .standard
      if let snapshot,
         let data = try? JSONSerialization.data(withJSONObject: snapshot),
         let json = String(data: data, encoding: .utf8) {
        defaults.set(json, forKey: self.snapshotKey)
      }
      if let level {
        defaults.set(level, forKey: self.levelKey)
      }
      defaults.synchronize()
    }

    AsyncFunction("setDailySnapshot") { (snapshot: [String: String]) in
      let defaults = UserDefaults(suiteName: self.suiteName) ?? .standard
      if let data = try? JSONSerialization.data(withJSONObject: snapshot),
         let json = String(data: data, encoding: .utf8) {
        defaults.set(json, forKey: self.snapshotKey)
        defaults.synchronize()
      }
    }

    AsyncFunction("setActiveLevel") { (level: String) in
      let defaults = UserDefaults(suiteName: self.suiteName) ?? .standard
      defaults.set(level, forKey: self.levelKey)
      defaults.synchronize()
    }

    AsyncFunction("setShownYears") { (json: String) in
      let defaults = UserDefaults(suiteName: self.suiteName) ?? .standard
      defaults.set(json, forKey: self.shownKey)
      defaults.synchronize()
    }

    AsyncFunction("getDailySnapshot") { () -> [String: String]? in
      let defaults = UserDefaults(suiteName: self.suiteName) ?? .standard
      guard let json = defaults.string(forKey: self.snapshotKey),
            let data = json.data(using: .utf8),
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: String] else {
        return nil
      }
      return object
    }

    AsyncFunction("reloadWidgets") {
      #if canImport(WidgetKit)
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadTimelines(ofKind: "DayinkWidget")
        WidgetCenter.shared.reloadAllTimelines()
      }
      #endif
    }
  }
}
