# UI/UX Wireframe Complete: Department & Position Management

**From**: UI/UX Developer
**To**: Frontend Developer
**Date**: 2026-03-26
**Ref task**: `journal/entries/2026-03-26_1900_uiux-department-position-wireframe.md`
**Output**: `agents/uiux-developer/outputs/2026-03-26_wireframe_dept-position.md`

---

## Summary

Wireframe and interaction spec complete for two new Admin Panel sections.

## What's Designed

### Nav Update
- 2 new nav items added after Users: Departments, Positions (Admin + SuperAdmin)

### Department Management (`dm-*`)
- List view: flat list with hierarchy indentation (`├`/`└` tree chars, `padding-left: 28px` for children)
- Root vs child rows: different font-weight to signal hierarchy
- Head cell: `—` clickable when unassigned → opens Assign Head panel
- Form panel: 420px right-side slide panel (NOT modal)
- Assign Head panel: 380px — shows current head + remove + user search + assign
- Delete protection: disabled + tooltip when dept has members or sub-departments

### Position Management (`pm-*`)
- List view: name + department badge + actions
- Department badge: rectangular tag (`border-radius: 8px`) — visually distinct from role badges
- Filter: by department (All / No Department / [specific dept])
- Form panel: 420px right-side slide — name, department select (optional), description
- Delete protection: disabled + tooltip when position has members

## Design Decisions

- **No tree expand/collapse** — flat list with indentation (MVP simplicity, < 50 depts typical)
- **No pagination on departments** — load all at once (small dataset)
- **Head assignment separate from form** — cleaner create flow, assign head via `•••` action
- **"No Department" in positions** — company-wide positions (CEO, CTO) are valid; shown as `—` not a badge

## Anti-AI Rules Applied
All 10 checked — see spec for details.

## Shared Resources
All keyframes reused from `admin-shared.css` (no new keyframes needed).
