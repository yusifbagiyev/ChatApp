# Admin Panel Redesign — Wireframe & Interaction Spec

**Agent**: UI/UX Developer
**Date**: 2026-03-26
**Task ref**: `journal/entries/2026-03-26_2200_admin-panel-redesign-uiux.md`
**Handoff to**: Frontend Developer
**Builds on**: `outputs/2026-03-26_wireframe_admin-panel.md`, `outputs/2026-03-26_wireframe_dept-position.md`

---

## 1. Admin Panel Nav — Final Structure

```
┌──────────────────────┐
│  ap-nav (220px)      │
│                      │
│  🏢  Companies       │  ← SuperAdmin only
│  👥  Users           │  ← SuperAdmin + Admin (YENİ)
│  🏗  Departments     │  ← Admin only
│  💼  Positions       │  ← Admin only
│                      │
└──────────────────────┘
```

Nav item CSS spec dəyişmir — mövcud `ap-nav-item` qaydaları tətbiq edilir:
- Default: `color: var(--gray-600); border-left: 3px solid transparent`
- Hover: `background: var(--gray-100); color: var(--gray-900)`
- Active: `background: rgba(47,198,246,0.10); border-left-color: var(--primary-color); color: var(--primary-color); font-weight: 600`

---

## 2. Ümumi Redesign Qaydaları (Bütün Bölmələr)

Bu qaydalar bütün Admin Panel komponentlərinə tətbiq edilir:

| Element | Yeni Dəyər |
|---------|-----------|
| Section title | `font-size: 20px; font-weight: 700; color: var(--gray-800)` |
| Table card wrap | `box-shadow: 0 1px 4px rgba(0,0,0,0.06)` əlavə et |
| Komponent arası boşluq | `gap: 20px` |
| Section içi boşluq | `gap: 16px` |
| Table row hover | `transition: background 150ms` |
| Bütün animasiyalar | `admin-shared.css`-dən — yenidən yaratma |
| CSS prefix-lər | mövcud `cm-*`, `um-*`, `dm-*`, `pm-*` saxla |

---

## 3. Users Bölməsi — İki Fərqli Görünüş (Hierarchy View)

### Komponent: HierarchyView (`hi-*`)

#### 3a. SuperAdmin Görünüşü — Bütün Şirkətlər Üzrə

```
┌──────────────────────────────────────────────────────────────────────┐
│  um-header                                                            │
│  Users                           [🔍 Search users and departments...] │
├──────────────────────────────────────────────────────────────────────┤
│  hi-tree                                                              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ hi-company-node                                                  │ │
│  │ ▼  🏢  166 Logistics                          [42 users]        │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │   ▼ 🏗 Engineering                            [12 users]        │ │
│  │   │   ▼ 🏗 Frontend                           [4 users]         │ │
│  │   │   │   👤 Aysel H.  Frontend Lead    [User]   ★ Head         │ │
│  │   │   │   👤 Murad B.  Frontend Dev     [User]                  │ │
│  │   │   └ 🏗 Backend                            [5 users]         │ │
│  │   │       👤 Rəşad Ə.  Backend Lead    [User]   ★ Head          │ │
│  │   │       👤 ...                                                 │ │
│  │   └ 🏗 Finance                                [6 users]         │ │
│  │       👤 Leyla M.  CFO                 [Admin]  ★ Head          │ │
│  │                                                                  │ │
│  │   (No department)                                                │ │
│  │       👤 Aqil Z.  Head of Company      [Admin]                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ hi-company-node                                                  │ │
│  │ ▼  🏢  156 Evakuasiya                         [18 users]        │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │   ▼ 🏗 Operations                             [8 users]         │ │
│  │   │   👤 ...                                                    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

#### 3b. Admin Görünüşü — Öz Şirkəti Üzrə

Admin üçün company node yoxdur. Başlıqda şirkət adı göstərilir, birbaşa departamentlər sıralanır.

```
┌──────────────────────────────────────────────────────────────────────┐
│  um-header                                                            │
│  Users — 166 Logistics        [42]    [🔍 Search...]                  │
├──────────────────────────────────────────────────────────────────────┤
│  hi-tree                                                              │
│                                                                       │
│  ▼ 🏗 Engineering                              [12 users]             │
│  │   ▼ 🏗 Frontend                             [4 users]              │
│  │   │   👤 Aysel H.  Frontend Lead    [User]   ★ Head                │
│  │   │   👤 Murad B.  Frontend Dev     [User]                         │
│  │   └ 🏗 Backend                              [5 users]              │
│  │       👤 Rəşad Ə.  Backend Lead    [User]   ★ Head                 │
│  └ 🏗 Finance                                 [6 users]              │
│      👤 Leyla M.  CFO                 [Admin]  ★ Head                 │
│                                                                       │
│  (No department)                                                      │
│      👤 Aqil Z.  Head of Company      [Admin]                         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Interaction States — Hierarchy View

#### Company Node (`hi-company-node`)
| State | Spec |
|-------|------|
| Default | `background: var(--white); border: 1px solid var(--gray-200); border-radius: 10px; margin-bottom: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden` |
| Collapsed | children hidden — `display: none` |
| Expanded | children visible — `display: block` |

#### Company Header (`hi-company-header`)
| State | Spec |
|-------|------|
| Default | `display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer` |
| Hover | `background: #f8fafc` — 150ms |
| Layout | chevron (left) + logo 36px + name `font-size: 16px; font-weight: 700; color: var(--gray-800)` + count badge (right) |

#### Company Logo/Avatar
- Logo varsa: `width: 36px; height: 36px; border-radius: 8px; object-fit: cover`
- Logo yoxdursa: initials avatar, hash-based background color, `font-size: 13px; font-weight: 700; color: #fff`

#### Department Node (`hi-dept-node`)
| State | Spec |
|-------|------|
| Default | `display: flex; align-items: center; gap: 10px; height: 40px; padding-left: calc(level * 24px + 16px); background: var(--gray-50); border-bottom: 1px solid var(--border-light); cursor: pointer` |
| Hover | `background: #f0f9ff` — 150ms |
| Level 1 (root dept) | `padding-left: 16px` |
| Level 2 (child dept) | `padding-left: 40px` |
| Level 3+ (deeper) | `padding-left: 64px` (same pattern) |

**Department Header içi:**
- Chevron icon (8px, rotate animasiyalı)
- Folder icon `color: var(--gray-400)`
- Dept name: `font-weight: 600; font-size: 13px; color: var(--gray-800)`
- Head subtitle: `color: var(--gray-400); font-size: 12px; margin-left: 4px` — `"· Aysel H."`
- Count badge (sağda): `[12 users]`

#### Chevron (`hi-chevron`)
| State | Spec |
|-------|------|
| Expanded | `transform: rotate(90deg)` |
| Collapsed | `transform: rotate(0deg)` |
| Transition | `transition: transform 200ms ease` |

#### Count Badge (`hi-count-badge`)
| State | Spec |
|-------|------|
| Default | `background: var(--gray-100); color: var(--gray-500); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; margin-left: auto` |

#### User Row (`hi-user-row`)
| State | Spec |
|-------|------|
| Default | `display: flex; align-items: center; gap: 10px; height: 44px; padding-left: [parent-dept-indent + 24px]; background: var(--white); border-bottom: 1px solid var(--border-light)` |
| Hover | `background: #f8fafc` — 150ms |
| Layout | avatar 28px + full name + position text + role badge + `★ Head` badge (if dept head) |

#### Avatar (`hi-avatar`)
- `width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0`
- Hash-based background color (mövcud pattern)

#### Role Badge (`hi-role-badge`)
| Role | Spec |
|------|------|
| Admin | `background: rgba(47,198,246,0.15); color: var(--primary-color); font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 4px` |
| User | `background: var(--gray-100); color: var(--gray-500); font-size: 10px; font-weight: 500; padding: 1px 7px; border-radius: 4px` |
| SuperAdmin | `background: rgba(139,92,246,0.12); color: #7c3aed; font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 4px` |

#### Head Badge (`hi-head-badge`)
- `color: var(--primary-color); font-size: 11px; font-weight: 600`
- Text: `★ Head`
- `margin-left: 6px`
- Yalnız dept head olan user-lərdə göstərilir

#### "No Department" Section (`hi-no-dept-section`)
| State | Spec |
|-------|------|
| Header | `height: 36px; padding-left: [same as root dept]; display: flex; align-items: center; font-size: 12px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.04em; background: var(--gray-50); border-bottom: 1px solid var(--border-light)` |
| Text | "(No department)" — dept node kimi deyil, label kimi |
| User rows | birbaşa altda, eyni `hi-user-row` stili, indent: root dept indent + 24px |

#### Search (`hi-search`)
| State | Spec |
|-------|------|
| Default | `border: 1px solid var(--border-light); border-radius: var(--radius-md); height: 36px; padding: 0 12px 0 36px; width: 280px; font-size: 13px` |
| Focus | `border-color: var(--primary-color); outline: 2px solid rgba(47,198,246,0.25); outline-offset: -1px` |
| Typing | 300ms debounce — filterlər client-side (data yüklüdür) |

**Axtarış davranışı:**
- User adı uyğunlaşırsa: həmin user-in dept və company nodeları açıq qalır, uyğun olmayan user-lər `opacity: 0.25`
- Dept adı uyğunlaşırsa: həmin dept node highlight edilir
- Uyğun mətn: `background: rgba(47,198,246,0.15); border-radius: 3px` — wrap only the matched text
- Heç nə tapılmırsa: "No users found." empty state

#### Search Match Highlight
```css
.hi-highlight {
  background: rgba(47, 198, 246, 0.15);
  border-radius: 3px;
  padding: 0 2px;
}
```

#### Loading State (Skeleton Hierarchy)
```
┌────────────────────────────────────────┐
│  [shimmer block — company header 52px] │
│    [shimmer line — dept 40px]          │
│      [shimmer line — user 44px]        │
│      [shimmer line — user 44px]        │
│    [shimmer line — dept 40px]          │
│      [shimmer line — user 44px]        │
└────────────────────────────────────────┘
[repeat 2x for 2 skeleton companies]
```
`adm-shimmer` animasiyası — `admin-shared.css`-dən.

#### Empty State
```
[users-off icon — 32px, color: var(--gray-300)]
No users found.
[optional: "Try clearing your search"]
```
- Yalnız axtarış aktiv olduqda CTA olmur — search-clear hint
- Data boşdursa (şirkətdə heç kim yoxdur): CTA göstərilmir (admin buradan user yaratmır)

---

## 4. Companies Bölməsi — Vizual Yenilik

Mövcud table layout saxlanılır. Yalnız aşağıdakılar əlavə edilir:

### Əlavələr

#### Table Card
```css
.cm-table-wrap {
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);  /* əlavə et */
  /* qalanı dəyişmir */
}
```

#### Row Click → Detail View
Company row-una click edildikdə company detail panel açılır (right-side, 480px).

**Detail Panel Wireframe:**
```
                              ┌──────────────────────────────────────┐
                              │ cm-detail-panel                      │
                              │ [×]  166 Logistics                   │
                              ├──────────────────────────────────────┤
                              │  [Logo 64px]                         │
                              │  166 Logistics                       │
                              │  Status: ● Active                    │
                              │                                      │
                              │  ──────────────────────────────────  │
                              │  Stats                               │
                              │  ┌──────────┐  ┌──────────────────┐ │
                              │  │ 42 Users │  │ 5 Departments    │ │
                              │  └──────────┘  └──────────────────┘ │
                              │                                      │
                              │  Company Admin                       │
                              │  ◉ Aqil Z. — Head of Company        │
                              │                                      │
                              │  Description                         │
                              │  (not set)                           │
                              │                                      │
                              │       [Edit Company]                 │
                              └──────────────────────────────────────┘
```

**Detail Panel spec:**
- `ap-panel-in` slide animasiyası
- `width: 480px; height: 100vh; position: fixed; right: 0; top: 0`
- Stats: 2 kart yan-yana — `background: var(--bg-secondary); border-radius: var(--radius-md); padding: 12px 16px; text-align: center`
- Stat rəqəm: `font-size: 24px; font-weight: 700; color: var(--gray-800)`
- Stat label: `font-size: 12px; color: var(--gray-500); margin-top: 2px`
- "Edit Company" button: primary style, paneli bağlayıb edit form-u açır

---

## 5. Section Title Güncəlləmə

Bütün bölmələrdə section title font ölçüsü artırılır:

```css
/* Mövcud */
.cm-section-title,
.um-section-title,
.dm-section-title { font-size: 18px; font-weight: 700; }

/* Yeni */
.cm-section-title,
.um-section-title,
.dm-section-title,
.pm-section-title { font-size: 20px; font-weight: 700; color: var(--gray-800); }
```

---

## 6. CSS Naming — Yeni Komponentlər

```
Hierarchy View:    hi-*
  hi-tree              — root ul/div container
  hi-company-node      — company wrapper block (SuperAdmin only)
  hi-company-header    — clickable company header row
  hi-dept-node         — department row (collapsible)
  hi-dept-header       — clickable dept header
  hi-user-row          — user row
  hi-chevron           — ▶/▼ expand icon
  hi-avatar            — 28px user avatar circle
  hi-role-badge        — Admin/User/SuperAdmin tag
  hi-head-badge        — "★ Head" marker
  hi-count-badge       — "[12 users]" pill
  hi-search            — search input
  hi-highlight         — matched text span
  hi-no-dept-section   — "(No department)" group header
  hi-skeleton-company  — loading placeholder: company node
  hi-skeleton-dept     — loading placeholder: dept row
  hi-skeleton-user     — loading placeholder: user row

Company Detail Panel:  cm-detail-*
  cm-detail-panel      — right-side slide panel
  cm-detail-logo       — company logo/avatar
  cm-detail-stats      — stats row
  cm-detail-stat-card  — individual stat card
```

---

## 7. Animation Specs

Yeni keyframe lazım deyil. Mövcud `admin-shared.css`-dən istifadə:

| Animasiya | Komponent | Keyframe |
|-----------|-----------|----------|
| Panel açılması | cm-detail-panel, hi-tree yeniləmə | `ap-panel-in` |
| Dropdown | `•••` menyular | `adm-dropdownIn` |
| Skeleton | Loading state-lər | `adm-shimmer` |
| Chevron rotate | `hi-chevron` | CSS `transition: transform 200ms ease` (keyframe lazım deyil) |

---

## 8. Anti-AI Checklist

- [x] Company node → dept expand/collapse: chevron rotate 90° animasiyalı — default **expanded**
- [x] `★ Head` işarəsi: dept head olan user həm dept header subtitle-ında (`"· Aysel H."`), həm user sırasında (`★ Head`) göstərilir — iki yerdə, iki fərqli vizual
- [x] "No department" qrupu: dept node kimi deyil, label kimi — fərqli `font-size`, `text-transform: uppercase`, `letter-spacing` ilə ayrılır
- [x] Search: user adlarını VƏ dept adlarını filter edir — yalnız bir sahə deyil
- [x] Loading: skeleton hierarchy göstərilir — boş ekran deyil
- [x] Admin view: company node YOXdur — birbaşa dept-lər başlıq altında
- [x] Role badge-lər 3 fərqli rəng: Admin (cyan), User (gray), SuperAdmin (purple) — eyni rəng yoxdur
- [x] Stats kartları (detail panel): 2 kart yan-yana, `text-align: center` — uniform grid kimi görsənir, lakin məzmun fərqlidir (saylar fərqli olur — anti-AI xüsusiyyəti)
- [x] Section titles `20px` — mövcud `18px`-dən fərqli, iyerarxiya hissi yaradır

---

## 9. Spacing Reference

| Element | Dəyər |
|---------|-------|
| Company node border-radius | 10px |
| Company header padding | 12px 16px |
| Company logo size | 36px |
| Dept node height | 40px |
| User row height | 44px |
| Base dept indent (level 1) | 16px |
| Indent per level | +24px |
| User indent (from dept) | parent-indent + 24px |
| hi-avatar size | 28px |
| hi-count-badge padding | 2px 8px |
| Stats card padding | 12px 16px |
| Detail panel width | 480px |
| Section title font | 20px / weight 700 |

---

## 10. Edge Cases

| Ssenari | Davranış |
|---------|----------|
| Departamentsiz şirkət | "No department" section göstərilir — içi boşdursa "No users in this department." |
| Heç bir departamenti olmayan şirkət | Yalnız "(No department)" section + həmin şirkətin bütün userləri |
| Axtarış — heç nə tapılmır | "No users found." — bütün nodelar `opacity: 0.25` |
| SuperAdmin — çox şirkət (10+) | Hamısı yüklənir, hər biri ayrı kart — sonsuz sürüşmə |
| Admin — öz şirkəti boşdur | "No departments found." empty state + "Departments are managed in the Departments section." hint |
| Collapse + axtarış | Axtarış zamanı bütün nodelar açılır (expand); axtarış silindikdə əvvəlki vəziyyət bərpa olunur |

---

*Spec complete. Frontend Developer may begin implementation.*
