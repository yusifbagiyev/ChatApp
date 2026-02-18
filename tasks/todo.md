# React Migration - Progress Tracker

## Current Status: Step 13 COMPLETE — Typing Indicator + Online Status
**Last Updated:** 2026-02-18
**Next Step:** Step 14 - Channels (CRUD, members, messages)

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
- `react-router-dom` — client-side routing (like Blazor @page)
- `BrowserRouter` — URL izləyici wrapper (like Blazor <Router>)
- `Routes` + `Route` — URL-ə komponent bağlamaq (like @page "/login")
- `Navigate` — avtomatik redirect komponent (like NavigationManager.NavigateTo)
- `useNavigate` — koddan redirect hook (like @inject NavigationManager)
- ProtectedRoute pattern — login olmayan useri redirect et
- React hooks qaydası — hook-lar həmişə şərtli return-dan əvvəl olmalıdır
- API Service Layer — mərkəzləşdirilmiş fetch wrapper (like HttpClient in .NET)
- `named export` vs `default export` — bir fayldan çoxlu şey export edəndə named, bir şey export edəndə default
- Utility functions — təkrarlanan kodu bir yerə yığmaq (DRY prinsipi)
- `.map()` — array-dən JSX render etmək (like @foreach in Blazor)
- `key` prop — React hər list elementinə unikal key istəyir (performance üçün)
- Template literals — `` `text ${variable}` `` (like C# $"text {variable}")
- C# enum serialization — backend `JsonStringEnumConverter` olmadan enum-u rəqəm kimi göndərir (0, 1, 2)
- `style={{ }}` — inline CSS (like Blazor style attribute)
- Hash-based color — user adından sabit rəng generasiya etmək
- Date formatting — `toLocaleDateString()`, `toLocaleTimeString()` (like .NET ToString("HH:mm"))
- Conditional chaining — `selectedChat?.id` (like C# null-conditional ?.)
- `useRef` vs `useState` — ref dərhal dəyişir (sinxron flag), state növbəti render-ə gözləyir
- `useLayoutEffect` — paint-dən əvvəl DOM manipulyasiya (scroll bərpası)
- `flushSync` — state update-ini dərhal sinxron render etmək
- Infinite scroll — hasMore flag + loadingMore ref + cursor-based pagination (before param)
- Scroll position restore — scrollHeight fərqi + useLayoutEffect

## What Exists So Far
```
chatapp-frontend/
  src/
    pages/
      Login.jsx       ← Login page (useState, fetch, form handling)
      Login.css        ← Modern glassmorphism UI
      Chat.jsx         ← Bitrix24 messenger layout (sidebar + conversations + chat)
      Chat.css         ← Bitrix24 style CSS (3-column layout)
    context/
      AuthContext.jsx  ← Global auth state (user, login, logout, checkAuth)
    services/
      api.js           ← Centralized fetch wrapper (apiGet, apiPost)
    App.jsx            ← AuthProvider + Routes + ProtectedRoute
    main.jsx           ← BrowserRouter wrapper
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
- [x] Step 7: Routing + Protected Routes (`react-router`) ✅
- [x] Step 8: API Service Layer (fetch with credentials) ✅

## Phase 2: Chat App UI (Bitrix24 Style)
- [x] Step 9: Layout + Real Data (sidebar, conversations, messages) ✅
- [x] Step 10: Message sending + Infinite scroll up ✅
- [x] Step 11: SignalR real-time connection ✅
- [x] Step 12: Real-time messaging (send/receive live) ✅
- [x] Step 13: Typing indicator + online status + file refactoring ✅

## Phase 3: Full Features
- [ ] Step 14: Channels (CRUD, members, messages)
- [ ] Step 15: File uploads & downloads
- [ ] Step 16: Notifications
- [ ] Step 17: Search
- [ ] Step 18: Settings (theme, privacy, notifications)
- [ ] Step 19: User management & profiles

---

## Step 9 Review: What Was Built
1. **3-column layout**: Sidebar (60px) + Conversation list (380px) + Chat panel (flex)
2. **Real API integration**: `GET /api/unified-conversations` for conversation list
3. **Message loading**: Click conversation → `GET /api/conversations/{id}/messages`
4. **Bitrix24 CSS**: Avatar colors, unread badges, date separators, message bubbles
5. **Bug fixes**: enum comparison (number not string), template literal backticks

## Step 10 Review: What Was Built
1. **Message sending**: Enter key / Send button → `POST /api/conversations/{id}/messages`
2. **Infinite scroll up**: Yuxarı scroll → köhnə mesajlar yüklənir (cursor-based, `before` param)
3. **Scroll position restore**: `useLayoutEffect` + `flushSync` — tullanma olmadan
4. **hasMoreRef**: Backend boş array qaytaranda daha request göndərilmir
5. **loadingMoreRef**: `useRef` flag ilə sonsuz request problemi həll edildi
6. **shouldScrollBottom**: Yalnız conversation seçəndə / mesaj göndərəndə aşağı scroll

## Step 11+12 Review: What Was Built
1. **signalr.js service**: SignalR connection management (start, stop, join/leave groups)
2. **JWT auth for SignalR**: `GET /api/auth/signalr-token` → `accessTokenFactory`
3. **Auto-reconnect**: `withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])`
4. **Race condition fix**: `connectionPromise` pattern — eyni anda 2 bağlantı yaranmaz
5. **Event listeners**: `NewDirectMessage`, `NewChannelMessage` — real-time mesaj alma
6. **Duplicate prevention**: `prev.some(m => m.id === message.id)` — eyni mesaj 2 dəfə görünmür
7. **Group management**: `JoinConversation/LeaveConversation` — conversation-a qoşulma/ayrılma
8. **API fallback**: SignalR olmasa da, mesaj göndərəndə API-dən yenidən yükləyir

## Step 13 Review: What Was Built
1. **Online status**: SignalR `UserOnline`/`UserOffline` events + `GetOnlineStatus` hub method
2. **Typing indicator**: `TypingInConversation`/`TypingInChannel` with debounce (2s timeout)
3. **Header layout**: Bitrix24 style — name + online/last seen/typing on same row, position below
4. **File refactoring**: Chat.jsx split into Sidebar, ConversationList, MessageBubble, chatUtils

## Decision Log
| Date | Decision | Reason |
|------|----------|--------|
| 2025-02-15 | Blazor WASM → React | UI freezing during real-time chat, single-thread limitation |
| 2025-02-15 | Vite as build tool | Fast, modern, lightweight |
| 2025-02-15 | JavaScript (not TypeScript) | User is learning React from scratch, keep it simple first |
| 2025-02-15 | Skip demo steps, learn through real features | User prefers learning by building actual ChatApp |
| 2025-02-15 | No register page | All users registered by admin only |
| 2026-02-17 | Bitrix24 style (not WhatsApp) | User's company uses Bitrix24, familiar UI |

## Backend API Reference
- **Base URL:** `http://localhost:7000`
- **Auth:** Cookie-based session (`_sid`), JWT stored server-side (BFF pattern)
- **SignalR Hub:** `/chat` (auth via query string `?access_token={token}`)
- **CORS Origins:** `http://localhost:5300`, `http://localhost:5301`, `http://localhost:5173`
- **Modules:** Identity, Channels, DirectMessages, Files, Notifications, Search, Settings
- **Enum serialization:** Numbers (not strings) — 0=Conversation, 1=Channel, 2=DepartmentUser
- **MessageStatus:** 0=Pending, 1=Sent, 2=Delivered, 3=Read, 4=Failed

## How to Resume
When starting a new session, say: **"Continue React migration"**
Claude will read this file and continue from the next unchecked step.
