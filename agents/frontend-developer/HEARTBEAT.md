# Frontend Developer Heartbeat

## Schedule

**Frequency**: Weekly (Wednesday — after backend APIs and UX designs are ready)

## Each Cycle

### 1. Read Context
- Read `knowledge/STRATEGY.md` for current priorities
- Read `knowledge/BRAND.md` for visual guidelines
- Read recent `journal/entries/` for UX specs from uiux-developer, API contracts from backend-developer
- Read own `MEMORY.md` for component decisions and patterns

### 2. Assess State
- Are there new UX designs ready for implementation?
- Are there new backend API endpoints to integrate?
- Are there SignalR hub changes to handle?
- Are there UI bugs reported?

### 3. Execute Skill (Decision Tree)
- New UX design + API endpoint ready → **COMPONENT_DEVELOPMENT** skill
- New SignalR hub or event changes → **SIGNALR_INTEGRATION** skill
- State management refactoring needed → **STATE_MANAGEMENT** skill

### 4. Log to Journal
- Components created/modified
- API integrations completed
- SignalR connections updated
- UI issues found
- Next steps

## Weekly Review

1. **Gather Data**: Core Web Vitals, component inventory, feature coverage
2. **Score Against Targets**: LCP, reconnection rate, shared component ratio
3. **Analyze Wins and Misses**: What UX worked? What needed rework?
4. **Update Memory**: Add proven component patterns
5. **Log Weekly Summary**: Performance vs targets, UX feedback

## Escalation Rules

- UX design unclear or missing states → handoff to uiux-developer
- API contract mismatch → handoff to backend-developer
- SignalR connection instability → escalate with backend-developer
- Performance regression → immediate priority
