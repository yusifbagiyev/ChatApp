# Frontend Task: Department & Position Management Panels

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-26
**Priority**: P1 — Next feature after Admin Panel CSS fixes
**Wireframe**: `agents/uiux-developer/outputs/2026-03-26_wireframe_dept-position.md`
**CSS ref**: `agents/uiux-developer/outputs/2026-03-26_review_admin-panel.md`

---

## Context

Admin Panel already has Company Management and User Management panels. Now add two new sections:
- **Department Management** — CRUD + tree hierarchy view + head assignment
- **Position Management** — CRUD + department filter

Wireframe spec is fully detailed. Follow it exactly — do not improvise interaction states or layout.

---

## Backend API Endpoints (ready)

```
GET    /api/identity/departments              → list all (company-scoped by JWT)
POST   /api/identity/departments              → create
PUT    /api/identity/departments/{id}         → update
DELETE /api/identity/departments/{id}         → delete
POST   /api/identity/departments/{id}/assign-head   → assign head
DELETE /api/identity/departments/{id}/remove-head   → remove head

GET    /api/identity/positions                → list all (company-scoped)
POST   /api/identity/positions                → create
PUT    /api/identity/positions/{id}           → update
DELETE /api/identity/positions/{id}           → delete
GET    /api/identity/positions/department/{id} → positions by dept (optional, for filter)
```

All endpoints are protected — JWT bearer token required. Company isolation is server-side (JWT `companyId` claim).

**Request bodies:**

`POST /api/identity/departments`:
```json
{ "name": "string", "parentDepartmentId": "guid | null" }
```

`PUT /api/identity/departments/{id}`:
```json
{ "name": "string", "parentDepartmentId": "guid | null" }
```

`POST /api/identity/departments/{id}/assign-head`:
```json
{ "userId": "guid" }
```

`POST /api/identity/positions`:
```json
{ "name": "string", "departmentId": "guid | null", "description": "string | null" }
```

`PUT /api/identity/positions/{id}`:
```json
{ "name": "string", "departmentId": "guid | null", "description": "string | null" }
```

---

## Data Shapes

**Department DTO** (from API):
```js
{
  id: "guid",
  name: "string",
  parentDepartmentId: "guid | null",
  parentDepartmentName: "string | null",
  headOfDepartmentId: "guid | null",
  headOfDepartmentName: "string | null"
}
```

**Position DTO** (from API):
```js
{
  id: "guid",
  name: "string",
  description: "string | null",
  departmentId: "guid | null",
  departmentName: "string | null"
}
```

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/components/admin/DepartmentManagement.jsx` | Create — new component |
| `src/components/admin/DepartmentManagement.css` | Create — `dm-*` styles |
| `src/components/admin/PositionManagement.jsx` | Create — new component |
| `src/components/admin/PositionManagement.css` | Create — `pm-*` styles |
| `src/pages/AdminPanel.jsx` | Modify — add nav items + render new sections |
| `src/services/adminService.js` | Modify — add dept/position API calls |

---

## Step 1 — Admin Panel Nav

In `AdminPanel.jsx`, add two nav items after Users (visible to Admin + SuperAdmin — same access as Users):

```jsx
<button
  className={`ap-nav-item ${activeSection === 'departments' ? 'ap-nav-item--active' : ''}`}
  onClick={() => setActiveSection('departments')}
>
  <span className="ap-nav-icon">🏗</span>
  Departments
</button>

<button
  className={`ap-nav-item ${activeSection === 'positions' ? 'ap-nav-item--active' : ''}`}
  onClick={() => setActiveSection('positions')}
>
  <span className="ap-nav-icon">💼</span>
  Positions
</button>
```

Render the sections:
```jsx
{activeSection === 'departments' && <DepartmentManagement />}
{activeSection === 'positions' && <PositionManagement />}
```

Nav states from wireframe:
- Default: `color: var(--gray-600); border-left: 3px solid transparent`
- Hover: `background: var(--gray-100); color: var(--gray-900)`
- Active: `background: rgba(47,198,246,0.10); border-left-color: var(--primary-color); color: var(--primary-color); font-weight: 600`

---

## Step 2 — adminService.js additions

Add to `src/services/adminService.js`:

```js
// Departments
export const getDepartments = () => api.get('/identity/departments');
export const createDepartment = (data) => api.post('/identity/departments', data);
export const updateDepartment = (id, data) => api.put(`/identity/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/identity/departments/${id}`);
export const assignDepartmentHead = (id, userId) =>
  api.post(`/identity/departments/${id}/assign-head`, { userId });
export const removeDepartmentHead = (id) =>
  api.delete(`/identity/departments/${id}/remove-head`);

// Positions
export const getPositions = () => api.get('/identity/positions');
export const createPosition = (data) => api.post('/identity/positions', data);
export const updatePosition = (id, data) => api.put(`/identity/positions/${id}`, data);
export const deletePosition = (id) => api.delete(`/identity/positions/${id}`);
```

---

## Step 3 — DepartmentManagement Component

### State

```js
const [departments, setDepartments] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [panel, setPanel] = useState(null); // null | 'create' | 'edit' | 'assignHead'
const [selected, setSelected] = useState(null); // department being edited/assigned
```

### Tree Rendering

Departments come as a flat list from API. Sort and render with indentation:

```js
// Separate root and children
const roots = departments.filter(d => !d.parentDepartmentId);
const children = departments.filter(d => d.parentDepartmentId);

// Render: root first, then its children immediately after
const renderRows = () => {
  const rows = [];
  roots.forEach(root => {
    rows.push({ ...root, isChild: false });
    const childDepts = children.filter(c => c.parentDepartmentId === root.id);
    childDepts.forEach((child, i) => {
      const isLast = i === childDepts.length - 1;
      rows.push({ ...child, isChild: true, isLast });
    });
  });
  return rows;
};
```

Tree prefix rendering:
```jsx
{row.isChild && (
  <span className="dm-tree-prefix">
    {row.isLast ? '└' : '├'}
  </span>
)}
```

Child rows: `className="dm-row dm-row--child"` — `padding-left: 44px` (28px + 16px base).

### Head Cell

- If `headOfDepartmentName` is set: show avatar (initials) + name
- If null: show `—` (em dash) with `color: var(--gray-300)` — clicking the dash opens Assign Head panel
- Do NOT make the assigned head name clickable (no accidental re-assignment)

### Actions Dropdown

Context-dependent items:
- Always: **Edit**, **Delete**
- If `headOfDepartmentId` is null: **Assign Head**
- If `headOfDepartmentId` is set: **Remove Head** (instead of Assign Head)

Delete button disabled with `title` tooltip if department has members or children.
(MVP: check `departments.some(d => d.parentDepartmentId === dept.id)` for children client-side.
For members: disable based on API error response — if 400/409 returned on delete, show toast.)

### Search

Client-side filter (data already loaded):
```js
const filtered = search
  ? flatRows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
  : flatRows;
```
Debounce 300ms optional — data is local, no API call needed.

### Department Form Panel (420px)

Fields:
- **Department Name** (required, text input)
- **Parent Department** (native `<select>`)
  - Options: "None (top-level)" + all existing departments
  - When editing: exclude current dept and its children from options

```jsx
<select value={form.parentDepartmentId || ''} onChange={...}>
  <option value="">None (top-level)</option>
  {availableParents.map(d => (
    <option key={d.id} value={d.id}>{d.name}</option>
  ))}
</select>
```

Hint: `ⓘ Leave empty for a root department.`

Panel behavior:
- `position: fixed; right: 0; top: 0; width: 420px; height: 100vh`
- `animation: ap-panel-in 200ms ease` (from `admin-shared.css`)
- Backdrop: `position: fixed; inset: 0; background: rgba(0,0,0,0.15); z-index: 999`
- Click backdrop → close panel

Buttons: `[Cancel]` (ghost) and `[Create]` / `[Save Changes]` (primary).

### Assign Head Panel (380px)

Same slide animation. Width 380px.

**"Current Head" section** — only shown if `selected.headOfDepartmentId` is not null:
```jsx
{selected?.headOfDepartmentId && (
  <div className="dm-current-head">
    <div className="dm-avatar">{initials(selected.headOfDepartmentName)}</div>
    <span>{selected.headOfDepartmentName}</span>
    <button className="dm-remove-head-btn" onClick={handleRemoveHead}>
      Remove Head
    </button>
  </div>
)}
```

**User search** — search company users (use existing `getUsers` from adminService or similar):
- 300ms debounce
- Filtered list of users — click to select, highlighted with `background: rgba(47,198,246,0.08); border-left: 3px solid var(--primary-color)`
- `[Assign]` button: disabled (opacity 0.4) until user selected, then active primary style

On success: close panel, refresh departments list.

---

## Step 4 — PositionManagement Component

### State

```js
const [positions, setPositions] = useState([]);
const [departments, setDepartments] = useState([]); // for filter + form select
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [deptFilter, setDeptFilter] = useState('all'); // 'all' | 'none' | dept.id
const [panel, setPanel] = useState(null); // null | 'create' | 'edit'
const [selected, setSelected] = useState(null);
```

### Toolbar

Two controls side by side:
1. Search input (`adm-search`) — filters `position.name` client-side
2. Department filter (`pm-dept-filter`) — native `<select>`:

```jsx
<select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
  <option value="all">All Departments</option>
  <option value="none">No Department</option>
  {departments.map(d => (
    <option key={d.id} value={d.id}>{d.name}</option>
  ))}
</select>
```

Filter logic:
```js
const filtered = positions
  .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  .filter(p => {
    if (deptFilter === 'all') return true;
    if (deptFilter === 'none') return !p.departmentId;
    return p.departmentId === deptFilter;
  });
```

### Department Cell (`pm-dept-cell`)

- Has department → badge: `<span className="pm-dept-badge">{p.departmentName}</span>`
  - Style: `background: var(--gray-100); color: var(--gray-600); font-size: 12px; padding: 2px 8px; border-radius: var(--radius-md)` — rectangular, NOT pill
- No department → `<span className="pm-dash">—</span>` with `color: var(--gray-300)`

### Position Form Panel (420px)

Fields:
- **Position Name** (required)
- **Department** (optional native `<select>` — "No Department (company-wide)" + all depts)
- **Description** (optional `<textarea>`, `min-height: 72px; resize: vertical`)

Hint under Department: `ⓘ Leave empty for company-wide positions (CEO, CTO, etc.)`

### Actions Dropdown

Items: **Edit**, **Delete**
Delete disabled + tooltip if position has members (handle via API error response).

---

## CSS Implementation

### DepartmentManagement.css

```css
@import '../admin/admin-shared.css';

/* Section */
.dm-section { ... }
.dm-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.dm-section-header h2 { font-size: 18px; font-weight: 700; color: var(--gray-800); }
.dm-count-badge { background: var(--gray-100); color: var(--gray-500); font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 20px; margin-left: 8px; }

/* Table */
.dm-table { width: 100%; border-collapse: collapse; }
.dm-th { font-weight: 400; font-size: 12px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 16px; text-align: left; border-bottom: 2px solid var(--border-light); }

/* Rows */
.dm-row { background: var(--white); border-bottom: 1px solid var(--border-light); height: 48px; }
.dm-row:hover { background: #f5f7fa; }
.dm-row td { padding: 0 16px; font-size: 14px; }
.dm-row--child td:first-child { padding-left: 44px; }

/* Tree prefix */
.dm-tree-prefix { color: var(--gray-300); margin-right: 6px; font-family: monospace; user-select: none; }

/* Name cell */
.dm-name-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dm-row:not(.dm-row--child) .dm-name-cell { font-weight: 600; color: var(--gray-800); }
.dm-row--child .dm-name-cell { font-weight: 500; color: var(--gray-700); }

/* Head cell */
.dm-head-cell { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-700); }
.dm-head-dash { color: var(--gray-300); font-style: italic; cursor: pointer; }
.dm-head-dash:hover { color: var(--primary-color); text-decoration: underline; }

/* Parent cell */
.dm-parent-dash { color: var(--gray-300); }
.dm-parent-name { color: var(--gray-500); font-size: 13px; }

/* Form panel */
.dm-form-panel,
.dm-head-panel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  background: var(--white);
  box-shadow: -4px 0 20px rgba(0,0,0,0.10);
  z-index: 1000;
  animation: ap-panel-in 200ms ease;
  overflow-y: auto;
}
.dm-form-panel { width: 420px; }
.dm-head-panel { width: 380px; }

.dm-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.15);
  z-index: 999;
}

/* Form fields */
.dm-form-field {
  width: 100%;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  height: 38px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--gray-700);
  box-sizing: border-box;
}
.dm-form-field:focus {
  border-color: var(--primary-color);
  outline: 2px solid rgba(47,198,246,0.25);
  outline-offset: -1px;
}
.dm-form-field.error { border-color: #ef4444; outline: 2px solid rgba(239,68,68,0.15); }

/* Assign head panel */
.dm-current-head {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 8px 12px;
}
.dm-remove-head-btn {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  cursor: pointer;
  margin-left: auto;
}
.dm-remove-head-btn:hover { background: rgba(239,68,68,0.06); }

.dm-user-pick-row {
  height: 44px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
}
.dm-user-pick-row:hover { background: #f5f7fa; }
.dm-user-pick-row.selected {
  background: rgba(47,198,246,0.08);
  border-left: 3px solid var(--primary-color);
}

/* Skeleton */
.dm-skeleton-row {
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

### PositionManagement.css

```css
@import '../admin/admin-shared.css';

.pm-section { ... }
.pm-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.pm-section-header h2 { font-size: 18px; font-weight: 700; color: var(--gray-800); }
.pm-count-badge { background: var(--gray-100); color: var(--gray-500); font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 20px; margin-left: 8px; }

.pm-toolbar { display: flex; gap: 12px; margin-bottom: 16px; }

.pm-table { width: 100%; border-collapse: collapse; }
.pm-th { font-weight: 400; font-size: 12px; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 16px; text-align: left; border-bottom: 2px solid var(--border-light); }
.pm-th.sortable { cursor: pointer; }
.pm-th.sortable:hover { color: var(--gray-700); }

.pm-row { background: var(--white); border-bottom: 1px solid var(--border-light); height: 48px; }
.pm-row:hover { background: #f5f7fa; }
.pm-row td { padding: 0 16px; font-size: 14px; }

/* Department badge — rectangular tag (NOT pill) */
.pm-dept-badge {
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: var(--radius-md); /* 8px — rectangular */
}
.pm-dash { color: var(--gray-300); }

/* Department filter */
.pm-dept-filter {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  height: 36px;
  padding: 0 12px;
  background: var(--white);
  font-size: 13px;
  color: var(--gray-700);
  cursor: pointer;
  min-width: 160px;
}
.pm-dept-filter:focus {
  border-color: var(--primary-color);
  outline: 2px solid rgba(47,198,246,0.25);
}

/* Form panel */
.pm-form-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 420px;
  height: 100vh;
  background: var(--white);
  box-shadow: -4px 0 20px rgba(0,0,0,0.10);
  z-index: 1000;
  animation: ap-panel-in 200ms ease;
  overflow-y: auto;
}

.pm-desc-textarea {
  width: 100%;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 72px;
  box-sizing: border-box;
}
.pm-desc-textarea:focus {
  border-color: var(--primary-color);
  outline: 2px solid rgba(47,198,246,0.25);
}

/* Skeleton */
.pm-skeleton-row {
  height: 48px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--border-light);
}
.pm-skeleton-bar {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f2f5 25%, #e8eaed 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: adm-shimmer 1.2s infinite;
}
```

---

## Anti-AI Checklist (must verify before done)

- [ ] Child rows use `padding-left: 44px` + `dm-tree-prefix` with `├`/`└` characters — NOT generic indent
- [ ] Head cell shows `—` with `color: var(--gray-300)` when unassigned — NOT empty cell
- [ ] `—` dash in head cell is clickable (opens Assign Head) — assigned head name is NOT clickable
- [ ] Position department badge: `border-radius: var(--radius-md)` (8px, rectangular) — NOT pill shape
- [ ] Delete disabled: `opacity: 0.4; cursor: not-allowed` + `title` attribute tooltip
- [ ] Both form panels use `ap-panel-in` animation — NOT `modalIn` or any other
- [ ] Empty state has CTA button (`[→ Create your first department]`) — NOT just text
- [ ] Table headers `font-weight: 400` — lighter than row data
- [ ] Count badge `[12]` uses `background: var(--gray-100)` — neutral style, NOT role badge style
- [ ] Search returns 0 → inline message "No departments match your search." — NO CTA button (filter-state empty, not data-state empty)

---

## Notes

- **No pagination for Departments** — load all at once (typically < 50 items per company)
- **Positions**: show "Load more" button if > 30 items
- **User search in Assign Head panel**: reuse existing company user list fetch (e.g. `getUsers` from adminService). Filter client-side by name.
- Import `admin-shared.css` via `@import` — do NOT redefine `ap-panel-in`, `adm-shimmer`, `adm-dropdownIn` locally
- Reuse `adm-actions-menu`, `adm-actions-item`, `adm-search` classes from shared styles where applicable
- Avatar initials: first letter of first name + first letter of last name — background color from hash of name string
