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

    provideContent {
      Column(
        modifier = GlanceModifier
          .fillMaxSize()
          .background(ColorProvider(day = Color.Transparent, night = Color.Transparent))
          .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalAlignment = Alignment.Start,
      ) {
        Text(
          text = word,
          style = TextStyle(
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            fontFamily = FontFamily.SansSerif,
            color = ColorProvider(day = Color(0xE01C2B22), night = Color(0xF2F2F5F1)),
          ),
        )
        Text(
          text = oneLiner,
          style = TextStyle(
            fontSize = 13.sp,
            fontFamily = FontFamily.SansSerif,
            color = ColorProvider(day = Color(0xB31C2B22), night = Color(0xCCB7C2B9)),
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
