# Frontend Task: Upload Permission Check

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-28
**Priority**: P2

---

## Xülasə

Yeni `Avatar.Upload` permission yaradılıb (backend tapşırığı). Frontend-də avatar upload UI-ı bu permission-a bağlanmalıdır. `Files.Upload` ümumi fayl yükləmədir (mesajda attachment), `Avatar.Upload` isə avatar yükləməyə aiddir.

---

## Mövcud Vəziyyət

- `AuthContext.jsx` — `user` obyektində `permissions: string[]` mövcuddur (`/api/users/me`-dən gəlir)
- Backend `Avatar.Upload` permission-u regular user-lərə avtomatik assign edir
- Amma gələcəkdə admin bu permission-u silə bilər → frontend UI-da upload düymələri gizlənməlidir

---

## 1. Permission Check Helper

**Fayl:** `chatapp-frontend/src/context/AuthContext.jsx`

`useAuth` hook-dan `hasPermission` helper export et:

```js
// AuthContext daxilində, value-ya əlavə et:
const hasPermission = useCallback(
  (perm) => user?.permissions?.includes(perm) ?? false,
  [user]
);

// Provider value:
value={{ user, isLoading, login, logout, hasPermission }}
```

---

## 2. Upload UI-da Permission Yoxla

### UserProfilePanel.jsx — Avatar Upload

Avatar dəyişdirmə düyməsini `hasPermission("Avatar.Upload")` ilə şərtləndir:

```jsx
const { hasPermission } = useAuth();

// Avatar dəyişmə düyməsi:
{hasPermission("Avatar.Upload") && (
  <button onClick={openAvatarCrop}>Change Avatar</button>
)}
```

### DepartmentManagement.jsx — Department Avatar Upload

Avatar upload sahəsini gizlət:

```jsx
const { hasPermission } = useAuth();

// Avatar upload area:
{hasPermission("Avatar.Upload") && (
  <div className="dm-avatar-upload">
    {/* ... mövcud upload UI ... */}
  </div>
)}
```

> **Qeyd:** Department yaradılarkən avatar məcburidirsa, `Avatar.Upload` permission-u olmayan user department yarada bilməz. Bu məntiqlidir — admin panel-ə giriş permission-a bağlıdır.

### HierarchyView.jsx — Department Avatar Upload

`DeptDetailPanel` daxilindəki avatar upload-u eyni şəkildə:

```jsx
const { hasPermission } = useAuth();

{hasPermission("Avatar.Upload") && (
  <div className="hi-avatar-upload">
    {/* ... upload UI ... */}
  </div>
)}
```

### Ümumi Fayl Upload (Chat/DM)

Mesaj göndərmədəki attachment düyməsi `Files.Upload`-a bağlıdır (avatar deyil, ümumi fayl):

```jsx
{hasPermission("Files.Upload") && (
  <button className="attach-btn" onClick={openFilePicker}>
    <AttachIcon />
  </button>
)}
```

---

## Qeydlər

- Backend `[RequirePermission("Avatar.Upload")]` yoxlayır — frontend check UX üçündür (düymə gizlənir)
- `hasPermission` helper-i `useAuth` hook-dan gəlir — hər component-dən istifadə oluna bilər
- Regular user-lərə `Avatar.Upload` avtomatik assign edilir — default davranış dəyişmir
- Admin `Permissions` tab-dan bu permission-u silsə, həmin user üçün avatar upload UI gizlənəcək
- `Files.Upload` (ümumi attachment) ayrıdır — mesaj göndərmədəki fayl əlavə etmə düyməsi `Files.Upload`-a bağlıdır, avatar upload isə `Avatar.Upload`-a
