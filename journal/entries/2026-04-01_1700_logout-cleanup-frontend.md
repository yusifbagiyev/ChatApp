# Frontend Task: Logout Flow Cleanup — Stop All Connections Before Token Clear

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-04-01
**Priority**: P2 — Quality bug (console errors after logout)
**Source**: DevOps & Security Agent audit — `2026-04-01_1600_logout-console-errors-devops.md`

---

## Problem

Logout-dan sonra brauzerin console-unda bu xətalar görünür:
- `GET /api/users/me` → 401
- `POST /api/auth/refresh` → 400
- `GET /api/auth/signalr-token` → 401
- SignalR reconnect: "Failed to complete negotiation"

Login səhifəsində qaldıqda bu xətalar təkrarlanır — frontend unauthenticated olduğu halda API sorğuları və SignalR reconnect cəhdləri davam edir.

---

## Kök Səbəb

Logout flow-da ardıcıllıq yanlışdır:
1. Cookie/session silinir
2. **Amma** SignalR connection hələ açıqdır → reconnect cəhd edir → 401
3. **Amma** proactive refresh timer hələ işləyir → refresh cəhd edir → 400
4. **Amma** `checkAuth()` çağırılır → `/api/users/me` → 401

---

## Düzəliş

Logout flow-da bu ardıcıllıq olmalıdır:

### 1. AuthContext.jsx — `logout()` funksiyası
```
1. SignalR connection-u dayandır (stopConnection)
2. Proactive refresh timer-i dayandır (stopRefreshTimer)  ← artıq olur
3. POST /api/auth/logout → server session sil             ← artıq olur
4. setUser(null) → app login səhifəsinə yönləndirir       ← artıq olur
```

SignalR `stopConnection()` çağırılmalıdır logout-da — `signalr.js`-dən export olunub?

### 2. signalr.js — `stopConnection()` export
Əgər mövcud deyilsə, `stopConnection()` funksiyası export olunmalıdır:
```javascript
export function stopConnection() {
  stopRequested = true;
  if (retryTimerId) { clearTimeout(retryTimerId); retryTimerId = null; }
  if (connection) { connection.stop(); connection = null; }
  connectionPromise = null;
}
```

### 3. Login səhifəsində API sorğusu olmamalıdır
Login səhifəsi render olunanda `checkAuth()` və ya `useChatSignalR` çağırılmamalıdır. Yoxla:
- `AuthContext`-dəki `checkAuth()` — login page-də çağırılırsa, user null olduqda 401 sorğusu getməsin
- `useChatSignalR` — yalnız Chat.jsx-də çağırılır, login page-də yoxdur (bu düzgündür)
- Proactive refresh timer — user null olduqda işləməməlidir

### 4. api.js — sessionExpired flag
`sessionExpired = true` olduqda heç bir API sorğusu göndərilməməlidir. Yoxla ki, logout zamanı bu flag düzgün set olunur.

---

## Acceptance Criteria

- [ ] Logout-dan sonra console-da 0 xəta — heç bir 401/400 sorğu yoxdur
- [ ] Login səhifəsində heç bir API sorğusu göndərilmir (user null olduqda)
- [ ] SignalR connection logout-da dayandırılır, reconnect cəhd etmir
- [ ] Refresh timer logout-da dayandırılır
- [ ] Yenidən login olduqda SignalR yeni connection qurur
