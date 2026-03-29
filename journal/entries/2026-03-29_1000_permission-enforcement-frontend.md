# Frontend Task: Bütün Permission-Gated UI Elementlərinin Yoxlanması

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-29
**Priority**: P0 — CRITICAL

---

## Problem

Hal-hazırda yalnız `Files.Upload` və `Avatar.Upload` permission-ları frontend-də `hasPermission()` ilə yoxlanılır. Digər bütün permission-lar (Messages.Send, Messages.Edit, Users.Create və s.) üçün heç bir UI check yoxdur. Nəticədə permission silinsə belə, istifadəçi həmin düymələri görür.

`hasPermission()` artıq `AuthContext`-də mövcuddur — **sadəcə istifadə olunmalıdır**.

---

## Mövcud Vəziyyət

**Artıq implementasiya olunub:**
- ✅ `AuthContext.jsx` — `hasPermission(perm)` helper mövcuddur
- ✅ `ChatInputArea.jsx` — `Files.Upload` check var
- ✅ `UserProfilePanel.jsx` — `Avatar.Upload` check var
- ✅ `DepartmentManagement.jsx` — `Avatar.Upload` check var
- ✅ `HierarchyView.jsx` — `Avatar.Upload` check var

**Yoxdur:**
- ❌ `Messages.Send` — mesaj göndərmə
- ❌ `Messages.Edit` — mesaj redaktəsi
- ❌ `Messages.Delete` — mesaj silmə
- ❌ `Users.Create` — istifadəçi yaratma
- ❌ `Users.Update` — istifadəçi redaktəsi
- ❌ `Users.Delete` — istifadəçi silmə
- ❌ `Users.Read` — istifadəçi siyahısına baxmaq
- ❌ `Channels.Create` — kanal yaratmaq
- ❌ `Channels.Delete` — kanal silmək
- ❌ `Permissions.Read` — permission siyahısını görmək
- ❌ `Permissions.Assign` / `Permissions.Revoke` — permission toggle

---

## İmplementasiya

Hər komponentdə: `const { hasPermission } = useAuth();`

### 1. Messages (Chat/DM)

**ChatInputArea.jsx** (və ya mesaj göndərmə komponenti):

```jsx
const canSend = hasPermission("Messages.Send");

// Mesaj input + göndər düyməsi:
{canSend ? (
  <form onSubmit={handleSend}>
    <input ... />
    <button type="submit">Send</button>
  </form>
) : (
  <div className="no-permission-bar">You don't have permission to send messages</div>
)}
```

**Mesaj kontekst menyusu** (sağ klik / "..." düyməsi):

```jsx
// Edit düyməsi — yalnız öz mesajlarında + permission:
{isOwnMessage && hasPermission("Messages.Edit") && (
  <button onClick={handleEdit}>Edit</button>
)}

// Delete düyməsi:
{isOwnMessage && hasPermission("Messages.Delete") && (
  <button onClick={handleDelete}>Delete</button>
)}
```

### 2. Users (Admin Panel)

**HierarchyView.jsx** — Create User düyməsi:

```jsx
{hasPermission("Users.Create") && (
  <button onClick={() => setCreatePanel("user")}>+ New User</button>
)}
```

**HierarchyView.jsx / UserDetailPage.jsx** — User actions:

```jsx
// Edit user:
{hasPermission("Users.Update") && (
  <button onClick={handleEdit}>Edit</button>
)}

// Delete user:
{hasPermission("Users.Delete") && (
  <button onClick={handleDelete}>Delete User</button>
)}

// Activate/Deactivate:
{hasPermission("Users.Update") && (
  <button onClick={handleToggleActive}>
    {user.isActive ? "Deactivate" : "Activate"}
  </button>
)}
```

**HierarchyView.jsx** — Create Department düyməsi:

```jsx
// Department yaratmaq da Users.Update ilə mümkündür (department idarəsi)
```

### 3. Channels

**Channel yaratma düyməsi:**

```jsx
{hasPermission("Channels.Create") && (
  <button onClick={handleCreateChannel}>Create Channel</button>
)}
```

**Channel silmə:**

```jsx
{hasPermission("Channels.Delete") && (
  <button onClick={handleDeleteChannel}>Delete Channel</button>
)}
```

### 4. Permissions (UserDetailPage.jsx — Permissions Tab)

```jsx
// Tab-ın özünü göstər:
{hasPermission("Permissions.Read") && (
  <button onClick={() => setActiveTab("permissions")}>Permissions</button>
)}

// Toggle switch-ləri:
{hasPermission("Permissions.Assign") && (
  <input type="checkbox" checked={isGranted} onChange={handleToggle} />
)}

// Əgər Permissions.Assign yoxdursa, read-only göstər:
{!hasPermission("Permissions.Assign") && (
  <span>{isGranted ? "✓" : "✗"}</span>
)}
```

### 5. Admin Panel Navigation

**AdminPanel.jsx:**

Admin panel-ə giriş artıq role-a bağlıdır. Amma navigation item-ları permission-a da bağlana bilər:

```jsx
// Users section — Users.Read lazımdır:
{hasPermission("Users.Read") && (
  <button onClick={() => changeSection("users")}>Users</button>
)}
```

---

## Əlavə Fix: HierarchyView CreateDeptPanel — currentAvatarUrl

**Fayl:** `chatapp-frontend/src/components/admin/HierarchyView.jsx`

Line 617-də `uploadDepartmentAvatar` çağırışına `currentAvatarUrl` əlavə et:

```js
// Köhnə:
const result = await uploadDepartmentAvatar(file, companyId);

// Yeni:
const result = await uploadDepartmentAvatar(file, companyId, null, null);
```

> Yeni department yaradılır — köhnə avatar yoxdur, `null` doğrudur. Amma parametrlərin açıq göstərilməsi tutarlılıq üçün vacibdir.

---

## Yoxlama Siyahısı

- [ ] `Messages.Send` — mesaj input/göndər düyməsi gizlənir
- [ ] `Messages.Edit` — edit düyməsi gizlənir
- [ ] `Messages.Delete` — delete düyməsi gizlənir
- [ ] `Files.Upload` — attachment düyməsi gizlənir (artıq var ✅)
- [ ] `Avatar.Upload` — avatar upload gizlənir (artıq var ✅)
- [ ] `Users.Create` — create user düyməsi gizlənir
- [ ] `Users.Update` — edit/activate/deactivate düymələri gizlənir
- [ ] `Users.Delete` — delete user düyməsi gizlənir
- [ ] `Channels.Create` — create channel düyməsi gizlənir
- [ ] `Channels.Delete` — delete channel düyməsi gizlənir
- [ ] `Permissions.Read` — permissions tab gizlənir
- [ ] `Permissions.Assign` — toggle switch-ləri disabled olur
- [ ] HierarchyView CreateDeptPanel — `currentAvatarUrl` fix
- [ ] `useAuth` import hər komponentdə mövcuddur

---

## Qeydlər

- Backend artıq (düzəlişdən sonra) hər request-də DB-dən permission yoxlayır — frontend check UX üçündür
- Page refresh → `/api/users/me` → fresh permissions → UI dərhal yenilənir
- Permission olmayan istifadəçiyə düymə göstərilmir — "You don't have permission" mesajı yalnız vacib yerlərdə (mesaj göndərmə kimi)
- Bütün `hasPermission` string-lərini DƏQIQ yaz — typo backend-dəki permission adı ilə uyğun gəlməlidir
