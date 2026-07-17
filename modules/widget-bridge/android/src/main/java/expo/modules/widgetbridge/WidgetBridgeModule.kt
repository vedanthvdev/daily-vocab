package expo.modules.widgetbridge

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.util.Locale

class WidgetBridgeModule : Module() {
  private val prefsName = "dayink_widget"
  private val snapshotKey = "dailySnapshot"
  private val levelKey = "activeLevel"
  private val shownKey = "shownYearByWordId"
  private val mainHandler = Handler(Looper.getMainLooper())

  private var tts: TextToSpeech? = null
  private var ttsReady = false
  private var pendingSpeak: Pair<String, String?>? = null

  override fun definition() = ModuleDefinition {
    Name("WidgetBridge")

    AsyncFunction("syncWidgetState") { snapshot: Map<String, String>?, level: String? ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val editor = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE).edit()
      if (snapshot != null) {
        val json = JSONObject()
        for ((key, value) in snapshot) {
          json.put(key, value)
        }
        editor.putString(snapshotKey, json.toString())
      }
      if (level != null) {
        editor.putString(levelKey, level)
      }
      editor.commit()
    }

    AsyncFunction("setDailySnapshot") { snapshot: Map<String, String> ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val json = JSONObject()
      for ((key, value) in snapshot) {
        json.put(key, value)
      }
      context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        .edit()
        .putString(snapshotKey, json.toString())
        .commit()
    }

    AsyncFunction("setActiveLevel") { level: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        .edit()
        .putString(levelKey, level)
        .commit()
    }

    AsyncFunction("setShownYears") { json: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        .edit()
        .putString(shownKey, json)
        .commit()
    }

    AsyncFunction("getDailySnapshot") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      val raw = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        .getString(snapshotKey, null) ?: return@AsyncFunction null
      val obj = JSONObject(raw)
      val map = mutableMapOf<String, String>()
      val keys = obj.keys()
      while (keys.hasNext()) {
        val key = keys.next()
        map[key] = obj.getString(key)
      }
      map
    }

    AsyncFunction("reloadWidgets") {
      val context = appContext.reactContext ?: return@AsyncFunction
      DayinkWidgetUpdater.requestUpdate(context)
    }

    AsyncFunction("speakWord") { text: String, language: String? ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val trimmed = text.trim()
      if (trimmed.isEmpty()) return@AsyncFunction
      runOnMain {
        ensureTts(context)
        if (ttsReady) {
          doSpeak(trimmed, language)
        } else {
          pendingSpeak = trimmed to language
        }
      }
    }

    AsyncFunction("stopSpeaking") {
      runOnMain {
        pendingSpeak = null
        tts?.stop()
      }
    }

    OnDestroy {
      runOnMain {
        tts?.shutdown()
        tts = null
        ttsReady = false
        pendingSpeak = null
      }
    }
  }

  private fun runOnMain(block: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      block()
    } else {
      mainHandler.post(block)
    }
  }

  private fun ensureTts(context: Context) {
    if (tts != null) return
    tts = TextToSpeech(context.applicationContext) { status ->
      runOnMain {
        ttsReady = status == TextToSpeech.SUCCESS
        val pending = pendingSpeak
        pendingSpeak = null
        if (ttsReady && pending != null) {
          doSpeak(pending.first, pending.second)
        }
      }
    }
  }

  private fun doSpeak(text: String, language: String?) {
    val engine = tts ?: return
    val locale = when {
      language?.startsWith("en-GB", ignoreCase = true) == true -> Locale.UK
      language?.startsWith("en-US", ignoreCase = true) == true -> Locale.US
      language?.startsWith("en", ignoreCase = true) == true -> Locale.US
      else -> Locale.UK
    }
    val result = engine.setLanguage(locale)
    if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
      engine.language = Locale.US
    }
    engine.setSpeechRate(0.9f)
    engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "dayink-word")
  }
}
