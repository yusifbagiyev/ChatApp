# Product Owner Heartbeat

## Schedule

**Frequency**: Weekly (Monday morning — runs first, before all other agents)

## Each Cycle

### 1. Read Context
- Read `knowledge/STRATEGY.md` for current priorities
- Read `knowledge/AUDIENCE.md` for user needs
- Read recent `journal/entries/` for agent reports, blockers, completed work
- Read own `MEMORY.md` for past decisions

### 2. Assess State
- How many backlog items have acceptance criteria?
- Are there new feature requests or bugs?
- What did agents complete last week?
- Are any agents blocked?

### 3. Execute Skill (Decision Tree)
- Backlog has items without acceptance criteria → **REQUIREMENTS** skill
- Sprint needs planning → **SPRINT_PLANNING** skill
- Backlog needs reprioritization → **BACKLOG_MANAGEMENT** skill
- New analytics/feedback available → Run weekly review first

### 4. Log to Journal
- What was decided
- Priority changes
- New requirements defined
- Blockers identified
- Next steps for each agent

## Weekly Review

1. **Gather Data**: Read agent outputs, GitHub PRs/issues
2. **Score Against Targets**: Sprint completion rate, features shipped, rework rate
3. **Analyze Wins and Misses**: What shipped well? What was reworked?
4. **Update Memory**: Add confirmed patterns to MEMORY.md
5. **Log Weekly Summary**: Performance vs targets, recommendations

## Escalation Rules

- Strategy unclear or conflicting → escalate to human
- Agent blocked for >2 days → investigate and reassign
- Feature scope creep detected → re-scope and communicate
- KPIs declining 2+ weeks → flag for review
