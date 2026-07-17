package expo.modules.widgetbridge

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class WidgetBridgeModule : Module() {
  private val prefsName = "dayink_widget"
  private val snapshotKey = "dailySnapshot"
  private val levelKey = "activeLevel"
  private val shownKey = "shownYearByWordId"

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
  }
}
