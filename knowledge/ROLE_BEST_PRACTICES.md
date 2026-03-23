# Role-Based Best Practices for .NET + React Chat Application

> Researched 2026-03-23. Sources cited at bottom.

---

## 1. Backend Developer (.NET 10 + CQRS + SignalR)

### 1.1 Separate Read and Write Models Explicitly
Create distinct classes for commands (writes) and queries (reads). Commands mutate state and return nothing or a result ID; queries return DTOs and never mutate state. Use MediatR `IRequest<T>` for both, but never mix read and write logic in a single handler.

### 1.2 Use MediatR Pipeline Behaviors for Cross-Cutting Concerns
Register `IPipelineBehavior<TRequest, TResponse>` implementations for validation, logging, and performance monitoring. The pipeline flow is: Request → Validation Behavior → Logging Behavior → Handler → Response. This keeps handlers focused purely on business logic.

### 1.3 Implement FluentValidation via Pipeline Behavior
Create a `ValidationBehavior` that injects all `IValidator<TRequest>` instances, runs them before the handler executes, and throws a custom `ValidationException` with structured error details. This ensures every command/query is validated automatically without polluting handler code.

### 1.4 Use Separate DbContexts for Read and Write Operations
For the write side, use EF Core with full change tracking and rich domain models. For the read side, use a separate read-only DbContext with `AsNoTracking()` by default, or use Dapper with raw SQL for complex queries that benefit from hand-tuned optimization.

### 1.5 Structure as a Modular Monolith with Clear Module Boundaries
Organize code into modules (e.g., `Chat`, `Identity`, `Notifications`) where each module owns its own DbContext, entities, commands, queries, and domain events. Modules communicate only through well-defined interfaces or integration events — never by directly accessing another module's DbContext or internal types.

### 1.6 Use SignalR Groups for Chat Room Management
Map each conversation/room to a SignalR group via `Groups.AddToGroupAsync(Context.ConnectionId, roomId)`. Send messages with `Clients.Group(roomId).SendAsync(...)`. Never use `Clients.All` in a multi-room chat — always scope to the relevant group.

### 1.7 Handle SignalR Reconnection and Group Re-enrollment
SignalR does not persist group membership across reconnects. Override `OnConnectedAsync()` to look up the user's active conversations from the database and re-add them to all relevant groups. Store a mapping of UserId-to-ConnectionId for direct messaging.

### 1.8 Configure a Redis Backplane for Multi-Instance SignalR
When running multiple server instances, add `AddStackExchangeRedis()` to your SignalR configuration so messages are broadcast across all instances. Without a backplane, a message sent on Server A will not reach clients connected to Server B.

### 1.9 Keep SignalR Payloads Small and Use MessagePack
Use MessagePack protocol instead of JSON for SignalR to reduce payload size by ~30%. Keep message DTOs lean — send only `messageId`, `senderId`, `content`, `timestamp`, and `conversationId`. Let the client fetch additional metadata (sender avatar, etc.) from cache.

### 1.10 Use Domain Events for Side Effects
When a message is sent, raise a `MessageSentDomainEvent`. Separate handlers can then update unread counts, send push notifications, and update "last message" previews — all without coupling these concerns into the send-message handler.

### 1.11 Implement Idempotency for Commands
Assign a client-generated `idempotencyKey` (UUID) to each send-message command. Check for duplicates before processing. This prevents double-sends on reconnect or retry scenarios, which are common in real-time chat.

### 1.12 Use EF Core Compiled Queries for Hot Paths
For frequently executed queries (e.g., "get recent messages for conversation"), use `EF.CompileAsyncQuery()` to eliminate the overhead of query translation on every call. This is measurably faster for queries that execute thousands of times per minute.

### 1.13 Implement Rate Limiting per Hub Method
Apply rate limiting on SignalR hub methods (e.g., `SendMessage`) using a sliding window algorithm. A chat app should limit to ~30 messages/minute per user to prevent spam and protect server resources.

---

## 2. Frontend Developer (React 19 + Vite + SignalR)

### 2.1 Create a Singleton SignalR Service Outside React
Instantiate `HubConnectionBuilder` in a standalone TypeScript module, not inside a component. Export the connection instance and wrap it with a `SignalRProvider` using React Context. This prevents reconnection storms caused by component re-renders creating new connections.

```typescript
// signalr.ts — singleton, created once
export const connection = new HubConnectionBuilder()
  .withUrl("/chatHub")
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
  .withHubProtocol(new MessagePackHubProtocol())
  .build();
```

### 2.2 Use Custom Hooks for SignalR Event Subscriptions
Create a `useSignalREvent(eventName, callback)` hook that registers/unregisters handlers using `connection.on()` / `connection.off()` tied to the component lifecycle via `useEffect` cleanup. This prevents memory leaks and duplicate event handlers.

### 2.3 Virtualize the Message List with react-virtuoso
Use `react-virtuoso` (or `react-window` with `VariableSizeList`) for the message list. Chat messages have variable heights, so fixed-size virtualization won't work. `react-virtuoso` handles variable heights, reverse scrolling (newest at bottom), and prepending older messages seamlessly.

### 2.4 Implement Optimistic Updates for Sent Messages
When a user sends a message, immediately append it to the local state with a `pending` status. When the server confirms via SignalR callback, update the status to `sent`. If the server rejects it, mark it as `failed` with a retry option. This makes the UI feel instant.

### 2.5 Use useReducer for Complex Chat State
Manage message lists, typing indicators, read receipts, and connection status with `useReducer` rather than multiple `useState` calls. Define actions like `MESSAGE_RECEIVED`, `MESSAGE_SENT`, `TYPING_START`, `TYPING_STOP`, `CONNECTION_STATE_CHANGED`. This keeps state transitions predictable and debuggable.

### 2.6 Debounce Typing Indicators
When the user types, emit a `UserTyping` event to SignalR, but debounce it to fire at most once every 2-3 seconds. Send a `UserStoppedTyping` event after 3 seconds of inactivity. Never send a typing event on every keystroke — it floods the server and other clients.

### 2.7 Leverage React 19 Compiler — Remove Manual useMemo/useCallback
React 19's compiler auto-memoizes components and values at build time. Remove manual `useMemo`, `useCallback`, and `React.memo` wrappers — they add complexity without benefit when the compiler is enabled. Verify by checking your Vite config includes the React Compiler plugin.

### 2.8 Code-Split by Route and Lazy-Load Heavy Features
Use `React.lazy()` and `Suspense` for routes like Settings, User Profile, and Media Gallery. The core chat view should be in the main bundle; everything else should load on demand. Target <200KB initial JS bundle (gzipped).

### 2.9 Preload Critical Resources with React 19 APIs
Use React 19's built-in `preload()`, `prefetchDNS()`, and `preinit()` for fonts, critical CSS, and hub connection URLs. This reduces First Contentful Paint by preemptively resolving DNS and fetching resources while the initial shell renders.

### 2.10 Implement Infinite Scroll with Cursor-Based Pagination
When the user scrolls up in a conversation, fetch older messages using a cursor (`beforeMessageId`) rather than offset-based pagination. Prepend results to the virtualized list. Cache fetched pages to avoid re-fetching when scrolling back down.

### 2.11 Use Web Workers for Heavy Operations
Offload message search, encryption/decryption, and large JSON parsing to a Web Worker. This keeps the main thread free for smooth scrolling and animations. Use `comlink` for a clean RPC-style API between main thread and worker.

### 2.12 Handle All Connection States Visually
Display a clear banner for each SignalR connection state: `Connected` (hidden), `Reconnecting` (yellow bar: "Reconnecting..."), `Disconnected` (red bar: "Connection lost. Retrying..."). Queue outgoing messages during disconnection and flush them on reconnect.

---

## 3. UI/UX Developer (Chat/Messaging Apps)

### 3.1 Use Distinct Visual Alignment for Sent vs. Received Messages
Sent messages: right-aligned, primary brand color background, light text. Received messages: left-aligned, neutral/gray background, dark text. Include a bubble "tail" pointing toward the sender's side. This two-column layout is universally understood and reduces cognitive load.

### 3.2 Design a Persistent, Accessible Input Bar
The message input bar must remain fixed at the bottom of the viewport at all times. Include: text input with placeholder "Type a message...", a send button (always visible, enabled only when input is non-empty), attachment button, and emoji picker trigger. Minimum touch target: 44x44px.

### 3.3 Implement a Layered Status Indicator System
Show message delivery status with progressive icons: single gray checkmark = sent to server, double gray checkmarks = delivered to recipient's device, double blue checkmarks = read by recipient. Add timestamps that appear on tap/hover to reduce clutter.

### 3.4 Show Typing Indicators with Context
Display "[Name] is typing..." with an animated ellipsis below the last message in the conversation. For group chats: "Alice and Bob are typing..." (2 users) or "3 people are typing..." (3+ users). Auto-dismiss after 4 seconds of inactivity.

### 3.5 Design for Dark Mode from Day One
Use semantic color tokens (`--color-surface-primary`, `--color-text-primary`) instead of hardcoded hex values. Dark mode background: `#121212` (not pure black — reduces eye strain and improves depth perception). Maintain WCAG AA contrast ratio of 4.5:1 minimum for all text.

### 3.6 Make the Conversation List Scannable
Each conversation row must include: avatar (with online/offline indicator), contact name (bold if unread), message preview (truncated to 1 line), timestamp (relative: "2m", "1h", "Yesterday"), and unread count badge. Sort by most recent activity. Include a search bar pinned at the top.

### 3.7 Design Accessible ARIA Markup for Chat
Use `role="log"` on the message container so screen readers announce new messages. Each message should be an `article` element with `aria-label` describing sender and time. The input should have `aria-label="Type a message"`. Announce new messages via `aria-live="polite"` — use "polite" not "assertive" to avoid interrupting the user.

### 3.8 Support Keyboard-Only Navigation
Ensure all actions are reachable via keyboard: `Tab` to move between input, send button, and conversation list; `Enter` to send a message; `Escape` to close modals/pickers; `Arrow keys` to navigate the conversation list. Add visible focus rings on all interactive elements.

### 3.9 Design Responsive Layouts for Mobile and Desktop
Desktop: two-panel layout (conversation list on left, active chat on right). Mobile: single-panel with navigation transitions. Breakpoint at 768px. On mobile, the conversation list and active chat should be separate views with a back button, not a cramped split view.

### 3.10 Use Progressive Disclosure for Rich Features
Hide advanced features (reactions, threading, message editing, file sharing) behind contextual menus that appear on hover (desktop) or long-press (mobile). The primary interaction — reading and sending messages — must remain uncluttered.

### 3.11 Provide Clear Empty States and Onboarding
When a conversation has no messages, show a friendly prompt: "Say hello! Start a conversation." When the conversation list is empty, show: "No conversations yet. Start a new chat." with a prominent call-to-action button. Never show a blank screen.

### 3.12 Animate Transitions with Purpose
New incoming messages: slide up from bottom with 150ms ease-out. Sent messages: fade in at 100ms. Conversation switch: cross-fade at 200ms. Typing indicator: pulsing dots at 600ms interval. Avoid animations >300ms — they feel sluggish in a real-time context.

---

## 4. Database Developer (PostgreSQL + EF Core)

### 4.1 Design a Normalized Schema with Three Core Tables
Use this foundational schema structure:
- `conversations` (id UUID PK, type ENUM('direct','group'), created_at, updated_at)
- `conversation_participants` (conversation_id FK, user_id FK, joined_at, last_read_message_id FK, role ENUM('member','admin'))
- `messages` (id UUID PK, conversation_id FK, sender_id FK, content TEXT, content_type ENUM('text','image','file'), created_at, edited_at, is_deleted BOOLEAN DEFAULT false)

### 4.2 Use Composite Indexes on Foreign Keys + Timestamps
Create these essential indexes for chat query patterns:
```sql
CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_participants_user ON conversation_participants (user_id, conversation_id);
CREATE INDEX idx_messages_sender ON messages (sender_id, created_at DESC);
```
The first index is critical — it powers the "load messages for a conversation, newest first" query that runs on every conversation open.

### 4.3 Partition the Messages Table by Time Range
Use PostgreSQL declarative partitioning on the `messages` table by `created_at`, partitioned monthly. For a chat app, most queries target recent messages, so partition pruning will skip scanning older partitions entirely:
```sql
CREATE TABLE messages (
    id UUID, conversation_id UUID, content TEXT, created_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);
```
Use `pg_partman` to automate monthly partition creation and old partition archival.

### 4.4 Store Timestamps as TIMESTAMPTZ, Never TIMESTAMP
Always use `TIMESTAMPTZ` (timestamp with time zone) in PostgreSQL. This stores UTC internally and converts on retrieval based on the session timezone. Chat apps serve users across time zones — using `TIMESTAMP` without timezone will cause display bugs.

### 4.5 Implement Soft Deletes with an is_deleted Flag
Never hard-delete messages. Use `is_deleted BOOLEAN DEFAULT false` and filter with `WHERE is_deleted = false` in all read queries. Add a partial index: `CREATE INDEX idx_messages_active ON messages (conversation_id, created_at DESC) WHERE is_deleted = false;` — this index is smaller and faster since it excludes deleted rows.

### 4.6 Use BRIN Indexes for Time-Ordered Insert-Heavy Tables
For the `messages` table where rows are inserted in roughly chronological order, BRIN (Block Range Index) indexes on `created_at` are far smaller than B-tree indexes (up to 100x) while providing comparable scan performance for range queries.

### 4.7 Denormalize "Last Message" on the Conversations Table
Add `last_message_id`, `last_message_content_preview`, and `last_message_at` columns to the `conversations` table. Update these via a trigger or application logic on each new message. This avoids an expensive JOIN + ORDER BY + LIMIT 1 subquery every time the conversation list loads.

### 4.8 Use Covering Indexes with INCLUDE for Index-Only Scans
For the conversation list query, create a covering index:
```sql
CREATE INDEX idx_conv_list ON conversation_participants (user_id)
  INCLUDE (conversation_id, last_read_message_id);
```
PostgreSQL can satisfy the entire query from the index without touching the heap, which is significantly faster.

### 4.9 Generate SQL Migration Scripts — Never Auto-Apply in Production
Use `dotnet ef migrations script --idempotent` to generate SQL scripts, then apply them through a controlled CI/CD pipeline. Never use `Database.Migrate()` at application startup in production — if multiple instances start simultaneously, they can corrupt the migration history or cause deadlocks.

### 4.10 Keep Migrations Small, Focused, and Backward-Compatible
One migration per schema change. Never mix table creation with data migration in the same migration file. Use a backward-compatible strategy: (1) add new column with default, (2) deploy code that writes to both old and new, (3) backfill data, (4) deploy code that reads from new, (5) drop old column in a later migration.

### 4.11 Split EF Core DbContext Per Module
Create separate DbContexts (e.g., `ChatDbContext`, `IdentityDbContext`) rather than one massive context. Large DbContexts have measurable startup overhead because EF Core must build the model for all entities at once. Each context should own only the entities relevant to its module.

### 4.12 Use Connection Pooling with PgBouncer
Configure PgBouncer in front of PostgreSQL with transaction-mode pooling. EF Core opens and closes connections frequently; without a pooler, you'll hit PostgreSQL's connection limit (~100 default) quickly under load. Set `Max Pool Size=50` in the connection string and PgBouncer `max_client_conn=200`.

### 4.13 Implement Read Replicas for Query-Heavy Operations
Route all CQRS read queries to a PostgreSQL streaming replica. Configure EF Core with separate connection strings for the read and write DbContexts. This offloads conversation history queries and search from the primary database.

### 4.14 Schedule Regular VACUUM and ANALYZE
Chat apps have high INSERT/UPDATE volume, which creates dead tuples. Configure `autovacuum_naptime = 30s` and `autovacuum_vacuum_scale_factor = 0.05` for the messages table. Run `ANALYZE` after bulk imports to update query planner statistics.

---

## 5. Product Owner (Agile/Chat Product)

### 5.1 Maintain a Refined Backlog of 2-3 Sprints Depth
Always have the next 2-3 sprints worth of user stories refined, estimated, and prioritized. Stories beyond that horizon should remain as epics. Refine stories mid-sprint (not the day before sprint planning) — schedule a 60-minute refinement session every Wednesday.

### 5.2 Write User Stories in Standard Format with Acceptance Criteria
Every story follows: `As a [role], I want to [action], so that [benefit]`. Every story has 3-7 acceptance criteria in Given/When/Then format. Example for a chat feature:

**Story:** As a user, I want to see when someone is typing, so that I know a response is coming.

**Acceptance Criteria:**
- Given I am viewing a conversation, When the other user starts typing, Then I see "[Name] is typing..." within 500ms
- Given a typing indicator is displayed, When the other user stops typing for 3 seconds, Then the indicator disappears
- Given I am in a group chat, When 3+ users are typing, Then I see "3 people are typing..."

### 5.3 Prioritize Using RICE Scoring, Not Gut Feeling
Score each backlog item with RICE: **R**each (how many users affected), **I**mpact (1-3 scale), **C**onfidence (percentage), **E**ffort (person-sprints). RICE Score = (Reach × Impact × Confidence) / Effort. Use this to objectively rank features and defend prioritization decisions to stakeholders.

### 5.4 Define "Done" Explicitly for Chat Features
A chat feature is "Done" when: code is merged to main, unit + integration tests pass, message delivery works in <500ms (measured), the feature works on mobile and desktop viewports, accessibility audit passes (WCAG AA), and the feature has been demo'd to the PO. Write this as a checklist on every story.

### 5.5 Break Epics into Vertical Slices, Not Horizontal Layers
Never create stories like "Build message database" or "Create message API." Instead, slice vertically: "User can send a text message in a 1:1 conversation" — this touches database, API, SignalR, and UI in a single deliverable story. Each story must deliver a testable increment of user value.

### 5.6 Use Sprint Goals, Not Just Story Lists
Define a single Sprint Goal that ties stories together: "Users can have real-time 1:1 conversations" rather than listing 8 unrelated stories. The Sprint Goal guides trade-off decisions when scope pressure arises — if a story doesn't serve the goal, it can be deferred.

### 5.7 Track Velocity Over 3+ Sprints Before Making Commitments
Do not commit to delivery dates based on 1-2 sprints of data. After 3-4 sprints, calculate average velocity and use it for forecasting. If average velocity is 34 story points and the feature epic totals 85 points, forecast 2.5 sprints (not "about 3 sprints").

### 5.8 Write Acceptance Criteria with Measurable Performance Requirements
For a chat app, include non-functional requirements in acceptance criteria: "Message delivery latency must be <500ms p95", "Conversation list must load within 1 second for users with 100+ conversations", "File upload must support files up to 25MB". Vague criteria like "must be fast" are untestable.

### 5.9 Conduct Sprint Reviews with Real Users, Not Just Stakeholders
Invite 2-3 actual users (or beta testers) to every sprint review. Let them use the feature live during the review. Their feedback on chat UX (e.g., "I didn't notice the typing indicator") is more valuable than internal stakeholder opinions.

### 5.10 Use Story Mapping for Feature Discovery
For a chat application, create a story map with horizontal axis = user activities (Register → Find Contact → Start Chat → Send Message → Read Messages → Manage Settings) and vertical axis = depth (MVP on top, enhancements below). This reveals gaps and dependencies that a flat backlog hides.

### 5.11 Apply MoSCoW to Every Sprint's Scope
Classify stories as Must-have (sprint fails without it), Should-have (important but sprint is still viable), Could-have (nice-to-have), Won't-have (explicitly excluded). Must-haves should consume no more than 60% of capacity — the remaining 40% provides buffer for unknowns.

### 5.12 Define MVP as the Minimum Path Through the Chat Flow
For a chat app MVP, define the minimum: user registration/login, 1:1 messaging (text only), conversation list, real-time delivery via SignalR, basic online/offline presence. Everything else (group chat, file sharing, reactions, threading, search) is post-MVP. Resist scope creep by pointing back to this list.

### 5.13 Estimate with Planning Poker Using Fibonacci Scale
Use the Fibonacci sequence (1, 2, 3, 5, 8, 13) for story points. Any story estimated at 13+ must be split. Use a reference story ("Send a text message" = 3 points) as the baseline. The entire team votes simultaneously to avoid anchoring bias.

---

## Sources

### Backend (.NET, CQRS, SignalR)
- [CQRS and MediatR in ASP.NET Core — Code Maze](https://code-maze.com/cqrs-mediatr-in-aspnet-core/)
- [CQRS Pattern With MediatR — Milan Jovanovic](https://www.milanjovanovic.tech/blog/cqrs-pattern-with-mediatr)
- [CQRS Validation with MediatR Pipeline and FluentValidation — Milan Jovanovic](https://www.milanjovanovic.tech/blog/cqrs-validation-with-mediatr-pipeline-and-fluentvalidation)
- [CQRS Validation Pipeline with MediatR and FluentValidation — Code Maze](https://code-maze.com/cqrs-mediatr-fluentvalidation/)
- [ASP.NET Core SignalR Production Hosting and Scaling — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/signalr/scale?view=aspnetcore-9.0)
- [Manage Users and Groups in SignalR — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/signalr/groups?view=aspnetcore-8.0)
- [Scaling SignalR: Scaleout Strategies — Ably](https://ably.com/topic/scaling-signalr)
- [Advanced SignalR Techniques in .NET — NashTech Blog](https://blog.nashtechglobal.com/advanced-signalr-techniques-in-net-scalability-performance-and-custom-protocols/)
- [Efficient Querying — EF Core — Microsoft Learn](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying)
- [Modular Monolith Architecture — Milan Jovanovic](https://www.milanjovanovic.tech/modular-monolith-architecture)
- [Modular Monolith Architecture with .NET — ABP.IO](https://abp.io/architecture/modular-monolith)
- [CQRS and MediatR in ASP.NET Core — codewithmukesh](https://codewithmukesh.com/blog/cqrs-and-mediatr-in-aspnet-core/)

### Frontend (React, SignalR Client)
- [React Performance Optimization: 15 Best Practices for 2025 — DEV Community](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)
- [React 19 Best Practices — DEV Community](https://dev.to/jay_sarvaiya_reactjs/react-19-best-practices-write-clean-modern-and-efficient-react-code-1beb)
- [React 19.2 — React Blog](https://react.dev/blog/2025/10/01/react-19-2)
- [React Architecture Patterns and Best Practices for 2026 — Bacancy](https://www.bacancytechnology.com/blog/react-architecture-patterns-and-best-practices)
- [Building a Real-Time Chat Application with SignalR and React — Medium](https://medium.com/@SuneraKonara/building-a-real-time-chat-application-with-signalr-asp-net-core-and-react-0848be6d6cf9)
- [React Virtuoso — Virtualized List Component](https://virtuoso.dev/)
- [VirtualizedMessageList — Stream Chat React SDK](https://getstream.io/chat/docs/sdk/react/components/core-components/virtualized_list/)

### UI/UX (Chat Design)
- [UI/UX Best Practices for Chat App Design — CometChat](https://www.cometchat.com/blog/chat-app-design-best-practices)
- [16 Chat UI Design Patterns That Work in 2025 — BricxLabs](https://bricxlabs.com/blogs/message-screen-ui-deisgn)
- [Mastering Messaging App UX — Netguru](https://www.netguru.com/blog/messaging-app-ux)
- [Chat UX Best Practices — Stream](https://getstream.io/blog/chat-ux/)
- [Web Chat Accessibility Considerations — Craig Abbott](https://www.craigabbott.co.uk/blog/web-chat-accessibility-considerations/)
- [Webchat Accessibility: WCAG Best Practices — Cognigy](https://www.cognigy.com/product-updates/webchat-accessibility-wcag-best-practices)
- [Best Chat UI Design to Watch in 2025 — Octet Design](https://octet.design/journal/best-chat-ui-design/)

### Database (PostgreSQL, EF Core Migrations)
- [Efficient Schema Design for a Chat App using PostgreSQL — tome01](https://www.tome01.com/efficient-schema-design-for-a-chat-app-using-postgresql)
- [PostgreSQL Index Best Practices — Mydbops](https://www.mydbops.com/blog/postgresql-indexing-best-practices-guide)
- [A Practical Guide to PostgreSQL Indexes — Percona](https://www.percona.com/blog/a-practical-guide-to-postgresql-indexes/)
- [Best Practices for PostgreSQL Table Partition Managing — DEV Community](https://dev.to/carlai/best-practices-for-postgresql-table-partition-managing-n30)
- [PostgreSQL Documentation: Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Best Practices for Applying EF Core Migrations in Production — AssemblySoft](https://services.assemblysoft.com/applying-migrations/)
- [Applying Migrations — EF Core — Microsoft Learn](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying)
- [EF Core Migrations Deep Dive — nhonvo](https://nhonvo.github.io/posts/2025-09-07-ef-core-migrations-deep-dive/)

### Product Owner (Agile)
- [Agile Backlog Grooming Tips for Scrum Product Owners in 2025 — SkillUPed](https://www.skilluped.com/blog/agile-backlog-grooming-scrum-product-owner-2025)
- [Top 8 Product Owner Best Practices in 2025 — StarAgile](https://staragile.com/blog/product-owner-best-practices)
- [Product Owner's Guide to Better Sprint Planning — Parabol](https://www.parabol.co/resources/sprint-planning/)
- [Acceptance Criteria: Purposes, Types, Examples — AltexSoft](https://www.altexsoft.com/blog/acceptance-criteria-purposes-formats-and-best-practices/)
- [Given-When-Then Acceptance Criteria — ParallelHQ](https://www.parallelhq.com/blog/given-when-then-acceptance-criteria)
- [Story Points: How to Estimate User Stories — Asana](https://asana.com/resources/story-points)
- [What Are Story Points — Atlassian](https://www.atlassian.com/agile/project-management/estimation)
- [Building a Strategic Product Backlog in 2026 — Monday.com](https://monday.com/blog/rnd/product-backlog/)
