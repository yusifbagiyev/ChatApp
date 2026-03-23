# Backlog Management

## Purpose
Maintain a prioritized, groomed backlog that reflects current strategy and user needs.

## Serves Goals
- Clear backlog
- Feature delivery

## Inputs
- `knowledge/STRATEGY.md` (current priorities)
- `journal/entries/` (completed work, blockers, new discoveries)
- Existing backlog items in `outputs/`
- Agent weekly review summaries

## Process
1. Read current strategy priorities
2. Review all existing backlog items
3. Remove or archive items no longer aligned with strategy
4. Reprioritize based on: user impact, strategic alignment, dependencies
5. Identify items missing acceptance criteria → schedule REQUIREMENTS skill
6. Group related items that should ship together
7. Flag blocked items and identify who can unblock them
8. Write updated backlog summary

## Outputs
- `outputs/YYYY-MM-DD_backlog-update.md`
- Journal entry with priority changes and reasoning

## Quality Bar
- Every item has priority rank (P0-P3)
- No item without assigned agent
- Blocked items have clear unblock path
- Backlog reflects current strategy (no stale items)
