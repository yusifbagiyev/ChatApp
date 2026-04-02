# Frontend Task: Session Resume After Computer Sleep

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-04-02
**Priority**: P0 — RememberMe ilə login olmuş istifadəçi kompüteri açanda login səhifəsinə atılır

---

## Problem

İstifadəçi rememberMe ilə login olur, kompüteri locka salır, səhər geri gəlir. Nəticə:
1. Access token expired (15 dəq ömrü var)
2. `checkAuth()` → `GET /api/users/me` → 401
3. `apiFetch` retry logic → `POST /api/auth/refresh` → 400 (session expired)
4. `sessionExpired = true` → login səhifəsinə atılır

**Gözlənilən davranış:** RememberMe aktiv olduqda, 30 gün ərzində sessiya bərpa olunmalıdır.

---

## Kök Səbəblər

### 1. `setTimeout` kompüter sleep zamanı işləmir
`scheduleRefresh()` (`api.js:92`) `setTimeout(fn, 12dəq)` istifadə edir. Kompüter locka salınanda JS engine-in bütün timer-ləri pauzaya düşür. 12+ saat keçdikdə timer fire olur amma access token artıq expired olur.

### 2. `checkAuth()` refresh-dən əvvəl `/api/users/me` çağırır
`AuthContext.jsx:53` — birbaşa `apiGet("/api/users/me")` çağırır. Access token expired olduğu üçün 401 alır. Sonra `apiFetch` retry-da refresh cəhd edir, amma bu zaman nədənsə 400 qaytarır.

### 3. Tab visibility dəyişikliyi handle olunmur
Kompüter sleep-dən qayıdanda `document.visibilitychange` event fire olur. Bu event handle olunmalıdır — dərhal refresh cəhd etmək lazımdır.

---

## Düzəlişlər

### 1. Visibility Change Handler — `api.js`-ə əlavə et

```javascript
// Kompüter sleep-dən qayıdanda və ya tab aktiv olanda — dərhal refresh et
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !sessionExpired) {
    // Timer-lər sleep zamanı fire olmayıb — dərhal refresh cəhd et
    refreshToken().catch(() => {});
  }
});
```

Bu, kompüter açılan kimi access token-i yeniləyəcək — `checkAuth()` çağırılmamışdan əvvəl.

### 2. `checkAuth()` — refresh-i əvvəl cəhd et

`AuthContext.jsx:48-62` — `checkAuth()` dəyişdirilməlidir:

```javascript
async function checkAuth() {
  resetSessionExpired();
  try {
    const data = await apiGet("/api/users/me");
    setUser(data);
    scheduleRefresh();
  } catch {
    // /api/users/me 401 aldı → refresh artıq cəhd edilib (apiFetch içində)
    // Əgər refresh də uğursuz oldusa → login lazımdır
    setUser(null);
  } finally {
    setIsLoading(false);
  }
}
```

Hal-hazırkı logic əslində düzgündür — `apiFetch` 401 aldıqda avtomatik refresh cəhd edir. Problem `visibilitychange` handler-in olmamasıdır.

### 3. Proactive refresh timer — sleep-dən qayıtma yoxlaması

`scheduleRefresh()` — timer fire olduqda vaxtın keçib-keçmədiyini yoxlamalıdır:

```javascript
let lastRefreshTime = Date.now();

function scheduleRefresh() {
  if (refreshTimerId) clearTimeout(refreshTimerId);
  lastRefreshTime = Date.now();
  
  refreshTimerId = setTimeout(async () => {
    // Sleep-dən qayıtma yoxlaması — timer 12 dəqiqəyə qurulub amma
    // 1+ saat keçibsə, sleep olub → dərhal refresh et
    try {
      await refreshToken();
    } catch {
      // Silent — növbəti API call retry edəcək
    }
  }, REFRESH_INTERVAL_MS);
}
```

---

## Test

1. Login ol (rememberMe ON)
2. Kompüteri locka sal
3. 20+ dəqiqə gözlə (access token expire olsun)
4. Kompüteri aç
5. **Gözlənilən:** Sessiya avtomatik bərpa olunur, login səhifəsinə atılmır
6. Mesaj göndərib ala bilirsən

---

## 4. Login Səhifəsində Lazımsız Sorğuların Qarşısını Al

Hazırda login səhifəsində console-da bu xətalar görünür:
- `GET /api/users/me` → 401
- `POST /api/auth/refresh` → 400
- `GET /api/auth/signalr-token` → 401
- SignalR reconnect retry-lar

**Düzəliş:**
- `signalr.js` — `startConnection()` çağırılmamışdan əvvəl session cookie mövcudluğunu yoxla. Cookie yoxdursa, connection cəhd etmə
- `signalr.js` — `scheduleRetry()` — `sessionExpired` flag aktiv olduqda retry etmə
- `api.js` — `visibilitychange` handler — `sessionExpired` olduqda refresh cəhd etmə
- SignalR `onclose` → əgər session expired-dirsə reconnect etmə

---

## Qeydlər

- `visibilitychange` event brauzerdə tab aktiv/gizli olanda və kompüter sleep/wake olanda fire olur
- Bu həll SignalR reconnect-ə də kömək edəcək — token refresh olduqdan sonra SignalR yeni token ala biləcək
- Backend-dəki refresh token (30 gün) Redis-də saxlanılır — bu hissə düzgün işləyir
