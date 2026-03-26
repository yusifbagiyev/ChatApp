# UI/UX Task: Admin Panel Wireframe & Interaction Spec

**From**: Product Owner
**To**: UI/UX Developer
**Date**: 2026-03-26
**Priority**: P0 — Frontend Developer is waiting on this before implementing Admin Panel
**Reference**: `journal/entries/2026-03-26_1000_admin-panel-frontend.md` (frontend task)
**Requirements doc**: `agents/product-owner/outputs/2026-03-25_requirement_platform-overhaul.md`

---

## Context

Admin Panel is a new page (`/admin`) accessible only to Admin and SuperAdmin roles. It has two sections:

- **Company Management** — SuperAdmin only: CRUD for companies, assign company admins
- **User Management** — Admin + SuperAdmin: CRUD for users, supervisors, roles

This is a corporate tool used by company admins and super admins. Users are non-technical to semi-technical. Keep it dense and functional — Bitrix24 style, NOT a consumer app.

Target audience: See `knowledge/AUDIENCE.md` — Segment 2 (Managers) and Segment 3 (IT Admins).

---

## Deliverables Required

Provide a spec file to `agents/uiux-developer/outputs/2026-03-26_wireframe_admin-panel.md` with:

1. **Page layout wireframe** (text-based ASCII)
2. **Company Management** component spec — all states
3. **User Management** component spec — all states
4. **All interaction states** for every component (use Design Handoff Template from `knowledge/UX_DESIGN_GUIDE.md`)
5. **CSS class naming** suggestions (prefix convention)
6. **Animation specs** (consistent with existing standards)

---

## Design Constraints

**Must follow:**
- Bitrix24 style — corporate, dense, professional
- Existing CSS variable system (`--primary-color: #2fc6f6`, `--bg-secondary: #f0f2f5`, etc.)
- No inline styles, no Tailwind
- Anti-AI rules — no uniform card grids, no purple gradients, no identical shadows
- `border-radius: var(--radius-md)` (8px)
- All dropdowns appear UNDER their trigger (position: absolute), NOT centered modals

**Page background**: `var(--bg-secondary)` (#f0f2f5)
**Panel background**: `var(--white)`

---

## Sections to Design

### 1. Admin Panel Page Layout

Full page layout with:
- **Header bar** (full width): Back to Chat button (left), "Admin Panel" title (center), role badge (right)
- **Left navigation** (220px fixed): Company, Users nav items — active state highlighted
- **Content area** (flex, fills remaining): Renders active section

Header must be visually distinct from chat header. No confusion between admin and chat contexts.

---

### 2. Company Management Section (SuperAdmin only)

#### 2a. Company List View

```
┌────────────────────────────────────────────────────────┐
│ Companies                              [+ New Company] │
│ ┌─────────────────────────────────┐                    │
│ │ 🔍 Search companies...          │                    │
│ └─────────────────────────────────┘                    │
├────────────┬──────────┬──────────┬──────────┬──────────┤
│ Company    │ Admin    │ Users    │ Status   │ Actions  │
├────────────┼──────────┼──────────┼──────────┼──────────┤
│ 166 Log... │ Aqil Z.  │ 61       │ ● Active │ •••      │
│ ...        │ —        │ 0        │ ○ Inact. │ •••      │
└────────────┴──────────┴──────────┴──────────┴──────────┘
│ Showing 1-10 of 12              [< Prev] [1] [2] [Next >] │
```

Spec requirements:
- Table rows: hover highlight (`#f5f7fa`), 48px row height
- Status: green dot `#10b981` for Active, grey dot `#9ca3af` for Inactive
- Actions `•••` dropdown (appears UNDER the button): Edit, Assign Admin, Deactivate/Activate
- Empty state: "No companies yet. Create your first company →"
- Loading state: skeleton rows (shimmer animation)
- Search: 300ms debounce, filters inline

#### 2b. Company Form (right-side slide panel, 420px)

Opens when: clicking "+ New Company" or "Edit" from actions dropdown.

```
┌─────────────────────────────────────────────────────┐
│ [×]  Create Company                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Company Logo                                       │
│  ┌──────────┐                                       │
│  │          │  [Upload Logo]                        │
│  │  [logo]  │  JPG, PNG up to 5MB                   │
│  └──────────┘                                       │
│                                                     │
│  Company Name *                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Enter company name...                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Description                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │                                              │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Company Admin                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🔍 Search users...                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│              [Cancel]  [Create Company]             │
└─────────────────────────────────────────────────────┘
```

States: default, loading (spinner on submit button), success (panel closes, table refreshes), error (inline red message under field).

---

### 3. User Management Section

#### 3a. User List View

```
┌─────────────────────────────────────────────────────────────────┐
│ Users                                          [+ New User]     │
│ ┌──────────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │ 🔍 Search users  │ │ All Depts ▾  │ │ All Status ▾         │ │
│ └──────────────────┘ └──────────────┘ └──────────────────────┘ │
├──────────────┬──────────────┬──────────────┬──────────┬─────────┤
│ Name         │ Department   │ Position     │ Role     │ Actions │
├──────────────┼──────────────┼──────────────┼──────────┼─────────┤
│ ◉ Leyla M.  │ Finance      │ CFO          │ Admin    │ •••     │
│ ◉ Rəşad Ə. │ Engineering  │ Tech Lead    │ User     │ •••     │
│ ○ İlham T.  │ HR           │ HR Spec.     │ User     │ •••     │
└──────────────┴──────────────┴──────────────┴──────────┴─────────┘
│ Showing 1-20 of 61                    [< Prev] [1] [2] [3] [Next >] │
```

Details:
- Avatar: colored circle with initials (hash-based color, existing pattern)
- ◉ = Active (filled circle, `#10b981`), ○ = Inactive (empty circle, `#9ca3af`)
- Role badge: Admin → `#2fc6f6` background, User → `#f3f4f6` background
- Actions `•••` dropdown: Edit, Reset Password, Activate/Deactivate
- Filters: Department dropdown (all departments from API), Status dropdown (All / Active / Inactive)
- Column headers: clickable for sort (Name, Department), arrow indicator

#### 3b. User Detail Panel (right-side slide panel, 480px)

Opens when: "+ New User" or "Edit" from actions.

Panel has TWO TABS: **Profile** | **Supervisors**

**Profile Tab:**
```
┌─────────────────────────────────────────────────────┐
│ [×]  Edit User                [Profile] [Supervisors]│
├─────────────────────────────────────────────────────┤
│  Avatar + Upload                                    │
│                                                     │
│  First Name *        Last Name *                    │
│  ┌───────────────┐   ┌───────────────────────────┐ │
│  │               │   │                           │ │
│  └───────────────┘   └───────────────────────────┘ │
│                                                     │
│  Email *                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Department              Position                   │
│  ┌────────────────────┐  ┌────────────────────────┐│
│  │ Select dept... ▾   │  │ Select position... ▾   ││
│  └────────────────────┘  └────────────────────────┘│
│                                                     │
│  Role                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ User ▾                                       │   │
│  └─────────────────────────────────────────────┘   │
│  ⓘ Admin can assign User role only.                 │
│    SuperAdmin can assign Admin or User.             │
│                                                     │
│  Status: ● Active    [Deactivate]                   │
│                                                     │
│         [Cancel]  [Save Changes]                    │
└─────────────────────────────────────────────────────┘
```

**Supervisors Tab:**
```
┌─────────────────────────────────────────────────────┐
│ [×]  Edit User               [Profile] [Supervisors] │
├─────────────────────────────────────────────────────┤
│  Supervisors  (this user reports to)                │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🔍 Add supervisor...                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────┬───┐   │
│  │ ◉ Aqil Zeynalov — Head of Company       │ × │   │
│  └─────────────────────────────────────────┴───┘   │
│  ┌─────────────────────────────────────────┬───┐   │
│  │ ◉ Leyla Məmmədova — CFO                 │ × │   │
│  └─────────────────────────────────────────┴───┘   │
│                                                     │
│  Subordinates  (reports to this user)               │
│  ┌─────────────────────────────────────────┐       │
│  │ ◉ Rəşad Əliyev — Tech Lead              │       │
│  │ ◉ Aysel Həsənova — Frontend Lead        │       │
│  └─────────────────────────────────────────┘       │
│  Subordinates are read-only (assigned via their     │
│  own profiles).                                     │
└─────────────────────────────────────────────────────┘
```

#### 3c. Reset Password Modal

Small centered modal (360px wide) — this is the ONE exception to "no modals" rule because it's a destructive/sensitive action:

```
┌──────────────────────────────────────────┐
│  Reset Password for Leyla Məmmədova      │
├──────────────────────────────────────────┤
│                                          │
│  New Password *                          │
│  ┌──────────────────────────────────┐   │
│  │ ••••••••••••          [👁]        │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Confirm Password *                      │
│  ┌──────────────────────────────────┐   │
│  │ ••••••••••••          [👁]        │   │
│  └──────────────────────────────────┘   │
│                                          │
│      [Cancel]  [Reset Password]          │
└──────────────────────────────────────────┘
```

---

## All Interaction States Required

For EVERY interactive component, define:

| State | What to specify |
|-------|----------------|
| Default | Colors, spacing, typography |
| Hover | Background change, cursor |
| Active/Pressed | Scale 0.97, color darken |
| Focus | `outline: 2px solid var(--primary-color)` ring |
| Disabled | Opacity 0.4, cursor: not-allowed |
| Loading | Spinner on button, skeleton for table |
| Error | Red border `#ef4444`, error text below field |
| Empty | Guidance message, icon, CTA button |
| Selected | Highlighted row or active nav item |
| Overflow | Text truncation with ellipsis + tooltip |

---

## Navigation Active States

Left nav items:
- Default: `color: var(--gray-600)`, no background
- Hover: `background: var(--gray-100)`, `color: var(--gray-900)`
- Active: `background: var(--primary-color)` at 10% opacity, left border `3px solid var(--primary-color)`, `color: var(--primary-color)`

---

## CSS Class Naming Conventions

```
Admin Panel page:     ap-*     (ap-header, ap-nav, ap-content)
Company Management:   cm-*     (cm-table, cm-row, cm-form, cm-status-badge)
User Management:      um-*     (um-table, um-row, um-panel, um-tab)
Shared admin:         adm-*    (adm-modal, adm-search, adm-actions-menu)
```

---

## Anti-AI Checklist (Verify Before Handoff)

- [ ] No identical row shadows — use border-bottom only for table rows
- [ ] Role badges NOT all same size — Admin badge slightly wider
- [ ] Status dots are NOT just colored circles — use pulse animation for active
- [ ] Form fields have DIFFERENT visual weight — required fields slightly bolder label
- [ ] Navigation uses LEFT border accent (not background fill alone)
- [ ] Table header: lighter font weight than row data (visual hierarchy inversion)
- [ ] "Cancel" button is NOT just grey — use ghost style with border

---

## Output

Write full spec to: `agents/uiux-developer/outputs/2026-03-26_wireframe_admin-panel.md`

Frontend Developer will read this file before writing any Admin Panel code.
