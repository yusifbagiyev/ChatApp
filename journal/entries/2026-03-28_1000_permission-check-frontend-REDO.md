# Frontend Task: Avatar Upload Permission Check — YENİDƏN

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-28
**Priority**: P0 — CRITICAL

---

## ⛔ XƏBƏRDARLIQ

**Bu tapşırıq əvvəl verilmişdi (`2026-03-28_0900_file-upload-permission-frontend.md`) və SƏN ONU TAMAMILƏ IGNORE ETDİN.** Nə `hasPermission` helper yaradıldı, nə də heç bir komponentdə `Avatar.Upload` permission yoxlandı. Tapşırıq açıq-aydın yazılmışdı, kod nümunələri verilmişdi — buna baxmayaraq heç bir iş görülmədi.

**Bu qəbuledilməzdir.** Tapşırıq verildikdə, hər bəndi oxu, hər bəndi implementasiya et, heç birini atla. "Etdim" demə — sübut göstər. Tamamlanmamış tapşırığı tamamlanmış kimi qeyd etmə.

**Bu bir daha təkrarlanmamalıdır.**

---

## Tapşırıq — Tam İmplementasiya Tələb Olunur

### 1. AuthContext.jsx — `hasPermission` helper

**Fayl:** `chatapp-frontend/src/context/AuthContext.jsx`

`useAuth` hook-dan `hasPermission` helper export et. Bu, `user.permissions` array-ini yoxlayır.

**Dəqiq addımlar:**

1. `useCallback` import-a əlavə et (əgər yoxdursa)
2. `AuthProvider` daxilində, `return` əvvəlində:
```js
const hasPermission = useCallback(
  (perm) => user?.permissions?.includes(perm) ?? false,
  [user]
);
```
3. Provider value-ya əlavə et:
```js
value={{ user, isLoading, login, logout, hasPermission }}
```

4. **TEST:** `console.log(hasPermission("Avatar.Upload"))` ilə yoxla — `true` qaytarmalıdır (backend user-ə default assign edir).

---

### 2. UserProfilePanel.jsx — Avatar Upload Permission

**Fayl:** `chatapp-frontend/src/components/UserProfilePanel.jsx`

Avatar dəyişdirmə düyməsini (və ya kamera icon / overlay) `hasPermission("Avatar.Upload")` ilə şərtləndir:

```jsx
const { hasPermission } = useAuth();

// Avatar dəyişmə düyməsi/overlay:
{hasPermission("Avatar.Upload") && (
  <button onClick={openAvatarCrop}>Change Avatar</button>
)}
```

Əgər permission yoxdursa → avatar yalnız göstərilir, dəyişdirilə bilmir.

---

### 3. DepartmentManagement.jsx — Department Avatar Upload Permission

**Fayl:** `chatapp-frontend/src/components/admin/DepartmentManagement.jsx`

Avatar upload sahəsini `hasPermission("Avatar.Upload")` ilə sar:

```jsx
const { hasPermission } = useAuth();

// Create/Edit formunda avatar upload area:
{hasPermission("Avatar.Upload") && (
  <div className="dm-avatar-upload">
    {/* ... mövcud upload UI ... */}
  </div>
)}
```

`useAuth` import et: `import { useAuth } from "../../context/AuthContext";`

---

### 4. HierarchyView.jsx — Department Avatar Upload Permission

**Fayl:** `chatapp-frontend/src/components/admin/HierarchyView.jsx`

**a)** `DeptDetailPanel` daxilindəki avatar upload/edit:

```jsx
const { hasPermission } = useAuth();

{hasPermission("Avatar.Upload") && (
  // avatar upload/change UI
)}
```

**b)** `CreateDeptPanel` daxilindəki avatar upload:

```jsx
const { hasPermission } = useAuth();

{hasPermission("Avatar.Upload") && (
  // avatar upload field
)}
```

`useAuth` import et: `import { useAuth } from "../../context/AuthContext";`

---

### 5. Ümumi Fayl Upload (Chat/DM) — `Files.Upload` permission

Mesaj göndərmə sahəsindəki fayl əlavə etmə düyməsini `Files.Upload` ilə yoxla (Avatar.Upload deyil!):

```jsx
const { hasPermission } = useAuth();

{hasPermission("Files.Upload") && (
  <button className="attach-btn" onClick={openFilePicker}>...</button>
)}
```

> **DİQQƏT:** `Files.Upload` ümumi fayl yükləmə üçündür (mesaj attachment). `Avatar.Upload` yalnız avatar üçündür. Qarışdırma!

---

## Yoxlama Siyahısı (Tamamlanmadan "bitdi" demə)

- [ ] `AuthContext.jsx` — `hasPermission` funksiyası mövcuddur və export olunur
- [ ] `AuthContext.jsx` — Provider value-da `hasPermission` var
- [ ] `UserProfilePanel.jsx` — avatar upload `hasPermission("Avatar.Upload")` ilə şərtlənib
- [ ] `DepartmentManagement.jsx` — avatar upload `hasPermission("Avatar.Upload")` ilə şərtlənib
- [ ] `HierarchyView.jsx` DeptDetailPanel — avatar upload permission yoxlaması var
- [ ] `HierarchyView.jsx` CreateDeptPanel — avatar upload permission yoxlaması var
- [ ] Heç bir yerdə `Avatar.Upload` string səhv yazılmayıb
- [ ] `useAuth` import hər komponentdə mövcuddur

---

## 6. `currentAvatarUrl` parametri — köhnə avatar URL-ini göndər

Backend upload endpoint-ləri indi `currentAvatarUrl` query parametri qəbul edir. Köhnə avatarı silmək üçün frontend köhnə URL-i göndərməlidir.

### Profile picture upload (`UserProfilePanel.jsx`)

```js
// Köhnə:
const uploadEndpoint = targetId
  ? `/api/files/upload/profile-picture?targetUserId=${targetId}`
  : "/api/files/upload/profile-picture";

// Yeni — currentAvatarUrl əlavə et:
const oldAvatar = profile.avatarUrl ?? "";
const params = new URLSearchParams();
if (targetId) params.set("targetUserId", targetId);
if (oldAvatar) params.set("currentAvatarUrl", oldAvatar);
const uploadEndpoint = `/api/files/upload/profile-picture${params.toString() ? "?" + params : ""}`;
```

### Department avatar upload (`api.js` — `uploadDepartmentAvatar`)

```js
// Köhnə:
async function uploadDepartmentAvatar(file, companyId, departmentId = null) {
  const formData = new FormData();
  formData.append("file", file);
  const url = departmentId
    ? `/api/files/upload/department-avatar/${companyId}?departmentId=${departmentId}`
    : `/api/files/upload/department-avatar/${companyId}`;
  return apiUpload(url, formData);
}

// Yeni — currentAvatarUrl parametri əlavə et:
async function uploadDepartmentAvatar(file, companyId, departmentId = null, currentAvatarUrl = null) {
  const formData = new FormData();
  formData.append("file", file);
  const params = new URLSearchParams();
  if (departmentId) params.set("departmentId", departmentId);
  if (currentAvatarUrl) params.set("currentAvatarUrl", currentAvatarUrl);
  const url = `/api/files/upload/department-avatar/${companyId}${params.toString() ? "?" + params : ""}`;
  return apiUpload(url, formData);
}
```

### DepartmentManagement.jsx — upload çağırışını yenilə

```js
// handleAvatarChange daxilində:
const result = await uploadDepartmentAvatar(file, companyId, departmentId, activeDept?.avatarUrl);
```

### HierarchyView.jsx — DeptDetailPanel avatar upload çağırışını yenilə

```js
const result = await uploadDepartmentAvatar(file, companyId, dept.id, dept.avatarUrl);
```

---

## 7. Köhnə `UserDetailPanel` silinməli

**Fayl:** `chatapp-frontend/src/components/admin/HierarchyView.jsx`

`UserDetailPanel` komponenti (təxminən line 64-169) artıq istifadə olunmur — `onOpenUser` callback ilə `UserDetailPage`-ə yönləndirilir. Bu komponenti sil.

---

## Yoxlama Siyahısı (Tamamlanmadan "bitdi" demə)

- [ ] `AuthContext.jsx` — `hasPermission` funksiyası mövcuddur və export olunur
- [ ] `AuthContext.jsx` — Provider value-da `hasPermission` var
- [ ] `UserProfilePanel.jsx` — avatar upload `hasPermission("Avatar.Upload")` ilə şərtlənib
- [ ] `DepartmentManagement.jsx` — avatar upload `hasPermission("Avatar.Upload")` ilə şərtlənib
- [ ] `HierarchyView.jsx` DeptDetailPanel — avatar upload permission yoxlaması var
- [ ] `HierarchyView.jsx` CreateDeptPanel — avatar upload permission yoxlaması var
- [ ] `UserProfilePanel.jsx` — `currentAvatarUrl` göndərilir
- [ ] `api.js` — `uploadDepartmentAvatar` `currentAvatarUrl` parametri qəbul edir
- [ ] `DepartmentManagement.jsx` — upload zamanı köhnə avatarUrl göndərilir
- [ ] `HierarchyView.jsx` — upload zamanı köhnə avatarUrl göndərilir
- [ ] `UserDetailPanel` (köhnə komponent) silinib
- [ ] Heç bir yerdə `Avatar.Upload` string səhv yazılmayıb
- [ ] `useAuth` import hər komponentdə mövcuddur

---

## Qeydlər

- Backend `[RequirePermission("Avatar.Upload")]` ilə yoxlayır — frontend yoxlama UX üçündür (icazəsiz user düyməni görməsin)
- `Avatar.Upload` — yalnız avatar. `Files.Upload` — yalnız attachment. İkisi fərqli permission-dur
- `currentAvatarUrl` olmadan upload işləyər amma köhnə fayl silinməz — storage boş yerə dolur
- Bu tapşırıq P0-dır. Tamamla, yoxla, sübut göstər
