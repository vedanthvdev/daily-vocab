import AVFoundation
import ExpoModulesCore
#if canImport(WidgetKit)
import WidgetKit
#endif

public class WidgetBridgeModule: Module {
  private let suiteName = "group.com.dayink.app"
  private let snapshotKey = "dailySnapshot"
  private let levelKey = "activeLevel"
  private let shownKey = "shownYearByWordId"
  private let synthesizer = AVSpeechSynthesizer()

  private func activateSpeechAudioSession() {
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
      try session.setActive(true)
    } catch {
      // Keep going; synthesizer may still work with the current session.
    }
  }

  private func speakOnMain(_ text: String, language: String?) {
    activateSpeechAudioSession()
    synthesizer.stopSpeaking(at: .immediate)

    let utterance = AVSpeechUtterance(string: text)
    let preferred = language ?? "en-GB"
    utterance.voice =
      AVSpeechSynthesisVoice(language: preferred)
      ?? AVSpeechSynthesisVoice(language: "en-US")
      ?? AVSpeechSynthesisVoice(language: "en-GB")
    // Slightly slower than default for learners; stay within Apple's rate range.
    utterance.rate = max(
      AVSpeechUtteranceMinimumSpeechRate,
      min(AVSpeechUtteranceDefaultSpeechRate * 0.9, AVSpeechUtteranceMaximumSpeechRate)
    )
    utterance.pitchMultiplier = 1.0
    synthesizer.speak(utterance)
  }

  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    AsyncFunction("syncWidgetState") { (snapshot: [String: String]?, level: String?) in
      guard let defaults = UserDefaults(suiteName: self.suiteName) else {
        throw Exception(name: "AppGroupUnavailable", description: "Missing App Group \(self.suiteName)")
      }
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
      guard let defaults = UserDefaults(suiteName: self.suiteName) else {
        throw Exception(name: "AppGroupUnavailable", description: "Missing App Group \(self.suiteName)")
      }
      if let data = try? JSONSerialization.data(withJSONObject: snapshot),
         let json = String(data: data, encoding: .utf8) {
        defaults.set(json, forKey: self.snapshotKey)
        defaults.synchronize()
      }
    }

    AsyncFunction("setActiveLevel") { (level: String) in
      guard let defaults = UserDefaults(suiteName: self.suiteName) else {
        throw Exception(name: "AppGroupUnavailable", description: "Missing App Group \(self.suiteName)")
      }
      defaults.set(level, forKey: self.levelKey)
      defaults.synchronize()
    }

    AsyncFunction("setShownYears") { (json: String) in
      guard let defaults = UserDefaults(suiteName: self.suiteName) else {
        throw Exception(name: "AppGroupUnavailable", description: "Missing App Group \(self.suiteName)")
      }
      defaults.set(json, forKey: self.shownKey)
      defaults.synchronize()
    }

    AsyncFunction("getDailySnapshot") { () -> [String: String]? in
      guard let defaults = UserDefaults(suiteName: self.suiteName) else {
        return nil
      }
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

    AsyncFunction("speakWord") { (text: String, language: String?) in
      let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !trimmed.isEmpty else { return }

      // AVSpeechSynthesizer must run on the main thread (async to avoid bridge deadlocks).
      DispatchQueue.main.async {
        self.speakOnMain(trimmed, language: language)
      }
    }

    AsyncFunction("stopSpeaking") {
      DispatchQueue.main.async {
        self.synthesizer.stopSpeaking(at: .immediate)
      }
    }
  }
}
