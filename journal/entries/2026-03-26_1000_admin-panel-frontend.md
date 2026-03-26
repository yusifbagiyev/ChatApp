# Frontend Task: Admin Panel — Company & User Management

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-26
**Priority**: P0 — Super Admin and Admin users need management UI
**Backend APIs**: All ready and tested

---

## Objective

Build an Admin Panel page with two sections:
- **Company Management** — Super Admin only: create/edit/deactivate companies, assign admins
- **User Management** — Admin + Super Admin: create/edit/deactivate users, assign roles, manage supervisors

---

## Current Frontend State

- `AuthContext` stores `user` object from `GET /api/users/me` — role and companyId are in the response
- `api.js` has no company endpoints yet — must be added
- `Sidebar.jsx` has TODO buttons (Contacts, Channels, Settings) — Admin entry point goes here
- No admin pages exist — only `Login.jsx` and `Chat.jsx`
- CSS convention: component-prefix class names (e.g., `upp-*` for UserProfilePanel)
- All components use `memo()` for performance

---

## Step 1: Add Company API Functions to api.js

Add these functions to `chatapp-frontend/src/services/api.js`:

```js
// ─── Company API Functions ─────────────────────────────────────────────────
export const getCompanies = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/api/companies${query ? `?${query}` : ''}`);
};

export const getCompany = (companyId) =>
  apiGet(`/api/companies/${companyId}`);

export const createCompany = (data) =>
  apiPost('/api/companies', data);

export const updateCompany = (companyId, data) =>
  apiPut(`/api/companies/${companyId}`, data);

export const deleteCompany = (companyId) =>
  apiDelete(`/api/companies/${companyId}`);

export const assignCompanyAdmin = (companyId, userId) =>
  apiPost(`/api/companies/${companyId}/admin`, { userId });

// ─── User Management API Functions ────────────────────────────────────────
export const getUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/api/users${query ? `?${query}` : ''}`);
};

export const createUser = (data) =>
  apiPost('/api/users', data);

export const updateUser = (userId, data) =>
  apiPut(`/api/users/${userId}`, data);

export const deleteUser = (userId) =>
  apiDelete(`/api/users/${userId}`);

export const getSupervisors = (userId) =>
  apiGet(`/api/users/${userId}/supervisors`);

export const addSupervisor = (userId, supervisorId) =>
  apiPost(`/api/users/${userId}/supervisors`, { supervisorId });

export const removeSupervisor = (userId, supervisorId) =>
  apiDelete(`/api/users/${userId}/supervisors/${supervisorId}`);
```

---

## Step 2: Add Route to App.jsx

Add protected `/admin` route. Admin Panel requires `Admin` or `SuperAdmin` role.

**Current App.jsx pattern:**
```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
</Routes>
```

**Updated:**
```jsx
import AdminPanel from "./pages/AdminPanel";

<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
  <Route path="/admin" element={
    <ProtectedRoute requireRole={['Admin', 'SuperAdmin']}>
      <AdminPanel />
    </ProtectedRoute>
  } />
</Routes>
```

**Update ProtectedRoute** to support `requireRole` prop:
```jsx
function ProtectedRoute({ children, requireRole }) {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (requireRole && !requireRole.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}
```

---

## Step 3: Add Admin Button to Sidebar

**File**: `chatapp-frontend/src/components/Sidebar.jsx`

Add `user` prop and `onAdminPanel` prop. Show admin button only for Admin/SuperAdmin:

```jsx
function Sidebar({ onLogout, onAdminPanel, user }) {
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdmin = user?.role === 'Admin' || isSuperAdmin;

  return (
    <aside className="sidebar">
      {/* ... existing logo ... */}

      <nav className="sidebar-nav">
        {/* ... existing nav buttons ... */}

        {/* Admin Panel — yalnız Admin/SuperAdmin üçün görünür */}
        {isAdmin && (
          <button
            className="nav-item"
            title="Admin Panel"
            aria-label="Admin Panel"
            onClick={onAdminPanel}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </button>
        )}
      </nav>

      {/* ... existing logout button ... */}
    </aside>
  );
}
```

In `Chat.jsx`, pass `user` and `onAdminPanel` to Sidebar:
```jsx
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

<Sidebar
  onLogout={handleLogout}
  user={currentUser}
  onAdminPanel={() => navigate('/admin')}
/>
```

---

## Step 4: Create AdminPanel Page

**File**: `chatapp-frontend/src/pages/AdminPanel.jsx`

Two-column layout:
- Left: navigation (Companies, Users)
- Right: content area (renders the active section)

```jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CompanyManagement from '../components/admin/CompanyManagement';
import UserManagement from '../components/admin/UserManagement';
import './AdminPanel.css';

function AdminPanel() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'SuperAdmin';

  // SuperAdmin: default section = 'companies', Admin: default = 'users'
  const [activeSection, setActiveSection] = useState(
    isSuperAdmin ? 'companies' : 'users'
  );

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <button className="admin-back-btn" onClick={() => navigate('/')}>
          ← Back to Chat
        </button>
        <h1 className="admin-title">Admin Panel</h1>
        <span className="admin-role-badge">{user?.role}</span>
      </div>

      <div className="admin-body">
        {/* Sol navigasiya */}
        <nav className="admin-nav">
          {isSuperAdmin && (
            <button
              className={`admin-nav-item ${activeSection === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveSection('companies')}
            >
              Companies
            </button>
          )}
          <button
            className={`admin-nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSection('users')}
          >
            Users
          </button>
        </nav>

        {/* Sağ content */}
        <main className="admin-content">
          {activeSection === 'companies' && isSuperAdmin && <CompanyManagement />}
          {activeSection === 'users' && <UserManagement />}
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
```

---

## Step 5: Create CompanyManagement Component

**File**: `chatapp-frontend/src/components/admin/CompanyManagement.jsx`

Features:
- Company list (table) with search
- Create/Edit company form (right panel or modal)
- Activate/Deactivate toggle
- Assign Admin button

**Key UI elements:**
```
┌─────────────────────────────────────────────┐
│ Companies                    [+ New Company] │
│ Search: [___________________]                │
├──────────┬──────────┬────────┬──────────────┤
│ Name     │ Admin    │ Users  │ Status       │
├──────────┼──────────┼────────┼──────────────┤
│ 166 Log… │ Aqil Z.  │ 61     │ ● Active     │
│ ...      │ ...      │ ...    │ ○ Inactive   │
└──────────┴──────────┴────────┴──────────────┘
```

API calls to use:
- `getCompanies({ pageNumber, pageSize, searchTerm, isActive })`
- `createCompany({ name, description })`
- `updateCompany(id, { name, description, logoUrl })`
- `deleteCompany(id)` — soft delete (deactivate)
- `assignCompanyAdmin(companyId, userId)`

CSS class prefix: `cm-*` (e.g., `cm-table`, `cm-row`, `cm-form`)

---

## Step 6: Create UserManagement Component

**File**: `chatapp-frontend/src/components/admin/UserManagement.jsx`

Features:
- User list (table) with search + filter by department/status
- Create user form
- Edit user (name, email, department, position, role)
- Activate/Deactivate
- Supervisor assignment (many-to-many)
- Password reset

**Key UI elements:**
```
┌───────────────────────────────────────────────────┐
│ Users                              [+ New User]   │
│ Search: [___________] Dept: [All ▾] Status: [All] │
├──────────┬──────────┬────────────┬──────────┬─────┤
│ Name     │ Dept     │ Position   │ Role     │ Act │
├──────────┼──────────┼────────────┼──────────┼─────┤
│ Leyla M. │ Finance  │ CFO        │ Admin    │ ••• │
│ Rəşad Ə. │ Eng      │ Tech Lead  │ User     │ ••• │
└──────────┴──────────┴────────────┴──────────┴─────┘
```

API calls to use:
- `getUsers({ pageNumber, pageSize, searchTerm, departmentId, isActive })`
- `createUser({ firstName, lastName, email, password, role, departmentId, positionId })`
- `updateUser(id, { ... })`
- `activateUser(id)` / `deactivateUser(id)`
- `adminChangePassword(userId, newPassword, confirmNewPassword)` (already in api.js)
- `getDepartments()` (already in api.js)
- `getPositionsByDepartment(departmentId)` (already in api.js)
- `getSupervisors(userId)` / `addSupervisor(userId, supervisorId)` / `removeSupervisor(userId, supervisorId)`

CSS class prefix: `um-*`

---

## File Structure to Create

```
chatapp-frontend/src/
├── pages/
│   ├── AdminPanel.jsx          (new)
│   └── AdminPanel.css          (new)
├── components/
│   └── admin/
│       ├── CompanyManagement.jsx   (new)
│       ├── CompanyManagement.css   (new)
│       ├── UserManagement.jsx      (new)
│       └── UserManagement.css      (new)
```

---

## Design Guidelines (Bitrix24 Style)

- Background: `var(--bg-secondary)` (`#f0f2f5`) for page, `var(--white)` for panels
- Tables: clean rows, hover highlight `#f5f7fa`, border `1px solid var(--border-light)`
- Buttons: primary `var(--primary-color)` (`#2fc6f6`), danger `#ff4d4f`
- Status badges: green dot for active, grey dot for inactive
- Forms: right-side slide panel (like DetailSidebar pattern)
- Row actions: `•••` (three dots) dropdown menu — Edit, Activate/Deactivate, Assign Admin
- Consistent border-radius: `var(--radius-md)` (`8px`)
- No inline styles — all CSS classes

---

## Acceptance Criteria

- [ ] `/admin` route exists and is protected (Admin/SuperAdmin only)
- [ ] Sidebar shows Admin button for Admin/SuperAdmin users
- [ ] SuperAdmin sees Companies section + Users section
- [ ] Admin sees only Users section (scoped to own company)
- [ ] Company list loads with search and pagination
- [ ] Create company form works (name, description, logo upload)
- [ ] Edit company works
- [ ] Deactivate company works
- [ ] Assign company admin works (user picker)
- [ ] User list loads with search, department filter, status filter
- [ ] Create user works (all fields including department/position)
- [ ] Edit user works
- [ ] Activate/Deactivate user works
- [ ] Password reset works
- [ ] Supervisor assignment works (add/remove multiple)
- [ ] Role change works (SuperAdmin → Admin, Admin → User)
- [ ] No console errors
- [ ] Consistent Bitrix24 style

---

## Notes

- `user.role` values from backend: `"User"`, `"Admin"`, `"SuperAdmin"` (string)
- Admin cannot create other Admins — role dropdown shows only "User"
- SuperAdmin can assign "Admin" role
- For company logo upload: use existing `apiUpload` to `/api/files/upload` then save URL
- Pagination: use `pageNumber` + `pageSize` params, show "Load more" or page controls
- Form validation: required fields highlighted, no empty submissions
