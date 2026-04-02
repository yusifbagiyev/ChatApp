# Backend Task: Refresh Token 400 Investigation

**From**: Product Owner
**To**: Backend Developer
**Date**: 2026-04-02
**Priority**: P0 — RememberMe aktiv olduğu halda refresh 400 qaytarır

---

## Problem

İstifadəçi rememberMe ilə login olub, kompüteri 12+ saat locka salıb. Səhər `POST /api/auth/refresh` → **400** qaytarır.

Backend logları:
```
04:45:06 — POST /api/auth/refresh → 400 (Bad Request)
04:56:57 — POST /api/auth/refresh → 200 (bu yenidən login-dən sonradır)
```

RememberMe aktiv olduqda refresh token 30 gün etibarlı olmalıdır. Amma 12 saatdan sonra 400 qaytarır.

---

## Araşdırılacaqlar

### 1. RefreshToken Endpoint — Niyə 400?

`AuthController.cs` — `RefreshToken()` metodu:
- Session cookie-dən `_sid` oxunur
- Redis-dən `GetRefreshTokenAsync(sessionId)` çağırılır
- **400 qaytarır əgər:**
  - Session cookie yoxdursa
  - Redis-dəki session expired olubsa (Redis TTL)
  - `RefreshTokenExpiresAt < DateTime.UtcNow` (token expired)

**Yoxla:** Redis-dəki session TTL nədir? `refreshTokenLifetime` config-dən neçə gün oxunur?

### 2. Redis Session TTL vs Cookie Lifetime

`RedisSessionStore.CreateSessionAsync()` (line 44):
```csharp
AbsoluteExpirationRelativeToNow = refreshTokenLifetime
```

`AuthController.SetSessionCookie()` (line 255):
```csharp
Expires = rememberMe ? DateTimeOffset.UtcNow.Add(refreshTokenLifetime) : null
```

**Cookie** brauzer-də `refreshTokenLifetime` qədər yaşayır.
**Redis session** eyni müddət yaşayır.

**Amma:** Əgər `JwtSettings:RefreshTokenExpirationDays` config-da aşağı dəyərdədirsə (məsələn 1 gün), onda 12 saatdan sonra expire ola bilər.

### 3. Config Yoxlaması

`appsettings.json`-da bu dəyərləri yoxla:
```json
"JwtSettings": {
  "RefreshTokenExpirationDays": ???
}
```

Əgər bu dəyər aşağıdırsa (1 gün), 30-a dəyiş.

### 4. Refresh zamanı token yenilənmə

`UpdateTokensAsync()` (line 81-109) — refresh uğurlu olduqda:
- Yeni access + refresh token yazılır
- Redis TTL yenilənir (`refreshTokenLifetime` ilə)

Bu düzgündür — hər refresh-də session TTL uzadılır. **Amma** əgər refresh heç olmadısa (timer sleep-dən qayıtmadı), session TTL uzadılmır və expire ola bilər.

---

## Düzəlişlər (Əgər Lazımdırsa)

### Əgər config problemidir:
`appsettings.json`-da `RefreshTokenExpirationDays: 30` olmalıdır.

### Əgər Redis TTL problemidir:
Production `.env`-dəki `JwtSettings:RefreshTokenExpirationDays` yoxla — override oluna bilər.

### Əgər refresh logic problemidir:
`GetRefreshTokenAsync()` (line 75) — `RefreshTokenExpiresAt > DateTime.UtcNow` yoxlayır. Əgər `RefreshTokenExpiresAt` düzgün set olunmayıbsa, vaxtından tez expire ola bilər.

### Logging əlavə et:
RefreshToken endpoint-ə detailed logging əlavə et ki, 400-ün dəqiq səbəbi görünsün:
```csharp
_logger.LogWarning("Refresh failed for session {SessionId}: {Reason}", sessionId, reason);
```

---

## Acceptance Criteria

- [ ] `RefreshTokenExpirationDays` production-da 30 gün olmalıdır
- [ ] RememberMe ilə login olub 12+ saat sonra refresh uğurlu olmalıdır (200)
- [ ] Refresh endpoint detailed logging əlavə olunmalıdır (400-ün səbəbi log olunmalıdır)
- [ ] Redis session TTL = refreshTokenLifetime olmalıdır (30 gün)
