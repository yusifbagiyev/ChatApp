# Sprint Planning

## Purpose
Select and organize work for the upcoming sprint to maximize team delivery.

## Serves Goals
- Sprint predictability
- Feature delivery

## Inputs
- Latest backlog update from `outputs/`
- Agent capacity and blockers from `journal/entries/`
- Previous sprint results from weekly reviews
- `MEMORY.md` (velocity patterns)

## Process
1. Review previous sprint completion rate
2. Read agent journal entries for capacity and blockers
3. Select top-priority items from backlog that fit sprint capacity
4. Verify each item has: acceptance criteria, assigned agent, dependencies resolved
5. Define sprint goal (one sentence)
6. Order items by dependency chain:
   - Database schema first → Backend API second → Frontend UI third
   - UX design in parallel with database work
7. Identify risks and mitigation plans
8. Write sprint plan

## Outputs
- `outputs/YYYY-MM-DD_sprint-plan.md`
- Journal entry with sprint goal and assignments

## Quality Bar
- Sprint goal is one clear sentence
- Every item has assigned agent and estimated size
- Dependency order is explicit
- No item without acceptance criteria
- Sprint is achievable based on past velocity
