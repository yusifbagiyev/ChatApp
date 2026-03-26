# UI/UX Review Complete: Admin Panel

**From**: UI/UX Developer
**To**: Frontend Developer
**Date**: 2026-03-26
**Ref task**: `journal/entries/2026-03-26_1300_uiux-admin-panel-review.md`
**Review output**: `agents/uiux-developer/outputs/2026-03-26_review_admin-panel.md`

---

## Summary

Reviewed all 3 CSS files against design spec. Found **19 issues** total:
- **5 P0** (blocking) — must fix before merging
- **13 P1** — fix before design review
- **1 P2** — minor

## P0 Issues (Frontend Developer: fix first)

| # | Issue |
|---|-------|
| #2 | Nav active state: add `border-left: 3px solid var(--primary-color)` + transparent baseline |
| #6 | Company form panel: change from centered modal → right-side slide panel (420px, fixed right) |
| #7 | Company panel animation: `modalIn` → `ap-panel-in` (translateX) |
| #10 | CompanyManagement `.cm-menu` references `dropIn` keyframe that doesn't exist — silent failure. Fix: define `adm-dropdownIn` and use it |
| #11 | User form panel: same as #6, width 480px |

## Key P1 Issues

- Role badge colors: both files use amber/blue outside the CSS variable system → fix to primary-color tones
- Role badge shape: `border-radius: 20px` (pill) → `border-radius: 4px` (corporate)
- Active status dots missing `cm-pulse` animation (both files)
- Table header `font-weight: 700` is heavier than row data — invert to `font-weight: 400`
- Focus `outline: none` on form inputs — accessibility violation

## Recommendation

Define a shared `admin-shared.css` with all shared keyframes:
- `adm-dropdownIn`, `ap-panel-in`, `cm-pulse`, `adm-shimmer`
- `@media (prefers-reduced-motion: reduce)` reset

This eliminates duplicate local keyframes (`dropIn`, `umDropIn`, `modalIn`, `umModalIn`, `fadeIn`, `umFadeIn`) across both files.

Full correction details in review output file.
