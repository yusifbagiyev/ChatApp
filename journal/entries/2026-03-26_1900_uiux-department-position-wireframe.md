# UI/UX Task: Department & Position Management Wireframes

**From**: Product Owner
**To**: UI/UX Developer
**Date**: 2026-03-26
**Priority**: P1 — Frontend is waiting on this before implementing
**Reference**: Admin Panel CSS patterns in `agents/uiux-developer/outputs/2026-03-26_review_admin-panel.md`

---

## Context

Two new sections will be added to the Admin Panel (`/admin`):
- **Departments** — manage company org structure (tree hierarchy, head assignment)
- **Positions** — manage job positions linked to departments

Backend endpoints are ready:
- `GET/POST/PUT/DELETE /api/identity/departments`
- `POST /api/identity/departments/{id}/assign-head`
- `DELETE /api/identity/departments/{id}/remove-head`
- `GET/POST/PUT/DELETE /api/identity/positions`
- `GET /api/identity/positions/department/{id}`

**Access**: Admin + SuperAdmin (same as User Management).

---

## Data Shapes

**Department**:
```
Id, Name, ParentDepartmentId?, ParentDepartmentName?, HeadOfDepartmentId?, HeadOfDepartmentName?
```

**Position**:
```
Id, Name, Description?, DepartmentId?, DepartmentName?
```

Departments are hierarchical — a department can have a parent department.

---

## Design Constraints

Same as Admin Panel:
- Bitrix24 style — corporate, dense
- Existing CSS variables (`--primary-color: #2fc6f6`, etc.)
- Form panels: right-side slide panel (NOT centered modal)
- `border-radius: var(--radius-md)` (8px)
- CSS prefixes: `dm-*` (Department Management), `pm-*` (Position Management)
- Shared admin keyframes from `admin-shared.css`
- Anti-AI rules apply

---

## Sections to Design

### 1. Admin Panel Nav — Updated

Add two new items to the left nav (after Users):

```
▸ Companies      (SuperAdmin only)
▸ Users
▸ Departments    ← new
▸ Positions      ← new
```

### 2. Department Management

#### 2a. Department List View

Departments are displayed as a **flat list with indentation** to show hierarchy.
(No expand/collapse tree — MVP simplicity. Parent name shown as a sub-label.)

```
┌──────────────────────────────────────────────────────────────────────┐
│  dm-section-header                                                    │
│  Departments                                  [+ New Department]      │
├──────────────────────────────────────────────────────────────────────┤
│  dm-toolbar                                                           │
│  ┌────────────────────────────────────┐                               │
│  │ 🔍 Search departments...           │                               │
│  └────────────────────────────────────┘                               │
├────────────────────┬─────────────────┬───────────────┬───────────────┤
│ Name               │ Parent Dept     │ Head          │ Actions       │
├────────────────────┼─────────────────┼───────────────┼───────────────┤
│ Engineering        │ —               │ Aqil Z.       │ •••           │
│   ├ Frontend       │ Engineering     │ Aysel H.      │ •••           │
│   └ Backend        │ Engineering     │ Rəşad Ə.      │ •••           │
│ Finance            │ —               │ Leyla M.      │ •••           │
│ HR                 │ —               │ —             │ •••           │
└────────────────────┴─────────────────┴───────────────┴───────────────┘
```

Spec requirements:
- Child departments: `padding-left: 28px`, prefix with `└` or `├` tree character (`color: var(--gray-300)`)
- Only 1 level of indentation shown — grandchildren get same indent as children (MVP)
- Parent column: `—` if top-level
- Head column: `—` if no head assigned, clickable to assign
- Actions `•••` dropdown: Edit, Assign Head / Remove Head (context-dependent), Delete
- Delete disabled if department has employees: tooltip "Cannot delete — department has members"
- Loading: skeleton rows (shimmer)
- Empty state: "No departments yet. Create your first department →"

#### 2b. Department Form Panel (right-side, 420px)

Opens on "+ New Department" or Edit action.

```
                              ┌──────────────────────────────────────┐
                              │ [×]  Create Department               │
                              ├──────────────────────────────────────┤
                              │                                      │
                              │  Department Name *                   │
                              │  ┌──────────────────────────────┐   │
                              │  │ Enter name...                │   │
                              │  └──────────────────────────────┘   │
                              │                                      │
                              │  Parent Department                   │
                              │  ┌──────────────────────────────┐   │
                              │  │ None (top-level) ▾            │   │
                              │  └──────────────────────────────┘   │
                              │  ⓘ Leave empty for a root dept.     │
                              │                                      │
                              │         [Cancel]  [Create]          │
                              └──────────────────────────────────────┘
```

- Parent Department: native `<select>` with all existing departments + "None (top-level)" option
- Cannot select itself or its own children as parent (when editing)
- Head assignment is NOT in the create form — assigned separately via •••→ Assign Head

#### 2c. Assign Head Panel (right-side, 380px)

Opens via `•••` → Assign Head.

```
                              ┌──────────────────────────────────────┐
                              │ [×]  Assign Head — Engineering       │
                              ├──────────────────────────────────────┤
                              │                                      │
                              │  Current Head                        │
                              │  ┌──────────────────────────────┐   │
                              │  │ ◉ Aqil Z. — Head of Company  │   │
                              │  └──────────────────────────────┘   │
                              │                 [Remove Head]        │
                              │                                      │
                              │  Assign New Head                     │
                              │  ┌──────────────────────────────┐   │
                              │  │ 🔍 Search users...            │   │
                              │  └──────────────────────────────┘   │
                              │  ┌──────────────────────────────┐   │
                              │  │ ◉ Leyla M. — CFO             │   │
                              │  │ ◉ Rəşad Ə. — Tech Lead       │   │
                              │  └──────────────────────────────┘   │
                              │                                      │
                              │              [Assign]               │
                              └──────────────────────────────────────┘
```

- "Current Head" section: only shown if head exists
- "Remove Head" button: ghost-danger style
- User search: same company users only, 300ms debounce
- Selected user: highlighted row, [Assign] button activates

---

### 3. Position Management

#### 3a. Position List View

```
┌───────────────────────────────────────────────────────────────────────┐
│  pm-section-header                                                     │
│  Positions                                         [+ New Position]    │
├───────────────────────────────────────────────────────────────────────┤
│  pm-toolbar                                                            │
│  ┌──────────────────────┐  ┌──────────────────────────────────────┐   │
│  │ 🔍 Search positions  │  │ All Departments ▾                    │   │
│  └──────────────────────┘  └──────────────────────────────────────┘   │
├──────────────────────────┬──────────────────────┬─────────────────────┤
│ Position Name            │ Department           │ Actions             │
├──────────────────────────┼──────────────────────┼─────────────────────┤
│ CEO                      │ — (company-wide)     │ •••                 │
│ Tech Lead                │ Engineering          │ •••                 │
│ Frontend Developer       │ Frontend             │ •••                 │
│ CFO                      │ Finance              │ •••                 │
└──────────────────────────┴──────────────────────┴─────────────────────┘
```

- Department column: `—` if position has no department (company-wide position like CEO)
- Department filter: dropdown with all departments + "All Departments" + "No Department"
- Actions: Edit, Delete
- Delete disabled if position has employees assigned: tooltip "Cannot delete — position has members"
- Loading: skeleton rows
- Empty state: "No positions yet. Create your first position →"

#### 3b. Position Form Panel (right-side, 420px)

```
                              ┌──────────────────────────────────────┐
                              │ [×]  Create Position                 │
                              ├──────────────────────────────────────┤
                              │                                      │
                              │  Position Name *                     │
                              │  ┌──────────────────────────────┐   │
                              │  │ Enter name...                │   │
                              │  └──────────────────────────────┘   │
                              │                                      │
                              │  Department                          │
                              │  ┌──────────────────────────────┐   │
                              │  │ No Department (company-wide) ▾│   │
                              │  └──────────────────────────────┘   │
                              │  ⓘ Leave empty for company-wide     │
                              │    positions (CEO, CTO, etc.)        │
                              │                                      │
                              │  Description                         │
                              │  ┌──────────────────────────────┐   │
                              │  │                              │   │
                              │  └──────────────────────────────┘   │
                              │                                      │
                              │        [Cancel]  [Create]           │
                              └──────────────────────────────────────┘
```

---

## Interaction States — All Components

Define all 10 states for each interactive component:

| State | What to define |
|-------|---------------|
| Default | Colors, spacing, typography |
| Hover | Background, cursor |
| Active/Pressed | `transform: scale(0.97)` |
| Focus | `outline: 2px solid var(--primary-color)` ring |
| Disabled | `opacity: 0.4; cursor: not-allowed` + tooltip |
| Loading | Shimmer skeleton rows |
| Error | Red border + inline message |
| Empty | Icon + guidance text + CTA |
| Selected | Highlighted row in user search |
| Overflow | Text truncation + `title` tooltip |

---

## CSS Naming Conventions

```
Department Management:   dm-*
  dm-section, dm-toolbar, dm-table, dm-row, dm-row--child
  dm-tree-prefix, dm-head-cell, dm-form-panel, dm-head-panel

Position Management:     pm-*
  pm-section, pm-toolbar, pm-table, pm-row
  pm-dept-badge, pm-form-panel
```

Shared patterns (`adm-*`, `ap-*`) already defined in `admin-shared.css` — reuse them.

---

## Anti-AI Checklist

- [ ] Department child rows use LEFT padding + tree character — NOT a generic indent
- [ ] "No head assigned" state uses `—` with `color: var(--gray-300)` — NOT empty string
- [ ] Position "No Department" badge uses different style than dept badge
- [ ] Delete disabled state uses tooltip — NOT just grayed button
- [ ] Form panel uses `ap-panel-in` slide animation — NOT `modalIn`
- [ ] Empty state has CTA button — NOT just text

---

## Output

Write full spec to: `agents/uiux-developer/outputs/2026-03-26_wireframe_dept-position.md`

Frontend Developer will read this before implementing Department and Position panels.
