# ChatApp — Lessons & Rules (All Agents Must Read This)

> These are battle-tested rules from real development. Every rule has a story behind it — a bug that was shipped, time that was wasted, or a pattern that proved itself. Follow these without exception.

## Architecture Rules

### 1. CQRS Pattern is Sacred
- Controller → `IMediator.Send()` → Handler → Repository/UnitOfWork
- **NEVER** inject repositories into controllers
- **NEVER** put business logic in controllers
- Every Command/Query must have a FluentValidation validator
- Handlers return `Result<T>` (never throw for expected failures)

### 2. Module Isolation is Absolute
- No cross-module foreign keys in database
- No direct C# references between module assemblies
- Cross-module communication: `IEventBus` (domain events) only
- Cross-module data reads: read-only `UserReadModel` mapped with `ExcludeFromMigrations()`

### 3. EF Core Entity Patterns
- **NEVER** use `record` types for entities — EF Core can't translate constructor calls in LINQ
- **ALWAYS** use `class` with `init` or `private set` properties + object initializer in projections
- Backing field pattern (`private readonly List<T> _items`) works for **new** entities but causes `DbUpdateConcurrencyException` on **tracked** entities — use `ValidateOnly + Repository.AddAsync` pattern instead
- **NEVER** use `AsNoTracking()` if you plan to modify the entity later

### 4. Enum Serialization
- C# enums serialize as **integers** by default
- **NEVER** add `JsonStringEnumConverter` globally in `AddJsonOptions` — breaks all enums across all modules
- If a specific enum needs string serialization: `[JsonConverter(typeof(JsonStringEnumConverter))]` attribute on that enum only

## Frontend Rules

### 5. Service Layer is Mandatory
- All REST calls go through `src/services/api.js` — never use `fetch()` directly
- All SignalR connections go through `src/services/signalr.js` — never create `HubConnection` elsewhere
- `credentials: "include"` on every fetch (BFF pattern)

### 6. React Hook Safety
- **ALWAYS** check if a variable is `useState` or `useMemo` before calling `setXxx()` — useMemo has no setter
- `function` keyword is hoisted, `const useCallback` is NOT — if converting function→useCallback, ensure dependencies are declared ABOVE it in code
- After adding new hooks (useState, useEffect), do full page refresh (Ctrl+F5) — HMR crashes are expected, not bugs
- `try-catch-finally`: if `setState(true)` is outside try block but `setState(false)` is in finally, any error between them leaves state stuck

### 7. Performance Patterns
- List components: wrap in `React.memo()` — prevents re-renders from parent state changes
- Callbacks passed to children: wrap in `useCallback()` — otherwise memo is useless
- Expensive computations (filtering, sorting): wrap in `useMemo()`
- **NEVER** put inline objects/functions in JSX props of memoized children: `style={{ color: 'red' }}` creates new reference every render

### 8. CSS Rules
- Every new component gets its own CSS file: `ComponentName.css`
- Import in component: `import "./ComponentName.css"`
- **NEVER** add styles to Chat.css — only `:root` variables and shared animations stay there
- If CSS change doesn't work → check browser DevTools for inline `style={}` from React — it overrides CSS
- `aspect-ratio` + `max-height` together causes browser to shrink width proportionally — use `aspect-ratio: auto !important` to override

### 9. SignalR Patterns
- **NEVER** send same event to both group AND direct connections — receiver gets it twice
- Remove `LogDebug` calls in high-traffic handlers (SignalR, messaging) — overhead in production
- Dead code: if a SignalR group is joined/left but never receives notifications, remove the join/leave
- Tab visibility: pause reconnection when `document.hidden === true`

## Backend-Frontend Integration Rules

### 10. Always Verify Configuration
- **NEVER** trust frontend comments about backend values — always read `appsettings.json` directly
- Backend URL is `http://localhost:7000` (verified from launchSettings.json)
- JWT access token lifetime: 15 minutes (not 30 — frontend timer must be 12 minutes, not 25)
- Before writing ANY URL/port: verify from config files. Never guess.

### 11. Optimistic Updates
- Pending messages use `temp-${uuidv4()}` IDs
- Server response merges with temp message via ID matching
- Cache invalidation: `messageCacheRef.current.delete(chatId)` on new SignalR message
- Race condition guard: `requestId` pattern — compare on response, ignore stale

### 12. File Upload Pattern
- Use XHR (not fetch) for progress tracking
- `FormData` for multipart upload
- AbortController for cancel support
- 2-minute timeout (`xhr.timeout = 120000`)
- Max file size: 100 MB, max batch: 20 files

## Process Rules

### 13. Before Writing Code
- Read the existing implementation pattern first — don't invent new patterns
- Check Blazor implementation if unsure — ChatApp was migrated from Blazor
- Look at how similar features are already implemented in the same module

### 14. Optimization First Principle
- After any fix: pause and ask "is there a more optimal solution?"
- Workarounds (normalize everywhere) < Root cause fixes (fix at source)
- Delete unnecessary code — don't comment out, delete
- If your code change didn't fix the problem and the issue is elsewhere, REVERT your unnecessary changes

### 15. Import Verification
- When using utility functions in new JSX sections: verify they are imported in THIS file, not just in child components
- Missing import → `ReferenceError` → React 18 unmounts entire tree → blank white page
- Debug tip: blank white page = unhandled render error. Check browser console (F12) first.

### 16. Stale Closure Prevention
- Use `useRef` for values accessed in SignalR/setTimeout handlers: `selectedChatRef.current`
- Use functional updater in setState: `setState(prev => ...)` instead of relying on closure value
- Use `requestId` pattern for async race conditions

## Anti-Patterns (Never Do These)

| Anti-Pattern | Why | Do Instead |
|-------------|-----|-----------|
| `record` for EF entities | Can't translate constructor in LINQ | `class` with `init` properties |
| Global `JsonStringEnumConverter` | Breaks all enums | `[JsonConverter]` on specific enum |
| `fetch()` directly | Bypasses auth, error handling | Use `api.js` service |
| Inject repo into controller | Breaks CQRS pattern | Inject `IMediator` only |
| `console.log` for debugging | Stays in production | Use Serilog structured logging |
| Sleep-retry loops | Masks real issues | Fix root cause |
| Cross-module FK | Breaks module isolation | Use read-only model + event bus |
| `git push --force` to main | Loses team work | Create branch + PR |
| Inline styles for permanent CSS | Hard to maintain, breaks cache | Use CSS class in component file |
| `LogDebug` in SignalR handlers | Parse overhead on every call | Only `Warning/Error` level |
