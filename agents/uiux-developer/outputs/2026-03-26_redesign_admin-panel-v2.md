# Admin Panel — Redesign v2

**Agent**: UI/UX Developer
**Date**: 2026-03-26
**Reason**: Previous specs were too template-like (AI aesthetic). This replaces them.
**Handoff to**: Frontend Developer

---

## Nə Dəyişdi

| Əvvəlki Yanaşma | Yeni Yanaşma |
|-----------------|--------------|
| Ağ nav sidebar | Tünd (dark slate) nav sidebar |
| Purple SuperAdmin badge | Warm amber SuperAdmin |
| Sadə background dəyişikliyi hover | Sol border slide-in + background |
| `ease` / `ease-out` animasiyalar | `cubic-bezier(0.16, 1, 0.3, 1)` spring |
| Section dəyişməsi — ani keçid | Crossfade + translateX animasiyası |
| Padding ilə tree indentation | Real CSS connecting lines |
| `•••` button həmişə görünür | Hover-triggered contextual toolbar |
| Uniform spacing | Intentional vizual ritem |

---

## 1. Visual Identity

### Rəng Sistemi

```
Nav bg:          #1a2332    (dark slate navy — artıq var olan rəng deyil)
Nav text:        #94a3b8    (subdued)
Nav active:      #2fc6f6    (primary)
Nav active bg:   rgba(47,198,246, 0.10)

Content bg:      #f4f5f7    (slight cool tint — #f0f2f5-dən fərqli)
Panel bg:        #ffffff
Card bg:         #ffffff
Card border:     #e8eaed    (var(--border-light)-dən bir az güclü)
Card shadow:     0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)

Primary:         #2fc6f6    (dəyişmir)
Hover row bg:    #f0f8ff    (blue-tinted, #f5f7fa-dan fərqli)
Active row bg:   rgba(47,198,246,0.07)
```

### Role Badge Rəngləri (purple YOX)

```
SuperAdmin:  background: rgba(180,83,9,0.09)   color: #b45309
             (dark warm amber — authority, NOT yellow AI amber)

Admin:       background: rgba(47,198,246,0.12)  color: #0891b2
             (deeper cyan, not the default primary)

User:        background: #f1f5f9               color: #64748b
             (slate, cooler than generic gray)
```

---

## 2. Admin Panel Shell

### Header

```
┌────────────────────────────────────────────────────────────────────┐
│  ap-header (56px, white, border-bottom: 2px solid var(--primary))  │
│                                                                     │
│  [← Back]    Admin  ›  Companies                    [SuperAdmin ▸] │
│              (breadcrumb updates on section change)                 │
└────────────────────────────────────────────────────────────────────┘
```

**Header detalları:**
- `border-bottom: 2px solid var(--primary-color)` — vizual separator, chat header-dən fərqlidir
- Breadcrumb: `"Admin  ›  [ActiveSection]"` — breadcrumb `›` separator `color: var(--gray-300)`
- ActiveSection adı section dəyişəndə 150ms fade ilə yenilənir
- Role badge: `border-radius: 4px` (rectangular), NOT pill

### Nav Sidebar (dark)

```css
.ap-nav {
  width: 220px;
  background: #1a2332;           /* dark slate */
  border-right: none;            /* nav-content arasında kəskin rəng fərqi bunu əvəz edir */
  padding: 20px 0;
}

.ap-nav-item {
  height: 42px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-left: 3px solid transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.ap-nav-item svg {
  opacity: 0.6;
  transition: opacity 150ms;
}

.ap-nav-item:hover {
  color: #cbd5e1;
  background: rgba(255,255,255,0.05);
}

.ap-nav-item:hover svg { opacity: 0.9; }

.ap-nav-item.active {
  color: #2fc6f6;
  background: rgba(47,198,246,0.10);
  border-left-color: #2fc6f6;
  font-weight: 600;
}

.ap-nav-item.active svg { opacity: 1; }
```

---

## 3. Section Keçid Animasiyaları

Section dəyişəndə (Companies → Users → Departments) content area-da keçid animasiyası:

```css
/* Çıxan section */
@keyframes section-leave {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-10px); }
}

/* Gələn section */
@keyframes section-enter {
  from { opacity: 0; transform: translateX(10px); }
  to   { opacity: 1; transform: translateX(0); }
}

.ap-section-leave {
  animation: section-leave 160ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

.ap-section-enter {
  animation: section-enter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

**React implementasiya qaydası:**
Section dəyişəndə:
1. Mövcud section `section-leave` class alır (160ms)
2. 160ms sonra yeni section render edilib `section-enter` class ilə appear edir
3. Animasiya bitəndən sonra class-lar silинir

---

## 4. Table Row Hover — Non-Standard

Sadə background dəyişikliyi yox. Sol-dan gələn accent:

```css
.cm-row,
.um-row,
.dm-row,
.pm-row {
  position: relative;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Sol accent — hover-da slide in */
.cm-row::before,
.um-row::before,
.dm-row::before,
.pm-row::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--primary-color);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.cm-row:hover::before,
.um-row:hover::before,
.dm-row:hover::before,
.pm-row:hover::before {
  transform: scaleY(1);
}

.cm-row:hover td,
.um-row:hover td { background: #f0f8ff; }  /* blue-tinted */
```

---

## 5. Contextual Action Toolbar (Row Hover)

`•••` button əvəzinə — hover-da icon-lar slide in olur:

```
Row default:   [ Name    │ Dept  │ Role    │            ]
Row hover:     [ Name    │ Dept  │ Role    │ ✎  🔑  ⏻  ]
                                            ↑  ↑   ↑
                                          Edit Pass Deact
```

**Toolbar spec:**
```css
.um-row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: translateX(8px);
  transition: opacity 150ms, transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.um-row:hover .um-row-actions {
  opacity: 1;
  transform: translateX(0);
}

.um-action-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--gray-400);
  cursor: pointer;
  transition: all 120ms;
}

.um-action-btn:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

.um-action-btn.danger:hover {
  background: rgba(239,68,68,0.08);
  color: #ef4444;
}
```

**Stagger animasiyası** — icon-lar bir-bir görünür:
```css
.um-action-btn:nth-child(1) { transition-delay: 0ms; }
.um-action-btn:nth-child(2) { transition-delay: 30ms; }
.um-action-btn:nth-child(3) { transition-delay: 60ms; }
```

**Tooltip** — hər icon üzərində:
```css
/* Native title attribute — sadə, overhead-siz */
/* Hover edəndə: "Edit", "Reset Password", "Deactivate" */
```

---

## 6. Slide Panel — Yenilənmiş Spec

```css
/* Panel gəlir */
@keyframes panel-in {
  from {
    transform: translateX(100%);
    opacity: 0;
    box-shadow: none;
  }
  to {
    transform: translateX(0);
    opacity: 1;
    box-shadow: -8px 0 32px rgba(0,0,0,0.12);
  }
}

/* Panel gedir */
@keyframes panel-out {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}

.ap-slide-panel {
  position: fixed;
  right: 0; top: 0;
  height: 100vh;
  background: var(--white);
  animation: panel-in 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.ap-slide-panel.closing {
  animation: panel-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}
```

**Panel açıldıqda content stagger:**
Panel slide tamamlandıqdan sonra (280ms delay) form field-lər yuxarıdan aşağı stagger ilə görünür:

```css
.ap-slide-panel .ap-field {
  opacity: 0;
  transform: translateY(6px);
  animation: field-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes field-in {
  to { opacity: 1; transform: translateY(0); }
}

.ap-field:nth-child(1) { animation-delay: 280ms; }
.ap-field:nth-child(2) { animation-delay: 320ms; }
.ap-field:nth-child(3) { animation-delay: 360ms; }
.ap-field:nth-child(4) { animation-delay: 400ms; }
```

---

## 7. Users — Hierarchy View (Yenilənmiş)

### Real Tree Connectors (CSS Lines)

Sadə padding deyil — görünən bağlantı xətləri:

```
Engineering                          ← root
│
├─── Frontend           [4]          ← child (not last)
│    ├─ Aysel H.    [User] ★
│    └─ Murad B.    [User]
│
└─── Backend            [5]          ← child (last)
     └─ Rəşad Ə.    [User] ★
```

**CSS implementation:**

```css
/* Dept children container */
.hi-dept-children {
  position: relative;
  padding-left: 24px;
}

/* Vertical connecting line */
.hi-dept-children::before {
  content: "";
  position: absolute;
  left: 11px;          /* indent/2 — xətt ortada */
  top: 0;
  bottom: 20px;        /* son elementdən bir az yuxarı dayanır */
  width: 1px;
  background: #dde3ea; /* var(--gray-200)-dan bir az güclü */
}

/* Horizontal connector per child */
.hi-dept-node::before,
.hi-user-row::before {
  content: "";
  position: absolute;
  left: -13px;
  top: 50%;
  width: 13px;
  height: 1px;
  background: #dde3ea;
}
```

**Result:** Hər child element sol-dan gələn horizontal xətt alır, onları birləşdirən vertical xətt isə üstdən aşağı uzanır. Bu — sadəcə padding ilə edilmiş fərqdir.

---

### Company Node (SuperAdmin)

```
┌────────────────────────────────────────────────────────────┐
│  ▼  [Logo]  166 Logistics                       [42] →    │
└────────────────────────────────────────────────────────────┘
```

```css
.hi-company-node {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
  transition: box-shadow 200ms;
}

.hi-company-node:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.05);
}

.hi-company-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--white);
  cursor: pointer;
  user-select: none;
  transition: background 150ms;
}

.hi-company-header:hover { background: #fafbfc; }
```

**Count badge (sağda) — "→" arrow ile:**
```css
.hi-company-count {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--gray-400);
}
/* [42 users →] — arrow hover-da primary color olur */
.hi-company-header:hover .hi-company-count { color: var(--primary-color); }
```

---

### Dept Node

```css
.hi-dept-node {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 16px;
  background: #f8fafc;  /* var(--gray-50)-dan fərqli — slight blue tint */
  border-bottom: 1px solid #edf0f3;
  cursor: pointer;
  position: relative;
  transition: background 150ms;
}

.hi-dept-node:hover { background: #eef4fb; }

.hi-dept-header-text {
  font-weight: 600;
  font-size: 13px;
  color: #334155;        /* slate-700, var(--gray-800)-dan fərqli */
}

/* Dept head subtitle */
.hi-dept-head-subtitle {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 8px;
  font-weight: 400;
}
/* · Aqil Z. */
```

---

### User Row

```css
.hi-user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 16px;
  background: var(--white);
  position: relative;
  cursor: default;
  transition: background 150ms;
}

/* Bottom border — full width deyil, 80% — sol tərəfdən boşluq */
.hi-user-row::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 0;
  height: 1px;
  background: #f1f5f9;
}

.hi-user-row:hover { background: #f8fbff; }
```

**★ Head badge:**
```css
.hi-head-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--primary-color);
  background: rgba(47,198,246,0.10);
  padding: 1px 6px;
  border-radius: 3px;
  letter-spacing: 0.02em;
  text-transform: uppercase;  /* HEAD */
}
```

---

### Collapse/Expand Animasiyası

```css
.hi-chevron {
  width: 14px;
  height: 14px;
  color: #94a3b8;
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);  /* spring overshoot */
  flex-shrink: 0;
}

/* Collapsed state */
.hi-chevron { transform: rotate(0deg); }

/* Expanded state */
.hi-dept-node.expanded .hi-chevron { transform: rotate(90deg); }

/* Children show/hide — height animasiyası overflow-hidden ilə */
.hi-dept-children {
  overflow: hidden;
  transition: height 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
/* JS ilə scrollHeight → height animasiyası edilir */
```

---

## 8. Skeleton Loading — Hierarchy

Sadə shimmer bars deyil — real hierarchy struktur əks olunur:

```
┌──────────────────────────────────────────────────────┐
│  [████████████████████████████████████]  52px high   │  ← company skeleton
├──────────────────────────────────────────────────────┤
│  [██████████████████████]  40px high                 │  ← dept skeleton
│    [████████████]  44px high                         │  ← user skeleton
│    [████████████████]  44px high                     │  ← user skeleton
│  [██████████████]  40px high                         │  ← dept skeleton
│    [████████████████████]  44px high                 │  ← user skeleton
└──────────────────────────────────────────────────────┘
```

```css
.hi-skeleton-company {
  height: 52px;
  border-radius: 10px;
  margin-bottom: 12px;
}
.hi-skeleton-dept {
  height: 40px;
  width: 60%;   /* tam width deyil — vizual çeşidlik */
}
.hi-skeleton-user {
  height: 44px;
  width: 80%;
}
/* Hamısına adm-shimmer animasiyası tətbiq edilir */
```

---

## 9. Search — Keyboard Shortcut Hint

```
┌──────────────────────────────────────────────┐
│  🔍 Search users and departments...   [/]    │
└──────────────────────────────────────────────┘
```

`[/]` — keyboard shortcut hint badge (sağda):
```css
.hi-search-shortcut {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--gray-300);
  background: var(--gray-100);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--gray-200);
  font-family: monospace;
  pointer-events: none;
}
/* Focus olduqda gizlənir */
.hi-search:focus + .hi-search-shortcut { display: none; }
```

`/` düyməsinə basıldıqda (document.addEventListener) search-ə focus gedir.

---

## 10. Status Dot — Yenilənmiş

Sadə rəngli dairə deyil — halo effekti ilə:

```css
/* Active status dot */
.cm-status-dot.active {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16,185,129,0.4);
  animation: status-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes status-pulse {
  0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.4); }
  70%  { box-shadow: 0 0 0 6px rgba(16,185,129,0.0); }
  100% { box-shadow: 0 0 0 0   rgba(16,185,129,0.0); }
}

/* Inactive — subtle, no animation */
.cm-status-dot.inactive {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;  /* cool gray — generic gray-400 deyil */
}
```

---

## 11. Form Input Focus — Yenilənmiş

```css
.ap-form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(47,198,246,0.15);  /* soft glow, outline deyil */
}

/* Error state */
.ap-form-input.error {
  border-color: #f43f5e;   /* rose-500, #ef4444-dən fərqli */
  box-shadow: 0 0 0 3px rgba(244,63,94,0.12);
}

/* Error text */
.ap-form-error-msg {
  font-size: 12px;
  color: #f43f5e;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 4px;
}
/* ⚠ Error message — icon + text */
```

---

## 12. Shared Keyframes — admin-shared.css (Yenilənmiş)

```css
/* ─── Spring animations ──────────────────────────────────── */

@keyframes adm-dropdownIn {
  from { opacity: 0; transform: scale(0.94) translateY(-6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
/* Duration: 180ms, curve: cubic-bezier(0.16, 1, 0.3, 1) */

@keyframes ap-panel-in {
  from { transform: translateX(100%); opacity: 0.6; }
  to   { transform: translateX(0); opacity: 1; }
}
/* Duration: 280ms, curve: cubic-bezier(0.16, 1, 0.3, 1) */

@keyframes ap-panel-out {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}
/* Duration: 200ms, curve: cubic-bezier(0.4, 0, 1, 1) */

@keyframes section-leave {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-10px); }
}

@keyframes section-enter {
  from { opacity: 0; transform: translateX(10px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes field-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes status-pulse {
  0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.4); }
  70%  { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
  100% { box-shadow: 0 0 0 0   rgba(16,185,129,0); }
}

/* Skeleton shimmer */
@keyframes adm-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* ─── Reduced motion ─────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 13. Anti-AI Checklist — v2

- [x] Purple #8b5cf6, #7c3aed — heç bir yerdə yoxdur
- [x] SuperAdmin badge — dark amber (#b45309), AI amber (#f59e0b) deyil
- [x] Nav sidebar — dark (#1a2332), ağ deyil — güclü vizual ayrılma
- [x] Hover state — sol border slide-in + background tint, yalnız background deyil
- [x] Section keçidi — crossfade + translateX, ani deyil
- [x] Panel açılması — spring curve (0.16, 1, 0.3, 1), field stagger 40ms
- [x] Status dot — halo pulse animasiyası, sadə opacity deyil
- [x] Tree hierarchy — real CSS connecting lines, sadə padding deyil
- [x] Action buttons — hover-triggered slide-in toolbar, həmişə görünən ••• deyil
- [x] Search — keyboard shortcut hint [/], input-dan fərqli
- [x] Skeleton — real hierarchy struktur (company→dept→user), düz bars deyil
- [x] Row separator (user) — 80% width, sol tərəfdən offset — tam xətt deyil
- [x] Form focus — `box-shadow` glow, `outline: 2px` deyil
- [x] Company card hover — `box-shadow` dəyişir (`translateY` deyil — az effektiv)

---

## 14. Spacing — Intentional Variasiyalar

Uniform spacing yox. Hər kontekst üçün öz boşluğu:

| Element | Spacing | Reason |
|---------|---------|--------|
| Company cards arası | `margin-bottom: 12px` | nəfəs sahəsi |
| Dept rows arası | `border-bottom: 1px` (no margin) | compact, dense |
| User rows arası | 80%-width alt xətt | yüngül, hava hissi |
| Form fields arası | `gap: 18px` | form oxunması üçün |
| Panel padding | `24px 28px` | geniş, rahat |
| Section header → toolbar | `margin-bottom: 20px` | güclü ayrılma |
| Toolbar → table | `gap: 0` (birbaşa bitişik) | table toolbar-ın davamıdır |
| Nav items arası | `gap: 2px` | compact nav |
| Section title → content | `margin-bottom: 16px` | mötədil |

---

*Bu spec əvvəlki admin-panel, dept-position, admin-panel-redesign spec-lərini əvəz edir.*
*Frontend Developer: admin-shared.css-i yenilə, sonra component-ləri tətbiq et.*
