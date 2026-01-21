import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { canCheckInToday, isYesterday, isMilestone } from '../utils/time';
import { api } from '../utils/api';
import { getCurrentPosition, isGeolocationSupported } from '../utils/geolocation';
import { trackCheckInCompleted } from '../utils/analytics';
import { syncWidget } from '../plugins/WidgetBridge';

export const useCheckIn = (data, updateData) => {
  const [isChecking, setIsChecking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCheckInFlow, setShowCheckInFlow] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState(null);

  // Start check-in (show mood selector)
  const initiateCheckIn = useCallback(() => {
    if (!canCheckInToday(data.lastCheckIn, data.timezone) || isChecking) {
      return { success: false, reason: 'already_checked_in' };
    }
    setShowCheckInFlow(true);
    return { success: true, reason: 'flow_started' };
  }, [data.lastCheckIn, data.timezone, isChecking]);

  // Complete check-in with mood and note
  const completeCheckIn = useCallback(async ({ mood, note } = {}) => {
    setIsChecking(true);
    setShowCheckInFlow(false);

    try {
      const now = new Date().toISOString();

      // Try to get location if enabled
      let latitude = null;
      let longitude = null;

      if (data.locationSharingEnabled && isGeolocationSupported()) {
        try {
          const position = await getCurrentPosition({ timeout: 5000 });
          latitude = position.latitude;
          longitude = position.longitude;
        } catch (error) {
          console.warn('Could not get location for check-in:', error);
          // Continue without location
        }
      }

      // Calculate new streak (timezone-aware)
      let newStreak;
      if (!data.lastCheckIn) {
        newStreak = 1;
      } else if (isYesterday(data.lastCheckIn, data.timezone)) {
        newStreak = data.streak + 1;
      } else {
        // Streak broken - start over
        newStreak = 1;
      }

      // Create check-in entry (new format with mood/note/location)
      const checkInEntry = {
        date: now,
        mood: mood || null,
        note: note || null,
        latitude,
        longitude
      };

      // Update local storage
      const newHistory = [...(data.checkInHistory || []), checkInEntry];
      updateData({
        lastCheckIn: now,
        streak: newStreak,
        checkInHistory: newHistory
      });

      // Try to sync with server
      if (data.userId && navigator.onLine) {
        try {
          await api.checkIn(data.userId, { mood, note, latitude, longitude });
        } catch (error) {
          console.error('Failed to sync check-in with server:', error);
        }
      }

      // Check for milestone
      if (isMilestone(newStreak)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      // Track check-in analytics
      trackCheckInCompleted(mood);

      // Sync widget on native platforms
      if (Capacitor.isNativePlatform()) {
        syncWidget({
          streak: newStreak,
          lastCheckIn: now,
          checkInWindowStart: data.checkInWindowStart,
          checkInWindowEnd: data.checkInWindowEnd,
          vacationUntil: data.vacationUntil
        });
      }

      return { success: true, streak: newStreak, isMilestone: isMilestone(newStreak) };
    } catch (error) {
      console.error('Check-in error:', error);
      return { success: false, reason: 'error' };
    } finally {
      setIsChecking(false);
    }
  }, [data, updateData]);

  // Cancel check-in flow
  const cancelCheckInFlow = useCallback(() => {
    setShowCheckInFlow(false);
  }, []);

  // Legacy method for compatibility
  const performCheckIn = useCallback(async () => {
    return completeCheckIn({ mood: null, note: null });
  }, [completeCheckIn]);

  // Use stored timezone for consistent date comparisons
  const hasCheckedInToday = !canCheckInToday(data.lastCheckIn, data.timezone);

  return {
    performCheckIn,
    initiateCheckIn,
    completeCheckIn,
    cancelCheckInFlow,
    isChecking,
    hasCheckedInToday,
    showConfetti,
    setShowConfetti,
    showCheckInFlow
  };
};
