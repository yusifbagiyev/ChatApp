# Users Page — Wireframe & Interaction Spec

**Agent**: UI/UX Developer
**Date**: 2026-03-27
**Task ref**: `journal/entries/2026-03-27_0900_users-page-redesign-uiux.md`
**Handoff to**: Frontend Developer
**CSS rules**: `skills/CSS_SPEC_PRECISION.md` — texniki məhdudiyyətlər nəzərə alınıb

---

## 1. Layout — SuperAdmin View

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ap-content                                                               │
│                                                                           │
│  um-section-header                                                        │
│  Users  [80]                     [🔍 Search users, departments...]        │
│                                                                           │
│  hi-tree                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ hi-company-node                                                      │  │
│  │ ▼  [1L]  166 Logistics        Head: Aqil Z.           [62 users]    │  │
│  ├──────────────────────────────────────────────────────────────────── │  │
│  │   ▼ 🏗 Engineering            · Aqil Z.    [12]              [›]    │  │
│  │   │  ▼ 🏗 Frontend            · Aysel H.   [4]               [›]    │  │
│  │   │  │  👤 Aysel H.  Frontend Lead  [User] ★    [✏] [⚡] [•••]     │  │
│  │   │  │  👤 Murad B.  Frontend Dev   [User]       [✏] [⚡] [•••]    │  │
│  │   │  └ 🏗 Backend              · Rəşad Ə.  [5]               [›]    │  │
│  │   │     👤 Rəşad Ə. Backend Lead   [User] ★    [✏] [⚡] [•••]     │  │
│  │   └ 🏗 Finance                 · Leyla M.   [6]               [›]    │  │
│  │                                                                      │  │
│  │   (No department)                                                    │  │
│  │   👤 Aqil Z.  Head of Company  [Admin]          [✏] [⚡] [•••]     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ▼  [1E]  156 Evakuasiya       Head: —                [18 users]    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## Layout — Admin View

Company node yoxdur. Şirkət adı section header-da göstərilir:

```
│  Users — 166 Logistics  [62]     [🔍 Search...]                           │
│                                                                           │
│  ▼ 🏗 Engineering                · Aqil Z.    [12]              [›]      │
│  │  ▼ 🏗 Frontend                · Aysel H.   [4]               [›]      │
│  │  │  👤 Aysel H.  Frontend Lead  [User] ★   [✏] [⚡] [•••]            │
│  ...                                                                      │
```

---

## 2. Company Node (`hi-company-node`)

### CSS

```css
.hi-company-node {
  background: var(--white);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: visible;            /* dropdown-lar kəsilməsin */
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
  transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hi-company-node:has(.hi-company-header:hover) {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.05);
}

.hi-company-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px 10px 0 0;
}

.hi-company-header:hover { background: #f8fafc; }
```

### Company Logo / Initials

```css
.hi-company-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.hi-company-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Logo yoxdursa: şirkət adının baş hərfləri, hash-based background color.

### Header içi elementlər

```css
.hi-company-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--gray-800);
}

.hi-company-head {
  font-size: 12px;
  color: var(--gray-500);
  margin-left: 4px;
}
/* "Head: Aqil Z." — head yoxdursa göstərilmir */

.hi-company-count {
  margin-left: auto;
  background: var(--gray-100);
  color: var(--gray-500);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  transition: color 150ms;
}

.hi-company-header:hover .hi-company-count {
  color: var(--primary-color);
}
```

### Chevron

```css
.hi-chevron {
  color: #94a3b8;
  flex-shrink: 0;
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hi-company-node.expanded  .hi-chevron { transform: rotate(90deg); }
.hi-company-node.collapsed .hi-chevron { transform: rotate(0deg); }
```

Default: **expanded**.

### Children container

```css
.hi-company-children {
  overflow: hidden;
  /* JS ilə scrollHeight → height animasiyası */
  transition: height 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 3. Tree Connecting Lines

Real CSS connector lines — sadə padding deyil:

```css
/* Children wrapper — vertical line */
.hi-dept-children,
.hi-company-children > .hi-dept-group {
  position: relative;
  padding-left: 0;
}

/* Vertical line — sol tərəfdə */
.hi-dept-children::before {
  content: "";
  position: absolute;
  left: calc(var(--indent) + 11px);  /* indent + chevron merkezi */
  top: 0;
  bottom: 20px;
  width: 1px;
  background: #dde3ea;
  pointer-events: none;
}

/* Horizontal connector — hər child-a */
.hi-dept-node::after,
.hi-user-row::after {
  content: "";
  position: absolute;
  left: calc(var(--indent) + 11px);
  top: 50%;
  width: 13px;
  height: 1px;
  background: #dde3ea;
  pointer-events: none;
}
```

`--indent` CSS custom property: JS tərəfindən `style="--indent: 40px"` kimi set edilir.

---

## 4. Department Node (`hi-dept-node`)

```css
.hi-dept-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding-right: 12px;
  /* padding-left: JS tərəfindən inline style ilə — level * 24px + 16px */
  background: #f8fafc;
  border-bottom: 1px solid #edf0f3;
  cursor: pointer;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hi-dept-node:hover { background: #f0f9ff; }

.hi-dept-icon {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.6;
}

.hi-dept-name {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hi-dept-head-sub {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 400;
  flex-shrink: 0;
  /* "· Aysel H." */
}

.hi-dept-count {
  background: var(--gray-100);
  color: var(--gray-500);
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 8px;
  flex-shrink: 0;
}

/* [›] detail button */
.hi-dept-detail-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--gray-300);
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 120ms, background 120ms;
}

.hi-dept-detail-btn:hover {
  color: var(--primary-color);
  background: rgba(47,198,246,0.08);
}
```

**Qeyd:** `[›]` dept detail panel-i açır — expand/collapse ilə eyni click deyil. `[›]` click-i event propagation dayandırmalıdır (`e.stopPropagation()`).

---

## 5. User Row (`hi-user-row`)

```css
.hi-user-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding-right: 12px;
  /* padding-left: JS ilə — dept-indent + 24px */
  background: var(--white);
  border-bottom: 1px solid #f1f5f9;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hi-user-row:hover { background: #f8fbff; }

/* Subtle sol accent — hover-da */
.hi-user-row::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--primary-color);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hi-user-row:hover::before { transform: scaleY(1); }
```

**Qeyd:** `::before` div elementinə tətbiq olunur — table row deyil, işləyir.

### Avatar

```css
.hi-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
}
```

### User info

```css
.hi-user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-800);
  cursor: pointer;
  white-space: nowrap;
  transition: color 120ms;
}

.hi-user-name:hover { color: var(--primary-color); }

.hi-user-position {
  font-size: 11px;
  color: var(--gray-400);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Role Badge

```css
.hi-role-badge {
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
  flex-shrink: 0;
}

.hi-role-badge.admin {
  padding: 1px 8px;
  background: rgba(47,198,246,0.12);
  color: #0891b2;
}

.hi-role-badge.superadmin {
  padding: 1px 8px;
  background: rgba(180,83,9,0.09);
  color: #b45309;
}

.hi-role-badge.user {
  padding: 1px 7px;
  background: #f1f5f9;
  color: #64748b;
}
```

### Head Badge

```css
.hi-head-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--primary-color);
  background: rgba(47,198,246,0.10);
  padding: 1px 6px;
  border-radius: 3px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  flex-shrink: 0;
}
/* "HEAD" — yalnız dept head olanlara */
```

---

## 6. Action Shortcuts (`hi-actions`)

```css
.hi-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hi-user-row:hover .hi-actions {
  opacity: 1;
  pointer-events: all;
}

/* Dropdown açıq olduqda həmişə görünür */
.hi-user-row.dropdown-open .hi-actions {
  opacity: 1;
  pointer-events: all;
}

.hi-action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--gray-400);
  cursor: pointer;
  transition: all 120ms;
}

/* Edit button */
.hi-action-btn.edit:hover {
  color: var(--primary-color);
  background: rgba(47,198,246,0.08);
}

/* Quick toggle — active user */
.hi-action-btn.toggle.is-active { color: #22c55e; }

/* Quick toggle — inactive user */
.hi-action-btn.toggle.is-inactive { color: var(--gray-300); }

.hi-action-btn.toggle:hover { background: var(--gray-100); }

/* More (•••) */
.hi-action-btn.more:hover {
  color: var(--gray-700);
  background: var(--gray-100);
}
```

### `•••` Dropdown məzmunu

```
┌──────────────────────────┐
│ ✏  Edit                  │
│ 🔑  Reset Password        │
│ ✓   Activate             │  ← kontekstə görə biri görünür
│ ✗   Deactivate           │
│ ──────────────────────── │
│ 🗑  Delete               │  ← danger, `color: #ef4444`
└──────────────────────────┘
```

```css
.hi-action-dropdown {
  position: absolute;
  right: 12px;
  top: calc(100% + 4px);
  background: var(--white);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  min-width: 168px;
  z-index: 200;
  overflow: hidden;
  animation: adm-dropdownIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hi-dropdown-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 14px;
  background: none;
  border: none;
  font-size: 13px;
  color: var(--gray-700);
  cursor: pointer;
  text-align: left;
  transition: background 100ms;
}

.hi-dropdown-item:hover { background: var(--gray-50); }

.hi-dropdown-divider {
  height: 1px;
  background: var(--gray-100);
  margin: 3px 0;
}

.hi-dropdown-item.danger { color: #ef4444; }
.hi-dropdown-item.danger:hover { background: rgba(239,68,68,0.06); }
```

### Delete Inline Confirm

Modal deyil — sıranın içində:

```
Normal:  👤 Aysel H.  Frontend Lead  [User] ★   [✏] [⚡] [•••]
After:   [Delete Aysel H.?]   [Yes, delete]  [Cancel]
```

```css
.hi-delete-confirm {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  width: 100%;
  animation: section-enter 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hi-delete-label {
  font-size: 12px;
  color: var(--gray-600);
  flex: 1;
}

.hi-delete-yes {
  padding: 4px 10px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms;
}
.hi-delete-yes:hover { background: #dc2626; }

.hi-delete-cancel {
  padding: 4px 10px;
  background: none;
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  font-size: 12px;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 120ms;
}
.hi-delete-cancel:hover { border-color: var(--gray-400); }
```

---

## 7. "No Department" Section

```css
.hi-no-dept-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  padding-left: calc(var(--base-indent, 16px));
  background: var(--gray-50);
  border-bottom: 1px solid #edf0f3;
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
/* dept node kimi yox — label kimi. Chevron yoxdur, clickable deyil */
```

---

## 8. User Detail Panel (`hi-user-detail-panel`, 440px)

Dark hero pattern + white body:

```
┌───────────────────────────────────────────┐
│ hi-detail-hero (dark gradient)            │
│ [×]                                       │
│                                           │
│ [Avatar 56px + status ring]               │
│ Aysel Hüseynova                           │
│ Frontend Lead                             │
│ [Admin]                                   │
├───────────────────────────────────────────┤
│ hi-detail-body (white)                    │
│                                           │
│ CONTACT                                   │
│ ✉  aysel@chatapp.com                     │
│ 📞  +994501234567                         │
│                                           │
│ ORGANIZATION                              │
│ 🏢  166 Logistics                         │
│ 🏗  Frontend  ›  Engineering              │
│                                           │
│ SUPERVISORS                               │
│ 👤 Aqil Z. — Head of Company              │
│                                           │
├───────────────────────────────────────────┤
│ hi-detail-footer                          │
│ [✏ Edit User]          [Reset Password]   │
└───────────────────────────────────────────┘
```

### CSS

```css
.hi-user-detail-panel {
  position: fixed;
  right: 0; top: 0;
  width: 440px;
  height: 100vh;
  background: var(--white);
  box-shadow: -8px 0 32px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  z-index: 300;
  animation: ap-panel-in 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.hi-user-detail-panel.closing {
  animation: ap-panel-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

/* Dark hero */
.hi-detail-hero {
  padding: 20px 24px 24px;
  background: linear-gradient(135deg, #1a2332 0%, #243447 100%);
  flex-shrink: 0;
  position: relative;
}

.hi-detail-hero-close {
  position: absolute;
  top: 14px; right: 14px;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.08);
  border: none; border-radius: 6px;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: all 150ms;
}
.hi-detail-hero-close:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
}

/* Avatar ring — active/inactive göstərir */
.hi-detail-avatar-wrap {
  width: 60px; height: 60px;
  border-radius: 50%;
  padding: 3px;                         /* ring üçün boşluq */
  margin-bottom: 14px;
  background: rgba(255,255,255,0.12);   /* inactive üçün */
}

.hi-detail-avatar-wrap.active {
  background: rgba(34,197,94,0.50);     /* active — yaşıl ring */
}

.hi-detail-avatar {
  width: 54px; height: 54px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: #fff;
  overflow: hidden;
}

.hi-detail-name {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
}

.hi-detail-position {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin: 0 0 10px;
}

.hi-detail-role-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  padding: 2px 8px;
}
/* Admin: rgba(47,198,246,0.25) bg, #7dd3fc text — dark hero-da daha görünür */
/* User: rgba(255,255,255,0.12) bg, rgba(255,255,255,0.6) text */
```

### Body

```css
.hi-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-gutter: stable;
}

.hi-detail-section { display: flex; flex-direction: column; gap: 10px; }

.hi-detail-section-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--gray-400);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin: 0;
}

.hi-detail-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--gray-700);
}

.hi-detail-info-row svg,
.hi-detail-info-icon {
  color: var(--gray-400);
  flex-shrink: 0;
}

/* Supervisor row */
.hi-detail-supervisor {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--gray-50);
  border-radius: 8px;
  font-size: 13px;
  color: var(--gray-700);
}

/* Section divider */
.hi-detail-divider {
  height: 1px;
  background: var(--gray-100);
  margin: 0;
}
```

### Footer

```css
.hi-detail-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--gray-100);
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.hi-detail-footer .hi-btn-primary {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 16px;
  background: var(--primary-color);
  color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: filter 150ms;
}
.hi-detail-footer .hi-btn-primary:hover { filter: brightness(1.08); }

.hi-detail-footer .hi-btn-ghost {
  padding: 9px 14px;
  background: none;
  border: 1px solid var(--gray-200);
  color: var(--gray-600); border-radius: 8px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 150ms;
}
.hi-detail-footer .hi-btn-ghost:hover {
  border-color: var(--gray-400);
  background: var(--gray-50);
}
```

---

## 9. Department Detail Panel (`hi-dept-detail-panel`, 400px)

```
┌──────────────────────────────────────────┐
│ [×]  Frontend                            │
├──────────────────────────────────────────┤
│                                          │
│ PARENT DEPARTMENT                        │
│ 🏗 Engineering                           │
│                                          │
│ HEAD                                     │
│ 👤 Aysel H. — Frontend Lead  [Change]   │
│                                          │
│ STATS                                    │
│ ┌──────────┐  ┌────────────┐            │
│ │ 4        │  │ 0          │            │
│ │ Members  │  │ Sub-depts  │            │
│ └──────────┘  └────────────┘            │
│                                          │
│ MEMBERS                                  │
│ 👤 Aysel H.  Frontend Lead    ★ Head    │
│ 👤 Murad B.  Frontend Dev               │
│                                          │
├──────────────────────────────────────────┤
│ [✏ Edit Department]   [Delete]           │
└──────────────────────────────────────────┘
```

```css
.hi-dept-detail-panel {
  position: fixed;
  right: 0; top: 0;
  width: 400px;
  height: 100vh;
  background: var(--white);
  box-shadow: -8px 0 32px rgba(0,0,0,0.12);
  display: flex; flex-direction: column;
  z-index: 300;
  animation: ap-panel-in 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  scrollbar-gutter: stable;
}

.hi-dept-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 2px solid var(--primary-color);
  flex-shrink: 0;
}
/* Header-da primary-color border — admin panel header ilə eyni pattern */

.hi-dept-detail-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--gray-800);
}

.hi-dept-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-gutter: stable;
}

/* Stats cards */
.hi-dept-stats { display: flex; gap: 10px; }

.hi-dept-stat-card {
  flex: 1;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hi-dept-stat-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--gray-800);
  line-height: 1;
}

.hi-dept-stat-label {
  font-size: 11px;
  color: var(--gray-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

/* Member row */
.hi-dept-member {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-100);
  font-size: 13px;
}
.hi-dept-member:last-child { border-bottom: none; }

/* [Change Head] button */
.hi-change-head-btn {
  margin-left: auto;
  font-size: 11px;
  color: var(--primary-color);
  background: none;
  border: 1px solid rgba(47,198,246,0.3);
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 120ms;
}
.hi-change-head-btn:hover {
  background: rgba(47,198,246,0.08);
  border-color: var(--primary-color);
}

/* Footer */
.hi-dept-detail-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--gray-100);
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.hi-dept-detail-footer .delete-btn {
  padding: 9px 14px;
  background: none;
  border: 1px solid #fca5a5;
  color: #ef4444;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms;
}
.hi-dept-detail-footer .delete-btn:hover {
  background: rgba(239,68,68,0.06);
  border-color: #ef4444;
}
```

---

## 10. Search

```css
.hi-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.hi-search-input {
  width: 280px;
  height: 36px;
  padding: 0 36px 0 36px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  font-size: 13px;
  color: var(--gray-700);
  background: var(--white);
  transition: border-color 150ms, box-shadow 150ms;
}

.hi-search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(47,198,246,0.12);
}

/* Keyboard shortcut hint */
.hi-search-shortcut {
  position: absolute;
  right: 10px;
  font-size: 11px;
  color: var(--gray-300);
  background: var(--gray-100);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--gray-200);
  font-family: monospace;
  pointer-events: none;
  transition: opacity 150ms;
}

.hi-search-input:focus ~ .hi-search-shortcut { opacity: 0; }
```

**Axtarış davranışı:**
- 300ms debounce, client-side filter
- User adı match → highlight `<mark class="hi-highlight">` — `background: rgba(47,198,246,0.15); border-radius: 3px; padding: 0 2px`
- Dept adı match → dept node highlighted, expand olunur
- Heç nə match etmirsə: "No results for '...'" — bütün nodes `opacity: 0.3`

---

## 11. Partial Update Qaydası

Əməliyyatdan sonra bütün ağac yenilənmir:

| Əməliyyat | Yenilənən |
|-----------|-----------|
| User edit | yalnız həmin `hi-user-row` |
| Activate/Deactivate | `hi-action-btn.toggle` rəngi + row opacity |
| Delete user | row `height: 44px → 0` animasiya ilə yox olur |
| Change dept head | dept node-dakı subtitle + user row-dakı `★ HEAD` badge |

Row silinmə animasiyası:
```css
.hi-user-row.removing {
  animation: row-remove 220ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes row-remove {
  from { opacity: 1; height: 44px; }
  to   { opacity: 0; height: 0; padding-top: 0; padding-bottom: 0; }
}
```

---

## 12. Interaction States — Tam Siyahı

| Komponent | State | Spec |
|-----------|-------|------|
| Company node | hover | `box-shadow` artır |
| Company node | collapsed | children `height: 0`, chevron `rotate(0)` |
| Company node | expanded | children görünür, chevron `rotate(90deg)` — spring curve |
| Dept node | hover | `background: #f0f9ff` |
| Dept `[›]` | hover | `color: var(--primary-color); background: rgba(47,198,246,0.08)` |
| User row | hover | `background: #f8fbff` + sol accent scaleY(1) + actions görünür |
| User name | hover | `color: var(--primary-color)` |
| Edit btn | hover | `color: var(--primary-color); background: rgba(47,198,246,0.08)` |
| Toggle btn | is-active | `color: #22c55e` |
| Toggle btn | is-inactive | `color: var(--gray-300)` |
| `•••` dropdown | open | `adm-dropdownIn 150ms` |
| Delete confirm | inline | `section-enter 150ms` |
| User row | removing | `row-remove 220ms` → height 0 |
| Detail panel | open | `ap-panel-in 280ms cubic-bezier(0.16, 1, 0.3, 1)` |
| Detail panel | close | `ap-panel-out 200ms cubic-bezier(0.4, 0, 1, 1)` |
| Search | focus | `box-shadow glow`, shortcut hint `opacity: 0` |
| Search | match | text `<mark>` highlight |
| Loading | initial | skeleton hierarchy |

---

## 13. CSS Naming

```
hi-*
  hi-tree                  — root container
  hi-company-node          — company wrapper
  hi-company-header        — clickable company row
  hi-company-logo          — 36px logo/initials
  hi-company-name          — company name text
  hi-company-head          — "Head: Name" label
  hi-company-count         — "[62 users]" badge
  hi-company-children      — collapsible container
  hi-chevron               — expand/collapse icon
  hi-dept-group            — dept + its children wrapper
  hi-dept-node             — department row
  hi-dept-name             — dept name text
  hi-dept-head-sub         — "· Name" subtitle
  hi-dept-count            — "[12]" count badge
  hi-dept-detail-btn       — [›] button
  hi-dept-children         — dept children container
  hi-no-dept-header        — "(No department)" label row
  hi-user-row              — user row div
  hi-user-row--head        — modifier: user is dept head
  hi-user-row--inactive    — modifier: user is inactive
  hi-avatar                — 28px user avatar
  hi-user-name             — clickable name
  hi-user-position         — position text
  hi-role-badge            — Admin/User/SuperAdmin tag
  hi-head-badge            — "HEAD" marker
  hi-actions               — action button group
  hi-action-btn            — individual action (edit/toggle/more)
  hi-action-dropdown       — ••• popup menu
  hi-dropdown-item         — menu item
  hi-dropdown-divider      — separator line
  hi-delete-confirm        — inline delete confirmation row
  hi-highlight             — <mark> search match
  hi-search-wrap           — search container
  hi-search-input          — search input
  hi-search-shortcut       — [/] hint badge
  hi-user-detail-panel     — 440px user detail slide panel
  hi-dept-detail-panel     — 400px dept detail slide panel
  hi-detail-hero           — dark gradient hero section
  hi-detail-hero-close     — [×] close button in hero
  hi-detail-avatar-wrap    — avatar with status ring
  hi-detail-avatar         — actual avatar
  hi-detail-name           — name in hero
  hi-detail-position       — position in hero
  hi-detail-role-badge     — role in hero
  hi-detail-body           — white body content area
  hi-detail-section        — grouped section block
  hi-detail-section-label  — uppercase section title
  hi-detail-info-row       — contact/org info row
  hi-detail-supervisor     — supervisor chip in panel
  hi-detail-divider        — section separator line
  hi-detail-footer         — sticky bottom action row
  hi-dept-stats            — stats cards row
  hi-dept-stat-card        — individual stat card
  hi-dept-stat-num         — large number
  hi-dept-stat-label       — label under number
  hi-dept-member           — member row in dept panel
  hi-change-head-btn       — [Change] button next to head
```

---

## 14. Anti-AI Checklist

- [x] Action butonlar yalnız hover-da görünür — statik deyil
- [x] `⚡` toggle: is-active (yaşıl) / is-inactive (boz) — iki fərqli rəng
- [x] Company header: logo/initials + ad + Head: Name + count — 4 element, hamısı məlumat daşıyır
- [x] Delete: inline `[Yes] [No]` — modal popup deyil
- [x] `[›]` dept detail: expand/collapse-dan ayrı click target — `e.stopPropagation()`
- [x] Partial update: yalnız dəyişən element yenilənir
- [x] User detail panel: dark hero (nav rəngi) + white body — 2 ayrı vizual zona
- [x] "No department" qrupu: uppercase label row, dept node deyil
- [x] `::before` hover accent: `div`-ə tətbiq olunur, `<tr>`-ə deyil — texniki düzgün
- [x] `overflow: visible` company node-da — dropdown-lar kəsilmir
- [x] Avatar status ring: active (yaşıl ring), inactive (subtle white ring) — status vizual olaraq avatar-da əks olunur
- [x] Dept detail header: `2px solid var(--primary-color)` border — admin panel header ilə eyni language

---

*Spec complete. Frontend Developer: `hi-*` CSS faylını yarat, `admin-shared.css`-i import et.*
