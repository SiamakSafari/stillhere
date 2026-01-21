package com.stillhere.app.widget

import android.content.Context
import android.content.SharedPreferences

/**
 * Shared data store for widget data using SharedPreferences.
 * The main app saves data here, and the widget reads it.
 */
class WidgetDataStore(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )

    data class WidgetData(
        val streak: Int,
        val lastCheckIn: String?,
        val hasCheckedInToday: Boolean,
        val checkInWindowStart: String?,
        val checkInWindowEnd: String?,
        val isOnVacation: Boolean
    )

    /**
     * Save widget data from the Capacitor plugin
     */
    fun save(data: WidgetData) {
        prefs.edit().apply {
            putInt(KEY_STREAK, data.streak)
            putString(KEY_LAST_CHECK_IN, data.lastCheckIn)
            putBoolean(KEY_HAS_CHECKED_IN_TODAY, data.hasCheckedInToday)
            putString(KEY_WINDOW_START, data.checkInWindowStart)
            putString(KEY_WINDOW_END, data.checkInWindowEnd)
            putBoolean(KEY_IS_ON_VACATION, data.isOnVacation)
            apply()
        }
    }

    /**
     * Load widget data for display
     */
    fun load(): WidgetData {
        return WidgetData(
            streak = prefs.getInt(KEY_STREAK, 0),
            lastCheckIn = prefs.getString(KEY_LAST_CHECK_IN, null),
            hasCheckedInToday = prefs.getBoolean(KEY_HAS_CHECKED_IN_TODAY, false),
            checkInWindowStart = prefs.getString(KEY_WINDOW_START, null),
            checkInWindowEnd = prefs.getString(KEY_WINDOW_END, null),
            isOnVacation = prefs.getBoolean(KEY_IS_ON_VACATION, false)
        )
    }

    companion object {
        private const val PREFS_NAME = "still_here_widget_prefs"

        private const val KEY_STREAK = "widget_streak"
        private const val KEY_LAST_CHECK_IN = "widget_last_check_in"
        private const val KEY_HAS_CHECKED_IN_TODAY = "widget_has_checked_in_today"
        private const val KEY_WINDOW_START = "widget_check_in_window_start"
        private const val KEY_WINDOW_END = "widget_check_in_window_end"
        private const val KEY_IS_ON_VACATION = "widget_is_on_vacation"
    }
}
