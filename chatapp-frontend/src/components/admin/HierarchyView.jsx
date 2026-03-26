import { useState, useEffect, useCallback } from "react";
import { getOrganizationHierarchy, getFileUrl } from "../../services/api";
import { getInitials, getAvatarColor } from "../../utils/chatUtils";
import "./HierarchyView.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query || !text) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="hi-highlight">{text.slice(i, i + query.length)}</span>
      {text.slice(i + query.length)}
    </>
  );
}

function filterTree(nodes, query) {
  return nodes.reduce((acc, node) => {
    const match = node.name?.toLowerCase().includes(query);
    const filteredChildren = node.children?.length ? filterTree(node.children, query) : [];
    if (match || filteredChildren.length > 0)
      acc.push({ ...node, children: filteredChildren });
    return acc;
  }, []);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function HierarchySkeleton() {
  return (
    <div className="hi-skeleton">
      {[1, 2].map(i => (
        <div key={i} className="hi-skeleton-company">
          <div className="hi-skeleton-bar" style={{ width: "220px" }} />
          {[1, 2, 3].map(j => (
            <div key={j} className="hi-skeleton-bar"
              style={{ width: `${180 - j * 20}px`, marginLeft: j * 12 + "px" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// level-ə görə indent (level 1 = 16px, hər level +24px)
const calcIndent = (level) => (level - 1) * 24 + 16;

// ─── HierarchyView ────────────────────────────────────────────────────────────
function HierarchyView({ isSuperAdmin }) {
  const [tree, setTree]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [collapsed, setCollapsed]     = useState(new Set()); // boş = hamısı açıq

  useEffect(() => {
    getOrganizationHierarchy()
      .then(data => setTree(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  // 300ms debounce
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggle = useCallback((id) => {
    setCollapsed(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  // Axtarış aktiv olduqda hamısı açıq görünür
  const isExpanded = (id) => search ? true : !collapsed.has(id);

  // ─── Node renderers ──────────────────────────────────────────────────────
  const renderUserNode = (node) => (
    <div
      key={node.id}
      className={`hi-user-row${node.isDepartmentHead ? " hi-user-row--head" : ""}`}
      style={{ paddingLeft: calcIndent(node.level) }}
    >
      <div
        className="hi-avatar"
        style={{ background: node.avatarUrl ? "transparent" : getAvatarColor(node.name) }}
      >
        {node.avatarUrl
          ? <img src={getFileUrl(node.avatarUrl)} alt="" />
          : getInitials(node.name)}
      </div>
      <div className="hi-user-info">
        <span className="hi-user-name"><Highlight text={node.name} query={search} /></span>
        {node.positionName && <span className="hi-position">{node.positionName}</span>}
      </div>
      {node.isDepartmentHead && <span className="hi-head-badge">★ Head</span>}
      {node.role && (
        <span className={`hi-role-badge hi-role-badge--${node.role.toLowerCase()}`}>{node.role}</span>
      )}
    </div>
  );

  const renderDeptNode = (node) => {
    const expanded  = isExpanded(node.id);
    const subDepts  = node.children?.filter(n => n.type === "Department") ?? [];
    const deptUsers = node.children?.filter(n => n.type === "User") ?? [];
    const hasAny    = subDepts.length + deptUsers.length > 0;

    return (
      <div key={node.id}>
        <div
          className="hi-dept-header"
          style={{ paddingLeft: calcIndent(node.level) }}
          onClick={() => hasAny && toggle(node.id)}
          style={{ paddingLeft: calcIndent(node.level), cursor: hasAny ? "pointer" : "default" }}
        >
          {hasAny
            ? <span className={`hi-chevron${expanded ? " hi-chevron--open" : ""}`}>▶</span>
            : <span className="hi-chevron-spacer" />
          }
          <svg className="hi-dept-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          <span className="hi-dept-name"><Highlight text={node.name} query={search} /></span>
          {node.headOfDepartmentName && (
            <span className="hi-dept-head-hint">· {node.headOfDepartmentName}</span>
          )}
          <span className="hi-count-badge">{node.userCount ?? 0} users</span>
        </div>
        {expanded && hasAny && (
          <>
            {subDepts.map(renderDeptNode)}
            {deptUsers.map(renderUserNode)}
          </>
        )}
      </div>
    );
  };

  const renderCompanyNode = (node) => {
    const expanded   = isExpanded(node.id);
    const depts      = node.children?.filter(n => n.type === "Department") ?? [];
    const noDeptUsers = node.children?.filter(n => n.type === "User") ?? [];
    const hasAny     = depts.length + noDeptUsers.length > 0;

    return (
      <div key={node.id} className="hi-company-node">
        <div className="hi-company-header" onClick={() => toggle(node.id)}>
          <span className={`hi-chevron${expanded ? " hi-chevron--open" : ""}`}>▶</span>
          <div className="hi-company-logo" style={{ background: getAvatarColor(node.name) }}>
            {node.avatarUrl
              ? <img src={getFileUrl(node.avatarUrl)} alt="" />
              : getInitials(node.name)}
          </div>
          <span className="hi-company-name"><Highlight text={node.name} query={search} /></span>
          <span className="hi-count-badge">{node.userCount ?? 0} users</span>
        </div>
        {expanded && hasAny && (
          <div className="hi-children">
            {depts.map(renderDeptNode)}
            {noDeptUsers.length > 0 && (
              <div className="hi-no-dept-section">
                <div className="hi-no-dept-label">(No department)</div>
                {noDeptUsers.map(renderUserNode)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Data prep ───────────────────────────────────────────────────────────
  const adminCompany = !isSuperAdmin ? (tree[0] ?? null) : null;

  let content;
  if (loading) {
    content = <HierarchySkeleton />;
  } else if (isSuperAdmin) {
    const visible = search ? filterTree(tree, search) : tree;
    content = visible.length === 0
      ? <div className="hi-empty">No users found.</div>
      : visible.map(renderCompanyNode);
  } else {
    // Admin: company layer keçilir
    const allDepts    = adminCompany?.children?.filter(n => n.type === "Department") ?? [];
    const noDeptUsers = adminCompany?.children?.filter(n => n.type === "User") ?? [];

    const visibleDepts    = search ? filterTree(allDepts, search) : allDepts;
    const visibleNoDept   = search
      ? noDeptUsers.filter(u => u.name?.toLowerCase().includes(search))
      : noDeptUsers;

    if (visibleDepts.length === 0 && visibleNoDept.length === 0) {
      content = (
        <div className="hi-empty">
          {search ? "No users found." : "No departments found."}
        </div>
      );
    } else {
      content = (
        <>
          {visibleDepts.map(renderDeptNode)}
          {visibleNoDept.length > 0 && (
            <div className="hi-no-dept-section">
              <div className="hi-no-dept-label">(No department)</div>
              {visibleNoDept.map(renderUserNode)}
            </div>
          )}
        </>
      );
    }
  }

  return (
    <div className="hi-root">
      <div className="hi-toolbar">
        <div className="hi-title-wrap">
          <h2 className="hi-title">
            {isSuperAdmin
              ? "Users"
              : `Users${adminCompany ? ` — ${adminCompany.name}` : ""}`}
          </h2>
          {!isSuperAdmin && adminCompany && (
            <span className="hi-count-badge">{adminCompany.userCount ?? 0}</span>
          )}
        </div>
        <div className="hi-search-wrap">
          <svg className="hi-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="hi-search"
            placeholder="Search users or departments..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
      </div>
      <div className="hi-tree">{content}</div>
    </div>
  );
}

export default HierarchyView;
