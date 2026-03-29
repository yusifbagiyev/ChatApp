# Frontend Task: UserDetailPage Hero Buttons — Permission Check

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-29
**Priority**: P0

---

## Problem

`UserDetailPage.jsx` hero bölməsindəki 3 düymə permission check-siz açıqdır. HierarchyView-da eyni düymələr düzgün implementasiya olunub, amma UserDetailPage-də unudulub.

---

## Düzəliş

**Fayl:** `chatapp-frontend/src/components/admin/UserDetailPage.jsx`

Hero bölməsindəki düymələr (təxminən line 835-843) `hasPermission` ilə şərtlənməlidir.

`useAuth` artıq import olunubsa yoxla. Yoxdursa əlavə et.

```jsx
const { hasPermission } = useAuth();
```

### Hero düymələri:

```jsx
{/* Reset Password — Users.Update lazımdır */}
{hasPermission("Users.Update") && (
  <button className="ud-btn-outline" onClick={() => setActiveTab("security")}>
    Reset Password
  </button>
)}

{/* Activate/Deactivate — Users.Update lazımdır */}
{hasPermission("Users.Update") && (
  <button className="ud-btn-outline" onClick={handleToggleStatus} disabled={toggling}>
    {toggling ? "..." : user.isActive ? "Deactivate" : "Activate"}
  </button>
)}

{/* Delete — Users.Delete lazımdır */}
{hasPermission("Users.Delete") && (
  <button className="ud-btn-danger-outline" onClick={() => setDeleteConfirm(true)}>
    Delete
  </button>
)}
```

---

## Yoxlama Siyahısı

- [ ] Reset Password düyməsi `hasPermission("Users.Update")` ilə şərtlənib
- [ ] Activate/Deactivate düyməsi `hasPermission("Users.Update")` ilə şərtlənib
- [ ] Delete düyməsi `hasPermission("Users.Delete")` ilə şərtlənib
- [ ] `useAuth` import mövcuddur
- [ ] Permission string-lərdə typo yoxdur
