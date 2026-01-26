const API_BASE = '/api';
const DEFAULT_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base for exponential backoff

// Auth token storage key
const AUTH_TOKEN_KEY = 'still-here-auth-token';

// Get stored auth token
const getAuthToken = () => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

// Store auth token
const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (error) {
    console.warn('Failed to store auth token:', error);
  }
};

// Clear auth token
export const clearAuthToken = () => {
  setAuthToken(null);
};

// Check if error is transient and worth retrying
const isTransientError = (error, status) => {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
  // Timeout errors
  if (error.name === 'AbortError') return true;
  // Server errors (5xx) are typically transient
  if (status >= 500 && status < 600) return true;
  // Rate limiting
  if (status === 429) return true;
  return false;
};

// Sleep helper for retry delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch with timeout
const fetchWithTimeout = async (url, options, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Get default headers including auth
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Fetch with retry and exponential backoff
const fetchWithRetry = async (url, options, retries = MAX_RETRIES) => {
  let lastError;
  let lastStatus;

  // Add auth headers
  const optionsWithAuth = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options?.headers
    }
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, optionsWithAuth);

      // If response is ok, return it
      if (response.ok) {
        return response;
      }

      // Store status for transient check
      lastStatus = response.status;

      // If not a transient error, don't retry
      if (!isTransientError(new Error(), lastStatus)) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      lastStatus = 0;

      // If not a transient error, throw immediately
      if (!isTransientError(error, 0)) {
        throw error;
      }
    }

    // Don't delay after last attempt
    if (attempt < retries - 1) {
      // Exponential backoff with jitter
      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt) + Math.random() * 500;
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw lastError || new Error('Request failed after retries');
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({ error: 'Invalid response' }));
  
  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Request failed');
    error.code = data.code;
    error.status = response.status;
    throw error;
  }
  
  return data;
};

export const api = {
  // User endpoints
  createUser: async (userData) => {
    const response = await fetchWithRetry(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    const data = await handleResponse(response);
    
    // Store the auth token from registration
    if (data.authToken) {
      setAuthToken(data.authToken);
    }
    
    return data;
  },

  getUser: async (userId) => {
    const response = await fetchWithRetry(`${API_BASE}/users/${userId}`);
    return handleResponse(response);
  },

  updateUser: async (userId, userData) => {
    const response = await fetchWithRetry(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  // Check-in endpoints
  checkIn: async (userId, { mood, note, latitude, longitude } = {}) => {
    const response = await fetchWithRetry(`${API_BASE}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ userId, mood, note, latitude, longitude })
    });
    return handleResponse(response);
  },

  // Vacation mode
  setVacation: async (userId, vacationUntil, notifyContact = false) => {
    const response = await fetchWithRetry(`${API_BASE}/vacation`, {
      method: 'PUT',
      body: JSON.stringify({ userId, vacationUntil, notifyContact })
    });
    return handleResponse(response);
  },

  // Test alert (updated endpoint)
  testAlert: async (userId) => {
    const response = await fetchWithRetry(`${API_BASE}/users/${userId}/test-alert`, {
      method: 'POST'
    });
    return handleResponse(response);
  },

  // Activity Mode endpoints
  startActivity: async (userId, activityData) => {
    const response = await fetchWithRetry(`${API_BASE}/activity/start`, {
      method: 'POST',
      body: JSON.stringify({ userId, ...activityData })
    });
    return handleResponse(response);
  },

  completeActivity: async (userId, activityId) => {
    const response = await fetchWithRetry(`${API_BASE}/activity/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId, activityId })
    });
    return handleResponse(response);
  },

  extendActivity: async (userId, minutes) => {
    const response = await fetchWithRetry(`${API_BASE}/activity/extend`, {
      method: 'POST',
      body: JSON.stringify({ userId, minutes })
    });
    return handleResponse(response);
  },

  cancelActivity: async (userId) => {
    const response = await fetchWithRetry(`${API_BASE}/activity/cancel`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    return handleResponse(response);
  },

  sendActivityAlert: async (userId, activity) => {
    const response = await fetchWithRetry(`${API_BASE}/activity/alert`, {
      method: 'POST',
      body: JSON.stringify({ userId, activity })
    });
    return handleResponse(response);
  },

  getActivityStatus: async (userId) => {
    const response = await fetchWithRetry(`${API_BASE}/activity/status/${userId}`);
    return handleResponse(response);
  },

  // Family Dashboard endpoints
  getFamilyDashboard: async (token) => {
    // Family dashboard doesn't need auth - it's accessed via share token
    const response = await fetchWithTimeout(`${API_BASE}/family/dashboard/${token}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  getFamilyShares: async (userId) => {
    const response = await fetchWithRetry(`${API_BASE}/family/shares/${userId}`);
    return handleResponse(response);
  },

  createFamilyShare: async (userId, label = null, expiresAt = null) => {
    const response = await fetchWithRetry(`${API_BASE}/family/shares/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ label, expiresAt })
    });
    return handleResponse(response);
  },

  deleteFamilyShare: async (userId, shareId) => {
    const response = await fetchWithRetry(`${API_BASE}/family/shares/${userId}/${shareId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // Push notification endpoints
  getVapidPublicKey: async () => {
    const response = await fetchWithRetry(`${API_BASE}/notifications/vapid-public-key`);
    return handleResponse(response);
  },

  subscribePush: async (userId, subscription) => {
    const response = await fetchWithRetry(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ userId, subscription })
    });
    return handleResponse(response);
  },

  unsubscribePush: async (userId) => {
    const response = await fetchWithRetry(`${API_BASE}/notifications/unsubscribe`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    return handleResponse(response);
  },

  // Confirmation status
  getConfirmationStatus: async (userId) => {
    const response = await fetchWithRetry(`${API_BASE}/confirmations/status/${userId}`);
    return handleResponse(response);
  }
};

// Sync local data to server
export const syncToServer = async (localData) => {
  if (!localData.userId || !navigator.onLine) return null;

  try {
    const serverData = await api.updateUser(localData.userId, {
      name: localData.name,
      contactName: localData.contactName,
      contactEmail: localData.contactEmail,
      contactPhone: localData.contactPhone,
      petName: localData.petName,
      petNotes: localData.petNotes,
      petEmoji: localData.petEmoji,
      streak: localData.streak,
      lastCheckIn: localData.lastCheckIn,
      vacationUntil: localData.vacationUntil,
      timezone: localData.timezone,
      checkInWindowStart: localData.checkInWindowStart,
      checkInWindowEnd: localData.checkInWindowEnd,
      alertPreference: localData.alertPreference,
      locationSharingEnabled: localData.locationSharingEnabled,
      proofOfLifeEnabled: localData.proofOfLifeEnabled
    });
    return serverData;
  } catch (error) {
    console.error('Failed to sync with server:', error);
    return null;
  }
};
