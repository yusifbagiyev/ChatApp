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

## Qeydlər

- Backend `[RequirePermission("Avatar.Upload")]` ilə yoxlayır — frontend yoxlama UX üçündür (icazəsiz user düyməni görməsin)
- `Avatar.Upload` — yalnız avatar. `Files.Upload` — yalnız attachment. İkisi fərqli permission-dur
- Bu tapşırıq P0-dır. Tamamla, yoxla, sübut göstər
