# Frontend Task: Users Page Full Redesign

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-27
**Priority**: P1
**Wireframe**: `agents/uiux-developer/outputs/2026-03-27_wireframe_users-page.md`
**Backend fix**: `journal/entries/2026-03-27_0900_hierarchy-fix-backend.md` (backend tamamladıqdan sonra test et)

---

## Xülasə

`HierarchyView.jsx` tamamilə yenidən yazılır. Wireframe-dəki bütün CSS və davranış spesifikasiyalarına əməl et.

---

## Ediləcək İşlər

1. `HierarchyView.jsx` — tam rewrite (aşağıdakı spec-ə görə)
2. `HierarchyView.css` — wireframe-dəki bütün CSS class-ları
3. `api.js` — user action-lar üçün əlavələr
4. `AdminPanel.jsx` — dəyişmir (Users artıq hər iki rol üçün görünür)

---

## API Funksiyaları

`api.js`-də mövcud olanlar saxla. Əksəriyyəti artıq var. Yoxla:

```js
getOrganizationHierarchy(companyId)  // mövcud
getUsers(params)                      // mövcud
updateUser(id, data)                  // mövcud
deleteUser(id)                        // mövcud
activateUser(id)                      // mövcud
deactivateUser(id)                    // mövcud
adminChangePassword(id, pwd, confirmPwd) // mövcud
getUserById(id)                       // yoxdursa əlavə et: apiGet(`/api/users/${id}`)
getDepartments()                      // mövcud
```

---

## HierarchyView — Komponent Strukturu

```
HierarchyView
├── toolbar (başlıq + search)
├── hi-tree
│   ├── CompanyNode (SuperAdmin üçün) — expand/collapse
│   │   └── DeptNode (rekursiv)
│   │       └── UserRow
│   └── DeptNode (Admin üçün — company layer-siz)
│       └── UserRow
├── UserDetailPanel (seçilmiş user)
└── DeptDetailPanel (seçilmiş dept)
```

---

## State

```js
const [tree, setTree] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [collapsed, setCollapsed] = useState(new Set()); // collapsed node id-ləri
const [selectedUser, setSelectedUser] = useState(null); // detail panel
const [selectedDept, setSelectedDept] = useState(null); // detail panel
const [deletingId, setDeletingId] = useState(null);     // inline confirm state
const [openDropdown, setOpenDropdown] = useState(null); // ••• açıq olan user id
```

---

## Partial Update Prinsipi

**Əməliyyatdan sonra bütün tree yenilənmir.** Yalnız dəyişən node yenilənir:

```js
// User activate/deactivate — yalnız həmin user-i yenilə
const updateUserInTree = (userId, changes) => {
  setTree(prev => updateNodeInTree(prev, userId, changes));
};

// Rekursiv helper
function updateNodeInTree(nodes, userId, changes) {
  return nodes.map(node => {
    if (node.type === "User" && node.id === userId)
      return { ...node, ...changes };
    if (node.children?.length)
      return { ...node, children: updateNodeInTree(node.children, userId, changes) };
    return node;
  });
};
```

Delete: həmin user-i tree-dən çıxar:
```js
const removeUserFromTree = (userId) => {
  setTree(prev => removeNodeFromTree(prev, userId));
};

function removeNodeFromTree(nodes, userId) {
  return nodes
    .filter(n => !(n.type === "User" && n.id === userId))
    .map(n => n.children?.length
      ? { ...n, children: removeNodeFromTree(n.children, userId) }
      : n);
}
```

---

## CompanyNode Komponenti

```jsx
function CompanyNode({ node, isSuperAdmin }) {
  const isExpanded = !collapsed.has(node.id);

  return (
    <div className={`hi-company-node ${isExpanded ? "expanded" : "collapsed"}`}>
      <div className="hi-company-header" onClick={() => toggleCollapse(node.id)}>
        <svg className="hi-chevron" width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <div className="hi-company-logo"
          style={{ background: node.avatarUrl ? "transparent" : getAvatarColor(node.name) }}>
          {node.avatarUrl
            ? <img src={getFileUrl(node.avatarUrl)} alt="" />
            : getInitials(node.name)}
        </div>
        <span className="hi-company-name">{node.name}</span>
        {node.headOfDepartmentName && (
          <span className="hi-company-head">Head: {node.headOfDepartmentName}</span>
        )}
        <span className="hi-company-count">{countUsers(node)} users</span>
      </div>

      {isExpanded && (
        <div className="hi-company-children">
          {node.children.map(child => renderTreeNode(child, 1))}
        </div>
      )}
    </div>
  );
}
```

---

## DeptNode Komponenti

```jsx
function DeptNode({ node, level }) {
  const isExpanded = !collapsed.has(node.id);
  const indent = level * 24 + 16;
  const hasChildren = node.children?.length > 0;

  return (
    <div className="hi-dept-wrapper">
      <div
        className="hi-dept-node"
        style={{ paddingLeft: indent, "--indent": `${indent}px` }}
        onClick={() => hasChildren && toggleCollapse(node.id)}
      >
        {hasChildren && (
          <svg className={`hi-chevron ${isExpanded ? "hi-chevron--open" : ""}`}
            width="10" height="10" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        )}
        <span className="hi-dept-icon">🏗</span>
        <span className="hi-dept-name">{node.name}</span>
        {node.headOfDepartmentName && (
          <span className="hi-dept-head-sub">· {node.headOfDepartmentName}</span>
        )}
        <span className="hi-dept-count">{node.userCount}</span>
        <button
          className="hi-dept-detail-btn"
          onClick={(e) => { e.stopPropagation(); setSelectedDept(node); }}
          title="Department details"
        >›</button>
      </div>

      {isExpanded && hasChildren && (
        <div className="hi-dept-children" style={{ "--indent": `${indent}px` }}>
          {node.children.map(child =>
            child.type === "Department"
              ? <DeptNode key={child.id} node={child} level={level + 1} />
              : <UserRow key={child.id} node={child} level={level + 1} />
          )}
        </div>
      )}
    </div>
  );
}
```

---

## UserRow Komponenti

```jsx
function UserRow({ node, level }) {
  const indent = level * 24 + 16;
  const isDeleting = deletingId === node.id;
  const isDropdownOpen = openDropdown === node.id;

  if (isDeleting) {
    return (
      <div className="hi-user-row hi-user-row--confirm" style={{ paddingLeft: indent }}>
        <span className="hi-delete-label">Delete {node.name}?</span>
        <button className="hi-delete-yes" onClick={() => handleDelete(node.id)}>
          Yes, delete
        </button>
        <button className="hi-delete-cancel" onClick={() => setDeletingId(null)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={`hi-user-row${node.isDepartmentHead ? " hi-user-row--head" : ""}${!node.isActive ? " hi-user-row--inactive" : ""}${isDropdownOpen ? " dropdown-open" : ""}`}
      style={{ paddingLeft: indent, "--indent": `${indent}px` }}
    >
      <div className="hi-avatar"
        style={{ background: node.avatarUrl ? "transparent" : getAvatarColor(node.name) }}>
        {node.avatarUrl
          ? <img src={getFileUrl(node.avatarUrl)} alt="" />
          : getInitials(node.name)}
      </div>

      <span className="hi-user-name" onClick={() => setSelectedUser(node)}>
        {node.name}
      </span>

      {node.positionName && (
        <span className="hi-user-position">{node.positionName}</span>
      )}

      <span className={`hi-role-badge ${node.role?.toLowerCase()}`}>{node.role}</span>

      {node.isDepartmentHead && (
        <span className="hi-head-badge">HEAD</span>
      )}

      {/* Action shortcuts */}
      <div className="hi-actions">
        {/* Edit */}
        <button className="hi-action-btn edit" title="Edit user"
          onClick={() => handleEditUser(node)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>

        {/* Activate/Deactivate toggle */}
        <button
          className={`hi-action-btn toggle ${node.isActive ? "is-active" : "is-inactive"}`}
          title={node.isActive ? "Deactivate user" : "Activate user"}
          onClick={() => handleToggleActive(node)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </button>

        {/* More ••• */}
        <div style={{ position: "relative" }}>
          <button className="hi-action-btn more"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(isDropdownOpen ? null : node.id); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>

          {isDropdownOpen && (
            <>
              <div className="hi-dropdown-overlay" onClick={() => setOpenDropdown(null)} />
              <div className="hi-action-dropdown">
                <button className="hi-dropdown-item" onClick={() => { setOpenDropdown(null); handleEditUser(node); }}>
                  ✏ Edit
                </button>
                <button className="hi-dropdown-item" onClick={() => { setOpenDropdown(null); handleResetPassword(node); }}>
                  🔑 Reset Password
                </button>
                {node.isActive
                  ? <button className="hi-dropdown-item" onClick={() => { setOpenDropdown(null); handleToggleActive(node); }}>✗ Deactivate</button>
                  : <button className="hi-dropdown-item" onClick={() => { setOpenDropdown(null); handleToggleActive(node); }}>✓ Activate</button>
                }
                <div className="hi-dropdown-divider" />
                <button className="hi-dropdown-item danger"
                  onClick={() => { setOpenDropdown(null); setDeletingId(node.id); }}>
                  🗑 Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Action Handlers

```js
const handleToggleActive = async (node) => {
  // Optimistic update
  updateUserInTree(node.id, { isActive: !node.isActive });
  try {
    if (node.isActive) await deactivateUser(node.id);
    else await activateUser(node.id);
  } catch {
    // Revert on error
    updateUserInTree(node.id, { isActive: node.isActive });
    showToast("Action failed", "error");
  }
};

const handleDelete = async (userId) => {
  try {
    await deleteUser(userId);
    removeUserFromTree(userId);
    setDeletingId(null);
    showToast("User deleted", "success");
  } catch (err) {
    setDeletingId(null);
    showToast(err.message || "Delete failed", "error");
  }
};

const handleResetPassword = (node) => {
  // Mövcud UserManagement-dəki reset password panel-ini aç
  // Və ya sadə prompt ilə yeni şifrə al
  // TODO: ayrıca tapşırıq kimi işlənəcək
};

const handleEditUser = (node) => {
  // Mövcud UserManagement edit panel-ini istifadə et
  // Yaxud HierarchyView-daxili edit panel yarat
};
```

---

## User Detail Panel

Slide panel (440px) — click on user name açır.

```jsx
{selectedUser && (
  <>
    <div className="hi-panel-overlay" onClick={() => setSelectedUser(null)} />
    <div className="hi-user-detail-panel">
      {/* Hero section */}
      <div className="hi-detail-hero">
        <button className="hi-detail-close" onClick={() => setSelectedUser(null)}>×</button>
        <div className="hi-detail-avatar-wrap">
          <div className="hi-detail-avatar"
            style={{ background: selectedUser.avatarUrl ? "transparent" : getAvatarColor(selectedUser.name) }}>
            {selectedUser.avatarUrl
              ? <img src={getFileUrl(selectedUser.avatarUrl)} alt="" />
              : getInitials(selectedUser.name)}
          </div>
          <span className={`hi-detail-status-dot ${selectedUser.isActive ? "active" : "inactive"}`} />
        </div>
        <div className="hi-detail-hero-name">{selectedUser.name}</div>
        {selectedUser.positionName && (
          <div className="hi-detail-hero-position">{selectedUser.positionName}</div>
        )}
        <span className={`hi-role-badge ${selectedUser.role?.toLowerCase()}`}>
          {selectedUser.role}
        </span>
      </div>

      {/* Body sections */}
      <div className="hi-detail-body">
        {selectedUser.email && (
          <div className="hi-detail-section">
            <div className="hi-detail-section-label">CONTACT</div>
            <div className="hi-detail-row">✉ {selectedUser.email}</div>
          </div>
        )}

        <div className="hi-detail-section">
          <div className="hi-detail-section-label">ORGANIZATION</div>
          {selectedUser.companyName && (
            <div className="hi-detail-row">🏢 {selectedUser.companyName}</div>
          )}
          {selectedUser.departmentName && (
            <div className="hi-detail-row">🏗 {selectedUser.departmentName}</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="hi-detail-footer">
        <button className="cm-btn cm-btn-primary" onClick={() => handleEditUser(selectedUser)}>
          ✏ Edit User
        </button>
        <button className="cm-btn cm-btn-ghost" onClick={() => handleResetPassword(selectedUser)}>
          Reset Password
        </button>
      </div>
    </div>
  </>
)}
```

**Not**: `selectedUser` node-undakı data tam deyil (hierarchy node yalnız `name`, `role`, `email`, `positionName`, `avatarUrl`-dir). Detail panel üçün əlavə data lazım olarsa `getUserById(selectedUser.id)` çağır.

---

## Department Detail Panel

Slide panel (400px) — `[›]` click-i açır.

```jsx
{selectedDept && (
  <>
    <div className="hi-panel-overlay" onClick={() => setSelectedDept(null)} />
    <div className="hi-dept-detail-panel">
      <div className="hi-detail-header">
        <h2>{selectedDept.name}</h2>
        <button onClick={() => setSelectedDept(null)}>×</button>
      </div>
      <div className="hi-detail-body">
        {selectedDept.headOfDepartmentName && (
          <div className="hi-detail-section">
            <div className="hi-detail-section-label">HEAD</div>
            <div className="hi-detail-row">👤 {selectedDept.headOfDepartmentName}</div>
          </div>
        )}
        <div className="hi-detail-section">
          <div className="hi-detail-section-label">MEMBERS</div>
          {selectedDept.children
            ?.filter(c => c.type === "User")
            .map(u => (
              <div key={u.id} className="hi-detail-member-row">
                <div className="hi-avatar" style={{ width: 24, height: 24, fontSize: 9, background: getAvatarColor(u.name) }}>
                  {getInitials(u.name)}
                </div>
                <span>{u.name}</span>
                {u.positionName && <span className="hi-user-position">{u.positionName}</span>}
                {u.isDepartmentHead && <span className="hi-head-badge">HEAD</span>}
              </div>
            ))}
        </div>
      </div>
    </div>
  </>
)}
```

---

## "No Department" Section

Üst-level (company altında) departamentsiz userlər üçün:

```jsx
// Admin view-da tree flatmap-dən gəlirsə:
const noDeptUsers = nodes.filter(n => n.type === "User");
const depts = nodes.filter(n => n.type === "Department");

// Render:
{depts.map(d => <DeptNode key={d.id} node={d} level={0} />)}
{noDeptUsers.length > 0 && (
  <div>
    <div className="hi-no-dept-header">(No department)</div>
    {noDeptUsers.map(u => <UserRow key={u.id} node={u} level={0} />)}
  </div>
)}
```

---

## Search

Client-side, 300ms debounce:

```js
const debouncedSearch = useCallback(
  debounce((val) => setSearch(val), 300),
  []
);
```

Filter recursive:
```js
function filterTree(nodes, query) {
  return nodes.reduce((acc, node) => {
    const match = node.name?.toLowerCase().includes(query);
    const filteredChildren = node.children?.length
      ? filterTree(node.children, query)
      : [];
    if (match || filteredChildren.length > 0)
      acc.push({ ...node, children: filteredChildren });
    return acc;
  }, []);
}
```

---

## CSS

Wireframe-dəki bütün CSS class-larını `HierarchyView.css`-ə yaz. Bütün spesifikasiya `agents/uiux-developer/outputs/2026-03-27_wireframe_users-page.md`-dədir.

Xülasə class-lar:
```
hi-tree, hi-company-node, hi-company-header, hi-company-logo
hi-company-name, hi-company-head, hi-company-count, hi-company-children
hi-dept-node, hi-dept-name, hi-dept-head-sub, hi-dept-count, hi-dept-detail-btn
hi-user-row, hi-user-row--head, hi-user-row--inactive, hi-user-row--confirm
hi-avatar, hi-user-name, hi-user-position
hi-role-badge (+ .admin, .user, .superadmin)
hi-head-badge
hi-actions, hi-action-btn (+ .edit, .toggle, .more)
hi-action-dropdown, hi-dropdown-item, hi-dropdown-divider
hi-delete-confirm, hi-delete-label, hi-delete-yes, hi-delete-cancel
hi-no-dept-header
hi-chevron, hi-chevron--open
hi-user-detail-panel, hi-dept-detail-panel
hi-detail-hero, hi-detail-body, hi-detail-footer
hi-detail-section, hi-detail-section-label, hi-detail-row
hi-panel-overlay, hi-dropdown-overlay
```

`ap-panel-in` animasiyası — `admin-shared.css`-dən. Yenidən yaratma.

---

## Anti-AI Checklist

- [ ] Action butonları: `opacity: 0` default, yalnız hover-da `opacity: 1`
- [ ] `⚡` toggle: user `isActive` statusuna görə rəng fərqlənir (yaşıl/boz)
- [ ] Delete: inline confirm (row içində) — modal deyil
- [ ] `[›]` dept detail: `e.stopPropagation()` — expand/collapse trigger etmir
- [ ] Partial update: activate/deactivate/delete → tree tam yenilənmir
- [ ] "No department" section: dept node kimi deyil — chevron yox, clickable deyil
- [ ] User name click → detail panel; row click → heç nə (yalnız hover)
- [ ] SuperAdmin: company node-lar default expanded
- [ ] Admin: company node yox, birbaşa dept-lər
- [ ] `ap-panel-out` animasiyası panel bağlananda (əgər wireframe spesifikasiya edirsə)
