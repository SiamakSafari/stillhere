// Check if geolocation is supported
export const isGeolocationSupported = () => {
  return 'geolocation' in navigator;
};

// Get current position
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let message;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
          default:
            message = 'Unknown location error';
        }
        reject(new Error(message));
      },
      { ...defaultOptions, ...options }
    );
  });
};

// Check permission status
export const checkLocationPermission = async () => {
  if (!('permissions' in navigator)) {
    return 'unknown';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch {
    return 'unknown';
  }
};

// Request location permission by attempting to get position
export const requestLocationPermission = async () => {
  try {
    await getCurrentPosition({ timeout: 5000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate Google Maps link
export const getMapLink = (latitude, longitude) => {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
};

// Generate Apple Maps link
export const getAppleMapsLink = (latitude, longitude) => {
  return `https://maps.apple.com/?q=${latitude},${longitude}`;
};

// Get a generic map link (works on most devices)
export const getUniversalMapLink = (latitude, longitude) => {
  // geo: URI scheme works on most mobile devices
  return `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
};
