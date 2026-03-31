# Frontend Task: File Serving Security — TAMAMLANDI ✅

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-31
**Priority**: P0 — CRITICAL
**Status**: TAMAMLANDI — Blob URL pattern lazımsız çıxdı

## Nəticə

Backend authenticated endpoint-ləri (`/api/files/serve/{fileId}`, `/api/files/avatar/{fileId}`) qurulub. DTO-lar `FileUrlHelper.ToAvatarUrl()` ilə düzgün URL qaytarır. Frontend `getFileUrl(path)` ilə `BASE_URL + path` yaradır. Brauzer `<img src>` üçün HttpOnly cookie göndərir — əlavə blob URL keçidinə ehtiyac yoxdur. Cookie-based auth birbaşa işləyir.

**Depends On**: `2026-03-31_1200_file-security-proxy-backend.md` (Tamamlanıb)

---

## Problem

Hazırda frontend faylları birbaşa static URL ilə göstərir:
```html
<img src="http://localhost:7000/uploads/companies/xxx/users/yyy/images/abc.jpg" />
```

Bu URL public-dir, authorization yoxdur. Backend bu URL-i bağlayacaq. Frontend yeni authenticated endpoint-dən istifadə etməlidir.

---

## Yeni Pattern: Authenticated Fetch + Blob URL

### Necə işləyəcək:

```
1. Backend DTO-dan fileId gəlir
2. Frontend: fetch("/api/files/serve/{fileId}", { credentials: "include" })
3. Response: binary file data (blob)
4. Browser: URL.createObjectURL(blob) → "blob:http://localhost:3000/abc-123"
5. <img src="blob:http://localhost:5173/abc-123" />
```

**Nəticə:** Brauzer URL-i müvəqqətidir, paylaşıla bilməz, session bitəndə ölür.

---

## 1. Yeni API Helper Funksiyaları (`services/api.js`)

### `getSecureFileUrl(fileId)` — Mesaj faylları üçün
```javascript
// fileId → blob URL çevirmə
// Cache: Map<fileId, blobUrl> — eyni fayl üçün təkrar fetch etmə
// Cleanup: URL.revokeObjectURL() component unmount-da
```

### `getSecureAvatarUrl(fileId)` — Avatarlar üçün
```javascript
// Eyni pattern, amma avatar endpoint istifadə edir
// Daha uzun cache (avatarlar nadir dəyişir)
```

### Cache Strategiyası
```javascript
const blobCache = new Map(); // fileId → blobUrl

async function getSecureFileUrl(fileId) {
  if (blobCache.has(fileId)) return blobCache.get(fileId);
  
  const response = await apiFetch(`/api/files/serve/${fileId}`);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  
  blobCache.set(fileId, blobUrl);
  return blobUrl;
}
```

**Memory management:** Component unmount-da `URL.revokeObjectURL()` çağır. Conversation switch-də köhnə blob URL-ləri təmizlə.

---

## 2. Dəyişdiriləcək Komponentlər

### MessageBubble.jsx
- `msg.fileUrl` (static URL) → `msg.fileId` ilə `getSecureFileUrl(fileId)` çağır
- Şəkillər: `useEffect` ilə blob URL al, `useState`-də saxla
- Loading state: blob yüklənənə qədər skeleton/placeholder göstər
- `_uploading` / `_localPreview` halları dəyişməz — lokal preview blob artıq var

### ConversationList.jsx
- Avatar-lar: `getSecureAvatarUrl(avatarFileId)` istifadə et
- Default initials placeholder dəyişməz

### ChatHeader.jsx
- Aktiv conversation/channel avatar-ı: secure avatar URL

### Admin komponentləri (UserManagement, CompanyManagement, DepartmentManagement, UserDetailPage)
- User avatar, company logo, department avatar: secure avatar URL

### FilePreviewPanel.jsx
- Fayl preview URL-ləri: secure file URL

### ImageViewer.jsx (Lightbox)
- Tam ölçülü şəkil: secure file URL

### ChannelPanel.jsx
- Channel info-da paylaşılmış fayllar: secure file URL-lər

---

## 3. Custom Hook: `useSecureFile(fileId)`

Təkrar istifadə olunan hook yarat:

```javascript
function useSecureFile(fileId) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(!!fileId);
  
  useEffect(() => {
    if (!fileId) return;
    let revoked = false;
    
    getSecureFileUrl(fileId).then(blobUrl => {
      if (!revoked) {
        setUrl(blobUrl);
        setLoading(false);
      }
    });
    
    return () => { revoked = true; };
  }, [fileId]);
  
  return { url, loading };
}
```

---

## 4. `getFileUrl()` Helper-in Refactoru

Mövcud `getFileUrl(path)` helper (`api.js:296-299`) artıq static URL yaratmamalıdır. Bu funksiya ya silinməli, ya da `getSecureFileUrl(fileId)` ilə əvəz olunmalıdır.

**Əvvəl:**
```javascript
function getFileUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return BASE_URL + path;
}
```

**Sonra:** Bu funksiya silinir. Hər yerdə `useSecureFile(fileId)` hook istifadə olunur.

---

## 5. Upload Flow Dəyişikliyi

Upload zamanı backend-dən gələn response-da artıq `fileUrl` (static path) əvəzinə `fileId` gələcək.

**Əvvəl:**
```json
{ "fileUrl": "/uploads/companies/xxx/users/yyy/images/abc.jpg", "fileId": "..." }
```

**Sonra:**
```json
{ "fileId": "7898c7b7-053d-49e0-85f6-554ba2960b4e" }
```

Frontend upload-dan sonra:
1. `fileId`-ni alır
2. Mesaj DTO-ya `fileId` əlavə edir
3. MessageBubble `useSecureFile(fileId)` ilə render edir

**Local preview:** Upload zamanı `_localPreview` blob URL istifadə olunmağa davam edir (dəyişiklik yoxdur). Backend response gələndən sonra real `fileId`-yə keçir.

---

## 6. SignalR Message Handling

Real-time gələn mesajlarda da `fileUrl` → `fileId` keçidi olacaq. `useChatSignalR.js`-də gələn mesaj DTO-sunda `fileId` istifadə et.

---

## Acceptance Criteria

- [ ] Heç bir komponent birbaşa `/uploads/...` URL istifadə etmir
- [ ] Bütün şəkillər blob URL ilə göstərilir
- [ ] Blob URL-lər paylaşıla bilməz (kopyalayıb başqa tab-da açsan işləmir — session-a bağlıdır)
- [ ] Avatar-lar authenticated endpoint-dən gəlir
- [ ] Upload flow düzgün işləyir (local preview → real fileId)
- [ ] SignalR ilə gələn mesajlarda şəkillər düzgün render olunur
- [ ] Conversation switch-də memory leak yoxdur (köhnə blob URL-lər revoke olunur)
- [ ] Loading state: blob yüklənənə qədər skeleton göstərilir

---

## Qeydlər

- Bu task backend task-dan asılıdır — backend endpoint hazır olmadan test etmək mümkün deyil
- Performans: blob cache mütləqdir — eyni avatar üçün hər dəfə fetch etmə
- Conversation-dakı bütün şəkilləri parallel fetch et (Promise.all), ardıcıl deyil
- Memory management vacibdir — conversation switch-də `URL.revokeObjectURL()` mütləqdir
