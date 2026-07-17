package expo.modules.widgetbridge

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlin.random.Random

data class DailySnapshot(
  val level: String,
  val localDate: String,
  val wordId: String,
  val word: String,
  val oneLiner: String,
)

data class CatalogWord(
  val id: String,
  val word: String,
  val oneLiner: String,
)

object DailyWordStore {
  const val PREFS = "dayink_widget"
  const val SNAPSHOT_KEY = "dailySnapshot"
  const val LEVEL_KEY = "activeLevel"
  const val SHOWN_KEY = "shownYearByWordId"

  fun localDateString(now: Date = Date(), timeZone: TimeZone = TimeZone.getDefault()): String {
    val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    fmt.timeZone = timeZone
    return fmt.format(now)
  }

  fun yearDigit(now: Date = Date()): Int {
    val cal = Calendar.getInstance()
    cal.time = now
    return cal.get(Calendar.YEAR) % 10
  }

  fun loadShownYears(context: Context): MutableMap<String, Int> {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(SHOWN_KEY, null) ?: return mutableMapOf()
    return runCatching {
      val obj = JSONObject(raw)
      val map = mutableMapOf<String, Int>()
      val keys = obj.keys()
      while (keys.hasNext()) {
        val key = keys.next()
        map[key] = obj.getInt(key)
      }
      map
    }.getOrDefault(mutableMapOf())
  }

  fun saveShownYears(context: Context, map: Map<String, Int>) {
    val obj = JSONObject()
    for ((key, value) in map) {
      obj.put(key, value)
    }
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(SHOWN_KEY, obj.toString())
      .commit()
  }

  fun loadSnapshot(context: Context): DailySnapshot? {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(SNAPSHOT_KEY, null) ?: return null
    return runCatching {
      val obj = JSONObject(raw)
      DailySnapshot(
        level = obj.getString("level"),
        localDate = obj.getString("localDate"),
        wordId = obj.getString("wordId"),
        word = obj.getString("word"),
        oneLiner = obj.getString("oneLiner"),
      )
    }.getOrNull()
  }

  fun saveSnapshot(context: Context, snapshot: DailySnapshot) {
    val obj = JSONObject()
      .put("level", snapshot.level)
      .put("localDate", snapshot.localDate)
      .put("wordId", snapshot.wordId)
      .put("word", snapshot.word)
      .put("oneLiner", snapshot.oneLiner)
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(SNAPSHOT_KEY, obj.toString())
      .commit()
  }

  fun loadCatalog(context: Context, level: String): List<CatalogWord> {
    val assetName = "words/$level.json"
    return runCatching {
      context.assets.open(assetName).bufferedReader().use { it.readText() }
        .let { JSONObject(it) }
        .getJSONArray("words")
        .toWordList()
    }.getOrDefault(emptyList())
  }

  fun ensureTodaysWord(
    context: Context,
    level: String,
    words: List<CatalogWord>,
    state: DailySnapshot?,
    now: Date = Date(),
    randomInt: (Int) -> Int = { Random.nextInt(it) },
  ): DailySnapshot? {
    val today = localDateString(now)
    val digit = yearDigit(now)
    if (state != null && state.localDate == today) {
      val shown = loadShownYears(context)
      shown[state.wordId] = digit
      saveShownYears(context, shown)
      return state
    }
    if (words.isEmpty()) return null

    val shown = loadShownYears(context)
    val previousDigit = (digit + 9) % 10
    var pool = words.filter { word ->
      val stamp = shown[word.id]
      stamp == null || (stamp != digit && stamp != previousDigit)
    }
    if (pool.isEmpty()) {
      pool = words.filter { it.id != state?.wordId }
      if (pool.isEmpty()) pool = words
    }

    var index = randomInt(pool.size)
    val previous = state?.wordId
    if (pool.size > 1 && previous != null) {
      var guard = 0
      while (pool[index].id == previous && guard < 8) {
        index = randomInt(pool.size)
        guard += 1
      }
      if (pool[index].id == previous) {
        index = (index + 1) % pool.size
      }
    }

    val entry = pool[index]
    shown[entry.id] = digit
    saveShownYears(context, shown)
    return DailySnapshot(
      level = level,
      localDate = today,
      wordId = entry.id,
      word = entry.word,
      oneLiner = entry.oneLiner,
    )
  }

  fun resolveForWidget(context: Context): DailySnapshot? {
    val existing = loadSnapshot(context)
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val today = localDateString()
    if (existing != null && existing.localDate == today) {
      val shown = loadShownYears(context)
      shown[existing.wordId] = yearDigit()
      saveShownYears(context, shown)
      return existing
    }
    val level = prefs.getString(LEVEL_KEY, null) ?: existing?.level ?: return null
    val words = loadCatalog(context, level)
    val next = ensureTodaysWord(context, level, words, existing) ?: return existing
    if (next.wordId != existing?.wordId || next.localDate != existing.localDate) {
      saveSnapshot(context, next)
    }
    return next
  }
}

private fun JSONArray.toWordList(): List<CatalogWord> {
  val list = ArrayList<CatalogWord>(length())
  for (i in 0 until length()) {
    val obj = getJSONObject(i)
    list.add(
      CatalogWord(
        id = obj.getString("id"),
        word = obj.getString("word"),
        oneLiner = obj.getString("oneLiner"),
      ),
    )
  }
  return list
}
