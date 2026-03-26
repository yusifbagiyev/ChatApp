# UI/UX Task: Users Page Full Redesign

**From**: Product Owner
**To**: UI/UX Developer
**Date**: 2026-03-27
**Priority**: P1
**Handoff to**: Frontend Developer
**Builds on**: `outputs/2026-03-26_wireframe_admin-panel-redesign.md`

---

## Tələblər

1. Yalnız company-grouped users — standalone user node-ları olmamalıdır
2. Company logo/initials — hər şirkətin avatarı göstərilir
3. User sırasında action shortcuts — bütün əməliyyatlar birbaşa sıradan
4. Partial update — əməliyyatdan sonra səhifə tam yenilənmir
5. Click user → user detail panel (right-side)
6. Click dept → department detail panel (right-side)
7. Modern UI/UX, istifadəsi rahat

---

## 1. Layout — Users Page (SuperAdmin)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Users                                    [🔍 Search users, depts...]    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │ hi-company-node                                                    │   │
│  │ ▼  [1L]  166 Logistics          Head: Aqil Z.    [62 users]       │   │
│  ├───────────────────────────────────────────────────────────────────┤   │
│  │   ▼ 🏗 Engineering              Head: Aqil Z.    [12]      [›]   │   │
│  │   │  ▼ 🏗 Frontend              Head: Aysel H.   [4]       [›]   │   │
│  │   │  │  👤 Aysel H.  Frontend Lead  [User] ★   [✏] [⚙] [•••]   │   │
│  │   │  │  👤 Murad B.  Frontend Dev  [User]      [✏] [⚙] [•••]   │   │
│  │   │  └ 🏗 Backend               Head: Rəşad Ə.  [5]       [›]   │   │
│  │   └ 🏗 Finance                  Head: Leyla M.   [6]       [›]   │   │
│  │                                                                    │   │
│  │   (No department)                                                  │   │
│  │   👤 Aqil Z.  Head of Company   [Admin]         [✏] [⚙] [•••]   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │ ▼  [1E]  156 Evakuasiya         Head: —         [18 users]       │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Company Node (`hi-company-node`)

### Header
```
[chevron]  [logo/initials 36px]  Company Name        Head: Name    [XX users]
```

| Element | Spec |
|---------|------|
| Node container | `background: var(--white); border: 1px solid var(--gray-200); border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 8px; overflow: hidden` |
| Header | `display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; transition: background 150ms` |
| Hover | `background: #f8fafc` |
| Logo | `36px × 36px; border-radius: 8px; object-fit: cover` |
| Initials | hash-based bg, `font-size: 13px; font-weight: 700; color: #fff` |
| Company name | `font-size: 15px; font-weight: 700; color: var(--gray-800)` |
| Head label | `font-size: 12px; color: var(--gray-500)` — `Head: Aqil Z.` |
| Count badge | `background: var(--gray-100); color: var(--gray-500); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; margin-left: auto` |
| Default state | **Expanded** |

---

## 3. Department Node (`hi-dept-node`)

```
[indent]  [chevron]  🏗  Dept Name     Head: Name    [XX]   [›]
```

| Element | Spec |
|---------|------|
| Row | `height: 40px; padding-left: calc(level × 24px + 16px); background: var(--gray-50); border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 150ms; padding-right: 12px` |
| Hover | `background: #f0f9ff` |
| Dept name | `font-size: 13px; font-weight: 600; color: var(--gray-800); flex: 1` |
| Head subtitle | `· Aysel H.` — `font-size: 12px; color: var(--gray-400); margin-left: 4px` |
| Count badge | sağda — `[4]` pill |
| `[›]` detail button | `color: var(--gray-300); font-size: 14px` — hover: `color: var(--primary-color)` — click: dept detail panel açır |

---

## 4. User Row (`hi-user-row`)

```
[indent]  [avatar 28px]  Full Name    Position     [Role]  [★]   [✏] [⚡] [•••]
```

| Element | Spec |
|---------|------|
| Row | `height: 44px; padding-left: [dept-indent + 24px]; padding-right: 12px; display: flex; align-items: center; gap: 10px; background: var(--white); border-bottom: 1px solid var(--border-light); transition: background 150ms` |
| Hover | `background: #f8fafc` — action butonları görünür |
| Name | `font-size: 13px; font-weight: 500; color: var(--gray-800); cursor: pointer` — click: user detail panel açır |
| Position | `font-size: 11px; color: var(--gray-400)` |
| Role badge | Admin: cyan, User: gray |
| `★ Head` | `color: var(--primary-color); font-size: 11px; font-weight: 600` — yalnız dept head-lərə |

### Action Shortcuts

Default: gizli. Row hover-da görünür.

```
[✏ Edit]   [⚡ Quick]   [•••]
```

| Button | Spec |
|--------|------|
| `✏` Edit | `background: none; border: none; padding: 4px 6px; border-radius: 6px; color: var(--gray-400)` — hover: `color: var(--primary-color); background: rgba(47,198,246,0.08)` — click: edit panel açır |
| `⚡` Quick action | Aktiv/deaktiv toggle — `color: #22c55e` (aktiv user) / `color: var(--gray-300)` (deaktiv) — hover: tooltip göstər |
| `•••` Dropdown | Edit, Reset Password, Delete, Activate/Deactivate |

**`•••` Dropdown məzmunu:**
```
┌──────────────────────┐
│ ✏  Edit              │
│ 🔑  Reset Password    │
│ ✓/✗ Activate/Deact.  │
│ ─────────────────    │
│ 🗑  Delete           │  ← danger color, ayrıca
└──────────────────────┘
```

### Action Görünürlük Qaydası

- Hover olmadıqda: action butonları `opacity: 0; pointer-events: none`
- Hover olduqda: `opacity: 1; pointer-events: all; transition: opacity 150ms`
- Dropdown açıq olduqda: həmişə görünür

---

## 5. User Detail Panel (right-side, 440px)

Click on user name → slide panel

```
                    ┌──────────────────────────────────────────┐
                    │ [×]                                       │
                    ├──────────────────────────────────────────┤
                    │  [Avatar 56px]                            │
                    │  Aysel Hüseynova                          │
                    │  Frontend Lead · Frontend Dept  ★ Head   │
                    │  ● Active          [Admin]               │
                    ├──────────────────────────────────────────┤
                    │  Contact                                  │
                    │  ✉  aysel@chatapp.com                    │
                    │  📞  +994501234567                        │
                    ├──────────────────────────────────────────┤
                    │  Organization                             │
                    │  🏢  166 Logistics                        │
                    │  🏗  Frontend (Engineering)               │
                    ├──────────────────────────────────────────┤
                    │  Supervisors                              │
                    │  👤 Aqil Z. — Head of Company            │
                    ├──────────────────────────────────────────┤
                    │  [✏ Edit User]   [Reset Password]        │
                    └──────────────────────────────────────────┘
```

**Spec:**
- `position: fixed; right: 0; top: 0; width: 440px; height: 100vh`
- `animation: ap-panel-in 200ms ease`
- Backdrop: `rgba(0,0,0,0.10)` — click outside → close
- Avatar: 56px circle, hash-based bg
- Section divider-ləri: `border-top: 1px solid var(--gray-100); padding-top: 12px`
- Action buttons: panel altında sticky footer

---

## 6. Department Detail Panel (right-side, 400px)

Click on `[›]` → dept detail panel

```
                    ┌──────────────────────────────────────────┐
                    │ [×]  Frontend                            │
                    ├──────────────────────────────────────────┤
                    │  Parent: Engineering                      │
                    │  Head: Aysel H.          [Change Head]   │
                    ├──────────────────────────────────────────┤
                    │  Stats                                    │
                    │  ┌──────────┐  ┌──────────┐             │
                    │  │ 4 Users  │  │ 0 Sub-   │             │
                    │  │          │  │ depts    │             │
                    │  └──────────┘  └──────────┘             │
                    ├──────────────────────────────────────────┤
                    │  Members                                  │
                    │  👤 Aysel H.  — Frontend Lead  ★ Head   │
                    │  👤 Murad B.  — Frontend Dev             │
                    ├──────────────────────────────────────────┤
                    │  [✏ Edit Department]   [Delete]          │
                    └──────────────────────────────────────────┘
```

**Spec:** eyni slide panel qaydaları, width: 400px

---

## 7. Interaction States

| State | Spec |
|-------|------|
| Action buttons | hover-da görünür, `opacity: 0 → 1; transition 150ms` |
| Dept `[›]` hover | `color: var(--primary-color)` |
| Panel açılması | `ap-panel-in 200ms ease` |
| Partial update | əməliyyatdan sonra yalnız dəyişən node yenilənir |
| `⚡` Activate/Deact. | optimistic update — dərhal vizual dəyişir, xəta olarsa revert |
| Delete confirm | inline confirmation: `[Delete?] [Yes] [No]` — modal deyil |

---

## 8. CSS Naming

```
hi-*  (mövcud)
  hi-company-node, hi-company-header
  hi-dept-node, hi-dept-header
  hi-user-row, hi-user-row--head, hi-user-row--inactive
  hi-actions            — action button group
  hi-action-btn         — individual action button
  hi-action-dropdown    — ••• dropdown
  hi-user-detail-panel  — user detail slide panel
  hi-dept-detail-panel  — dept detail slide panel
  hi-detail-section     — panel section block
  hi-detail-footer      — panel bottom action row
```

---

## 9. Anti-AI Checklist

- [ ] Action butonları yalnız hover-da görünür — statik göstərilmir
- [ ] `⚡` Activate/Deactivate: user statusuna görə rəng dəyişir (yaşıl/boz)
- [ ] Company header-da həm logo/initials, həm Head adı var — ikisi birlikdə
- [ ] Delete: inline confirm (`[Yes] [No]`) — modal popup deyil
- [ ] `[›]` dept detail butonu dept-in expand/collapse-indan ayrıdır
- [ ] Partial update: yalnız dəyişən node re-render olunur, bütün ağac deyil
- [ ] User detail panel: contact, org, supervisors — 3 ayrı section
- [ ] "No department" users: dept node kimi deyil, label altında göstərilir

---

## Output

`agents/uiux-developer/outputs/2026-03-27_wireframe_users-page.md`
