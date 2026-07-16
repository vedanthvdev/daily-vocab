package expo.modules.widgetbridge

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class WidgetBridgeModule : Module() {
  private val prefsName = "dailyvocab_widget"
  private val snapshotKey = "dailySnapshot"

  override fun definition() = ModuleDefinition {
    Name("WidgetBridge")

    AsyncFunction("setDailySnapshot") { snapshot: Map<String, String> ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val json = JSONObject()
      for ((key, value) in snapshot) {
        json.put(key, value)
      }
      context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        .edit()
        .putString(snapshotKey, json.toString())
        .apply()
    }

    AsyncFunction("setActiveLevel") { level: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
        .edit()
        .putString("activeLevel", level)
        .apply()
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
      DailyVocabWidgetUpdater.requestUpdate(context)
    }
  }
}
