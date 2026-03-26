# Frontend Task: Admin Panel CSS Fixes

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-26
**Priority**: P0 — design review corrections from UI/UX Developer
**Review source**: `agents/uiux-developer/outputs/2026-03-26_review_admin-panel.md`

---

## Context

UI/UX Developer reviewed the Admin Panel implementation and found 19 issues.
Fix all P0 and P1 items. P2 is optional.

---

## Step 1 — Create `admin-shared.css`

**New file**: `chatapp-frontend/src/components/admin/admin-shared.css`

Define all shared admin keyframes here. Import this file in `AdminPanel.css`.

```css
/* ─── Shared Admin Keyframes ─────────────────────────────────────────────── */

@keyframes ap-panel-in {
  from { transform: translateX(100%); opacity: 0.8; }
  to   { transform: translateX(0);    opacity: 1;   }
}

@keyframes adm-dropdownIn {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    }
}

@keyframes cm-pulse {
  0%, 100% { opacity: 1;    }
  50%       { opacity: 0.45; }
}

@keyframes adm-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition-duration: 1ms !important; }
}
```

---

## Step 2 — Fix `AdminPanel.css`

### 2a. Import shared CSS at top of file
```css
@import "./components/admin/admin-shared.css";
```
> Note: if AdminPanel.css is in `src/pages/`, the import path is `../components/admin/admin-shared.css`

### 2b. Header border
```css
/* Change */
border-bottom: 1px solid var(--gray-200);
/* To */
border-bottom: 2px solid var(--primary-color);
```

### 2c. Nav width
```css
/* Change */
width: 200px;
/* To */
width: 220px;
```

### 2d. Nav item — add border-left baseline to prevent layout shift on active
```css
/* Add to .ap-nav-item */
border-left: 3px solid transparent;
border-radius: 0 8px 8px 0;   /* keep right-side radius, remove left */
```

### 2e. Nav active state — add left accent
```css
/* Update .ap-nav-item.active */
.ap-nav-item.active {
  background: rgba(47, 198, 246, 0.10);
  border-left-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;
}
```

### 2f. Role badge — shape and colors
```css
/* Change */
.ap-role-badge {
  border-radius: 20px;   /* remove pill */
  /* ... rest stays */
}

/* To */
.ap-role-badge {
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Change color classes */
.ap-role-badge.superadmin {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
}
.ap-role-badge.admin {
  background: rgba(47, 198, 246, 0.15);
  color: var(--primary-color);
}
```

---

## Step 3 — Fix `CompanyManagement.css`

### 3a. Form panel — centered modal → right-side slide panel

Replace `.cm-form-overlay` and `.cm-form-panel` entirely:

```css
/* Replace */
.cm-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.cm-form-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 420px;
  height: 100vh;
  background: var(--white);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.10);
  border-radius: 0;
  overflow-y: auto;
  animation: ap-panel-in 200ms ease;
}

/* Remove cm-form-panel-sm — no longer needed */
```

### 3b. Remove old modal keyframes (now in admin-shared.css)
```css
/* DELETE these lines from CompanyManagement.css */
@keyframes fadeIn  { ... }
@keyframes modalIn { ... }
```

### 3c. Active status dot — pulse animation
```css
/* Add */
.cm-status-badge.active::before {
  animation: cm-pulse 2s infinite;
}
```

### 3d. Dropdown animation — fix missing keyframe
```css
/* Update .cm-menu */
.cm-menu {
  /* change: animation: dropIn 180ms ease-out; */
  animation: adm-dropdownIn 150ms ease;
}
/* DELETE @keyframes dropIn if it exists — use shared adm-dropdownIn instead */
```

### 3e. Table header font-weight
```css
/* Change */
.cm-table th {
  font-weight: 700;
  /* ... */
}
/* To */
.cm-table th {
  font-weight: 400;
  /* ... */
}
```

### 3f. Form input focus — add outline ring
```css
/* Change */
.cm-form-input:focus { outline: none; border-color: var(--primary-color); }

/* To */
.cm-form-input:focus {
  outline: 2px solid rgba(47, 198, 246, 0.25);
  outline-offset: -1px;
  border-color: var(--primary-color);
}

/* Same fix for .cm-form-textarea:focus */
.cm-form-textarea:focus {
  outline: 2px solid rgba(47, 198, 246, 0.25);
  outline-offset: -1px;
  border-color: var(--primary-color);
}
```

---

## Step 4 — Fix `UserManagement.css`

### 4a. Form panel — centered modal → right-side slide panel

Replace `.um-form-overlay` and `.um-form-panel`:

```css
.um-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.um-form-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 480px;
  height: 100vh;
  background: var(--white);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.10);
  border-radius: 0;
  overflow-y: auto;
  animation: ap-panel-in 200ms ease;
}

/* Remove um-form-panel-sm, um-form-panel-md — no longer needed */
```

### 4b. Remove old modal keyframes
```css
/* DELETE */
@keyframes umFadeIn  { ... }
@keyframes umModalIn { ... }
@keyframes umDropIn  { ... }
```

### 4c. Role badge — padding and colors
```css
/* Change base */
.um-role-badge {
  padding: 2px 9px;  /* remove — define per role */
}

/* Add per-role padding */
.um-role-badge.admin      { padding: 2px 10px; }
.um-role-badge.superadmin { padding: 2px 10px; }
.um-role-badge.user       { padding: 2px 8px;  }

/* Update colors */
.um-role-badge.superadmin {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
}
.um-role-badge.admin {
  background: rgba(47, 198, 246, 0.15);
  color: var(--primary-color);
}
/* .um-role-badge.user stays the same */
```

### 4d. Active status dot — pulse animation
```css
/* Add */
.um-status-badge.active::before {
  animation: cm-pulse 2s infinite;
}
```

### 4e. Dropdown animation — standardize
```css
/* Update .um-menu */
.um-menu {
  /* change: animation: umDropIn 180ms ease-out; */
  animation: adm-dropdownIn 150ms ease;
}
```

### 4f. Table header font-weight
```css
/* Change */
.um-table th { font-weight: 700; }
/* To */
.um-table th { font-weight: 400; }
```

### 4g. Form input focus — add outline ring
```css
/* Change */
.um-form-input:focus { outline: none; border-color: var(--primary-color); }
.um-form-select:focus { outline: none; border-color: var(--primary-color); }

/* To */
.um-form-input:focus {
  outline: 2px solid rgba(47, 198, 246, 0.25);
  outline-offset: -1px;
  border-color: var(--primary-color);
}
.um-form-select:focus {
  outline: 2px solid rgba(47, 198, 246, 0.25);
  outline-offset: -1px;
  border-color: var(--primary-color);
}
```

---

## Step 5 — JSX changes for slide panel behavior

The form panels changed from centered modal to right-side slide panel.
The JSX overlay behavior also needs a small update:

**In `CompanyManagement.jsx`**: The `.cm-form-overlay` click handler (closes panel on backdrop click) should remain — it still works. No JSX change needed.

**In `UserManagement.jsx`**: Same — no JSX change needed if backdrop click-outside logic is already on the overlay div.

> If the overlay currently uses `display: flex; align-items: center; justify-content: center` in inline styles or JSX — remove those. The panel is now positioned `fixed; right: 0` on its own.

---

## Checklist

- [ ] `admin-shared.css` created with 4 keyframes + reduced-motion rule
- [ ] `AdminPanel.css` — header border, nav width, nav left accent, role badge shape + colors
- [ ] `CompanyManagement.css` — slide panel, animation, pulse dot, dropdownIn, th weight, focus outline
- [ ] `UserManagement.css` — slide panel, animation, role badge padding + colors, pulse dot, dropdownIn, th weight, focus outline
- [ ] Old local keyframes removed from both component CSS files
- [ ] Build passes, no visual regressions in chat UI

## Priority order

1. P0: #6, #7, #10, #11 (slide panels + dropdown animation fix) — these are functional bugs
2. P0: #2 (nav left accent) — visual identity
3. P1: All remaining color, badge, pulse, font-weight fixes
4. P2: Nav width (#3) — last
