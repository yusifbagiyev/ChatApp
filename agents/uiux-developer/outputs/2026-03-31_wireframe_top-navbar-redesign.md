# Top Navbar Layout — Full Wireframe & CSS Specification

**Date:** 2026-03-31
**Agent:** UI/UX Developer
**Type:** Wireframe + Interaction Design + CSS Spec
**Priority:** P0 — April demo
**Scope:** Global layout restructure — vertical sidebar → horizontal top navbar

---

## 1. Design Rationale

Bitrix24 referans alınaraq, 60px sol sidebar ləğv olunur. Əvəzinə **48px horizontal top navbar** implementasiya edilir.

**Niyə 48px?** Bitrix24-ün navbar-ı ~52px-dir, lakin bizim content-ə daha çox vertical space vermək üçün 48px optimal seçimdir. Compact amma comfortable.

**Qazanılan üstünlüklər:**
- ~60px horizontal space geri qazanılır (conversation list + chat area genişlənir)
- Nav item-lar icon+text ilə discoverability artır
- Global navbar App.jsx səviyyəsində olacaq — bütün page-lərdə eyni
- Mobile-da hamburger menu-ya natural keçid

---

## 2. Layout Strukturu

### 2.1 Ümumi Arxitektura (Before → After)

**BEFORE:**
```
┌──────┬───────────────┬─────────────────────────────────┐
│ Side │ Conv List     │          Chat Area              │
│ bar  │ (380px)       │          (flex: 1)              │
│ 60px │               │                                 │
│      │               │                                 │
│      │               │                                 │
└──────┴───────────────┴─────────────────────────────────┘
```

**AFTER:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo]    Feed   Messages   Drive   Admin   ···   🔔   (AV) Ad  [↪]  │ 48px
├────────────────────────────────────────────────────────────────────────  │
│         12px padding                                                    │
│  ┌───────────────┐  12px  ┌──────────────────────────────────────────┐ │
│  │ Conv List     │  gap   │         Chat Area                        │ │
│  │ (360px)       │        │         (flex: 1)                        │ │
│  │               │        │                                          │ │
│  │               │        │                                          │ │
│  │  border-radius│        │         border-radius: 12px              │ │
│  │  12px         │        │         background: white                │ │
│  └───────────────┘        └──────────────────────────────────────────┘ │
│                                                                  12px  │
└────────────────────────────────────────────────────────────────────────┘
  background: #eef1f5
```

### 2.2 Component Hierarchy (yeni)

```
App.jsx
├── TopNavbar (YENİ — global, bütün route-larda)
│   ├── NavLogo
│   ├── NavItems (Feed, Messages, Drive, Admin, Settings, Notifications)
│   └── NavUserSection (Avatar + Name + Logout)
├── Route: /
│   └── Chat.jsx (sidebar çıxarılıb, navbar artıq App-da)
│       ├── ConversationList
│       └── ChatArea
├── Route: /admin
│   └── AdminPanel.jsx (öz header-i qalır, navbar + admin header birlikdə)
└── Route: /feed, /drive, /settings
    └── ComingSoonPage (YENİ — placeholder)
```

---

## 3. Top Navbar — Detailed Wireframe

### 3.1 Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                              │
│   [💬]  ChatApp     ·    📰 Feed    💬 Messages    📁 Drive    🛡 Admin    ⚙ Settings    🔔(3)    (AV)  Ad Soyad  [↪]   │
│                                          ▔▔▔▔▔▔                                             │
│   ├── Logo zone ──┤         ├──────────── Nav Items (center) ─────────────┤    ├─ User ──┤  │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

Sol: Logo icon (24px) + "ChatApp" text (16px, 600)
Mərkəz: Nav items (icon 18px + text 13px, gap: 6px arası, items gap: 4px)
Sağ: Bell icon + badge → Avatar (30px) + Ad (13px) → Logout icon (18px)
```

### 3.2 Tablet (768px — 1023px)

```
┌──────────────────────────────────────────────────────────┐
│  [💬]    📰  💬  📁  🛡  ⚙  🔔(3)        (AV)  [↪]   │
│                  ▔▔                                      │
│  Logo   Nav items (icon only, tooltip)    Avatar+Logout  │
└──────────────────────────────────────────────────────────┘

- Text gizlənir, yalnız icon qalır
- Tooltip: hover-da item adı göstərilir
- Avatar: ad gizli, yalnız circle
- Logout: icon button
```

### 3.3 Mobile (< 768px)

```
┌────────────────────────────────────────┐
│  [💬] ChatApp              [🔔(3)] [☰] │
│                                        │
└────────────────────────────────────────┘

Hamburger açıq:
┌────────────────────────────────────────┐
│  [💬] ChatApp                     [✕]  │
├────────────────────────────────────────┤
│                                        │
│   (AV)  Ad Soyad                       │
│          Role Badge                    │
│   ─────────────────────────────────    │
│                                        │
│   📰  Feed                             │
│   💬  Messages                    ●    │
│   📁  Drive                            │
│   🛡  Admin Panel                      │
│   ⚙  Settings                         │
│   🔔  Notifications              (3)  │
│                                        │
│   ─────────────────────────────────    │
│                                        │
│   [↪  Logout]                          │
│                                        │
└────────────────────────────────────────┘

- Overlay: backdrop blur + semi-transparent dark
- Menu: sağdan slide-in, 280px width
- İçəridə: user info + nav items + logout
- Active item: sol tərəfdə accent dot
```

---

## 4. CSS Specification

### 4.1 CSS Variables (Yeni + Mövcud ilə uyğun)

```css
:root {
  /* Navbar */
  --navbar-height: 48px;
  --navbar-bg: #ffffff;
  --navbar-border: #e5e7eb;
  --navbar-shadow: 0 1px 3px rgba(0,0,0,0.06);

  /* Nav items */
  --nav-item-color: #6b7280;
  --nav-item-hover-color: #374151;
  --nav-item-hover-bg: #f3f4f6;
  --nav-item-active-color: #111827;
  --nav-item-active-accent: #2fc6f6;

  /* Content area */
  --content-bg: #eef1f5;
  --content-padding: 12px;
  --panel-radius: 12px;
  --panel-shadow: 0 1px 4px rgba(0,0,0,0.08);

  /* Mobile menu */
  --mobile-menu-width: 280px;
  --mobile-backdrop: rgba(0,0,0,0.4);

  /* Sidebar artıq lazım deyil */
  /* --sidebar-width: 60px;  ← SİLİNƏCƏK */
}
```

### 4.2 Navbar Container

```css
.top-navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-overlay, 100);
  height: var(--navbar-height);
  background: var(--navbar-bg);
  border-bottom: 1px solid var(--navbar-border);
  box-shadow: var(--navbar-shadow);
  display: flex;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0;
}
```

### 4.3 Logo Zone (Sol)

```css
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  margin-right: 32px;
  /* Tıklanabilir — Ana səhifəyə (Messages) yönləndirir */
  cursor: pointer;
  text-decoration: none;
}

.nav-logo-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.nav-logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-900);
  letter-spacing: -0.3px;
  /* Tablet-də gizlənir */
}
```

**Logo SVG:** Mövcud Sidebar.jsx-dəki chat bubble SVG istifadə olunacaq (tanınırlıq).

### 4.4 Nav Items (Mərkəz)

```css
.nav-items {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  justify-content: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--nav-item-color);
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  height: 34px;
  transition: color 150ms cubic-bezier(0.4,0,0.2,1),
              background 150ms cubic-bezier(0.4,0,0.2,1);
}

.nav-item:hover {
  color: var(--nav-item-hover-color);
  background: var(--nav-item-hover-bg);
}

/* Active state — alt xətt (Bitrix24 style) */
.nav-item.active {
  color: var(--nav-item-active-color);
  font-weight: 600;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -7px; /* navbar-ın alt border-inə yapışır */
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 16px);
  height: 2px;
  background: var(--nav-item-active-accent);
  border-radius: 2px 2px 0 0;
  animation: nav-underline-in 200ms cubic-bezier(0.16,1,0.3,1) forwards;
}

@keyframes nav-underline-in {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: calc(100% - 16px);
    opacity: 1;
  }
}

.nav-item-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  /* Aktiv olanda icon-a da rəng keçir */
  transition: color 150ms cubic-bezier(0.4,0,0.2,1);
}

.nav-item.active .nav-item-icon {
  color: var(--nav-item-active-accent);
}

.nav-item-text {
  /* Tablet-da gizlənir */
}
```

### 4.5 Notification Badge

```css
.nav-notification-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.nav-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid var(--navbar-bg); /* navbar bg ilə eynı — "cut-out" effekti */
  line-height: 1;
  /* 0 olanda gizli */
}

.nav-badge:empty {
  display: none;
}

/* Yeni notification gələndə pulse */
@keyframes nav-badge-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.nav-badge.pulse {
  animation: nav-badge-pulse 400ms cubic-bezier(0.16,1,0.3,1);
}
```

### 4.6 User Section (Sağ)

```css
.nav-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 24px;
  flex-shrink: 0;
}

/* Separator — nav items ilə user section arası */
.nav-separator {
  width: 1px;
  height: 24px;
  background: var(--gray-200);
  margin: 0 8px;
  flex-shrink: 0;
}

.nav-user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 150ms cubic-bezier(0.4,0,0.2,1);
}

.nav-user-avatar:hover {
  box-shadow: 0 0 0 2px var(--primary-color);
}

.nav-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-700);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* Tablet-da gizlənir */
}

.nav-logout-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--gray-400);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 150ms cubic-bezier(0.4,0,0.2,1),
              background 150ms cubic-bezier(0.4,0,0.2,1);
}

.nav-logout-btn:hover {
  color: #ef4444;
  background: rgba(239,68,68,0.06);
}

.nav-logout-btn svg {
  width: 18px;
  height: 18px;
}
```

### 4.7 Content Area (Floating Panel Layout)

```css
.app-content {
  flex: 1;
  background: var(--content-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Chat page layout — floating card effekti */
.chat-layout {
  flex: 1;
  display: flex;
  gap: var(--content-padding);
  padding: var(--content-padding);
  min-height: 0;
}

/* Conversation List paneli */
.chat-layout .conversation-list-container {
  width: 360px;
  flex-shrink: 0;
  background: #fff;
  border-radius: var(--panel-radius);
  box-shadow: var(--panel-shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Chat Area paneli */
.chat-layout .chat-area-container {
  flex: 1;
  background: #fff;
  border-radius: var(--panel-radius);
  box-shadow: var(--panel-shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
```

### 4.8 Admin Panel Integration

Admin Panel-in mövcud `ap-header`-i saxlanılır, lakin yuxarıda TopNavbar olduğu üçün "Back to Chat" button-u ləğv olunur — çünki artıq navbar-dakı "Messages" button-u ilə geri keçilir.

```css
/* Admin Panel — navbar altında tam genişlikdə */
.admin-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Admin Panel artıq 100vh deyil, navbar-dan sonra qalan space-i tutur */
.ap-page {
  /* height: 100vh; → silinir */
  flex: 1;
  min-height: 0;
}
```

---

## 5. Nav Items Definition

### 5.1 Items Array

```jsx
const NAV_ITEMS = [
  {
    id: "feed",
    label: "Feed",
    icon: FeedIcon,        // RSS/newspaper SVG
    path: "/feed",
    comingSoon: true,
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessagesIcon,    // Chat bubble SVG (mövcud Sidebar-dakı)
    path: "/",
    comingSoon: false,
  },
  {
    id: "drive",
    label: "Drive",
    icon: DriveIcon,       // Folder SVG
    path: "/drive",
    comingSoon: true,
  },
  {
    id: "admin",
    label: "Admin",
    icon: AdminIcon,       // Shield SVG (mövcud Sidebar-dakı)
    path: "/admin",
    comingSoon: false,
    roles: ["Admin", "SuperAdmin"],  // yalnız bu role-lara görünür
  },
  {
    id: "settings",
    label: "Settings",
    icon: SettingsIcon,    // Gear SVG (mövcud Sidebar-dakı)
    path: "/settings",
    comingSoon: true,
  },
];
```

**Notifications ayrıdır** — nav items-ın sağında, badge ilə xüsusi render olunur (separator-dan əvvəl).

### 5.2 SVG Icon Specifications

Bütün icon-lar **18x18**, **stroke-based** (fill yox), **strokeWidth: 1.8**, **strokeLinecap: round**, **strokeLinejoin: round**.

```jsx
// Feed — RSS/newspaper
const FeedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a9 9 0 0 1 9 9" />
    <path d="M4 4a16 16 0 0 1 16 16" />
    <circle cx="5" cy="19" r="1" />
  </svg>
);

// Messages — chat bubble (mövcud Sidebar icon-dan)
const MessagesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Drive — folder
const DriveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

// Admin — shield
const AdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// Settings — gear
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// Notifications — bell
const NotificationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// Logout — door with arrow
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Hamburger — mobile menu
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
```

---

## 6. Responsive Breakpoints

### 6.1 Breakpoint System (mobile spec ilə uyğun)

```css
/* Desktop — tam layout */
@media (min-width: 1024px) {
  /* Default — yuxarıdakı bütün CSS-lər */
}

/* Tablet — icon only nav, compact user */
@media (max-width: 1023px) and (min-width: 768px) {
  .nav-logo-text     { display: none; }
  .nav-item-text     { display: none; }
  .nav-user-name     { display: none; }
  .nav-logo          { margin-right: 16px; }

  .nav-item {
    padding: 6px 10px;
    gap: 0;
    /* Tooltip əlavə et */
  }

  /* Tooltip on hover */
  .nav-item[data-tooltip]::before {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--gray-800);
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 150ms cubic-bezier(0.4,0,0.2,1);
    z-index: 200;
  }

  .nav-item[data-tooltip]:hover::before {
    opacity: 1;
  }

  /* Content padding azaldılır */
  :root {
    --content-padding: 8px;
  }

  .chat-layout .conversation-list-container {
    width: 300px;
  }
}

/* Mobile — hamburger menu */
@media (max-width: 767px) {
  .nav-items        { display: none; }
  .nav-separator    { display: none; }
  .nav-user         { display: none; }
  .nav-notification-desktop { display: none; }

  /* Mobile-da görünənlər */
  .nav-mobile-actions { display: flex; }
  .nav-hamburger      { display: flex; }
  .nav-notification-mobile { display: flex; }

  .top-navbar {
    padding: 0 16px;
  }

  :root {
    --content-padding: 0;
    --panel-radius: 0;
    --panel-shadow: none;
  }

  /* Chat layout full-width */
  .chat-layout {
    padding: 0;
    gap: 0;
  }

  .chat-layout .conversation-list-container {
    width: 100%;
    border-radius: 0;
  }

  .chat-layout .chat-area-container {
    border-radius: 0;
  }
}
```

### 6.2 Mobile Menu (Slide-in Drawer)

```css
/* Backdrop */
.nav-mobile-backdrop {
  position: fixed;
  inset: 0;
  background: var(--mobile-backdrop);
  z-index: 300;
  opacity: 0;
  pointer-events: none;
  transition: opacity 250ms cubic-bezier(0.4,0,0.2,1);
  /* Backdrop blur — daha premium hiss */
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.nav-mobile-backdrop.open {
  opacity: 1;
  pointer-events: auto;
}

/* Menu panel */
.nav-mobile-menu {
  position: fixed;
  top: 0;
  right: 0;
  width: var(--mobile-menu-width);
  height: 100%;
  background: #fff;
  z-index: 301;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 300ms cubic-bezier(0.16,1,0.3,1);
  box-shadow: -4px 0 24px rgba(0,0,0,0.12);
}

.nav-mobile-menu.open {
  transform: translateX(0);
}

/* Menu header */
.nav-mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-200);
}

.nav-mobile-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--gray-500);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms cubic-bezier(0.4,0,0.2,1);
}

.nav-mobile-close:hover {
  background: var(--gray-100);
}

/* User info section */
.nav-mobile-user {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--gray-100);
}

.nav-mobile-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
}

.nav-mobile-user-info {
  flex: 1;
  min-width: 0;
}

.nav-mobile-user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
}

.nav-mobile-user-role {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
}

.nav-mobile-user-role.superadmin {
  background: rgba(180,83,9,0.09);
  color: #b45309;
}

.nav-mobile-user-role.admin {
  background: rgba(47,198,246,0.12);
  color: #0891b2;
}

.nav-mobile-user-role.user {
  background: var(--gray-100);
  color: var(--gray-500);
}

/* Menu items */
.nav-mobile-items {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-mobile-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-600);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  position: relative;
  transition: color 150ms cubic-bezier(0.4,0,0.2,1),
              background 150ms cubic-bezier(0.4,0,0.2,1);
}

.nav-mobile-item:hover {
  background: var(--gray-50);
  color: var(--gray-900);
}

.nav-mobile-item.active {
  color: var(--nav-item-active-color);
  font-weight: 600;
  background: rgba(47,198,246,0.06);
}

/* Active indicator — sol tərəfdə accent dot */
.nav-mobile-item.active::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--nav-item-active-accent);
}

.nav-mobile-item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-mobile-item.active .nav-mobile-item-icon {
  color: var(--nav-item-active-accent);
}

/* Notification count (mobile menu-da) */
.nav-mobile-item-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

/* Mobile menu logout */
.nav-mobile-logout {
  padding: 16px 20px;
  border-top: 1px solid var(--gray-200);
}

.nav-mobile-logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(239,68,68,0.2);
  background: transparent;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: background 150ms cubic-bezier(0.4,0,0.2,1);
}

.nav-mobile-logout-btn:hover {
  background: rgba(239,68,68,0.06);
}
```

---

## 7. Coming Soon Page

Hələ implement olunmamış səhifələr üçün (Feed, Drive, Settings):

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                    ┌────────────┐                        │
│                    │  Icon 48px │                        │
│                    │  (muted)   │                        │
│                    └────────────┘                        │
│                                                          │
│               Coming Soon                                │
│                                                          │
│         This section will be available soon.             │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

```css
.coming-soon-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--content-bg);
  /* Floating card effekti — chat layout ilə eyni */
  margin: var(--content-padding);
  border-radius: var(--panel-radius);
  background: #fff;
  box-shadow: var(--panel-shadow);
}

.coming-soon-icon {
  width: 48px;
  height: 48px;
  color: var(--gray-300);
}

.coming-soon-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.coming-soon-text {
  font-size: 14px;
  color: var(--gray-400);
  margin: 0;
}
```

---

## 8. Interaction States

| State | Davranış | Animation |
|-------|----------|-----------|
| **Default** | Navbar sticky yuxarıda, content scrollable | — |
| **Nav hover** | Background: `#f3f4f6`, text darkens | 150ms material ease |
| **Nav active** | Bold text + cyan underline, icon cyan | underline: 200ms spring |
| **Nav transition** | Səhifə dəyişəndə underline köhnədən yeniyə sürüşür | 200ms spring |
| **Notification pulse** | Yeni notif gələndə badge scale bounce | 400ms spring |
| **Mobile menu open** | Sağdan slide-in + backdrop fade | 300ms spring |
| **Mobile menu close** | Sağa slide-out + backdrop fade-out | 250ms fast |
| **Logout hover** | Icon: gray → red, subtle red bg | 150ms material |
| **Scroll shadow** | Scroll aşağı edəndə navbar shadow artır (optional) | 200ms |
| **Admin hidden** | User role-u Admin/SuperAdmin deyilsə, Admin item render olunmur | — |

---

## 9. Accessibility (WCAG 2.1 AA)

```css
/* Focus ring — keyboard navigation */
.nav-item:focus-visible,
.nav-logout-btn:focus-visible,
.nav-user-avatar:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Skip nav link — screen readers üçün */
.skip-nav {
  position: absolute;
  top: -100px;
  left: 16px;
  padding: 8px 16px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 0 0 8px 8px;
  font-size: 13px;
  font-weight: 600;
  z-index: 1000;
  transition: top 200ms cubic-bezier(0.16,1,0.3,1);
}

.skip-nav:focus {
  top: 0;
}
```

**ARIA requirements:**
- `<nav role="navigation" aria-label="Main navigation">`
- Active item: `aria-current="page"`
- Notification badge: `aria-label="3 unread notifications"`
- Mobile menu: `aria-expanded="true/false"`, `aria-controls="mobile-menu"`
- Hamburger: `aria-label="Open menu"`

---

## 10. Anti-AI Checklist

- [x] Purple (#8b5cf6, #7c3aed) **istifadə olunmayıb**
- [x] Gradient button-lar yoxdur — flat, Bitrix24 style
- [x] Uniform card grid yoxdur — asymmetric layout (conversations ≠ chat area)
- [x] Nav underline: `calc(100% - 16px)` — tam genişlik deyil, human padding var
- [x] Mobile menu: sağdan gəlir (soldan deyil — Bitrix24 pattern)
- [x] Badge border: navbar bg ilə eynı rəng — "cut-out" effekti (detallı dizayn)
- [x] Icon-lar stroke-based, fill deyil — Bitrix24-ə uyğun yüngüllük
- [x] Tooltip-lər yalnız tablet breakpoint-da — lazımsız yerdə göstərilmir
- [x] NO glassmorphism, NO over-rounded corners, NO shadow-heavy elevation
- [x] FORBIDDEN animations: `ease`, `ease-in-out`, `linear` — yalnız cubic-bezier

---

## 11. Files to Create / Modify

### Yaradılacaq yeni fayllar:
| Fayl | Məzmun |
|------|--------|
| `components/TopNavbar.jsx` | Navbar component (logo, nav items, user section) |
| `components/TopNavbar.css` | Navbar styling |
| `pages/ComingSoon.jsx` | Placeholder page (Feed, Drive, Settings) |
| `pages/ComingSoon.css` | Placeholder styling |

### Dəyişdiriləcək mövcud fayllar:
| Fayl | Dəyişiklik |
|------|------------|
| `App.jsx` | TopNavbar əlavə et, route-lar yenilə (feed, drive, settings), layout restructure |
| `pages/Chat.jsx` | Sidebar import-unu çıxar, layout-u yenilə (sidebar yoxdur) |
| `pages/Chat.css` | `--sidebar-width` silinir, chat layout floating card effekti, content-bg |
| `pages/AdminPanel.jsx` | "Back to Chat" button-u silinir (navbar-da Messages var) |
| `pages/AdminPanel.css` | `ap-page` height dəyişir, layout uyğunlaşdırılır |

### Silinəcək fayllar:
| Fayl | Səbəb |
|------|-------|
| `components/Sidebar.jsx` | Tamamilə ləğv — TopNavbar əvəzləyir |
| `components/Sidebar.css` | Sidebar CSS-i artıq lazım deyil |

---

## 12. Data Consolidation from Sidebar

| Sidebar elementi | TopNavbar-da yeri |
|-----------------|-------------------|
| Logo (chat bubble icon) | `nav-logo-icon` (eyni SVG) |
| Messages nav item | Nav items → "Messages" (icon + text) |
| Contacts nav item | **Silinir** — gələcəkdə ayrıca feature |
| Channels nav item | **Silinir** — Messages içində (conversation list-də var) |
| Settings nav item | Nav items → "Settings" (coming soon) |
| Admin Panel nav item | Nav items → "Admin" (role-based visibility) |
| Logout button | `nav-logout-btn` (sağ tərəfdə) |
| User role check | `NAV_ITEMS` array-da `roles` field ilə |

---

## 13. Handoff Notes for Frontend Developer

1. **TopNavbar App.jsx-ə əlavə olunur** — Chat.jsx və AdminPanel.jsx-dən kənar, global render
2. **Sidebar.jsx tamamilə silinir** — referansları olan bütün fayllar yenilənməlidir
3. **useLocation()** ilə active nav item müəyyənləşdirilir: `pathname.startsWith(item.path)`
4. **Admin item visibility** — `user.role` yoxlanılır, Admin/SuperAdmin deyilsə `NAV_ITEMS`-dan filter olunur
5. **Coming soon pages** — sadə komponent, route əlavə et: `/feed`, `/drive`, `/settings`
6. **Notification badge** — hələ real data yoxdur, hardcoded `0` ola bilər, UI hazır olsun
7. **Mobile menu** — `useState(false)` ilə toggle, body scroll lock (`overflow: hidden`) lazımdır
8. **AdminPanel "Back to Chat"** — silinir, navbar Messages button-u istifadə olunur
9. **Chat.css `--sidebar-width: 60px`** — silinir, bütün referanslar təmizlənir
10. **Content area `#eef1f5` background** — `body` və ya `.app-content` səviyyəsində set olunmalı
11. **Floating panel effekti** — ConversationList və ChatArea-ya `border-radius: 12px` + `box-shadow` əlavə
12. **AdminPanel height** — `100vh` → `flex: 1` (navbar artıq space tutur)
