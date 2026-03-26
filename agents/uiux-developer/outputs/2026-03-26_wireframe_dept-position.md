# Department & Position Management — Wireframe & Interaction Spec

**Agent**: UI/UX Developer
**Date**: 2026-03-26
**Task ref**: `journal/entries/2026-03-26_1900_uiux-department-position-wireframe.md`
**Handoff to**: Frontend Developer
**CSS ref**: `agents/uiux-developer/outputs/2026-03-26_review_admin-panel.md`

---

## 1. Admin Panel Nav — Updated

Add two new items to `ap-nav` after Users:

```
┌──────────────────────┐
│  ap-nav (220px)      │
│                      │
│  🏢  Companies       │  ← SuperAdmin only
│  👥  Users           │
│  🏗  Departments     │  ← new (Admin + SuperAdmin)
│  💼  Positions       │  ← new (Admin + SuperAdmin)
│                      │
└──────────────────────┘
```

Nav item states unchanged from existing spec:
- Default: `color: var(--gray-600); border-left: 3px solid transparent`
- Hover: `background: var(--gray-100); color: var(--gray-900)`
- Active: `background: rgba(47,198,246,0.10); border-left-color: var(--primary-color); color: var(--primary-color); font-weight: 600`

---

## 2. Department Management Section

### Component: DepartmentManagement (`dm-*`)

---

#### Layout Wireframe — List View

```
┌──────────────────────────────────────────────────────────────────────────┐
│  dm-section                                                               │
│  dm-section-header                                                        │
│  Departments  [12]                              [+ New Department]        │
├──────────────────────────────────────────────────────────────────────────┤
│  dm-toolbar                                                               │
│  ┌───────────────────────────────────────┐                                │
│  │ 🔍 Search departments...              │                                │
│  └───────────────────────────────────────┘                                │
├───────────────────────────┬──────────────────┬─────────────────┬─────────┤
│ dm-th  Name               │ Parent           │ Head            │ Actions │
├───────────────────────────┼──────────────────┼─────────────────┼─────────┤
│ Engineering               │ —                │ Aqil Z.         │ •••     │
│   ├ Frontend              │ Engineering      │ Aysel H.        │ •••     │
│   └ Backend               │ Engineering      │ Rəşad Ə.        │ •••     │
│ Finance                   │ —                │ Leyla M.        │ •••     │
│ HR                        │ —                │ —               │ •••     │
├───────────────────────────┴──────────────────┴─────────────────┴─────────┤
│  (no pagination — all departments load at once, typically < 50 items)    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Interaction States — Department List

#### Section Header (`dm-section-header`)
- `display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px`
- Title: `font-size: 18px; font-weight: 700; color: var(--gray-800)`
- Count badge: `background: var(--gray-100); color: var(--gray-500); font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 20px; margin-left: 8px`

#### Table Row — Root department (`dm-row`)
| State | Spec |
|-------|------|
| Default | `background: var(--white); border-bottom: 1px solid var(--border-light); height: 48px; padding: 0 16px` |
| Hover | `background: #f5f7fa` — 150ms |
| Loading | skeleton: 3 shimmer bars per row, `adm-shimmer` 1.2s |
| Empty | icon (building-off), "No departments yet.", CTA "→ Create your first department" with `cm-btn-primary` style |

#### Table Row — Child department (`dm-row dm-row--child`)
| State | Spec |
|-------|------|
| Default | same as `dm-row` + `padding-left: 44px` (28px base indent + 16px normal) |
| Tree prefix | `dm-tree-prefix` — `color: var(--gray-300); margin-right: 6px; font-family: monospace; user-select: none` |
| Visual | slightly different background from root: `background: var(--white)` — same but tree character creates hierarchy |

**Tree character rendering:**
```
Engineering          ← root: no prefix
  ├ Frontend         ← child (not last): "├ "
  └ Backend          ← child (last): "└ "
Finance              ← root: no prefix
```
Characters `├` and `└` — `color: var(--gray-300)`. Children get `padding-left: 28px` relative to parent column start.

#### Name Cell (`dm-name-cell`)
| State | Spec |
|-------|------|
| Root dept | `font-weight: 600; color: var(--gray-800)` |
| Child dept | `font-weight: 500; color: var(--gray-700)` — slightly lighter, no bold |
| Overflow | `max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap` + `title` attr tooltip |

#### Head Cell (`dm-head-cell`)
| State | Spec |
|-------|------|
| Assigned | avatar circle 24px + name, `font-size: 13px; color: var(--gray-700)` |
| Unassigned | `—` em dash, `color: var(--gray-300); font-style: italic` |
| Hover (unassigned) | underline + `cursor: pointer; color: var(--primary-color)` — clicking opens Assign Head panel |

#### Parent Cell
| State | Spec |
|-------|------|
| Root (no parent) | `—` em dash, `color: var(--gray-300)` |
| Has parent | parent name, `color: var(--gray-500); font-size: 13px` |

#### Search Field (`adm-search`) — reuse existing spec
| State | Spec |
|-------|------|
| Default | `border: 1px solid var(--border-light); border-radius: var(--radius-md); height: 36px; padding: 0 12px 0 36px` |
| Focus | `border-color: var(--primary-color); outline: 2px solid rgba(47,198,246,0.25); outline-offset: -1px` |
| Typing | debounce 300ms, filters list inline (no API call — data already loaded) |

#### "+ New Department" Button
| State | Spec |
|-------|------|
| Default | `background: var(--primary-color); color: #fff; height: 36px; padding: 0 16px; border-radius: var(--radius-md); font-weight: 500; font-size: 13px` |
| Hover | `background: #28b4e0` — 150ms |
| Active | `transform: scale(0.97)` |
| Focus | `outline: 2px solid var(--primary-color); outline-offset: 2px` |

#### Actions Dropdown (`adm-actions-menu`) — `•••`
| State | Spec |
|-------|------|
| Default | `background: transparent; border: none; padding: 6px 10px; border-radius: var(--radius-md); color: var(--gray-400)` |
| Hover | `background: var(--gray-100); color: var(--gray-700)` |
| Open | panel appears `position: absolute; top: 100%; right: 0` |
| Panel | `background: var(--white); border: 1px solid var(--border-light); border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(0,0,0,0.08); min-width: 170px; padding: 4px 0; animation: adm-dropdownIn 150ms ease` |

**Dropdown items (context-dependent):**
1. Edit
2. Assign Head ← shown when no head assigned
3. Remove Head ← shown when head IS assigned (replaces Assign Head)
4. Delete — `color: var(--error-color)` — disabled + tooltip if dept has members

#### Delete Disabled State
```
cursor: not-allowed;
opacity: 0.4;
position: relative;
```
Tooltip on hover: "Cannot delete — department has members"
Use `title` attribute on the button element.

---

#### Layout Wireframe — Department Form Panel (420px)

```
                                   ┌──────────────────────────────────────┐
                                   │ dm-form-panel                        │
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
                                   │  │ None (top-level)  ▾           │   │
                                   │  └──────────────────────────────┘   │
                                   │  ⓘ Leave empty for a root dept.     │
                                   │                                      │
                                   │         [Cancel]  [Create]          │
                                   └──────────────────────────────────────┘
```

**Panel behavior:**
- Slides in from right: `animation: ap-panel-in 200ms ease`
- `position: fixed; right: 0; top: 0; width: 420px; height: 100vh; background: var(--white); box-shadow: -4px 0 20px rgba(0,0,0,0.10)`
- Backdrop: `position: fixed; inset: 0; background: rgba(0,0,0,0.15); z-index: 999`
- Click outside → close panel

### Interaction States — Department Form Panel

#### Form Fields (`dm-form-field`)
| State | Spec |
|-------|------|
| Default | `border: 1px solid var(--border-light); border-radius: var(--radius-md); height: 38px; padding: 0 12px; font-size: 14px; color: var(--gray-700)` |
| Focus | `border-color: var(--primary-color); outline: 2px solid rgba(47,198,246,0.25); outline-offset: -1px` |
| Error | `border-color: #ef4444; outline: 2px solid rgba(239,68,68,0.15)` + error text below: `color: #ef4444; font-size: 12px; margin-top: 4px` |
| Disabled | `opacity: 0.4; cursor: not-allowed; background: var(--gray-50)` |

**Required label** (`*`): `font-weight: 600; color: var(--gray-800)` — bolder than optional labels
**Optional label**: `font-weight: 400; color: var(--gray-600)`

#### Parent Department Select
- Native `<select>` element, styled with `dm-form-field` classes
- Options: "None (top-level)" + all existing departments
- When editing: current dept and its children excluded from options (cannot be its own parent)
- Hint text: `ⓘ Leave empty for a root department.` — `font-size: 12px; color: var(--gray-400); margin-top: 4px`

#### Submit Button (`[Create]` / `[Save Changes]`)
| State | Spec |
|-------|------|
| Default | primary filled — `background: var(--primary-color); color: #fff` |
| Loading | spinner `adm-spinner` replaces text, button `disabled` |
| Success | panel closes, list refreshes with `fadeIn` on new/updated row |
| Error | panel stays open, error toast or inline field error |

#### Cancel Button
| State | Spec |
|-------|------|
| Default | ghost: `background: transparent; border: 1px solid var(--border-light); color: var(--gray-700); height: 36px; padding: 0 16px; border-radius: var(--radius-md)` |
| Hover | `border-color: var(--gray-400); background: var(--gray-50)` |
| Active | `transform: scale(0.97)` |

---

#### Layout Wireframe — Assign Head Panel (380px)

```
                                   ┌──────────────────────────────────────┐
                                   │ dm-head-panel                        │
                                   │ [×]  Assign Head — Engineering       │
                                   ├──────────────────────────────────────┤
                                   │                                      │
                                   │  Current Head                        │
                                   │  ┌──────────────────────────────┐   │
                                   │  │ ◉ Aqil Z. — Head of Company  │   │
                                   │  └──────────────────────────────┘   │
                                   │                   [Remove Head]      │
                                   │                                      │
                                   │  ─────────────────────────────────  │
                                   │                                      │
                                   │  Assign New Head                     │
                                   │  ┌──────────────────────────────┐   │
                                   │  │ 🔍 Search users...            │   │
                                   │  └──────────────────────────────┘   │
                                   │  ┌──────────────────────────────┐   │
                                   │  │ ○ Leyla M. — CFO             │   │
                                   │  │ ○ Rəşad Ə. — Tech Lead       │   │
                                   │  │ ● Aysel H. — Frontend Lead   │   │← selected
                                   │  └──────────────────────────────┘   │
                                   │                                      │
                                   │                      [Assign]        │
                                   └──────────────────────────────────────┘
```

**Notes:**
- "Current Head" section: only shown if head exists — hidden otherwise
- Divider (`─────`) separates current head from new assignment
- Panel title shows department name: "Assign Head — [DeptName]"

### Interaction States — Assign Head Panel

#### Current Head Row (`dm-current-head`)
| State | Spec |
|-------|------|
| Default | `display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); border-radius: var(--radius-md); padding: 8px 12px` |
| Avatar | 32px circle, initials, hash-based color |
| Name | `font-size: 13px; font-weight: 600; color: var(--gray-800)` |
| Position | `font-size: 11px; color: var(--gray-400)` |

#### "Remove Head" Button
| State | Spec |
|-------|------|
| Default | ghost-danger: `background: transparent; border: 1px solid #ef4444; color: #ef4444; height: 30px; padding: 0 12px; border-radius: var(--radius-md); font-size: 13px` |
| Hover | `background: rgba(239,68,68,0.06)` |
| Active | `transform: scale(0.97)` |
| Loading | spinner, disabled |

#### User List Row (`dm-user-pick-row`)
| State | Spec |
|-------|------|
| Default | `height: 44px; padding: 0 12px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border-light); cursor: pointer` |
| Hover | `background: #f5f7fa` |
| Selected | `background: rgba(47,198,246,0.08); border-left: 3px solid var(--primary-color)` |
| No results | "No users found." centered, `color: var(--gray-400); font-style: italic` |

#### "[Assign]" Button
| State | Spec |
|-------|------|
| Disabled (no selection) | `opacity: 0.4; cursor: not-allowed` |
| Active (user selected) | `background: var(--primary-color); color: #fff` — full opacity, clickable |
| Loading | spinner, disabled |
| Success | panel closes, head cell in table updates immediately |

---

## 3. Position Management Section

### Component: PositionManagement (`pm-*`)

---

#### Layout Wireframe — List View

```
┌───────────────────────────────────────────────────────────────────────────┐
│  pm-section                                                                │
│  pm-section-header                                                         │
│  Positions  [24]                                       [+ New Position]    │
├───────────────────────────────────────────────────────────────────────────┤
│  pm-toolbar                                                                │
│  ┌───────────────────────────┐  ┌─────────────────────────────────────┐   │
│  │ 🔍 Search positions...    │  │ All Departments ▾                   │   │
│  └───────────────────────────┘  └─────────────────────────────────────┘   │
├─────────────────────────────────┬─────────────────────────┬───────────────┤
│ pm-th  Position Name            │ Department              │ Actions       │
├─────────────────────────────────┼─────────────────────────┼───────────────┤
│ CEO                             │ —                       │ •••           │
│ Tech Lead                       │ Engineering             │ •••           │
│ Frontend Developer              │ Frontend                │ •••           │
│ CFO                             │ Finance                 │ •••           │
│ HR Specialist                   │ HR                      │ •••           │
├─────────────────────────────────┴─────────────────────────┴───────────────┤
│  (load more button if > 30 items)                                          │
└───────────────────────────────────────────────────────────────────────────┘
```

---

### Interaction States — Position List

#### Table Row (`pm-row`)
| State | Spec |
|-------|------|
| Default | `background: var(--white); border-bottom: 1px solid var(--border-light); height: 48px; padding: 0 16px` |
| Hover | `background: #f5f7fa` — 150ms |
| Loading | skeleton rows, shimmer |
| Empty | icon (briefcase-off), "No positions yet.", CTA "→ Create your first position" |

#### Department Cell (`pm-dept-cell`)
| State | Spec |
|-------|------|
| Has department | department name tag: `background: var(--gray-100); color: var(--gray-600); font-size: 12px; padding: 2px 8px; border-radius: var(--radius-md)` — subtle badge |
| No department | `—` em dash, `color: var(--gray-300)` |

**Note**: Department badge uses `border-radius: var(--radius-md)` (8px, rectangular) — NOT pill shape. Intentionally different from role badges.

#### Department Filter Dropdown (`pm-dept-filter`)
| State | Spec |
|-------|------|
| Default | `border: 1px solid var(--border-light); border-radius: var(--radius-md); height: 36px; padding: 0 12px; background: var(--white); font-size: 13px` |
| Focus | `border-color: var(--primary-color); outline: 2px solid rgba(47,198,246,0.25)` |
| Active value | `border-color: var(--primary-color); background: rgba(47,198,246,0.05)` |

Options:
1. All Departments ← default
2. No Department ← positions without dept
3. [list of all departments]

#### Actions Dropdown — Position
**Items:**
1. Edit
2. Delete — disabled + tooltip if position has employees

#### Column Sort Headers (`pm-th`)
| State | Spec |
|-------|------|
| Default | `font-weight: 400; font-size: 12px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em` — lighter than row data |
| Sortable (Name) | `cursor: pointer` + `↕` arrow |
| Sort ASC | `↑` `color: var(--primary-color)` |
| Sort DESC | `↓` `color: var(--primary-color)` |
| Hover | `color: var(--gray-700)` |

---

#### Layout Wireframe — Position Form Panel (420px)

```
                                   ┌──────────────────────────────────────┐
                                   │ pm-form-panel                        │
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
                                   │  │                              │   │
                                   │  └──────────────────────────────┘   │
                                   │                                      │
                                   │        [Cancel]  [Create]           │
                                   └──────────────────────────────────────┘
```

**Panel behavior**: identical to Department Form Panel — `ap-panel-in` slide animation, 420px, `height: 100vh`.

### Interaction States — Position Form Panel

#### Position Name Field
Same as `dm-form-field` — default, focus, error, disabled states.

#### Department Select
- Native `<select>`, options: "No Department (company-wide)" + all departments
- Optional field — no `*` marker
- Hint text: `ⓘ Leave empty for company-wide positions (CEO, CTO, etc.)` — `font-size: 12px; color: var(--gray-400)`

#### Description Textarea
| State | Spec |
|-------|------|
| Default | `border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 10px 12px; font-size: 14px; resize: vertical; min-height: 72px; font-family: inherit` |
| Focus | `border-color: var(--primary-color); outline: 2px solid rgba(47,198,246,0.25)` |

#### Submit / Cancel Buttons
Same spec as Department Form Panel buttons.

---

## 4. Shared States — Both Sections

### Skeleton Loading Rows
```css
/* Requires adm-shimmer from admin-shared.css */
.dm-skeleton-row,
.pm-skeleton-row {
  height: 48px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--border-light);
}

.dm-skeleton-bar {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: adm-shimmer 1.2s infinite;
}
```
3 skeleton rows on initial load. Remove on data arrival.

### Empty State
```
         [icon — 32px, color: var(--gray-300)]
         No departments yet.
         [→ Create your first department]   ← primary button
```
- Icon: centered, `margin-bottom: 8px`
- Message: `font-size: 14px; color: var(--gray-500); margin-bottom: 12px`
- CTA button: primary style, same as section "+ New" button

### Text Overflow
All name cells: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` + `title` attribute on element for native tooltip.

---

## 5. CSS Class Naming Conventions

```
Department Management:   dm-*
  dm-section             — root container
  dm-section-header      — title + count + new button row
  dm-toolbar             — search bar
  dm-table               — <table>
  dm-th                  — table header cells
  dm-row                 — root dept row
  dm-row--child          — child dept row (BEM modifier)
  dm-tree-prefix         — "├ " / "└ " tree characters
  dm-name-cell           — name column cell
  dm-head-cell           — head column cell
  dm-form-panel          — create/edit slide panel
  dm-head-panel          — assign head slide panel
  dm-current-head        — current head display in assign panel
  dm-user-pick-row       — user row in search list
  dm-skeleton-row        — loading placeholder row
  dm-skeleton-bar        — shimmer bar within skeleton row

Position Management:     pm-*
  pm-section
  pm-section-header
  pm-toolbar
  pm-table
  pm-th
  pm-row
  pm-dept-cell           — department badge or dash
  pm-dept-badge          — tag-style badge for department name
  pm-form-panel
  pm-skeleton-row
  pm-skeleton-bar

Reused shared:           adm-*, ap-*
  adm-search             — search input with icon
  adm-actions-menu       — ••• dropdown
  adm-actions-item       — dropdown item
  adm-spinner            — loading spinner
  adm-empty-state        — empty state container
  ap-panel-in            — slide animation (from admin-shared.css)
  adm-dropdownIn         — dropdown animation (from admin-shared.css)
  adm-shimmer            — shimmer keyframe (from admin-shared.css)
```

---

## 6. Animation Specs

All animations defined in `admin-shared.css` (already specified in admin-panel review). Reuse — do not redefine locally:

```css
/* Reuse from admin-shared.css */
ap-panel-in     → Department / Position form panels (slide from right)
ap-panel-in     → Assign Head panel (same animation)
adm-dropdownIn  → ••• action menus
adm-shimmer     → skeleton loading bars
```

New keyframe needed — none. All animations covered by existing shared definitions.

---

## 7. Anti-AI Checklist

- [x] Child rows use LEFT padding (28px) + tree character (`├`/`└`) — NOT generic indent
- [x] "No head assigned" uses `—` em dash with `color: var(--gray-300)` — NOT empty string
- [x] Position "No Department" shown as `—` dash — badge only appears when dept IS set; two different visual treatments
- [x] Delete disabled state: button grayed (`opacity: 0.4`) + tooltip `title` attr — NOT just hidden
- [x] Form panels use `ap-panel-in` slide animation — NOT `modalIn`
- [x] Empty state has CTA button — NOT just text
- [x] Table headers `font-weight: 400` — lighter than row data (hierarchy inversion)
- [x] Department badge in Position table uses `border-radius: 8px` (rectangular tag) — NOT pill shape — different from role badges
- [x] Head assignment clickable only on `—` cell — does NOT trigger on assigned head click (no accidental re-assignment)
- [x] Section count badge `[12]` uses different style from role badges — `background: var(--gray-100)` neutral

---

## 8. Spacing Reference

| Element | Value |
|---------|-------|
| Section header font | 18px / weight 700 |
| Table row height | 48px |
| Child row indent | 28px additional left padding |
| Form panel width (both) | 420px |
| Assign Head panel width | 380px |
| Panel header height | 56px |
| Form field height | 38px |
| Button height | 36px |
| Skeleton bar height | 12px |
| Department badge padding | 2px 8px |
| Section count badge | 2px 8px, radius 20px (pill — neutral element, not a role badge) |

---

## 9. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Department with children — Delete | Delete disabled, tooltip: "Cannot delete — has sub-departments" |
| Department with employees — Delete | Delete disabled, tooltip: "Cannot delete — department has members" |
| Position with employees — Delete | Delete disabled, tooltip: "Cannot delete — position has members" |
| Editing dept — Parent dropdown | Current dept + its children excluded from options |
| Assign Head — current head shown | If head assigned: show current head section + Remove Head button |
| Assign Head — no current head | Current head section hidden; only "Assign New Head" shown |
| Search returns 0 results | Empty message inline: "No departments match your search." — no CTA (filter-state empty, not data-state empty) |

---

*Spec complete. Frontend Developer may begin implementation.*
