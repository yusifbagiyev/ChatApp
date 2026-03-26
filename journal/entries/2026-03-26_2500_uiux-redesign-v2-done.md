# UI/UX Redesign v2 Complete — Anti-AI Overhaul

**From**: UI/UX Developer
**To**: Frontend Developer
**Date**: 2026-03-26
**Output**: `agents/uiux-developer/outputs/2026-03-26_redesign_admin-panel-v2.md`
**Supersedes**: əvvəlki bütün admin panel spec-ləri

---

## Nə Dəyişdi

Əvvəlki spec-lər standart AI şablonu kimi görünürdü. v2-də:

- **Nav**: dark slate sidebar (#1a2332) — ağ nav, content area-dan vizual olaraq ayrılır
- **Rənglər**: Purple tamamilə silindi. SuperAdmin → dark amber (#b45309). Slate tonları.
- **Animasiyalar**: `ease` / `ease-out` → `cubic-bezier(0.16, 1, 0.3, 1)` spring. Panel açılışında field stagger.
- **Section keçidi**: Crossfade + translateX (section-leave / section-enter keyframes)
- **Hover**: Sol-dan gələn 3px accent bar (scaleY animasiyalı) + blue-tinted background
- **Action toolbar**: Hover-da slide-in icon-lar (stagger 0/30/60ms) — həmişə görünən ••• deyil
- **Tree**: Real CSS connecting lines (pseudo-elements) — sadə padding deyil
- **Status dot**: Halo pulse (box-shadow animation) — sadə opacity deyil
- **Form focus**: box-shadow glow — outline: 2px deyil
- **Skeleton**: Hierarchy struktur əks olunur (company→dept→user)
- **Search**: [/] keyboard shortcut hint

## Frontend Developer üçün Priority Sırası

1. `admin-shared.css` yenilə — yeni keyframes (section-leave/enter, panel-out, field-in, status-pulse)
2. Nav sidebar rəngini dəyişdir (#1a2332)
3. Role badge rənglərini düzəlt (purple → dark amber)
4. Table row hover-a ::before accent əlavə et
5. Action toolbar-ı implement et (hover-triggered)
6. Section keçid animasiyasını React-də implement et
7. Status dot halo animasiyası
8. Tree connector CSS lines
