// ─── api.js — Centralized HTTP Layer ─────────────────────────────────────────
// .NET-də: HttpClient + AuthenticationHandler kimi.
// Bütün API çağırışları bu fayldan keçir. Burda:
//   - Cookie avtomatik göndərilir (BFF pattern)
//   - 401 gəldikdə token refresh + retry avtomatik olur
//   - Proactive token refresh timer işləyir

// Backend server URL-i — bütün endpointlərə bu əlavə olunur
// Docker-da: window.__ENV__.API_BASE_URL nginx/docker-entrypoint.sh tərəfindən set olunur
// Development-də: public/env.js default "http://localhost:7000" istifadə edir
const BASE_URL = window.__ENV__?.API_BASE_URL ?? "http://localhost:7000";

// JWT token 30 dəq-ə expire olur.
// Biz 25 dəq sonra proaktiv refresh edirik ki, istifadəçi "session expired" görməsin.
// 25 * 60 * 1000 = 1,500,000 millisaniyə = 25 dəqiqə
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

// ─── Module-Level Variables ───────────────────────────────────────────────────
// Bu dəyişənlər faylın "özəl yaddaşı"dır — class-sız singleton kimi işləyir.

// refreshPromise: eyni anda 2+ 401 gəldikdə yalnız 1 refresh request göndərilsin.
// null — hal-hazırda refresh getmir.
// Promise — refresh gedir, gözlə.
let refreshPromise = null;

// refreshTimerId: setTimeout qaytardığı ID — clearTimeout üçün lazımdır
let refreshTimerId = null;

// ─── refreshToken ─────────────────────────────────────────────────────────────
// Server-dən yeni access token alır (refresh cookie vasitəsilə).
// "Singleton promise" pattern: eyni anda çoxlu 401 gəlsə, yalnız 1 refresh gedir.
async function refreshToken() {
  // Artıq refresh işləyirsə — eyni promise-i qaytar (2 request göndərmə)
  if (refreshPromise) return refreshPromise;

  // fetch — brauzer-in daxili HTTP client funksiyası (.NET-də HttpClient.PostAsync kimi)
  // credentials: "include" — cookie-ni avtomatik göndər (BFF pattern üçün vacib!)
  refreshPromise = fetch(BASE_URL + "/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then((res) => {
      // !res.ok → HTTP 4xx/5xx — refresh uğursuz → throw et
      if (!res.ok) throw new Error("Refresh failed");
      scheduleRefresh(); // Uğurlu → növbəti refresh-i planla (25 dəq sonra yenə)
      return true;
    })
    .finally(() => {
      // .finally() — uğurlu olsun ya olmasın, refreshPromise-i sıfırla
      // Növbəti çağırışda yenidən request göndərə bilsin
      refreshPromise = null;
    });

  return refreshPromise;
}

// ─── scheduleRefresh ──────────────────────────────────────────────────────────
// Token expire olmadan 5 dəq əvvəl avtomatik refresh planlaşdırır.
// setTimeout — JavaScript-in "gecikmə ilə funksiya çağır" mexanizmi.
// .NET-də: Timer ya da BackgroundService kimi.
function scheduleRefresh() {
  // Köhnə timer varsa sil — "restart" effekti
  if (refreshTimerId) clearTimeout(refreshTimerId);

  // 25 dəq sonra refreshToken() çağır
  refreshTimerId = setTimeout(async () => {
    try {
      await refreshToken();
    } catch {
      // Proactive refresh uğursuz — problem yoxdur.
      // Növbəti API call 401 alacaq, orada da retry edəcəyik.
    }
  }, REFRESH_INTERVAL_MS);
}

// ─── stopRefreshTimer ─────────────────────────────────────────────────────────
// Logout zamanı çağırılır — boşuna refresh etməsin.
function stopRefreshTimer() {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId); // Timer-i ləğv et
    refreshTimerId = null;        // ID-ni sıfırla
  }
}

// ─── apiFetch — Core HTTP Function ───────────────────────────────────────────
// Bütün API calls buradan keçir. 401 gəldikdə: refresh + retry.
// endpoint: "/api/users/me" kimi — BASE_URL-ə əlavə olunur
// options: { method, headers, body } — GET üçün boş, POST/PUT üçün dolu
async function apiFetch(endpoint, options = {}) {
  // fetch — HTTP sorğu göndər
  // ...options — spread operator: options-ın bütün xassələrini buraya kopyala
  // credentials: "include" — cookie-ni hər request-ə əlavə et (server session üçün)
  const response = await fetch(BASE_URL + endpoint, {
    ...options,
    credentials: "include",
  });

  // 401 Unauthorized → token expire olub → refresh et, yenidən cəhd et
  if (response.status === 401) {
    try {
      await refreshToken(); // Yeni token al
    } catch {
      // Refresh da uğursuz → session tamamilə bitib → login lazımdır
      throw new Error("Session expired");
    }

    // Orijinal sorğunu yenidən göndər (refresh-dən sonra yeni cookie var)
    const retryResponse = await fetch(BASE_URL + endpoint, {
      ...options,
      credentials: "include",
    });

    if (!retryResponse.ok) {
      // JSON-da server error mesajını götür (olmasa boş object {} qaytar)
      const error = await retryResponse.json().catch(() => ({}));
      throw new Error(error.error || "Request failed");
    }

    // 204 No Content: server cavab vermirdi (məsələn DELETE uğurlu)
    if (retryResponse.status === 204) return null;
    return retryResponse.json(); // JSON-u parse edib qaytır
  }

  // Normal (401 olmayan) error — serverdə problem
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  // 204 No Content — boş cavab (məsələn POST /logout)
  if (response.status === 204) return null;

  // .json() — response body-ni JSON-a parse edir və Promise qaytarır
  return response.json();
}

// ─── Convenience Functions ────────────────────────────────────────────────────
// GET sorğusu — body yoxdur, sadəcə endpoint
function apiGet(endpoint) {
  return apiFetch(endpoint);
}

// POST sorğusu — body var (JSON)
// JSON.stringify(body): JavaScript object-i JSON string-ə çevirir
// { "Content-Type": "application/json" }: servərə "body JSON formatındadır" deyirik
function apiPost(endpoint, body) {
  return apiFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// PUT sorğusu — POST kimi, amma mövcud resursu yeniləmək üçün
function apiPut(endpoint, body) {
  return apiFetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// DELETE sorğusu — body yoxdur, yalnız URL
function apiDelete(endpoint) {
  return apiFetch(endpoint, { method: "DELETE" });
}

// Named exports — başqa fayllar bunları import edə bilsin
export { apiGet, apiPost, apiPut, apiDelete, scheduleRefresh, stopRefreshTimer };
