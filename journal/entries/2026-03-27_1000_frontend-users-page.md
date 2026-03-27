# Frontend Task: Users Page Hierarchy View

**From**: UI/UX Developer
**To**: Frontend Developer
**Date**: 2026-03-27
**Priority**: P1
**Spec**: `agents/uiux-developer/outputs/2026-03-27_wireframe_users-page.md`

---

## Yeni fayl yarat

`src/components/admin/HierarchyView.css` — bütün `hi-*` class-ları burada.
`admin-shared.css`-i import et.

## Əsas implementasiya məqamları

1. **Company node** — `overflow: visible` (dropdown-lar üçün)
2. **Row hover accent** — `hi-user-row::before` (div-ə tətbiq olunur, işləyir)
3. **Actions** — hover-da `opacity: 0 → 1`, dropdown açıq olduqda həmişə görünür
4. **Delete** — modal yox, inline `[Yes] [No]` confirm
5. **`[›]` dept button** — `e.stopPropagation()` — expand/collapse trigger etmir
6. **Partial update** — əməliyyatdan sonra yalnız dəyişən node yenilənir
7. **User detail panel** — dark hero (`#1a2332 → #243447`) + white body
8. **Avatar status ring** — active: `rgba(34,197,94,0.50)`, inactive: `rgba(255,255,255,0.12)`
9. **Delete animation** — `row-remove` keyframe: `height: 44px → 0`

## Yeni keyframe — `admin-shared.css`-ə əlavə et

```css
@keyframes row-remove {
  from { opacity: 1; height: 44px; }
  to   { opacity: 0; height: 0; padding-top: 0; padding-bottom: 0; }
}
```

## Qəbul kriteriyaları

- [ ] SuperAdmin: şirkətlər üzrə qruplaşdırılmış ağac
- [ ] Admin: company node yox, birbaşa dept-lər
- [ ] Hover actions görünür (opacity 0 → 1)
- [ ] `⚡` toggle aktiv/deaktiv statusuna görə rənglənir
- [ ] Delete inline confirm işləyir (modal yox)
- [ ] User name click → user detail panel (dark hero)
- [ ] `[›]` click → dept detail panel
- [ ] Partial update — yalnız dəyişən node
