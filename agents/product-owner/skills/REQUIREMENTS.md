# Requirements Definition

## Purpose
Transform feature ideas into clear, implementable requirements with acceptance criteria.

## Serves Goals
- Requirement quality
- Clear backlog

## Inputs
- `knowledge/STRATEGY.md` (priorities)
- `knowledge/AUDIENCE.md` (user personas, pain points)
- `journal/entries/` (agent feedback, user signals)
- Feature request or idea

## Process
1. Read current strategy priorities
2. Identify which user persona this feature serves
3. Define the user story: "As a [persona], I want [action] so that [outcome]"
4. List acceptance criteria (testable, specific)
5. Identify which agents are involved (backend, frontend, database, uiux)
6. Define data requirements (what needs to be stored/retrieved)
7. Define UI requirements (what the user sees and does)
8. List dependencies and prerequisites
9. Estimate scope: Small / Medium / Large

## Outputs
- `outputs/YYYY-MM-DD_requirement_[feature-slug].md`
- Journal entry with requirement summary

## Quality Bar
- Every requirement has ≥3 acceptance criteria
- Each acceptance criterion is testable (pass/fail)
- User persona explicitly named
- Data requirements clear enough for database-developer
- UI requirements clear enough for uiux-developer
- No ambiguous language ("should", "might", "could" → "must", "will")
