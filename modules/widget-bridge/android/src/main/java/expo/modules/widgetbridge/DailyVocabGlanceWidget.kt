package expo.modules.widgetbridge

import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.color.ColorProvider
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.text.FontFamily
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle

class DailyVocabGlanceWidget : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val snapshot = DailyWordStore.resolveForWidget(context)
    val word = snapshot?.word ?: "Daily Vocab"
    val oneLiner = snapshot?.oneLiner ?: "Open the app and pick a level"
    val level = snapshot?.level ?: "beginner"

    val dayPanel = Color(0xE6E6EDE0)
    val nightPanel = Color(0xE01F2824)
    val dayInk = Color(0xE01C2B22)
    val nightInk = Color(0xF2F2F5F1)
    val dayMuted = Color(0xB31C2B22)
    val nightMuted = Color(0xCCB7C2B9)
    val dayAccent = when (level) {
      "intermediate" -> Color(0xFFE0A278)
      "hard" -> Color(0xFFE0909C)
      else -> Color(0xFF7BC4A0)
    }
    val nightAccent = when (level) {
      "intermediate" -> Color(0xFFEBB892)
      "hard" -> Color(0xFFE6A0AA)
      else -> Color(0xFFA8D4B4)
    }

    provideContent {
      Column(
        modifier = GlanceModifier
          .fillMaxSize()
          .background(ColorProvider(day = dayPanel, night = nightPanel))
          .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalAlignment = Alignment.Start,
      ) {
        Text(
          text = level.uppercase(),
          style = TextStyle(
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp,
            fontFamily = FontFamily.SansSerif,
            color = ColorProvider(day = dayAccent, night = nightAccent),
          ),
        )
        Text(
          text = word,
          style = TextStyle(
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            fontFamily = FontFamily.SansSerif,
            color = ColorProvider(day = dayInk, night = nightInk),
          ),
          modifier = GlanceModifier.padding(top = 4.dp),
        )
        Text(
          text = oneLiner,
          style = TextStyle(
            fontSize = 13.sp,
            fontFamily = FontFamily.SansSerif,
            color = ColorProvider(day = dayMuted, night = nightMuted),
          ),
          modifier = GlanceModifier.padding(top = 4.dp),
        )
      }
    }
  }
}

class DailyVocabGlanceWidgetReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = DailyVocabGlanceWidget()

  companion object {
    @JvmStatic
    fun requestUpdate(context: Context) {
      MidnightWordWorker.enqueueImmediate(context)
    }
  }
}
