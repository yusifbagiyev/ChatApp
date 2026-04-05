import { memo, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getInitials, getAvatarColor } from "../utils/chatUtils";
import { getFileUrl } from "../services/api";
import "./TopNavbar.css";

// ─── Nav Items konfiqurasiyası ───────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "feed",
    label: "Feed",
    path: "/feed",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" />
      </svg>
    ),
  },
  {
    id: "messages",
    label: "Messages",
    path: "/messages",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "drive",
    label: "Drive",
    path: "/drive",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "admin",
    label: "Admin",
    path: "/admin",
    roles: ["Admin", "Administrator", "SuperAdmin"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// ─── TopNavbar ───────────────────────────────────────────────────────────────
function TopNavbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
  const role = user.role ?? "User";

  // Aktiv nav item-ı müəyyən et
  const isActive = (item) => {
    return location.pathname.startsWith(item.path);
  };

  // Role-a görə görünən nav items
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  const handleNav = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
  };

  // Öz profili aç — App.jsx-dəki AuthenticatedLayout dinləyir
  const handleOpenProfile = () => {
    window.dispatchEvent(new CustomEvent("open-profile", { detail: { userId: user.id } }));
  };

  return (
    <>
      <nav className="top-navbar" role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <button className="nav-logo" onClick={() => navigate("/messages")}>
          <svg className="nav-logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="nav-logo-text">ChatApp</span>
        </button>

        {/* Nav Items — desktop/tablet */}
        <div className="nav-items">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${isActive(item) ? " active" : ""}`}
              data-tooltip={item.label}
              onClick={() => handleNav(item.path)}
              aria-current={isActive(item) ? "page" : undefined}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-text">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Notification — hələ implement olunmayıb, gizlədilib */}

        {/* Separator */}
        <div className="nav-separator" />

        {/* User section — desktop */}
        <div className="nav-user">
          <button className="nav-user-profile-btn" onClick={handleOpenProfile}>
            <div className="nav-user-avatar" style={{ background: getAvatarColor(name) }}>
              {user.avatarUrl
                ? <img src={getFileUrl(user.avatarUrl)} alt="" />
                : getInitials(name)
              }
            </div>
            <span className="nav-user-name">{name}</span>
          </button>
          <button className="nav-logout-btn" title="Logout" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Mobile: notification + hamburger */}
        <div className="nav-mobile-actions">
          <button className="nav-item" onClick={() => {}}>
            <span className="nav-notification-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
          </button>
          <button className="nav-hamburger" aria-label="Open menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`nav-mobile-backdrop${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`nav-mobile-menu${mobileMenuOpen ? " open" : ""}`} id="mobile-menu" role="dialog">
        <div className="nav-mobile-header">
          <span style={{ fontWeight: 600, fontSize: "15px", color: "#111827" }}>Menu</span>
          <button className="nav-mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* İstifadəçi məlumatları */}
        <div className="nav-mobile-user">
          <div className="nav-mobile-user-avatar" style={{ background: getAvatarColor(name) }}>
            {user.avatarUrl
              ? <img src={getFileUrl(user.avatarUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : getInitials(name)
            }
          </div>
          <div className="nav-mobile-user-info">
            <div className="nav-mobile-user-name">{name}</div>
            <span className={`nav-mobile-user-role ${role.toLowerCase()}`}>{role}</span>
          </div>
        </div>

        {/* Nav items */}
        <div className="nav-mobile-items">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              className={`nav-mobile-item${isActive(item) ? " active" : ""}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="nav-mobile-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          {/* Notifications */}
          <button className="nav-mobile-item" onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-mobile-item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            Notifications
          </button>
        </div>

        {/* Logout */}
        <div className="nav-mobile-logout">
          <button className="nav-mobile-logout-btn" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default memo(TopNavbar);
