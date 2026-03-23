# Backend Developer Heartbeat

## Schedule

**Frequency**: Weekly (Tuesday — after product-owner sets priorities)

## Each Cycle

### 1. Read Context
- Read `knowledge/STRATEGY.md` for current priorities
- Read recent `journal/entries/` for requirements from product-owner, schemas from database-developer
- Read product-owner `outputs/` for latest requirements
- Read own `MEMORY.md` for technical decisions and patterns

### 2. Assess State
- Are there new requirements ready for implementation?
- Are there pending code reviews?
- Are there failing tests?
- Has database-developer delivered new schemas?

### 3. Execute Skill (Decision Tree)
- New feature requirement ready + schema available → **API_DEVELOPMENT** skill
- Code submitted by other contributors → **CODE_REVIEW** skill
- Test coverage below target → **TESTING** skill
- Real-time feature needed → **SIGNALR_DEVELOPMENT** skill

### 4. Log to Journal
- What was implemented
- API endpoints created/modified
- Technical decisions made
- Blockers or dependencies needed
- Next steps

## Weekly Review

1. **Gather Data**: Test coverage reports, API error rates, response times
2. **Score Against Targets**: Coverage %, error rate, p95 response time
3. **Analyze Wins and Misses**: What worked? What caused issues?
4. **Update Memory**: Add proven patterns, technical decisions
5. **Log Weekly Summary**: Performance vs targets, technical debt notes

## Escalation Rules

- Requirements unclear → handoff to product-owner
- Schema change needed → handoff to database-developer
- Breaking change across modules → escalate to human
- Test failures blocking deployment → immediate priority
