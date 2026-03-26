import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { getAllPositions, getDepartments, createPosition, updatePosition, deletePosition } from "../../services/api";
import "./PositionManagement.css";

// ─── PositionRow (memoized) ───────────────────────────────────────────────────
const PositionRow = memo(function PositionRow({ pos, openMenuId, setOpenMenuId, onEdit, onDelete }) {
  return (
    <tr className="pm-row">
      <td>
        <span className="pm-name-cell" title={pos.name}>{pos.name}</span>
      </td>
      <td>
        {pos.departmentId
          ? <span className="pm-dept-badge" title={pos.departmentName}>{pos.departmentName}</span>
          : <span className="pm-cell-muted">—</span>
        }
      </td>
      <td className="pm-actions-cell">
        <div className="pm-menu-wrap">
          <button
            className="pm-menu-btn"
            onClick={() => setOpenMenuId(openMenuId === pos.id ? null : pos.id)}
          >•••</button>
          {openMenuId === pos.id && (
            <>
              <div className="pm-menu-overlay" onClick={() => setOpenMenuId(null)} />
              <div className="pm-menu">
                <button className="pm-menu-item" onClick={() => onEdit(pos)}>Edit</button>
                <button className="pm-menu-item danger" onClick={() => onDelete(pos)}>Delete</button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

// ─── PositionManagement ───────────────────────────────────────────────────────
function PositionManagement() {
  const [positions, setPositions]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sort, setSort]             = useState("asc");
  const [openMenuId, setOpenMenuId] = useState(null);

  // panel: null | 'create' | 'edit'
  const [panel, setPanel]         = useState(null);
  const [activePos, setActivePos] = useState(null);
  const [formName, setFormName]   = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formDesc, setFormDesc]   = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving]       = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pos, depts] = await Promise.all([getAllPositions(), getDepartments()]);
      setPositions(pos ?? []);
      setDepartments(depts ?? []);
    } catch (e) {
      console.error("Failed to load positions", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let rows = [...positions];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(p => p.name.toLowerCase().includes(q));
    }
    if (deptFilter === "none") {
      rows = rows.filter(p => !p.departmentId);
    } else if (deptFilter !== "all") {
      rows = rows.filter(p => p.departmentId === deptFilter);
    }
    rows.sort((a, b) => sort === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    return rows;
  }, [positions, search, deptFilter, sort]);

  const openCreatePanel = useCallback(() => {
    setFormName(""); setFormDeptId(""); setFormDesc(""); setFormError("");
    setActivePos(null);
    setPanel("create");
  }, []);

  const openEditPanel = useCallback((pos) => {
    setFormName(pos.name);
    setFormDeptId(pos.departmentId ?? "");
    setFormDesc(pos.description ?? "");
    setFormError("");
    setActivePos(pos);
    setPanel("edit");
    setOpenMenuId(null);
  }, []);

  const closePanel = useCallback(() => { setPanel(null); setActivePos(null); setFormError(""); }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formName.trim()) { setFormError("Position name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: formName.trim(),
        departmentId: formDeptId || null,
        description: formDesc.trim() || null,
      };
      if (panel === "create") await createPosition(payload);
      else await updatePosition(activePos.id, payload);
      await loadData();
      closePanel();
    } catch (err) {
      setFormError(err?.message ?? "An error occurred.");
    } finally {
      setSaving(false);
    }
  }, [formName, formDeptId, formDesc, panel, activePos, loadData, closePanel]);

  const handleDelete = useCallback(async (pos) => {
    if (!window.confirm(`Delete "${pos.name}"?`)) return;
    setOpenMenuId(null);
    try {
      await deletePosition(pos.id);
      await loadData();
    } catch (err) {
      alert(err?.message ?? "Delete failed.");
    }
  }, [loadData]);

  const toggleSort = useCallback(() => setSort(s => s === "asc" ? "desc" : "asc"), []);

  const isFiltering = search || deptFilter !== "all";

  return (
    <div className="pm-root">
      {/* Header */}
      <div className="pm-toolbar-header">
        <div className="pm-toolbar-left">
          <h2 className="pm-section-title">Positions</h2>
          <span className="pm-count">{positions.length}</span>
        </div>
        <button className="pm-btn pm-btn-primary" onClick={openCreatePanel}>+ New Position</button>
      </div>

      {/* Filter row */}
      <div className="pm-toolbar">
        <div className="pm-search-wrap">
          <svg className="pm-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="pm-search-input"
            placeholder="Search positions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="pm-dept-filter"
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          <option value="none">No Department</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="pm-table-wrap">
        <table className="pm-table">
          <thead>
            <tr>
              <th className="pm-th-sortable" onClick={toggleSort}>
                Position Name{" "}
                <span className="pm-sort-icon" style={{ color: "var(--primary-color)" }}>
                  {sort === "asc" ? "↑" : "↓"}
                </span>
              </th>
              <th>Department</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={3} style={{ padding: 0 }}>
                    <div className="pm-skeleton-row">
                      <div className="pm-skeleton-bar" style={{ width: "35%" }} />
                      <div className="pm-skeleton-bar" style={{ width: "22%" }} />
                    </div>
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  {isFiltering ? (
                    <div className="pm-empty-cell">No positions match your search.</div>
                  ) : (
                    <div className="pm-empty-state">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2"/>
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                      </svg>
                      <p>No positions yet.</p>
                      <button className="pm-btn pm-btn-primary" onClick={openCreatePanel}>
                        → Create your first position
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map(pos => (
                <PositionRow
                  key={pos.id}
                  pos={pos}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  onEdit={openEditPanel}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Panel */}
      {(panel === "create" || panel === "edit") && (
        <>
          <div className="pm-form-overlay" onClick={closePanel} />
          <div className="pm-form-panel">
            <div className="pm-form-header">
              <h3 className="pm-form-title">
                {panel === "create" ? "Create Position" : "Edit Position"}
              </h3>
              <button className="pm-form-close" onClick={closePanel} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form className="pm-form-body" onSubmit={handleSubmit}>
              <div className="pm-form-field">
                <label className="pm-form-label pm-form-label--required">Position Name *</label>
                <input
                  className="pm-form-input"
                  placeholder="Enter name..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  autoFocus
                />
                {formError && <span className="pm-form-error">{formError}</span>}
              </div>
              <div className="pm-form-field">
                <label className="pm-form-label">Department</label>
                <select
                  className="pm-form-select"
                  value={formDeptId}
                  onChange={e => setFormDeptId(e.target.value)}
                >
                  <option value="">No Department (company-wide)</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <span className="pm-form-hint">ⓘ Leave empty for company-wide positions (CEO, CTO, etc.)</span>
              </div>
              <div className="pm-form-field">
                <label className="pm-form-label">Description</label>
                <textarea
                  className="pm-form-textarea"
                  placeholder="Optional description..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="pm-form-actions">
                <button type="button" className="pm-btn pm-btn-ghost" onClick={closePanel} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="pm-btn pm-btn-primary" disabled={saving}>
                  {saving ? <span className="pm-spinner" /> : (panel === "create" ? "Create" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(PositionManagement);
