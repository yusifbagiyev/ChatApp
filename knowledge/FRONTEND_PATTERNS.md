# Frontend Developer — ChatApp Code Patterns

> This document teaches the frontend-developer agent exactly how to write React code in this project. Every pattern is extracted from the real codebase.

## API Service Pattern (api.js)

```javascript
// Core fetch wrapper — all requests go through this
async function apiFetch(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",  // ALWAYS — BFF pattern
        headers: { "Content-Type": "application/json", ...options.headers }
    });

    if (res.status === 401) {
        await refreshToken();  // Singleton promise — prevents duplicate refresh
        return apiFetch(endpoint, options);  // Retry once
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
}

// GET with retry (1x, 1s delay)
export async function apiGet(endpoint) { ... }

// POST/PUT/DELETE without retry (idempotency risk)
export async function apiPost(endpoint, body) { ... }
```

**Rules:**
- ALL REST calls go through api.js — never `fetch()` directly
- `credentials: "include"` on every request (cookie auth)
- 401 → refresh token → retry once (singleton promise prevents race)
- GET retries 1x with 1s delay; POST/PUT/DELETE throw immediately
- `sessionExpired` kill switch stops all requests after logout

## SignalR Service Pattern (signalr.js)

```javascript
let connection = null;           // Active HubConnection
let connectionPromise = null;    // Promise guard (prevents duplicate connections)
let stopRequested = false;       // Kill switch for logout

export async function startConnection(accessTokenFactory) {
    if (connectionPromise) return connectionPromise;  // Already connecting
    if (stopRequested) return null;

    connectionPromise = (async () => {
        const conn = new HubConnectionBuilder()
            .withUrl(`${HUB_URL}`, { accessTokenFactory: getSignalRToken })
            .withAutomaticReconnect([0, 1000, 2000, 5000, 5000, 10000, 30000, 60000])
            .build();
        await conn.start();
        connection = conn;
        return conn;
    })();

    return connectionPromise;
}
```

**Rules:**
- Singleton connection — only one active at a time
- `connectionPromise` prevents race conditions
- `stopRequested = true` on logout — prevents auto-reconnect
- Tab visibility aware: pause reconnect when `document.hidden === true`
- Network online event: `window.addEventListener('online')` → immediate reconnect

## Context Pattern

```javascript
// AuthContext.jsx — global auth state
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { checkAuth(); }, []);

    const login = useCallback(async (email, password, rememberMe) => {
        resetSessionExpired();
        await apiPost("/api/auth/login", { email, password, rememberMe });
        const userData = await apiGet("/api/users/me");
        setUser(userData);
        scheduleRefresh();
    }, []);

    const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**Rules:**
- `useMemo()` wraps provider value (prevents unnecessary consumer re-renders)
- `useCallback()` for functions in value
- Loading state → show spinner until `isLoading === false`
- ProtectedRoute redirects to /login when `user === null && !isLoading`

## Custom Hook Pattern

```javascript
// useSidebarPanels.js — encapsulates sidebar state + data loading
export default function useSidebarPanels({ selectedChatRef, ... }) {
    const [showFavorites, setShowFavorites] = useState(false);
    const [favoriteMessages, setFavoriteMessages] = useState([]);
    const filesRequestIdRef = useRef(0);  // Race condition guard

    const loadFileMessages = useCallback(async (chat, tab, existing, beforeUtc) => {
        const requestId = ++filesRequestIdRef.current;
        setFilesLoading(true);
        const data = await apiGet(`/api/...`);
        if (filesRequestIdRef.current !== requestId) return;  // Stale response
        setFileMessages(prev => [...prev, ...data]);
        setFilesLoading(false);
    }, []);

    return { showFavorites, favoriteMessages, loadFileMessages, ... };
}
```

**Rules:**
- One concern per hook
- `useRef` for values accessed in callbacks/closures (prevent stale closure)
- `requestId` pattern for async race conditions
- Functional updater `setState(prev => ...)` to avoid stale closure
- Return object with state + functions

## Component Pattern

```javascript
// ChatHeader.jsx — memo wrapped, props-driven
const ChatHeader = React.memo(function ChatHeader({
    selectedChat, onlineUsers, pinnedMessages, onSidebarToggle, ...
}) {
    const isOnline = onlineUsers.has(selectedChat?.otherUserId);

    return (
        <div className="chat-header">
            <div className="chat-header-avatar">
                {selectedChat.avatarUrl
                    ? <img src={getFileUrl(selectedChat.avatarUrl)} alt="" />
                    : <span style={{ backgroundColor: getAvatarColor(selectedChat.name) }}>
                        {getInitials(selectedChat.name)}
                      </span>
                }
            </div>
            ...
        </div>
    );
});

export default ChatHeader;
```

**Rules:**
- `React.memo()` for components that receive props from parent
- Utility functions: `getInitials()`, `getAvatarColor()`, `getFileUrl()` from `chatUtils.js`
- Verify imports exist in THIS file (not just child components)
- Always provide `key` prop in lists (use entity `id`, never array index)

## Message State Management

```javascript
// Chat.jsx — optimistic message pattern
const handleSendMessage = useCallback(async () => {
    const tempId = `temp-${uuidv4()}`;
    const optimisticMsg = {
        id: tempId, content: messageText, senderId: user.id,
        senderFullName: user.fullName, createdAtUtc: new Date().toISOString(),
        status: 0  // Pending
    };

    // 1. Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMsg]);
    setShouldScrollBottom(true);

    // 2. Send to server
    const result = await apiPost(getChatEndpoint(chatId, chatType, "/messages"), { content: messageText });

    // 3. Server's SignalR event will merge with temp message via ID matching
}, [messageText, user]);
```

**Message cache pattern:**
```javascript
const messageCacheRef = useRef(new Map());  // chatId → { messages, pinnedMessages, hasMore, timestamp }
// TTL: 5 minutes, max: 10 chats
// Invalidate on new SignalR message: messageCacheRef.current.delete(chatId)
```

## CSS Architecture

```css
/* Each component has own CSS file */
/* Naming: .kebab-case, BEM-inspired */
.chat-header { ... }
.chat-header-avatar { ... }
.chat-header-actions { ... }

/* Animations — defined in Chat.css (shared) */
@keyframes dropdownIn {
    from { opacity: 0; transform: scaleY(0.92) translateY(-4px); }
    to { opacity: 1; transform: scaleY(1) translateY(0); }
}

/* Z-index scale (NEVER use arbitrary values) */
/* 1: internals → 10: dropdowns → 100: panels → 200: modals → 5000: popovers → 99999: toasts */

/* Button states (standard across all buttons) */
.btn { transition: all var(--transition-fast); }
.btn:hover { background: lighter-color; }
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Loading skeleton (CSS-only, no extra HTML) */
.loading-skeleton::before, .loading-skeleton::after {
    content: "";
    height: 36px; border-radius: 6px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
}
```

## Dropdown Positioning Pattern (Bitrix24)

```javascript
// Viewport-aware positioning — never hardcode left/right
useEffect(() => {
    if (!menuId) return;
    const btn = document.querySelector(`[data-id="${menuId}"] .more-btn`);
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const spaceBottom = window.innerHeight - rect.bottom;

    setMenuPos({
        top: spaceBottom < 200 ? rect.top - menuHeight : rect.bottom,
        left: spaceRight < 200 ? rect.left - menuWidth : rect.right,
    });
}, [menuId]);
```

**Bitrix24 style rule:** Inline dropdowns under inputs (position: absolute), NOT floating overlays (position: fixed centered).

## SignalR Event Handling (useChatSignalR)

```javascript
useEffect(() => {
    const conn = getConnection();
    if (!conn || !userId) return;

    const handleNewMessage = (message, chatIdField) => {
        const chatId = message[chatIdField];
        // Duplicate check
        if (_lastProcessedMsgId === message.id) return;
        _lastProcessedMsgId = message.id;
        // Cache invalidation
        messageCacheRef.current.delete(chatId);
        // Update messages
        setMessages(prev => {
            // Merge with optimistic temp message
            const tempIdx = prev.findIndex(m => m.id?.startsWith?.("temp-"));
            if (tempIdx >= 0) { prev[tempIdx] = message; return [...prev]; }
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
        });
    };

    conn.on("NewDirectMessage", msg => handleNewMessage(msg, "conversationId"));
    conn.on("NewChannelMessage", msg => handleNewMessage(msg, "channelId"));

    return () => {
        conn.off("NewDirectMessage");
        conn.off("NewChannelMessage");
    };
}, [userId]);
```

## Performance Best Practices

1. **React.memo** all list item components (MessageBubble, ConversationItem)
2. **useCallback** for all functions passed as props to memoized children
3. **useMemo** for expensive computations: `favoriteIds = new Set(messages.map(m => m.id))`
4. **useRef** for non-render data: drafts, timers, cache, scroll positions
5. **Functional updater** in setState: `setState(prev => ...)` (not closure value)
6. **requestAnimationFrame** for scroll compensation after reactions
7. **Debounce** search inputs (300ms) and typing indicators (2000ms)
8. **Virtual scrolling** consideration for 100+ item lists
9. **Code splitting** with `React.lazy()` for routes
10. **AbortController** for fetch cleanup on unmount
