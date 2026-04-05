# Frontend Developer Memory

> This file is private to the frontend-developer agent. Updated after weekly reviews with confirmed patterns.

## What Works
<!-- Proven patterns with evidence — all ChatApp-specific patterns live in CHATAPP_FRONTEND_UX.md -->

## Available Skills

### chatapp-frontend-ux (`skills/CHATAPP_FRONTEND_UX.md`)
- ChatApp-specific UX patterns for Bitrix24-style components
- Covers: dropdown positioning, member picker, sidebar cache (SWR), animations, scrollbar, disabled states
- Common pitfalls: hook order errors, useEffect cleanup with refs, variable initialization order, chip display
- Use when: working on sidebar panels, ChannelPanel, DetailSidebar, member picker, file/media grid, any Bitrix24-style component

### frontend-audit
- `skills/FRONTEND_AUDIT.md` — Workflow, audit phases, report structure, condensed reference
- `skills/AUDIT_CHECKLIST.md` — Full 80+ point checklist across 8 domains
- `skills/ANTI_AI_DESIGN.md` — AI fingerprints, font pairing library, color palette recipes, texture/depth patterns
- `skills/PERFORMANCE_GUIDE.md` — Memory leaks, React re-renders, CSS performance, N+1 patterns, bundle optimization
- Use when: reviewing components, catching performance issues, ensuring UI doesn't look AI-generated

## ⛔ Kritik Qaydalar — Pozulması Qəbuledilməzdir

### Never mark a task as done without verifying every item
- **Incident 1 (2026-03-28):** `file-upload-permission-frontend.md` task was given — `hasPermission` helper and avatar upload permission checks were required. **NONE were implemented**, task was completely ignored.
- **Incident 2 (2026-03-29):** File storage restructure was done on backend, but frontend never appended `conversationId`/`channelId` to FormData — all uploaded files went to wrong folder (`drive/`). Backend was correct, frontend failed to send context.
- **Rule:** Read every item in every task. Implement every item. Never mark incomplete work as complete.
- **Verification:** After finishing, open each file, confirm the change is there. Use `grep` to verify. Test the actual behavior — check that files land in the correct folder.
- **Final warning issued (2026-03-29).** Further incidents are unacceptable.

## What Doesn't Work
<!-- Anti-patterns to avoid with evidence -->

### Virtual Scrolling — FORBIDDEN
- Never use `react-virtual`, windowing, or any virtualization library
- **Reason:** Tried multiple times, caused scroll breakage and other UI issues
- **Alternative:** `React.memo`, `useMemo`, `useCallback`, debounce/throttle, cursor-based pagination

### DTO Field Names — Always verify in backend before writing frontend
- `UserDetailDto`, `UserListItemDto`, `UserSearchResultDto`, `SupervisorDto`, `SubordinateDto` all use **`position`** (not `positionName`)
- `SupervisorDto` uses **`userId`** (not `id`) — normalize on load: `id: s.id ?? s.userId`
- `UserDetailDto` has **`companyId`** field (needed for company-scoped API calls)
- Rule: Before using `user.someField` in JSX, open the DTO file and confirm the exact camelCase field name
- Wrong field → shows "—" silently with no error, extremely hard to notice

### Search vs List — Two different endpoints, different contracts
- `GET /api/users` → paginated list, no search support, returns `List<UserListItemDto>` (direct array, not `{ items }`)
- `GET /api/users/search?q=...` → full-text search, returns `List<UserSearchResultDto>` (direct array), **minimum 2 chars** (returns `[]` for 1 char silently)
- Never pass `?search=...` to the list endpoint — it silently ignores it
- Frontend must enforce the 2-char minimum: `q.length >= 2 ? searchUsers(q) : getUsers({ pageSize: 50 })`
- Both return direct arrays — use: `d?.items ?? (Array.isArray(d) ? d : [])`

### Backend search minimum constraints — mirror on frontend
- When backend has minimum length / format constraints on inputs, always enforce the same on frontend
- Silent empty responses (no error, just `[]`) are the hardest bugs to diagnose
- Check the query handler for early returns: `if (searchTerm.Length < 2) return empty`

### Enum serialization — always send integers, never strings
- Backend has NO global `JsonStringEnumConverter` — only camelCase naming policy
- All enums must be sent as integers: `Role` (User=0, Admin=1, SuperAdmin=2), `ChannelType` (Public=1, Private=2), `MemberRole` (Member=1, Admin=2, Owner=3)
- Exception: `NodeType` in OrganizationHierarchyNodeDto has local `[JsonConverter(typeof(JsonStringEnumConverter))]` — reads as string
- Pattern: `const ROLE_VALUES = { User: 0, Admin: 1, SuperAdmin: 2 }; role: ROLE_VALUES[role] ?? 0`

### Password validation rules — backend requires all of these
- Minimum 8 characters (NOT 6)
- At least one uppercase letter: `/[A-Z]/`
- At least one lowercase letter: `/[a-z]/`
- At least one number: `/[0-9]/`
- At least one special character: `/[^a-zA-Z0-9]/`
- Applies to: CreateUser, AdminChangePassword, ChangePassword (user self-service)
- Always validate ALL rules on frontend before API call — `extractErrorMessage` in api.js will surface backend messages if missed

## Audit Nəticəsi Qaydaları (2026-04-05)

### Timer/Listener Cleanup — HƏR ZAMAN
- `setTimeout`, `setInterval` qaytardığı ID-ləri ref-ə yaz
- useEffect cleanup-da `clearTimeout(ref.current)` çağır
- document-ə əlavə olunan `mousemove`, `mouseup` listener-ləri `dragCleanupRef` pattern ilə izlə
- **Yoxlama:** Hər yeni timer/listener yaratdıqda özünə soruş: "unmount olsa nə olacaq?"

### State Updater Funksiyalar — PURE OLMALIDIR
- `setState(prev => { apiCall(); return prev; })` YASAQDIR — side effect yoxdur!
- API çağırışları setState-dən KƏNARDA olmalıdır
- Current state lazımdırsa → ref istifadə et (`selectedChatRef.current`)
- **Nümunə:** K5 bug — `setSelectedChat` daxilində `apiGet` çağırılırdı → StrictMode-da dublikat

### apiPost/apiPut body undefined — Yoxlama MÜTLƏQ
- `apiPost(endpoint)` body olmadan çağırıldıqda `JSON.stringify(undefined)` → `"undefined"` göndərir
- FIX: `body !== undefined` yoxlaması — body yoxdursa Content-Type header da olmamalı
- **Nümunə:** K1 bug — 12 yerdə body olmadan apiPost çağırılırdı

### SignalR connection — Reconnect zamanı null etmə
- `onreconnecting` callback-ində `connection = null` YAZMA
- Connection hələ keçərlidir, yalnız `onclose`-da null olmalıdır
- **Nümunə:** K2 bug — reconnect zamanı getConnection() null qaytarırdı

### useCallback — ConversationList prop-ları
- ConversationList-ə ötürülən handler-lar `useCallback` olmalıdır
- `selectedChat` dep-dən çıxart → functional updater `setSelectedChat(prev => ...)` istifadə et
- **Nümunə:** P3 — handleToggle* funksiyalar hər render-də yeni ref → lazımsız re-render

### Duplikat toast — Yoxla
- İki ardıcıl `showToast()` çağırışı → istifadəçi iki toast görür
- **Nümunə:** K6 — eyni xəta üçün iki toast (biri ingilis, biri azərbaycan dilində)

### Z-index — İKİ SCOPE VAR, QARIŞDIRMA!
- **Global** (`index.css :root`): `--z-navbar`, `--z-panel`, `--z-overlay`, `--z-modal`, `--z-toast` — UserProfilePanel, TopNavbar kimi global komponentlər üçün
- **Chat-lokal** (`Chat.css .chat-page`): `--zc-panel`, `--zc-float`, `--zc-dropdown`, `--zc-sidebar`, `--zc-popup`, `--zc-modal`, `--zc-popover` — Chat daxili komponentlər üçün
- Chat daxilindəki komponent (MessageBubble, PinnedBar, DetailSidebar...) → `--zc-*` istifadə et
- Chat xaricindəki və ya fixed-position overlay (UserProfilePanel, TopNavbar) → `--z-*` istifadə et
- **KRİTİK:** Eyni adlı variable iki scope-da fərqli dəyərlə mövcuddur → QARIŞDIRMAQ OLMAZ!
- **Nümunə:** `--z-panel: 2` (Chat.css) vs `--z-panel: 400` (index.css) — UserProfilePanel navbar altında qaldı

### Shimmer keyframe — VAHİD
- Yeni shimmer yaratma → `shimmer` keyframe `index.css`-dədir, onu istifadə et
- Login.css-nin öz `loginShimmer`-i var (fərqli animasiya)

### Responsive — @media query MÜTLƏQ
- Sabit px ölçülər (350px, 400px, 380px) → `calc(100vw - Xpx)` + `max-width`
- Admin table-lar → `overflow-x: auto` wrapper
- Tree indent → `Math.min(level, 6)` cap

### Touch target — 44px minimum
- Kiçik düymələr (20-28px) → `::before` pseudo-element ilə 44px touch area
- Vizual ölçü dəyişmir, toxunma sahəsi böyüyür

### İstifadəçiyə göstərilən mesajlar — YALNIZ İNGİLİS DİLİNDƏ
- `showToast()`, `setActionError()`, `setInviteError()` — bütün xəta/warning/info mesajları İNGİLİS dilində olmalıdır
- Azərbaycanca xəta mesajı YASAQDIR (istifadəçiyə göstərilən hər şey ingilis dilində)
- Comment-lər Azərbaycanca ola bilər, amma istifadəçiyə görünən string-lər — yalnız ingilis dili
- **Nümunə:** "Üzvü silmək mümkün olmadı" → "Failed to remove member"

### O(n²) loop-lar — useMemo ilə pre-compute
- `array.filter()` hər row üçün → O(n²). Əvvəlcədən Map/Set yarat
- **Nümunə:** P5 — `depts.filter(d => d.parentDepartmentId === dept.id).length` hər sətirdə

### Panel Bağlanma Animasiyası — Standart Pattern
- Hər panel/modal/sidebar üçün **açılma + bağlanma** animasiyası olmalıdır
- Pattern: `closing` state → CSS animasiya → `onAnimationEnd` → həqiqi `onClose()`
- **JSX tərəf:**
  ```jsx
  const [closing, setClosing] = useState(false);
  const handleAnimatedClose = useCallback(() => { if (!closing) setClosing(true); }, [closing]);
  const onAnimEnd = useCallback((e) => { if (closing && e.animationName === "xyzOut") onClose(); }, [closing, onClose]);
  // className-ə closing əlavə et, onAnimationEnd={onAnimEnd}
  ```
- **CSS tərəf:**
  - Overlay: `overlayFadeOut` (Chat.css-dədir, paylaşılan)
  - Modal: `modalScaleOut` (Chat.css-dədir, paylaşılan)
  - Slide panel: öz `xxxSlideOut` keyframe-i (UPP → `uppSlideOut`, DS → `dsSlideOut`)
  - Layout-a təsir edən panel (DetailSidebar): `max-width` animasiyası istifadə et, `translateX` deyil (background flash problemi)
  - Overlay paneli (UserProfilePanel): `translateX` istifadə et (layout-a təsir etmir)
- **Tətbiq olunan panellər:** DetailSidebar, UserProfilePanel, ForwardPanel, ReadersPanel, FilePreviewPanel, ImageViewer
- Escape key, close button, overlay click — hamısı `handleAnimatedClose()` çağırmalıdır, birbaşa `onClose()` yox

## Patterns Noticed
<!-- Emerging signals needing more data -->

## Component Decisions
<!-- Why certain patterns were chosen -->

## Performance Insights
- Chat.jsx 4436 sətir — P1/P2 refactoring hələ gözləyir (ayrı task)
- MessageBubble inline closure-lar — Y3 optimization (React.memo + useCallback) gözləyir
- X4: Empty state SVG (160 sətir) ayrı komponent olmalıdır — gözləyir

## Process Improvements
<!-- How this agent's own workflow should improve -->

## Last Updated
- 2026-04-05: Panel bağlanma animasiyası pattern-i əlavə olundu (6 panel)
- 2026-04-05: Frontend audit nəticəsi — 78 problemdən 65+ həll olundu, qaydalar əlavə olundu
- 2026-03-27: Added DTO field name verification rule, search vs list endpoint contract, backend constraint mirroring
