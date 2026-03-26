# Admin Panel — Design Review

**Agent**: UI/UX Developer
**Date**: 2026-03-26
**Task ref**: `journal/entries/2026-03-26_1300_uiux-admin-panel-review.md`
**Reviewed files**:
- `chatapp-frontend/src/pages/AdminPanel.css`
- `chatapp-frontend/src/components/admin/CompanyManagement.css`
- `chatapp-frontend/src/components/admin/UserManagement.css`
**Handoff to**: Frontend Developer

---

## Confirmed Issues (must fix)

### AdminPanel.css

**[#1] Header border — visual distinction from chat header**
```css
/* Current */
border-bottom: 1px solid var(--gray-200);

/* Fix */
border-bottom: 2px solid var(--primary-color);
```
Admin context must be unmistakably distinct from the chat header. A primary-color bottom border acts as a visual "mode indicator."

---

**[#2] Nav active state — missing left accent border**

Two changes needed:

```css
/* Current .ap-nav-item — no border-left baseline */
/* Fix — add to base style to prevent layout shift on active */
.ap-nav-item {
  border-left: 3px solid transparent;  /* add this */
  border-radius: 0;                     /* remove border-radius, left border won't show on rounded element */
  /* rest stays the same */
}

/* Current .ap-nav-item.active */
background: #e0f6fe;

/* Fix — add the left accent */
.ap-nav-item.active {
  background: rgba(47, 198, 246, 0.10);
  border-left-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;
}
```
Left border accent is a core anti-AI rule. Without it, the active state is indistinguishable from a generic highlight.

---

**[#3] Nav width — 200px → 220px**
```css
/* Current */
width: 200px;

/* Fix */
width: 220px;
```

---

**[#4] Role badge shape — pill → corporate badge**
```css
/* Current */
border-radius: 20px;

/* Fix */
border-radius: 4px;
```
Pill shape is a consumer-app pattern (Slack, Discord). Corporate tools (Bitrix24) use tight rectangular badges.

---

**[#5] Role badge colors — wrong color system**
```css
/* Current */
.ap-role-badge.superadmin { background: #fef3c7; color: #92400e; }  /* amber — outside color system */
.ap-role-badge.admin      { background: #dbeafe; color: #1e40af; }  /* blue — outside color system */

/* Fix */
.ap-role-badge.superadmin {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
  border-radius: 4px;
}
.ap-role-badge.admin {
  background: rgba(47, 198, 246, 0.15);
  color: var(--primary-color);
  border-radius: 4px;
}
```
Warm yellow and bootstrap-blue are outside the established CSS variable color system. Admin uses primary-color tone. SuperAdmin uses purple (signals elevated authority without being alarming).

---

### CompanyManagement.css

**[#6] Company form panel — centered modal → right-side slide panel**
```css
/* Current .cm-form-overlay: display: flex; align-items: center; justify-content: center */
/* Current .cm-form-panel: border-radius: 12px; width: 480px (centered modal) */

/* Fix — replace entirely */
.cm-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);   /* lighter backdrop — panel, not modal */
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
  border-radius: 0;                   /* no radius — edge-to-edge from right */
  overflow-y: auto;
  animation: ap-panel-in 200ms ease;
}
```
Centered modals interrupt the full-page context. A right-side slide panel preserves table visibility and allows comparison while editing — standard Bitrix24 pattern.

---

**[#7] Company form animation — modalIn → translateX slide**
```css
/* Current — used but not relevant to panel */
@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(-8px); } to { opacity: 1; transform: none; } }

/* Fix — replace with panel slide */
@keyframes ap-panel-in {
  from { transform: translateX(100%); opacity: 0.8; }
  to   { transform: translateX(0);    opacity: 1;   }
}
```
Scale+translateY is a modal animation. Right-side panels slide horizontally.

---

**[#8] Active status dot — missing pulse animation**
```css
/* Current */
.cm-status-badge::before {
  content: ""; width: 6px; height: 6px;
  border-radius: 50%; background: currentColor;
  /* no animation */
}

/* Fix — add animation to active only */
.cm-status-badge.active::before {
  animation: cm-pulse 2s infinite;
}

@keyframes cm-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}
/* Do NOT apply cm-pulse to inactive */
```
Static colored dots are an anti-AI flag — identical treatment for both states. Pulse on active only creates semantic distinction.

---

**[#10] Menu animation — local `dropIn` keyframe not defined + non-standard name**

`CompanyManagement.css` references `animation: dropIn 180ms ease-out` on `.cm-menu` but never defines `@keyframes dropIn`. The animation silently fails.

```css
/* Fix — define shared keyframe and use standard name */
@keyframes adm-dropdownIn {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Update .cm-menu */
.cm-menu {
  animation: adm-dropdownIn 150ms ease;
}
```

---

### UserManagement.css

**[#11] User form panel — centered modal → right-side slide panel**

Same pattern as #6. Apply identical fix with `width: 480px` (user panel is wider than company panel per spec).

```css
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
  animation: ap-panel-in 200ms ease;  /* reuse same keyframe */
}
```

---

**[#12] Role badge padding — all identical sizes (anti-AI violation)**
```css
/* Current — all same */
.um-role-badge { padding: 2px 9px; }

/* Fix — intentionally different sizes per role */
.um-role-badge.admin      { padding: 2px 10px; }  /* wider — more visual weight */
.um-role-badge.superadmin { padding: 2px 10px; }  /* same as admin */
.um-role-badge.user       { padding: 2px 8px;  }  /* narrower — less weight */
```
Anti-AI rule: role badges must NOT all be the same size. Visual hierarchy through size.

---

**[#13] User role badge colors — wrong color system**
```css
/* Current */
.um-role-badge.superadmin { background: #fef3c7; color: #92400e; }
.um-role-badge.admin      { background: #dbeafe; color: #1e40af; }
.um-role-badge.user       { background: var(--gray-100); color: var(--gray-500); }

/* Fix */
.um-role-badge.superadmin {
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
}
.um-role-badge.admin {
  background: rgba(47, 198, 246, 0.15);
  color: var(--primary-color);
}
.um-role-badge.user {
  background: var(--gray-100);
  color: var(--gray-500);   /* acceptable as-is */
}
```

---

**[#14] User active status dot — missing pulse animation**

Same fix as #8. Add `cm-pulse` keyframe and apply to `.um-status-badge.active::before` only.

```css
.um-status-badge.active::before {
  animation: cm-pulse 2s infinite;
}
/* Reuse same @keyframes cm-pulse defined in shared/global CSS */
```

---

**[#15] User menu animation — local `umDropIn` → shared `adm-dropdownIn`**
```css
/* Current */
animation: umDropIn 180ms ease-out;
@keyframes umDropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

/* Fix */
animation: adm-dropdownIn 150ms ease;
/* Remove umDropIn, reuse adm-dropdownIn from fix #10 */
```

---

## Acceptable Deviations (no fix needed)

**[#9] Inactive row opacity: `.cm-row-inactive td { opacity: 0.55 }`**

Acceptable. De-emphasizing the entire row for inactive companies/users provides immediate visual feedback that these rows are non-actionable. This does not conflict with any anti-AI rules — it is per-row, not per-cell uniform styling. Keep as-is.

---

## Additional Observations

These issues were NOT in the PO checklist but were found during code review:

**[OBS-1] Table header font-weight — anti-AI violation in both components**

Both `cm-table th` and `um-table th` use `font-weight: 700`. Row data (td) uses `font-weight: 600/500`. This is inverted — headers appear heavier than content.

```css
/* Current (both files) */
th { font-weight: 700; color: var(--gray-500); }

/* Fix — visual hierarchy inversion (anti-AI rule) */
th { font-weight: 400; color: var(--gray-500); }
/* Row data stays at font-weight: 500-600 — now heavier than headers */
```

---

**[OBS-2] `dropIn` keyframe missing in CompanyManagement.css — silent animation failure**

Already covered in #10, but flagged separately: `cm-menu` references `dropIn` which is never defined in this file. The dropdown menu currently has no opening animation. This must be fixed as part of #10.

---

**[OBS-3] `cm-pulse` and skeleton shimmer keyframes missing entirely**

Neither file defines `@keyframes cm-pulse` or `@keyframes adm-shimmer`. These are needed for:
- Active status dot pulse (#8, #14)
- Skeleton loading rows (no skeleton loading implemented at all)

Skeleton rows are a P2 item — Frontend Developer may defer skeleton implementation. But `cm-pulse` is P0 (required by #8 and #14 fixes).

Recommend: define shared admin keyframes in a single `admin-shared.css` file imported by all admin components:
```css
/* admin-shared.css */
@keyframes adm-dropdownIn { ... }
@keyframes ap-panel-in { ... }
@keyframes cm-pulse { ... }
@keyframes adm-shimmer { ... }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

---

**[OBS-4] Form input focus — missing `outline` ring (accessibility gap)**

All form inputs (`.cm-form-input:focus`, `.um-form-input:focus`) only change `border-color`. No `outline` ring is defined.

```css
/* Current */
.cm-form-input:focus { outline: none; border-color: var(--primary-color); }

/* Fix — add outline ring for WCAG 2.1 AA focus visibility */
.cm-form-input:focus {
  outline: 2px solid rgba(47, 198, 246, 0.25);
  outline-offset: -1px;
  border-color: var(--primary-color);
}
```
`outline: none` without a replacement violates WCAG 2.1 AA Success Criterion 2.4.7 (Focus Visible).

---

## Summary Table

| # | File | Issue | Priority | Action |
|---|------|-------|----------|--------|
| #1 | AdminPanel.css | Header border thin/wrong color | P1 | Fix |
| #2 | AdminPanel.css | Nav active missing border-left + baseline | P0 | Fix |
| #3 | AdminPanel.css | Nav width 200px vs 220px | P2 | Fix |
| #4 | AdminPanel.css | Role badge radius pill → 4px | P1 | Fix |
| #5 | AdminPanel.css | Role badge colors outside color system | P1 | Fix |
| #6 | CompanyManagement.css | Form panel centered modal → slide panel | P0 | Fix |
| #7 | CompanyManagement.css | Form panel animation wrong type | P0 | Fix (with #6) |
| #8 | CompanyManagement.css | Active dot missing cm-pulse animation | P1 | Fix |
| #9 | CompanyManagement.css | Inactive row opacity 0.55 | — | Acceptable |
| #10 | CompanyManagement.css | dropIn keyframe missing + non-standard name | P0 | Fix |
| #11 | UserManagement.css | Form panel centered modal → slide panel | P0 | Fix |
| #12 | UserManagement.css | Role badge padding identical | P1 | Fix |
| #13 | UserManagement.css | Role badge colors outside color system | P1 | Fix |
| #14 | UserManagement.css | Active dot missing pulse animation | P1 | Fix |
| #15 | UserManagement.css | umDropIn local → adm-dropdownIn shared | P1 | Fix |
| OBS-1 | Both | Table header font-weight heavier than data | P1 | Fix |
| OBS-2 | CompanyManagement.css | dropIn missing (same as #10) | P0 | Fix |
| OBS-3 | Both | cm-pulse + shimmer keyframes missing | P1 | Define shared |
| OBS-4 | Both | Focus outline: none (accessibility) | P1 | Fix |

**P0 fixes (blocking)**: #2, #6, #7, #10, #11
**P1 fixes (before review)**: #1, #4, #5, #8, #12, #13, #14, #15, OBS-1, OBS-3, OBS-4
**P2 fixes (nice to have)**: #3
