# React Migration - Progress Tracker

## Current Status: Step 6 COMPLETE — Auth Context Done
**Last Updated:** 2026-02-16
**Next Step:** Step 7 - Routing + Protected Routes (react-router)

---

## What Was Learned So Far
- JSX, components, export/import
- `useState` — state variables (email, password, isLoading, errorMessage, showPassword, rememberMe)
- Events — `onChange`, `onSubmit`, `onClick`
- Conditional rendering — `{condition && (...)}` and `{condition ? (...) : (...)}`
- Form handling — `e.preventDefault()`, `e.target.value`, `e.target.checked`
- `fetch` API — POST request with `credentials: 'include'` for cookies
- CSS-only changes don't require JSX changes (separation of concerns)
- `createContext` — global state yaratmaq (like CascadingAuthenticationState)
- `useContext` — istənilən komponentdən context-ə daxil olmaq (like @inject)
- `useEffect(() => {}, [])` — mount olanda 1 dəfə işləyir (like OnInitializedAsync)
- `children` prop — wrapper komponent patterı (like @Body / RenderFragment)
- BFF pattern React-də dəyişmir — `credentials: 'include'` cookie-ni avtomatik göndərir

## What Exists So Far
```
chatapp-frontend/
  src/
    pages/
      Login.jsx       ← Login page (useState, fetch, form handling)
      Login.css        ← Modern glassmorphism UI
    context/
      AuthContext.jsx  ← Global auth state (user, login, logout, checkAuth)
    App.jsx            ← AuthProvider wrapper + user/login switch
    main.jsx           ← Entry point (untouched)
    index.css          ← CSS reset (minimal)
```

---

## Phase 1: React Basics (learned through real ChatApp features)
- [x] Step 1: Install Node.js
- [x] Step 2: Create React project (`npm create vite@latest chatapp-frontend`)
- [x] Step 3: Understand project structure (every file explained)
- [x] Step 4: First component - what is JSX?
- [x] Step 5: Login Page (props, state, events, forms) ✅
- [x] Step 6: Auth Context (shared state, useContext, useEffect) ✅
- [ ] Step 7: Routing + Protected Routes (`react-router`)
- [ ] Step 8: API Service Layer (fetch with credentials)

## Phase 2: Chat App UI (WhatsApp Style)
- [ ] Step 9: Layout - Sidebar + Chat Panel
- [ ] Step 10: Conversation list component
- [ ] Step 11: Message list component
- [ ] Step 12: Message input component
- [ ] Step 13: Styling (CSS approach decision)

## Phase 3: Real-time Features
- [ ] Step 14: SignalR connection (`/hubs/chat` with JWT token)
- [ ] Step 15: Real-time messaging (send/receive live)

## Phase 4: Full Features
- [ ] Step 16: Channels (CRUD, members, messages)
- [ ] Step 17: Direct Messages (conversations, messages)
- [ ] Step 18: File uploads & downloads
- [ ] Step 19: Notifications
- [ ] Step 20: Search
- [ ] Step 21: Settings (theme, privacy, notifications)
- [ ] Step 22: User management & profiles

---

## Step 7 Plan: Routing + Protected Routes
Next session will build:
1. Install `react-router-dom`
2. `src/App.jsx` — Route setup (Login, Chat layout)
3. Protected Route component — login olmayan useri Login-ə redirect et
4. New concepts: `BrowserRouter`, `Routes`, `Route`, `Navigate`, `useNavigate`

## Decision Log
| Date | Decision | Reason |
|------|----------|--------|
| 2025-02-15 | Blazor WASM → React | UI freezing during real-time chat, single-thread limitation |
| 2025-02-15 | Vite as build tool | Fast, modern, lightweight |
| 2025-02-15 | JavaScript (not TypeScript) | User is learning React from scratch, keep it simple first |
| 2025-02-15 | Skip demo steps, learn through real features | User prefers learning by building actual ChatApp |
| 2025-02-15 | No register page | All users registered by admin only |

## Backend API Reference
- **Base URL:** `http://localhost:7000`
- **Auth:** Cookie-based session (`_sid`), JWT stored server-side (BFF pattern)
- **SignalR Hub:** `/hubs/chat` (auth via query string `?access_token={token}`)
- **CORS Origins:** `http://localhost:5300`, `http://localhost:5301`, `http://localhost:5173`
- **Modules:** Identity, Channels, DirectMessages, Files, Notifications, Search, Settings

## How to Resume
When starting a new session, say: **"Continue React migration"**
Claude will read this file and continue from the next unchecked step.
