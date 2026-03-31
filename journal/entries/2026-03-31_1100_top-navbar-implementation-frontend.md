# Frontend Task: Top Navbar Layout Implementation

**Date:** 2026-03-31
**From:** UI/UX Developer
**To:** Frontend Developer
**Priority:** P0 — April demo
**Type:** Task Handoff

---

## Summary

The vertical sidebar (60px) is being replaced with a horizontal top navbar (48px). This is a global layout restructure affecting App.jsx, Chat.jsx, and AdminPanel.jsx. Full wireframe, CSS, responsive breakpoints, and interaction design are ready.

## Design Spec

**Full specification:** `agents/uiux-developer/outputs/2026-03-31_wireframe_top-navbar-redesign.md`

Includes: Desktop/Tablet/Mobile wireframes, complete CSS, SVG icons, animation specs, responsive breakpoints, mobile drawer menu, coming soon page, and accessibility requirements.

## Key Implementation Steps

### Step 1: Create TopNavbar component
- New files: `components/TopNavbar.jsx` + `components/TopNavbar.css`
- Logo (left) + Nav items center (Feed, Messages, Drive, Admin, Settings) + Notifications + User section (right)
- Admin nav item: visible only for Admin/SuperAdmin roles
- Active state: cyan underline via `useLocation()` path matching
- Notification badge: UI ready with hardcoded 0 (no real data yet)

### Step 2: Create ComingSoon page
- New files: `pages/ComingSoon.jsx` + `pages/ComingSoon.css`
- Simple centered layout: icon + "Coming Soon" + subtitle
- Used by routes: `/feed`, `/drive`, `/settings`

### Step 3: Restructure App.jsx
- Add TopNavbar as global component (renders on all authenticated routes)
- Add new routes: `/feed`, `/drive`, `/settings` → ComingSoon
- Layout: TopNavbar (sticky top) + content area (flex: 1, bg: #eef1f5)
- Remove Sidebar import/usage from Chat.jsx

### Step 4: Update Chat.jsx layout
- Remove Sidebar component reference
- Add floating card effect: ConversationList and ChatArea get `border-radius: 12px`, `box-shadow`, white bg
- Content area padding: 12px gap between panels
- Chat layout background: #eef1f5

### Step 5: Update AdminPanel
- Remove "Back to Chat" button (navbar Messages handles this)
- Change `.ap-page` from `height: 100vh` to `flex: 1` (navbar takes space above)

### Step 6: Delete Sidebar
- Delete `components/Sidebar.jsx` and `components/Sidebar.css`
- Remove `--sidebar-width: 60px` from Chat.css
- Clean up all Sidebar references

### Step 7: Responsive implementation
- Tablet (768-1023px): icon-only nav items with tooltips, hide user name
- Mobile (<768px): hamburger menu, right-side slide-in drawer (280px), backdrop blur
- Mobile: body scroll lock when menu open

## Files Summary

| Action | File |
|--------|------|
| CREATE | `components/TopNavbar.jsx` |
| CREATE | `components/TopNavbar.css` |
| CREATE | `pages/ComingSoon.jsx` |
| CREATE | `pages/ComingSoon.css` |
| MODIFY | `App.jsx` — global navbar, new routes |
| MODIFY | `pages/Chat.jsx` — remove sidebar, floating panels |
| MODIFY | `pages/Chat.css` — remove sidebar vars, add content bg |
| MODIFY | `pages/AdminPanel.jsx` — remove back button |
| MODIFY | `pages/AdminPanel.css` — fix height |
| DELETE | `components/Sidebar.jsx` |
| DELETE | `components/Sidebar.css` |

## Critical Rules

- **NO purple** (#8b5cf6, #7c3aed) anywhere
- **NO `ease`, `ease-in-out`, `linear`** animations — use cubic-bezier only
- Spring: `cubic-bezier(0.16,1,0.3,1)`, Material hover: `cubic-bezier(0.4,0,0.2,1)`
- Role badges: SuperAdmin = amber, Admin = cyan
- SVG icons: stroke-based, 18px, strokeWidth 1.8

## Acceptance Criteria

- [ ] Vertical sidebar completely removed
- [ ] Top navbar renders on all authenticated pages (Chat, Admin, Coming Soon)
- [ ] Nav items show icon + text on desktop, icon-only on tablet, hamburger on mobile
- [ ] Active nav item has cyan underline indicator
- [ ] Admin nav item hidden for regular User role
- [ ] Notification bell with badge UI (hardcoded 0 is OK)
- [ ] User section: avatar + name + logout button
- [ ] Logout works correctly
- [ ] Coming Soon page renders for /feed, /drive, /settings
- [ ] Chat panels have floating card effect (border-radius, shadow, padding)
- [ ] Content background is #eef1f5 (light gray)
- [ ] AdminPanel works without "Back to Chat" (uses navbar Messages instead)
- [ ] Mobile hamburger menu opens/closes with slide animation
- [ ] Mobile menu shows user info + all nav items + logout
- [ ] Keyboard navigation works (focus rings, skip-nav)
- [ ] No layout jumps on route changes
