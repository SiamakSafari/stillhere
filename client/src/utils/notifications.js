const API_BASE = '/api';

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Check current permission status
export const getPermissionStatus = () => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
};

// Request notification permission
export const requestPermission = async () => {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported' };
  }

  try {
    const permission = await Notification.requestPermission();
    return {
      success: permission === 'granted',
      permission
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get or create push subscription
export const subscribeToPush = async (userId) => {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported' };
  }

  if (Notification.permission !== 'granted') {
    return { success: false, error: 'Permission not granted' };
  }

  try {
    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.ready;

    // Get VAPID public key from server
    const response = await fetch(`${API_BASE}/notifications/vapid-public-key`);
    if (!response.ok) {
      throw new Error('Failed to get VAPID key');
    }
    const { publicKey } = await response.json();

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Send subscription to server
    const saveResponse = await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON()
      })
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save subscription');
    }

    return { success: true, subscription };
  } catch (error) {
    console.error('Push subscription error:', error);
    return { success: false, error: error.message };
  }
};

// Unsubscribe from push
export const unsubscribeFromPush = async (userId) => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Remove subscription from server
      await fetch(`${API_BASE}/notifications/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Push unsubscription error:', error);
    return { success: false, error: error.message };
  }
};

// Check if currently subscribed
export const isSubscribed = async () => {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
};

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
