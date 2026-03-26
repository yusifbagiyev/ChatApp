# UI/UX Task: Admin Panel Design Review

**From**: Product Owner
**To**: UI/UX Developer
**Date**: 2026-03-26
**Priority**: P1 — Frontend already implemented Admin Panel without wireframe. Review and provide correction list.

---

## Context

Frontend Developer implemented the Admin Panel (`/admin`) before the wireframe was ready.
The implementation is in:

- `chatapp-frontend/src/pages/AdminPanel.jsx` + `AdminPanel.css`
- `chatapp-frontend/src/components/admin/CompanyManagement.jsx` + `CompanyManagement.css`
- `chatapp-frontend/src/components/admin/UserManagement.jsx` + `UserManagement.css`

Your job is to **review what was built** against design standards from `knowledge/UX_DESIGN_GUIDE.md`
and produce a correction list for the Frontend Developer.

---

## What to Review

Read the CSS and JSX files listed above. Then check each item below.

### 1. Admin Panel Shell (`AdminPanel.css`)

| # | Check | Current | Expected |
|---|-------|---------|----------|
| 1 | Header border | `1px solid var(--gray-200)` | `2px solid var(--primary-color)` — must be visually distinct from chat header |
| 2 | Nav item active state | `background: #e0f6fe` only | Must also have `border-left: 3px solid var(--primary-color)` — left accent rule |
| 3 | Nav width | `200px` | `220px` |
| 4 | Role badge shape | `border-radius: 20px` (pill) | `border-radius: 4px` — corporate badge, not pill |
| 5 | Role badge colors | `superadmin: #fef3c7/#92400e`, `admin: #dbeafe/#1e40af` | Use `var(--primary-color)` tones — not warm yellow/blue. Align with color system. |

### 2. Company Management (`CompanyManagement.css`)

| # | Check | Current | Expected |
|---|-------|---------|----------|
| 6 | Form panel type | Centered modal (`cm-form-overlay` + centered flex) | Right-side slide panel — `position: fixed; right: 0; top: 0; height: 100vh; width: 420px` |
| 7 | Form panel animation | `modalIn` (scale + translateY) | `slideIn` (translateX from right) |
| 8 | Active status dot | `::before` pseudo-element, no animation | Must have `cm-pulse` animation on active dot only |
| 9 | Inactive status row | `opacity: 0.55` on `tr` | Per-spec acceptable — confirm or adjust |
| 10 | Menu animation name | `dropIn` (local keyframe) | Standardize: rename to `adm-dropdownIn`, move to shared |

### 3. User Management (`UserManagement.css`)

| # | Check | Current | Expected |
|---|-------|---------|----------|
| 11 | Form panel type | Centered modal (same as company) | Right-side slide panel — `width: 480px` |
| 12 | Role badge padding | All same: `padding: 2px 9px` | Admin badge: `padding: 2px 10px` — intentionally wider than User (`2px 8px`) |
| 13 | Role badge colors | `admin: #dbeafe/#1e40af`, `superadmin: #fef3c7` | Admin → `var(--primary-color)` tone. SuperAdmin → purple tone `rgba(139,92,246,0.12)` / `#7c3aed` |
| 14 | Active status dot | `::before` pseudo, no animation | Same `cm-pulse` animation as company status |
| 15 | Menu animation | `umDropIn` (local) | Same `adm-dropdownIn` shared keyframe |

---

## Deliverable

Write your output to:
`agents/uiux-developer/outputs/2026-03-26_review_admin-panel.md`

Format:

```markdown
## Confirmed Issues (must fix)
- [#N] Description — exact CSS change needed

## Acceptable Deviations (no fix needed)
- [#N] Description — why it's acceptable

## Additional Observations
- Any issues not in the checklist above
```

Frontend Developer will read this and apply the corrections.

---

## Design References

- Color system: `knowledge/UX_DESIGN_GUIDE.md` — Color System section
- Anti-AI rules: `knowledge/UX_DESIGN_GUIDE.md` — Anti-AI Design Rules section
- Animation standards: `knowledge/UX_DESIGN_GUIDE.md` — Animation Standards section
- Interaction states: `knowledge/UX_DESIGN_GUIDE.md` — Interaction State Checklist section
