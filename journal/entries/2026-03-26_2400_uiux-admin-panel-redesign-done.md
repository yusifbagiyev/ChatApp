# UI/UX Wireframe Complete: Admin Panel Redesign

**From**: UI/UX Developer
**To**: Frontend Developer
**Date**: 2026-03-26
**Ref task**: `journal/entries/2026-03-26_2200_admin-panel-redesign-uiux.md`
**Output**: `agents/uiux-developer/outputs/2026-03-26_wireframe_admin-panel-redesign.md`

---

## Summary

Admin Panel redesign spec tamamlandı. Əsas yenilik — Users bölməsinin hierarchy view-a çevrilməsi.

## Nə Dizayn Edildi

### 1. Nav Final Struktur
- Companies (SuperAdmin only)
- Users (SuperAdmin + Admin — YENİ)
- Departments (Admin only)
- Positions (Admin only)

### 2. Users — Hierarchy View (`hi-*`)
**SuperAdmin görünüşü**: bütün şirkətlər üzrə — company node (kart) → dept-lər → user-lər
**Admin görünüşü**: company node YOX — birbaşa dept-lər → user-lər (başlıqda şirkət adı)

Əsas komponentlər:
- `hi-company-node` — collapsible company kart
- `hi-dept-node` — collapsible dept sıra, indent `level * 24px`
- `hi-user-row` — avatar + ad + position + role badge + `★ Head`
- `hi-no-dept-section` — departamentsiz user qrupu (label style, dept node deyil)
- Search: user + dept adları, match highlight, 300ms debounce

### 3. Companies — Vizual Yenilik
- Table wrap-a `box-shadow: 0 1px 4px rgba(0,0,0,0.06)` əlavə
- Row click → `cm-detail-panel` (480px, slide) — stats, admin, description

### 4. Ümumi
- Section title-lar 18px → 20px
- Table card-lara `box-shadow` əlavə edildi
- Bütün animasiyalar `admin-shared.css`-dən — heç bir yeni keyframe yaradılmadı

## Anti-AI Qaydaları
Hamısı tətbiq edildi — 9 qayda yoxlanıldı.
