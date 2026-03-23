# Database Developer Heartbeat

## Schedule

**Frequency**: Weekly (Tuesday — after product-owner sets priorities, before backend implements)

## Each Cycle

### 1. Read Context
- Read `knowledge/STRATEGY.md` for current priorities
- Read recent `journal/entries/` for requirements from product-owner, performance reports
- Read product-owner `outputs/` for feature data requirements
- Read own `MEMORY.md` for schema decisions and optimization patterns

### 2. Assess State
- Are there new features needing schema design?
- Are there slow queries reported?
- Are there pending migrations to review?
- Is there schema debt to address?

### 3. Execute Skill (Decision Tree)
- New feature with data requirements → **SCHEMA_DESIGN** skill
- Slow query reports or performance issues → **QUERY_OPTIMIZATION** skill
- Schema changes approved, ready to migrate → **MIGRATION_MANAGEMENT** skill

### 4. Log to Journal
- Schema designs created
- Migrations planned or executed
- Performance improvements made
- Cross-module data considerations
- Next steps

## Weekly Review

1. **Gather Data**: Slow query logs, migration history, index usage stats
2. **Score Against Targets**: Slow queries count, index coverage, migration success rate
3. **Analyze Wins and Misses**: Which optimizations worked? Which schemas needed revision?
4. **Update Memory**: Add proven schema patterns, index strategies
5. **Log Weekly Summary**: Performance vs targets, data integrity notes

## Escalation Rules

- Schema change affects multiple modules → coordinate with backend-developer
- Migration requires data transformation → plan rollback strategy first
- Query can't be optimized at DB level → discuss caching with backend-developer
- Data integrity issue discovered → immediate priority, escalate to human
