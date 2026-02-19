const BASE_URL = "http://localhost:7000";

// Token expire vaxtı: 30 dəq. Buffer: 5 dəq → 25 dəq sonra refresh
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

// Eyni anda bir neçə 401 gəldikdə refresh yalnız 1 dəfə çağırılsın
let refreshPromise = null;
let refreshTimerId = null;

async function refreshToken() {
  // Artıq refresh gedirsə, eyni promise-i paylaş
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(BASE_URL + "/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Refresh failed");
      // Uğurlu refresh — növbəti timer-i planla
      scheduleRefresh();
      return true;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Proactive refresh — token expire olmamış 5 dəq əvvəl avtomatik refresh
function scheduleRefresh() {
  if (refreshTimerId) clearTimeout(refreshTimerId);

  refreshTimerId = setTimeout(async () => {
    try {
      await refreshToken();
    } catch {
      // Refresh uğursuz — növbəti API call 401 alacaq, orada handle olunacaq
    }
  }, REFRESH_INTERVAL_MS);
}

// Timer-i dayandır (logout zamanı)
function stopRefreshTimer() {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(BASE_URL + endpoint, {
    ...options,
    credentials: "include",
  });

  // 401 gələndə: refresh et, sonra retry et
  if (response.status === 401) {
    try {
      await refreshToken();
    } catch {
      // Refresh uğursuz — session expired
      throw new Error("Session expired");
    }

    // Retry — orijinal request-i yenidən göndər
    const retryResponse = await fetch(BASE_URL + endpoint, {
      ...options,
      credentials: "include",
    });

    if (!retryResponse.ok) {
      const error = await retryResponse.json().catch(() => ({}));
      throw new Error(error.error || "Request failed");
    }

    return retryResponse.json();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

function apiGet(endpoint) {
  return apiFetch(endpoint);
}

function apiPost(endpoint, body) {
  return apiFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export { apiGet, apiPost, scheduleRefresh, stopRefreshTimer };
