# ChatApp — Project Context (All Agents Must Read This)

## What Is ChatApp?

A production-grade, real-time messaging platform (Slack/Bitrix24 style) for companies. Supports channels, direct messages, file sharing, mentions, reactions, search, notifications, and user/role management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10, ASP.NET Core, C# |
| Architecture | Modular Monolith + Clean Architecture + DDD |
| CQRS | MediatR 14 + FluentValidation |
| Real-time | SignalR (WebSocket) |
| Auth | JWT + HttpOnly cookies + Redis session store (BFF pattern) |
| Database | PostgreSQL 15 + Entity Framework Core 10 |
| Cache | Redis 7 (distributed) + MemoryCache (local) |
| Frontend | React 19.2 + Vite 8 + JavaScript (no TypeScript) |
| Routing | React Router DOM 7.13 |
| CSS | Plain CSS, per-component files, no Tailwind/SCSS |
| Reverse Proxy | Nginx |
| Monitoring | Prometheus + Grafana + Loki + Promtail |
| Containers | Docker + Docker Compose |

## Module Structure (7 Modules)

| Module | Purpose | Key Entities |
|--------|---------|-------------|
| Identity | Auth, users, companies, departments, roles, permissions | User, Employee, Company, Department, Position, Permission, RefreshToken |
| Channels | Group messaging (public/private) | Channel, ChannelMessage, ChannelMember, ChannelReaction |
| DirectMessages | 1-to-1 messaging | DirectConversation, DirectMessage |
| Files | File upload/download/storage | File |
| Notifications | Real-time alerts | Notification |
| Search | Full-text message/channel search | (uses other module contexts) |
| Settings | User profiles, preferences | UserSettings |

## Backend Architecture Pattern

Every module follows **Domain → Application → Infrastructure → Api**:

```
ChatApp.Modules.{Module}.Domain/          → Entities, value objects, enums, domain events
ChatApp.Modules.{Module}.Application/     → Commands, Queries, DTOs, Validators, Handlers
ChatApp.Modules.{Module}.Infrastructure/  → DbContext, Repositories, UnitOfWork, Configurations, Migrations
ChatApp.Modules.{Module}.Api/             → Controllers, Hubs, Module DI registration
```

Shared code:
- `ChatApp.Shared.Kernel` → Entity base class, Result<T>, DomainEvent, interfaces
- `ChatApp.Shared.Infrastructure` → Redis, Session, EventBus, Auth, SignalR hubs, Middleware

## Frontend Architecture

```
chatapp-frontend/src/
├── pages/          → Chat.jsx, Login.jsx (page-level components)
├── components/     → ChatHeader, MessageBubble, ConversationList, etc. (each with own .css)
├── context/        → AuthContext.jsx, ToastContext.jsx (global state)
├── hooks/          → useChatSignalR, useSidebarPanels, useChannelManagement, etc. (logic extraction)
├── services/       → api.js (REST), signalr.js (WebSocket)
├── utils/          → chatUtils.js (pure functions), emojiConstants.js
├── App.jsx         → Routes + AuthProvider + ToastProvider
└── main.jsx        → Entry point
```

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| Blazor WASM → React | UI freezing during real-time chat (single-thread limitation) |
| JavaScript (not TypeScript) | Owner is learning React from scratch, simplicity first |
| BFF pattern (no JWT in localStorage) | Security — tokens stored server-side in Redis |
| Modular Monolith (not Microservices) | Single deployment unit, module isolation via DbContext boundaries |
| Plain CSS (not Tailwind) | Bitrix24 style, per-component CSS files |
| No Redux/Zustand | Context + custom hooks sufficient for this scale |
| Bitrix24 style UI (not WhatsApp) | Owner's company uses Bitrix24, familiar layout |
| Comments in Azerbaijani | Owner's preference; errors/warnings/logs in English |

## API Configuration

| Setting | Value |
|---------|-------|
| Backend URL | `http://localhost:7000` |
| React Vite port | `5173` |
| CORS origins | `http://localhost:5300`, `http://localhost:5301`, `http://localhost:5173` |
| SignalR hubs | `/hubs/chat` |
| Auth cookie | `_sid` (HttpOnly) |
| JWT access token | 15 min lifetime |
| JWT refresh token | 30 day lifetime |
| SignalR keep-alive | 15 seconds |
| SignalR client timeout | 30 seconds |
| Max message size | 1 MB |
| Max file upload | 100 MB |

## Enum Serialization (CRITICAL)

Backend uses C# enums as **integers** (not strings) unless explicitly annotated:
```
ChannelType: Public=1, Private=2
MemberRole: Owner=1, Admin=2, Member=3
MessageStatus: Pending=0, Sent=1, Delivered=2, Read=3, Failed=4
ConversationType: Conversation=0, Channel=1, DepartmentUser=2
```

**Never use `JsonStringEnumConverter` globally** — it breaks all enums. Only use `[JsonConverter]` attribute on specific enums that need string serialization.

## Database Conventions

- Table names: **snake_case** (`channel_messages`, `channel_members`)
- Column names: **snake_case** (`created_at_utc`, `sender_id`)
- C# entity names: **PascalCase** (`ChannelMessage`, `ChannelMember`)
- Primary keys: **GUID** (`Guid Id`)
- Timestamps: **UTC** (`DateTime CreatedAtUtc`, `DateTime UpdatedAtUtc`)
- Column type for timestamps: `timestamp with time zone`
- Entity configuration: **Fluent API** (not Data Annotations)
- Each module has its own **isolated DbContext** — no cross-module foreign keys
- Cross-module data access: **read-only model** mapped to external table with `ExcludeFromMigrations()`

## SignalR Event Names

| Event | Direction | Description |
|-------|-----------|-------------|
| NewDirectMessage | Server → Client | New DM received |
| NewChannelMessage | Server → Client | New channel message |
| MessageEdited | Server → Client | Message content updated |
| MessageDeleted | Server → Client | Message deleted |
| MessageRead | Server → Client | Message read receipt |
| UserOnline | Server → Client | User came online |
| UserOffline | Server → Client | User went offline |
| TypingInConversation | Server → Client | User typing in DM |
| TypingInChannel | Server → Client | User typing in channel |
| ReactionToggled | Server → Client | Emoji reaction added/removed |
| MessagePinToggled | Server → Client | Message pinned/unpinned |

## Key Constants (Frontend)

```javascript
MESSAGE_PAGE_SIZE = 30
CONVERSATION_PAGE_SIZE = 50
TYPING_DEBOUNCE_MS = 2000
MESSAGE_MAX_LENGTH = 10000
MAX_FILE_SIZE = 100 * 1024 * 1024
MAX_BATCH_FILES = 20
HIGHLIGHT_DURATION_MS = 3000
```

## CSS Variable System

```css
--primary-color: #2fc6f6
--bubble-own: #e9fecb
--bubble-other: var(--white)
--selected-chat: #00ace3
--transition-fast: 150ms ease
--transition-base: 200ms ease
--z-base: 1 → --z-toast: 99999
--radius-sm: 6px, --radius-md: 8px, --radius-lg: 12px
```

## Progress Status

- Backend: **Complete and working** (do not modify unless performance improvement needed)
- Frontend: **Active migration** — see `tasks/todo.md` for current step
- Currently at: Step 14 (Channels) — Steps 14-19 remaining
