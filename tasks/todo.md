# ChatApp — Progress Tracker

## Current Focus: Platform Overhaul
**Full requirements**: `agents/product-owner/outputs/2026-03-25_requirement_platform-overhaul.md`

---

## Completed (Phase 1-3)
- [x] Phase 1: React Basics (Steps 1-8)
- [x] Phase 2: Chat UI — Layout, Messages, SignalR, Typing/Online (Steps 9-13)
- [x] Step 14: Channels (CRUD, members, messages, real-time)
- [x] Step 15: File Uploads & Downloads
- [x] Step 17: Search (global + scoped)

---

## Phase 4: Platform Overhaul — IN PROGRESS

### 4.1 Multi-Company System (Backend) — CURRENT
- [ ] Expand Company entity (logo, description, status active/inactive)
- [ ] Update Role enum: User=0, Admin=1, SuperAdmin=2
- [ ] Remove IsSuperAdmin boolean from User entity
- [ ] Add CompanyId to User/Employee (direct company link)
- [ ] Company CRUD endpoints (Super Admin only)
- [ ] Company-scoped queries — all data filtered by company
- [ ] Update GetDepartmentUsersQuery — company-scoped
- [ ] Update UnifiedConversationsController — company-scoped
- [ ] Block cross-company DM creation
- [ ] Block cross-company channel member addition
- [ ] Database migrations

### 4.2 Supervisor/Subordinate Refactor (Backend)
- [ ] EmployeeSupervisor junction table (many-to-many)
- [ ] Remove single SupervisorId from Employee
- [ ] Endpoints: add/remove/list supervisors and subordinates
- [ ] Update organization hierarchy query
- [ ] Migration

### 4.3 Company Management Panel (Frontend)
- [ ] Company list page (Super Admin only)
- [ ] Company CRUD form (name, logo, description)
- [ ] Activate/Deactivate company
- [ ] Assign Company Admin

### 4.4 User Management Panel (Frontend)
- [ ] User list with search/filter/sort
- [ ] User create/edit form
- [ ] Supervisor assignment UI (many-to-many)
- [ ] Role management (Super Admin assigns Admin, Admin assigns User)
- [ ] Activate/deactivate user

---

## Phase 5: Future Features

### Department Visibility (Backend + Frontend)
- [ ] DepartmentVisibility entity and endpoints
- [ ] Department management panel UI

### Department Management Panel (Frontend)
- [ ] Department tree view, CRUD, head assignment

### Position Management Panel (Frontend)
- [ ] Position list, CRUD

### Feed System (New Module)
- [ ] Backend: posts, likes, comments module
- [ ] Frontend: company-wide and department feeds

### Employee Drive (New Module)
- [ ] Backend: personal file storage, folders, sharing
- [ ] Frontend: drive UI

---

## Phase 6: Remaining Frontend Features

### Step 16: Notifications
- [ ] Notification list panel UI
- [ ] Unread count badge, mark read, real-time alerts

### Step 18: Settings
- [ ] Settings panel (notification, privacy, display preferences)

### Sidebar Navigation
- [ ] Contacts, Channels, Settings panel routing

---

## Known Bugs
*(To be reported)*

---

## Decision Log
| Date | Decision | Reason |
|------|----------|--------|
| 2025-02-15 | Blazor WASM → React | UI freezing during real-time chat |
| 2026-02-17 | Bitrix24 style (not WhatsApp) | Corporate use, familiar UI |
| 2026-03-25 | Platform overhaul — multi-company | Corporate clients need company isolation |
| 2026-03-25 | Company visibility CANCELLED | Full isolation — no cross-company interaction |
| 2026-03-25 | 3-tier roles: SuperAdmin, Admin, User | Clear separation of global vs company scope |
| 2026-03-25 | Channel roles separate from system roles | Owner, Administrator, Member — channel-level only |
| 2026-03-25 | Dept visibility & mgmt deferred to future | Focus on company foundation first |

## How to Resume
Say: **"Continue platform overhaul"** — Claude will read this file and the requirements doc.
