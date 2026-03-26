import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  assignDepartmentHead, removeDepartmentHead, getUsers,
} from "../../services/api";
import { getInitials, getAvatarColor } from "../../utils/chatUtils";
import "./DepartmentManagement.css";

// Flat list-i tree sırasına çevir (depth-first, isLast flag ilə)
function buildTreeRows(depts) {
  const childrenOf = {};
  depts.forEach(d => {
    const pid = d.parentDepartmentId ?? "__root__";
    if (!childrenOf[pid]) childrenOf[pid] = [];
    childrenOf[pid].push(d);
  });
  const rows = [];
  function walk(node, isLast) {
    rows.push({ ...node, isLast });
    (childrenOf[node.id] ?? []).forEach((child, i, arr) => walk(child, i === arr.length - 1));
  }
  (childrenOf["__root__"] ?? []).forEach((d, i, arr) => walk(d, i === arr.length - 1));
  return rows;
}

// ─── DepartmentRow (memoized) ─────────────────────────────────────────────────
const DepartmentRow = memo(function DepartmentRow({
  row, openMenuId, setOpenMenuId, onEdit, onHead, onDelete, canDelete,
}) {
  const isChild = !!row.parentDepartmentId;

  return (
    <tr className={`dm-row${isChild ? " dm-row--child" : ""}`}>
      <td>
        <div className="dm-name-cell" style={isChild ? { paddingLeft: "28px" } : {}}>
          {isChild && (
            <span className="dm-tree-prefix">{row.isLast ? "└" : "├"}</span>
          )}
          <span className={isChild ? "dm-name-child" : "dm-name-root"} title={row.name}>
            {row.name}
          </span>
        </div>
      </td>
      <td>
        {row.headOfDepartmentId ? (
          <div className="dm-head-cell--assigned">
            <div className="dm-head-avatar-sm" style={{ background: getAvatarColor(row.headOfDepartmentName ?? "") }}>
              {getInitials(row.headOfDepartmentName ?? "")}
            </div>
            <span>{row.headOfDepartmentName}</span>
          </div>
        ) : (
          <span className="dm-head-cell--empty" onClick={() => onHead(row)} title="Click to assign head">
            —
          </span>
        )}
      </td>
      <td>
        {row.parentDepartmentId
          ? <span className="dm-parent-name">{row.parentDepartmentName}</span>
          : <span className="dm-cell-muted">—</span>
        }
      </td>
      <td className="dm-actions-cell">
        <div className="dm-menu-wrap">
          <button
            className="dm-menu-btn"
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
          >•••</button>
          {openMenuId === row.id && (
            <>
              <div className="dm-menu-overlay" onClick={() => setOpenMenuId(null)} />
              <div className="dm-menu">
                <button className="dm-menu-item" onClick={() => onEdit(row)}>Edit</button>
                {row.headOfDepartmentId
                  ? <button className="dm-menu-item" onClick={() => onHead(row)}>Assign Head</button>
                  : <button className="dm-menu-item" onClick={() => onHead(row)}>Assign Head</button>
                }
                <button
                  className="dm-menu-item danger"
                  onClick={() => canDelete && onDelete(row)}
                  disabled={!canDelete}
                  title={!canDelete ? "Cannot delete — has sub-departments" : undefined}
                  style={!canDelete ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                >Delete</button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

// ─── DepartmentManagement ─────────────────────────────────────────────────────
function DepartmentManagement() {
  const [depts, setDepts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  // panel: null | 'create' | 'edit' | 'head'
  const [panel, setPanel]           = useState(null);
  const [activeDept, setActiveDept] = useState(null);

  // Create/Edit form
  const [formName, setFormName]         = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formError, setFormError]       = useState("");
  const [saving, setSaving]             = useState(false);

  // Head panel
  const [users, setUsers]                 = useState([]);
  const [usersLoading, setUsersLoading]   = useState(false);
  const [headSearch, setHeadSearch]       = useState("");
  const [selectedHeadId, setSelectedHeadId] = useState(null);
  const [headSaving, setHeadSaving]       = useState(false);

  const loadDepts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepts(data ?? []);
    } catch (e) {
      console.error("Failed to load departments", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDepts(); }, [loadDepts]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await getUsers({ pageSize: 200 });
      setUsers(data?.items ?? (Array.isArray(data) ? data : []));
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const treeRows = useMemo(() => buildTreeRows(depts), [depts]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return treeRows;
    const q = search.toLowerCase();
    return treeRows.filter(r => r.name.toLowerCase().includes(q));
  }, [treeRows, search]);

  const openCreatePanel = useCallback(() => {
    setFormName(""); setFormParentId(""); setFormError("");
    setActiveDept(null);
    setPanel("create");
  }, []);

  const openEditPanel = useCallback((dept) => {
    setFormName(dept.name);
    setFormParentId(dept.parentDepartmentId ?? "");
    setFormError("");
    setActiveDept(dept);
    setPanel("edit");
    setOpenMenuId(null);
  }, []);

  const openHeadPanel = useCallback((dept) => {
    setActiveDept(dept);
    setHeadSearch("");
    setSelectedHeadId(null);
    setPanel("head");
    setOpenMenuId(null);
    loadUsers();
  }, [loadUsers]);

  const closePanel = useCallback(() => {
    setPanel(null);
    setActiveDept(null);
    setFormError("");
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formName.trim()) { setFormError("Department name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload = { name: formName.trim(), parentDepartmentId: formParentId || null };
      if (panel === "create") await createDepartment(payload);
      else await updateDepartment(activeDept.id, payload);
      await loadDepts();
      closePanel();
    } catch (err) {
      setFormError(err?.message ?? "An error occurred.");
    } finally {
      setSaving(false);
    }
  }, [formName, formParentId, panel, activeDept, loadDepts, closePanel]);

  const handleDelete = useCallback(async (dept) => {
    if (!window.confirm(`Delete "${dept.name}"?`)) return;
    setOpenMenuId(null);
    try {
      await deleteDepartment(dept.id);
      await loadDepts();
    } catch (err) {
      alert(err?.message ?? "Delete failed.");
    }
  }, [loadDepts]);

  const handleAssignHead = useCallback(async () => {
    if (!selectedHeadId) return;
    setHeadSaving(true);
    try {
      await assignDepartmentHead(activeDept.id, selectedHeadId);
      await loadDepts();
      closePanel();
    } catch (err) {
      alert(err?.message ?? "Assign failed.");
    } finally {
      setHeadSaving(false);
    }
  }, [selectedHeadId, activeDept, loadDepts, closePanel]);

  const handleRemoveHead = useCallback(async () => {
    setHeadSaving(true);
    try {
      await removeDepartmentHead(activeDept.id);
      await loadDepts();
      closePanel();
    } catch (err) {
      alert(err?.message ?? "Remove failed.");
    } finally {
      setHeadSaving(false);
    }
  }, [activeDept, loadDepts, closePanel]);

  // Edit panelindən özünü və uşaqlarını parent seçimlərindən çıxar
  const parentOptions = useMemo(() => {
    if (panel !== "edit" || !activeDept) return depts;
    const excluded = new Set([activeDept.id]);
    const addDesc = (id) => depts.forEach(d => { if (d.parentDepartmentId === id) { excluded.add(d.id); addDesc(d.id); } });
    addDesc(activeDept.id);
    return depts.filter(d => !excluded.has(d.id));
  }, [depts, activeDept, panel]);

  const canDelete = useCallback((dept) => !depts.some(d => d.parentDepartmentId === dept.id), [depts]);

  const filteredUsers = useMemo(() => {
    if (!headSearch.trim()) return users;
    const q = headSearch.toLowerCase();
    return users.filter(u => {
      const name = u.fullName ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
      return name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
  }, [users, headSearch]);

  return (
    <div className="dm-root">
      {/* Toolbar */}
      <div className="dm-toolbar">
        <div className="dm-toolbar-left">
          <h2 className="dm-section-title">Departments</h2>
          <span className="dm-count">{depts.length}</span>
        </div>
        <div className="dm-toolbar-right">
          <div className="dm-search-wrap">
            <svg className="dm-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="dm-search-input"
              placeholder="Search departments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="dm-btn dm-btn-primary" onClick={openCreatePanel}>+ New Department</button>
        </div>
      </div>

      {/* Table */}
      <div className="dm-table-wrap">
        <table className="dm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Head</th>
              <th>Parent</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <div className="dm-skeleton-row">
                      <div className="dm-skeleton-bar" style={{ width: "38%" }} />
                      <div className="dm-skeleton-bar" style={{ width: "22%" }} />
                      <div className="dm-skeleton-bar" style={{ width: "16%" }} />
                    </div>
                  </td>
                </tr>
              ))
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  {search ? (
                    <div className="dm-empty-cell">No departments match your search.</div>
                  ) : (
                    <div className="dm-empty-state">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2"/>
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                      </svg>
                      <p>No departments yet.</p>
                      <button className="dm-btn dm-btn-primary" onClick={openCreatePanel}>
                        → Create your first department
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredRows.map(row => (
                <DepartmentRow
                  key={row.id}
                  row={row}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  onEdit={openEditPanel}
                  onHead={openHeadPanel}
                  onDelete={handleDelete}
                  canDelete={canDelete(row)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Panel */}
      {(panel === "create" || panel === "edit") && (
        <>
          <div className="dm-form-overlay" onClick={closePanel} />
          <div className="dm-form-panel">
            <div className="dm-form-header">
              <h3 className="dm-form-title">
                {panel === "create" ? "Create Department" : "Edit Department"}
              </h3>
              <button className="dm-form-close" onClick={closePanel} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form className="dm-form-body" onSubmit={handleSubmit}>
              <div className="dm-form-field">
                <label className="dm-form-label dm-form-label--required">Department Name *</label>
                <input
                  className="dm-form-input"
                  placeholder="Enter name..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  autoFocus
                />
                {formError && <span className="dm-form-error">{formError}</span>}
              </div>
              <div className="dm-form-field">
                <label className="dm-form-label">Parent Department</label>
                <select
                  className="dm-form-select"
                  value={formParentId}
                  onChange={e => setFormParentId(e.target.value)}
                >
                  <option value="">None (top-level)</option>
                  {parentOptions.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <span className="dm-form-hint">ⓘ Leave empty for a root department.</span>
              </div>
              <div className="dm-form-actions">
                <button type="button" className="dm-btn dm-btn-ghost" onClick={closePanel} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="dm-btn dm-btn-primary" disabled={saving}>
                  {saving ? <span className="dm-spinner" /> : (panel === "create" ? "Create" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Assign Head Panel */}
      {panel === "head" && (
        <>
          <div className="dm-form-overlay" onClick={closePanel} />
          <div className="dm-head-panel">
            <div className="dm-form-header">
              <h3 className="dm-form-title">Assign Head — {activeDept?.name}</h3>
              <button className="dm-form-close" onClick={closePanel} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="dm-form-body">
              {activeDept?.headOfDepartmentId && (
                <>
                  <div className="dm-form-field">
                    <label className="dm-form-label">Current Head</label>
                    <div className="dm-current-head">
                      <div
                        className="dm-head-avatar"
                        style={{ background: getAvatarColor(activeDept.headOfDepartmentName ?? "") }}
                      >
                        {getInitials(activeDept.headOfDepartmentName ?? "")}
                      </div>
                      <span className="dm-head-name">{activeDept.headOfDepartmentName}</span>
                      <button
                        className="dm-btn-ghost-danger"
                        onClick={handleRemoveHead}
                        disabled={headSaving}
                      >
                        {headSaving ? <span className="dm-spinner dm-spinner--dark" /> : "Remove Head"}
                      </button>
                    </div>
                  </div>
                  <hr className="dm-divider" />
                </>
              )}
              <div className="dm-form-field">
                <label className="dm-form-label">Assign New Head</label>
                <div className="dm-search-wrap dm-head-search">
                  <svg className="dm-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    className="dm-search-input"
                    placeholder="Search users..."
                    value={headSearch}
                    onChange={e => setHeadSearch(e.target.value)}
                  />
                </div>
                <div className="dm-user-pick-list">
                  {usersLoading ? (
                    <div className="dm-empty">Loading users...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="dm-empty">No users found.</div>
                  ) : (
                    filteredUsers.map(u => {
                      const name = u.fullName ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                      return (
                        <div
                          key={u.id}
                          className={`dm-user-pick-row${selectedHeadId === u.id ? " selected" : ""}`}
                          onClick={() => setSelectedHeadId(u.id)}
                        >
                          <div
                            className="dm-user-avatar-sm"
                            style={{ background: getAvatarColor(name) }}
                          >
                            {getInitials(name)}
                          </div>
                          <div className="dm-user-info-sm">
                            <span>{name}</span>
                            {u.positionName && <span className="dm-user-dept">{u.positionName}</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="dm-form-actions">
                <button type="button" className="dm-btn dm-btn-ghost" onClick={closePanel}>
                  Cancel
                </button>
                <button
                  className="dm-btn dm-btn-primary"
                  onClick={handleAssignHead}
                  disabled={!selectedHeadId || headSaving}
                >
                  {headSaving ? <span className="dm-spinner" /> : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(DepartmentManagement);
