package com.stillhere.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.stillhere.app.MainActivity
import com.stillhere.app.R

/**
 * Widget provider for the Still Here home screen widget.
 * Displays check-in streak and status information.
 */
class StillHereWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update each widget instance
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Called when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Called when the last widget is removed
    }

    companion object {
        /**
         * Updates a single widget instance with the latest data
         */
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val dataStore = WidgetDataStore(context)
            val data = dataStore.load()

            // Create the RemoteViews object
            val views = RemoteViews(context.packageName, R.layout.widget_still_here)

            // Set streak count
            views.setTextViewText(R.id.streakCount, data.streak.toString())
            views.setTextViewText(
                R.id.streakLabel,
                if (data.streak == 1) "day" else "days"
            )

            // Set status text and color
            val (statusText, statusColor) = when {
                data.isOnVacation -> "On Vacation" to context.getColor(R.color.widget_status_vacation)
                data.hasCheckedInToday -> "Checked In" to context.getColor(R.color.widget_status_checked_in)
                else -> "Check In" to context.getColor(R.color.widget_status_pending)
            }
            views.setTextViewText(R.id.statusText, statusText)
            views.setTextColor(R.id.statusText, statusColor)
            views.setInt(R.id.statusIndicator, "setColorFilter", statusColor)

            // Set streak color based on status
            views.setTextColor(R.id.streakCount, statusColor)

            // Create intent to open the app when widget is tapped
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widgetContainer, pendingIntent)

            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        /**
         * Refresh all widget instances with current data
         */
        fun refreshAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, StillHereWidget::class.java)
            )

            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
