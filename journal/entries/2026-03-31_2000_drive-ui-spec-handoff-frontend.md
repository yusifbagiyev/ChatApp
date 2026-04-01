# Frontend Handoff: Employee Drive — UI/UX Specification

**Date:** 2026-03-31
**From:** UI/UX Developer
**To:** Frontend Developer
**Priority:** P1
**Type:** Design Spec Handoff

---

## Summary

Complete wireframe + CSS specification for the Employee Drive module is ready. Covers all 9 artifacts requested by PO: grid/list views, selection toolbar, details panel, recycle bin, empty states, file type icons, quota component, context menu, and responsive breakpoints.

## Design Spec

**Full specification:** `agents/uiux-developer/outputs/2026-03-31_wireframe_employee-drive.md`

## What's Included

| Section | Content |
|---------|---------|
| Page layout | Desktop + details panel open/closed wireframes |
| Drive header | Title, + Add dropdown, search, recycle bin button, quota icon |
| Toolbar | Breadcrumb navigation, sort dropdown, view toggle (list/medium/large grid) |
| File grid | Card design (folder, image thumbnail, file type), checkbox, drag handle |
| List view | Table layout with sortable columns, row hover/selection |
| Selection toolbar | Dark bar with count, Details/Download/Rename/Move/Delete actions |
| Context menu | Right-click menu, mobile bottom sheet pattern |
| Details panel | 360px slide-in, preview area, metadata rows, download/delete |
| Quota popover | Usage bar (green/yellow/red), breakdown by type |
| Recycle bin | Header, info banner, restore buttons, empty trash |
| Move dialog | Folder tree with indentation, select target |
| Drag & drop | Dashed pulsing border overlay |
| Empty states | Empty drive, empty folder, empty recycle bin |
| Responsive | 3 breakpoints (1024/768/375px) |
| Animations | 14 interaction states with staggered card entrance |

## Key Design Decisions

1. **Floating card layout** — consistent with top navbar redesign (content bg: #eef1f5)
2. **FileTypeIcon reuse** — existing component for file type identification
3. **Selection toolbar** — dark bar (#1e293b) for high contrast
4. **Mobile context menu** — bottom sheet instead of floating at cursor
5. **Quota visualization** — 3-step color (green/yellow/red), not gradient
6. **Card checkbox** — hidden by default, visible on hover/selected (organic UX)
7. **Staggered entrance** — 30ms delay per card on folder navigation

## CSS Class Prefix

All classes use `drive-` prefix. No collisions with existing `ud-`, `ap-`, `cm-`, `um-` namespaces.

## Dependencies

- Existing `FileTypeIcon.jsx` component
- Existing `useFileUpload` hook (adapt for drive uploads, disable compression)
- Backend API: `2026-03-31_1800_drive-module-backend.md`
- Top navbar integration: Drive nav item links to `/drive` route

## Anti-AI Rules Applied

- NO purple colors
- NO `ease`/`linear` animations — cubic-bezier only
- Asymmetric hover effects (border change without shadow on cards)
- Platform-aware patterns (bottom sheet on mobile)
