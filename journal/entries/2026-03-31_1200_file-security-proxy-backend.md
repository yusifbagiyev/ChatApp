# Backend Task: File Serving Security — Proxy Pattern

**From**: Product Owner
**To**: Backend Developer
**Date**: 2026-03-31
**Priority**: P0 — CRITICAL (təhlükəsizlik boşluğu)

---

## Problem

Hazırda `UseStaticFiles` middleware `/uploads/*` path-i üçün **autentifikasiya olmadan** faylları serve edir. `Program.cs:376-385`-də middleware `UseAuthentication` (line 388) və `UseAuthorization` (line 390)-dan **əvvəl** qeydiyyata alınıb.

**Nəticə:** URL-i bilən istənilən şəxs (login olmadan belə) istənilən faylı yükləyə bilər:
```
http://localhost:7000/uploads/companies/xxx/users/yyy/images/abc.jpg
```

Bu həm mesaj fayllarına, həm avatarlara, həm də gələcək Drive fayllarına aiddir.

---

## Tələblər

### 1. UseStaticFiles `/uploads` üçün SİLİNMƏLİDİR

`Program.cs:376-385` — bu blok tamamilə silinməlidir. Fayllar artıq birbaşa disk-dən serve olunmayacaq.

### 2. Yeni Authenticated File Serve Endpoint

Faylları serve etmək üçün yeni endpoint yaradılmalıdır:

```
GET /api/files/serve/{fileId:guid}
```

**Davranış:**
- `[Authorize]` — autentifikasiya tələb olunur
- Permission check: `CheckFileAccessPermissionAsync()` — mövcud logic istifadə olunsun (uploader, channel member, conversation participant)
- Fayl tapılmadıqda 404
- İcazə yoxdursa 403
- Uğurlu halda: fayl stream + düzgün `Content-Type` header
- **Cache headers:** `Cache-Control: private, max-age=86400` (24 saat, yalnız authenticated user üçün)
- `enableRangeProcessing: true` — böyük fayllar üçün

**Qeyd:** Bu endpoint mövcud `DownloadFile` endpoint-ə (`GET /api/files/{fileId}/download`) çox oxşardır. Fərq: download endpoint `Content-Disposition: attachment` göndərir (yükləmə), serve endpoint isə `inline` göndərir (brauzerdə göstərmə). Mövcud kodu refactor et — ortaq logic `CheckFileAccessPermissionAsync`-də artıq var.

### 3. Avatar Serve Endpoint (Yüngül Auth)

Avatarlar yüksək tezlikli oxunuşdur (hər mesaj bubble, conversation list, user list). Bunlar üçün ayrıca yüngül endpoint:

```
GET /api/files/avatar/{fileId:guid}
```

**Davranış:**
- `[Authorize]` — yalnız autentifikasiya, əlavə access check yoxdur
- Hər authenticated istifadəçi hər avatarı görə bilər (semi-public)
- Cache headers: `Cache-Control: private, max-age=604800` (7 gün)
- Performans üçün daha uzun cache

**Alternativ yanaşma:** Əgər avatarlar üçün FileMetadata record yoxdursa (bəziləri yalnız path olaraq saxlanılır), o zaman:
```
GET /api/files/avatar?path={relativePath}
```
Bu halda path validate olunmalıdır (yalnız `/avatar/` və ya `/departments/` path-lərinə icazə — path traversal attack-ın qarşısını al).

### 4. DTO Dəyişiklikləri

Hazırda DTO-larda `FileUrl` / `AvatarUrl` sahələri birbaşa disk path-i qaytarır:
```
/uploads/companies/xxx/users/yyy/images/abc.jpg
```

Bu dəyişdirilməlidir. İki variant:

**Variant A (Tövsiyə olunan):** fileId qaytarmaq
```json
{
  "fileId": "7898c7b7-053d-49e0-85f6-554ba2960b4e",
  "fileUrl": "/api/files/serve/7898c7b7-053d-49e0-85f6-554ba2960b4e"
}
```

**Variant B:** Yalnız fileId qaytarmaq, frontend URL-i özü qursun
```json
{
  "fileId": "7898c7b7-053d-49e0-85f6-554ba2960b4e"
}
```

**Avatar DTO-lar üçün:** Eyni pattern — `avatarFileId` əlavə et, frontend endpoint-dən istifadə etsin.

### 5. FileUrlHelper Refactoru

`FileUrlHelper.ToUrl()` (`ChatApp.Shared.Kernel/Common/FileUrlHelper.cs`) hazırda path-i `/uploads/...` URL-ə çevirir. Bu artıq lazım deyil — `/api/files/serve/{fileId}` formatına keçirilməlidir.

---

## Toxunulacaq Fayllar

| Fayl | Dəyişiklik |
|------|-----------|
| `Program.cs` | `UseStaticFiles` `/uploads` blokunun silinməsi |
| `FilesController.cs` | Yeni `Serve` və `Avatar` endpoint-ləri |
| `FileUrlHelper.cs` | URL format dəyişikliyi (path → fileId-based URL) |
| Bütün message DTO-lar | `FileUrl` sahələrinin yenilənməsi |
| Bütün user/company/dept DTO-lar | Avatar URL sahələrinin yenilənməsi |
| Repository-lər | DTO projection dəyişiklikləri |

---

## Acceptance Criteria

- [ ] `/uploads/*` path-inə birbaşa HTTP sorğu **401 Unauthorized** qaytarır
- [ ] Authenticated user `/api/files/serve/{fileId}` ilə mesaj faylını görə bilir
- [ ] Channel-ə üzv olmayan user həmin channel-in faylına **403** alır
- [ ] Conversation-da iştirakçı olmayan user həmin DM faylına **403** alır
- [ ] Avatar endpoint authenticated user üçün işləyir
- [ ] Unauthenticated user avatar-a da daxil ola bilmir
- [ ] Frontend-dən gələn sorğularda JWT cookie avtomatik göndərilir
- [ ] Şəkillər browserdə düzgün render olunur (Content-Type düzgündür)

---

## Qeydlər

- Mövcud `DownloadFile` endpoint saxlanılsın — o attachment kimi yükləmə üçündür
- Yeni `Serve` endpoint inline göstərmə üçündür (şəkil, video preview və s.)
- Performance: avatar endpoint-ə response caching əlavə et (IMemoryCache və ya ResponseCaching middleware)
- Path traversal attack-ın qarşısını almaq üçün path validation mütləqdir
