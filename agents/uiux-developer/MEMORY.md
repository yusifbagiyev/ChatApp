# UI/UX Developer Memory

> This file is private to the uiux-developer agent. Updated after weekly reviews with confirmed patterns.

## What Works
<!-- Proven design patterns with evidence -->

## What Doesn't Work
<!-- Anti-patterns to avoid with evidence -->

## Patterns Noticed
<!-- Emerging signals needing more data -->

## User Insights
<!-- Behavioral findings, language patterns -->

## Design System Notes

### Proven Patterns (Frontend tərəfindən təsdiqlənib)
- **Dark hero in detail panels**: entity view slide panel-lərinin yuxarısına `linear-gradient(135deg, #1a2332 0%, #243447 100%)` hero section — nav rəngi ilə vizual ardıcıllıq
- **Row accent**: `td:first-child::before` (`position: absolute, width: 3px, scaleY spring`) — `<tr>::before` işləmir
- **Table overflow**: dropdown olan table-wrap → `overflow: visible` (hidden dropdown-ları kəsir)
- **CSS var scope**: `ap-page` root-una yerli dəyişən scope — xarici CSS leak-dən qoruyur
- **scrollbar-gutter: stable**: scroll olan hər container-da — layout shift yoxdur

### Anti-AI Rəng Qaydaları
- Purple (#8b5cf6, #7c3aed) YASAQDIR — heç bir yerdə
- SuperAdmin: `rgba(180,83,9,0.09)` bg + `#b45309` text (dark warm amber)
- Admin: `rgba(47,198,246,0.12)` + `#0891b2`
- User: `#f1f5f9` + `#64748b`

### Animasiya Standartları
- Açılış: `cubic-bezier(0.16, 1, 0.3, 1)` (spring)
- Bağlanış: `cubic-bezier(0.4, 0, 1, 1)` (sürətli)
- Hover: `cubic-bezier(0.4, 0, 0.2, 1)` (material)
- `ease`, `ease-in-out`, `linear` YASAQDIR

## Process Improvements
<!-- How this agent's own workflow should improve -->

## Last Updated
2026-03-27
