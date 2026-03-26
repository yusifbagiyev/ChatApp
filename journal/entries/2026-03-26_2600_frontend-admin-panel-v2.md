# Frontend Task: Admin Panel Redesign v2

**From**: UI/UX Developer
**To**: Frontend Developer
**Date**: 2026-03-26
**Priority**: P0 — Əvvəlki bütün admin spec-ləri bu ilə əvəz olunur
**Spec**: `agents/uiux-developer/outputs/2026-03-26_redesign_admin-panel-v2.md`

---

## Context

Admin Panel-in bütün CSS və animasiyaları yenidən yazılmalıdır. Əvvəlki spec-lər (admin-panel-wireframe, dept-position, admin-panel-redesign) bu spec ilə əvəz olunur.

**Dəyişən fayllar:**
- `src/pages/AdminPanel.css`
- `src/components/admin/CompanyManagement.css`
- `src/components/admin/UserManagement.css`
- `src/components/admin/DepartmentManagement.css`
- `src/components/admin/PositionManagement.css`
- Yeni: `src/components/admin/admin-shared.css`

---

## Priority Sırası

### 1. `admin-shared.css` — Yeni fayl yarat

Bütün shared keyframe-ləri bu faylda topla. Hər admin CSS faylında `@import './admin-shared.css'` əlavə et.

```css
@keyframes adm-dropdownIn {
  from { opacity: 0; transform: scale(0.94) translateY(-6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes ap-panel-in {
  from { transform: translateX(100%); opacity: 0.6; }
  to   { transform: translateX(0); opacity: 1; }
}

@keyframes ap-panel-out {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}

@keyframes section-leave {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-10px); }
}

@keyframes section-enter {
  from { opacity: 0; transform: translateX(10px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes field-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes status-pulse {
  0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.4); }
  70%  { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
  100% { box-shadow: 0 0 0 0   rgba(16,185,129,0); }
}

@keyframes adm-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 2. `AdminPanel.css` — Nav və Header

**Nav sidebar — dark:**
```css
.ap-nav {
  width: 220px;
  background: #1a2332;
  border-right: none;
  padding: 20px 0;
}

.ap-nav-item {
  height: 42px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-left: 3px solid transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.ap-nav-item svg { opacity: 0.6; transition: opacity 150ms; }
.ap-nav-item:hover { color: #cbd5e1; background: rgba(255,255,255,0.05); }
.ap-nav-item:hover svg { opacity: 0.9; }
.ap-nav-item.active {
  color: #2fc6f6;
  background: rgba(47,198,246,0.10);
  border-left-color: #2fc6f6;
  font-weight: 600;
}
.ap-nav-item.active svg { opacity: 1; }
```

**Header — breadcrumb:**
```css
.ap-header {
  border-bottom: 2px solid var(--primary-color);  /* 1px deyil, 2px primary */
}

/* Breadcrumb: "Admin  ›  Companies" */
.ap-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}
.ap-breadcrumb-root { font-weight: 600; color: var(--gray-700); }
.ap-breadcrumb-sep  { color: var(--gray-300); }
.ap-breadcrumb-page { font-weight: 600; color: var(--gray-900); }
```

**Role badge:**
```css
.ap-role-badge { border-radius: 4px; }  /* pill deyil */
.ap-role-badge.superadmin { background: rgba(180,83,9,0.09); color: #b45309; }
.ap-role-badge.admin      { background: rgba(47,198,246,0.12); color: #0891b2; }
```

**Section keçid animasiyası — React-də:**
```jsx
// AdminPanel.jsx-də
const [section, setSection] = useState('companies');
const [isLeaving, setIsLeaving] = useState(false);
const contentRef = useRef(null);

const changeSection = (newSection) => {
  if (newSection === section) return;
  setIsLeaving(true);
  setTimeout(() => {
    setSection(newSection);
    setIsLeaving(false);
  }, 160);
};

// JSX-də:
<main
  className={`ap-content ${isLeaving ? 'section-leaving' : 'section-entering'}`}
  ref={contentRef}
>
```

```css
.section-leaving  { animation: section-leave 160ms cubic-bezier(0.4, 0, 1, 1) forwards; }
.section-entering { animation: section-enter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
```

---

### 3. Table Rows — Hover Accent

Bütün table-larda (Companies, Users, Departments, Positions):

```css
/* cm-row, um-row, dm-row, pm-row üçün eyni pattern */
.cm-row,
.um-row,
.dm-row,
.pm-row {
  position: relative;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cm-row::before,
.um-row::before,
.dm-row::before,
.pm-row::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--primary-color);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.cm-row:hover::before { transform: scaleY(1); }
.um-row:hover::before { transform: scaleY(1); }
.dm-row:hover::before { transform: scaleY(1); }
.pm-row:hover::before { transform: scaleY(1); }

.cm-row:hover td,
.um-row:hover td,
.dm-row:hover td,
.pm-row:hover td { background: #f0f8ff; }
```

---

### 4. Role Badge Rəngləri — Bütün Komponentlərdə

`CompanyManagement.css`, `UserManagement.css` — hər ikisini yenilə:

```css
/* SuperAdmin — purple YOX */
.um-role-badge.superadmin,
.ap-role-badge.superadmin {
  background: rgba(180,83,9,0.09);
  color: #b45309;
  border-radius: 4px;
}

/* Admin */
.um-role-badge.admin,
.ap-role-badge.admin {
  background: rgba(47,198,246,0.12);
  color: #0891b2;
  border-radius: 4px;
  padding: 2px 10px;
}

/* User */
.um-role-badge.user {
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  padding: 2px 8px;
}
```

---

### 5. Status Dot — Halo Animasiyası

```css
/* CompanyManagement.css və UserManagement.css */
.cm-status-badge.active::before,
.um-status-badge.active::before {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16,185,129,0.4);
  animation: status-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  /* status-pulse admin-shared.css-dən */
}

.cm-status-badge.inactive::before,
.um-status-badge.inactive::before {
  background: #cbd5e1;
  animation: none;
}
```

---

### 6. Contextual Action Toolbar — UserManagement

`•••` button-u hover-triggered icon toolbar ilə əvəz et:

```jsx
// UserManagement.jsx-də — hər row-da:
<td className="um-actions-cell">
  <div className="um-row-actions">
    <button className="um-action-btn" title="Edit" onClick={() => openEdit(user)}>
      <EditIcon size={15} />
    </button>
    <button className="um-action-btn" title="Reset Password" onClick={() => openResetPassword(user)}>
      <KeyIcon size={15} />
    </button>
    <button className="um-action-btn danger" title={user.isActive ? "Deactivate" : "Activate"} onClick={() => toggleStatus(user)}>
      <PowerIcon size={15} />
    </button>
  </div>
</td>
```

```css
.um-row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: translateX(8px);
  transition: opacity 150ms, transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.um-row:hover .um-row-actions {
  opacity: 1;
  transform: translateX(0);
}

.um-action-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 6px;
  background: transparent; color: var(--gray-400);
  cursor: pointer; transition: all 120ms;
}
.um-action-btn:nth-child(1) { transition-delay: 0ms; }
.um-action-btn:nth-child(2) { transition-delay: 30ms; }
.um-action-btn:nth-child(3) { transition-delay: 60ms; }

.um-action-btn:hover { background: var(--gray-100); color: var(--gray-700); }
.um-action-btn.danger:hover { background: rgba(239,68,68,0.08); color: #ef4444; }
```

---

### 7. Slide Panel — Spring Animasiyası

Form panellərin (Company form, User form) CSS-ini yenilə:

```css
/* cm-form-panel, um-form-panel */
.cm-form-panel,
.um-form-panel {
  animation: ap-panel-in 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Panel bağlananda .closing class əlavə et */
.cm-form-panel.closing,
.um-form-panel.closing {
  animation: ap-panel-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}
```

**Form field stagger:**
```css
.cm-form-body .cm-form-field,
.um-form-body .um-form-field {
  opacity: 0;
  animation: field-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.cm-form-field:nth-child(1),
.um-form-field:nth-child(1) { animation-delay: 280ms; }

.cm-form-field:nth-child(2),
.um-form-field:nth-child(2) { animation-delay: 320ms; }

.cm-form-field:nth-child(3),
.um-form-field:nth-child(3) { animation-delay: 360ms; }

.cm-form-field:nth-child(4),
.um-form-field:nth-child(4) { animation-delay: 400ms; }
```

---

### 8. Form Input Focus

```css
/* Bütün admin form input-larında */
.cm-form-input:focus,
.um-form-input:focus,
.dm-form-field input:focus,
.pm-form-field input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(47,198,246,0.15);
}
```

---

## Qəbul Kriteriyaları

- [ ] Nav sidebar dark (#1a2332), mövcud ağ nav yoxdur
- [ ] Purple heç bir yerdə görünmür (SuperAdmin → amber)
- [ ] Section dəyişməsi: crossfade + slide animasiyası işləyir
- [ ] Table row hover: sol-dan 3px accent bar görünür
- [ ] Action toolbar: yalnız row hover-da görünür, stagger işləyir
- [ ] Panel açılış: spring curve, field-lər stagger ilə görünür
- [ ] Panel bağlanış: sliding out animasiyası var
- [ ] Status dot: halo pulse animasiyası
- [ ] `admin-shared.css` yaradılıb, bütün fayllar import edir
- [ ] Mövcud `modalIn`, `dropIn`, `umDropIn`, `umFadeIn` keyframe-ləri silinib
