# UI/UX Task: Top Navbar Layout Redesign

**From**: Product Owner
**To**: UI/UX Developer
**Date**: 2026-03-31
**Priority**: P0 — CRITICAL (April demo üçün)

---

## Xülasə

Sol vertical sidebar ləğv edilir. Əvəzinə yuxarıda horizontal top navbar implementasiya olunacaq. Bu Bitrix24 dizayn strategiyamıza tam uyğundur. Aşağıdakı spec əsasında wireframe və CSS specification hazırla.

**Referans:** Bitrix24-ün yuxarıdakı horizontal nav layout-u (Chats, Channels, Notifications, Settings və s.)

---

## 1. Mövcud Vəziyyət (Ləğv Ediləcək)

```
┌──┬──────────────┬──────────────────────────────┐
│  │ Conv List    │       Chat Area              │
│I │ (400px)      │       (flex: 1)              │
│C │              │                              │
│O │              │                              │
│N │              │                              │
│S │              │                              │
│  │              │                              │
└──┴──────────────┴──────────────────────────────┘
 ^
 Sol sidebar (~60px) — icon-only, implement olunmayıb
```

**Problemlər:**
- Sidebar icon-ları işləmir (implement olunmayıb)
- Icon-only dizayn discoverability-ni azaldır
- ~60px horizontal space itirilir
- Demo üçün yarımçıq görünür

---

## 2. Yeni Layout (Top Navbar)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]  ·  Feed  Messages  Drive  Admin  Settings  Notif  │ AV Ad Soyad [↪] │
├──────────────────┬──────────────────────────────────────────────┤
│  Conv List       │           Chat Area                         │
│  (400px)         │           (flex: 1)                         │
│                  │                                             │
│                  │                                             │
│                  │                                             │
│                  │                                             │
│                  │                                             │
└──────────────────┴──────────────────────────────────────────────┘
```

### 2.1 Top Navbar Strukturu

| Zona | Məzmun | Align |
|------|--------|-------|
| **Sol** | Logo/App icon (gələcəkdə dəyişəcək) | `flex-start` |
| **Mərkəz** | Nav butonları: Feed, Messages, Drive, Admin Panel, Settings, Notifications | `center` |
| **Sağ** | User avatar + Ad Soyad + Logout button | `flex-end` |

### 2.2 Nav Button Dizaynı

Hər button: **icon + text** (horizontal, inline)

```
┌─────────────────┐
│  💬  Messages   │  ← icon sol tərəfdə, text sağda
└─────────────────┘
```

- **Aktiv state:** alt xətt (2-3px accent color), text color dəyişir
- **Hover state:** background-color subtle dəyişiklik
- **Icon size:** 18-20px
- **Font size:** 13-14px, medium weight
- **Gap (icon-text):** 6-8px
- **Gap (buttons arası):** 4-8px
- **Bitrix24-ə uyğun:** rounded background yox, flat dizayn, underline indicator

### 2.3 Navbar Ölçüləri

| Property | Dəyər |
|----------|-------|
| Height | 48-52px |
| Background | `var(--bg-primary)` / white və ya çox açıq gradient |
| Border-bottom | 1px solid `var(--border-light)` |
| Padding horizontal | 16-20px |
| Box-shadow | `0 1px 3px rgba(0,0,0,0.06)` (çox yüngül) |

### 2.4 User Section (Sağ tərəf)

```
┌──────────────────────────┐
│  (AV)  Ad Soyad   [↪]   │
└──────────────────────────┘
```

- Avatar: 28-32px circle
- Ad Soyad: 13px, regular weight
- Logout: icon button (door/arrow icon), hover-da rəng dəyişir
- Gap: 8-10px

---

## 3. Padding / Spacing (Bitrix24 style)

Bitrix24-dəki kimi conversation list və chat area border-lərə yapışmamalıdır:

| Element | Padding/Margin |
|---------|---------------|
| **Bütün content area** | `padding: 0 12-16px 12-16px 12-16px` (navbar-dan aşağı) |
| **ConversationList sol tərəf** | `margin-left: 8-12px` |
| **ChatArea sağ tərəf** | `margin-right: 8-12px` |
| **ConversationList və ChatArea arası** | `gap: 8-12px` |
| **Content area background** | Açıq boz/gradient (navbar-dan fərqli) |

Vizual nəticə: panellər "floating card" effekti verir, hər tərəfdən breathing room var.

### 3.1 Panel Card Effekti (Optional amma tövsiyə olunur)

```css
/* ConversationList və ChatArea */
border-radius: 8-12px (yuxarı künclərdə);
background: white;
box-shadow: 0 1px 4px rgba(0,0,0,0.08);
```

Body background isə `#f0f2f5` və ya oxşar açıq boz olur — panellər üstündə "üzən" kimi görünür.

---

## 4. Nav Items — Active Page Mapping

| Nav Item | Route/State | Icon (təklif) |
|----------|-------------|---------------|
| Feed | `/feed` (gələcək) | RSS/newspaper icon |
| Messages | `/chat` (mövcud) | Chat bubble icon |
| Drive | `/drive` (gələcək) | Folder/cloud icon |
| Admin Panel | `/admin` (mövcud) | Shield/gear icon |
| Settings | `/settings` (gələcək) | Gear icon |
| Notifications | — | Bell icon (+ unread badge) |

**Qeyd:** Feed, Drive, Settings, Notifications hələ implement olunmayıb. Nav-da görünsün, click olunanda həmin səhifəyə keçsin amma səhifə məzmunu olaraq sadəcə "Coming soon — Bu bölmə tezliklə aktiv olacaq" mesajı göstərsin (mərkəzdə, icon + text). Disabled/grayed-out etmə — normal görünsün, amma content hazır deyil. Messages və Admin Panel tam aktiv işləyəcək.

---

## 5. Notification Badge

Notifications butonunda unread count badge göstər:

```
🔔 Notifications  [3]
                   ^
                   Qırmızı badge, 18px circle, white text
```

- 0 olanda badge gizli
- 9+ olanda "9+" göstər
- Pulse animation yeni notification gələndə

---

## 6. Responsive Davranış

### Desktop (≥ 1024px)
- Tam layout: logo + nav items (icon+text) + user section

### Tablet (768px - 1023px)
- Nav items: yalnız icon (text gizli), tooltip ilə
- User section: yalnız avatar (ad gizli)

### Mobile (< 768px)
- Top navbar: logo + hamburger menu (sağda)
- Hamburger açılanda: full-screen overlay menu
- User section: menu içində

---

## 7. Çıxarılacaq Artifacts

1. Top navbar wireframe (desktop, tablet, mobile)
2. Nav button states specification (default, hover, active, disabled)
3. Color palette və spacing tokens
4. Padding/margin specification (floating panel effekti)
5. Notification badge specification
6. Responsive breakpoint davranışı
7. CSS variable listesi (navbar üçün)

---

## Qeydlər

- Sol vertical sidebar tamamilə silinəcək — heç bir elementi qalmayacaq
- Navbar fixed/sticky olmalıdır (scroll-da yuxarıda qalır)
- Admin Panel nav item-ı yalnız Admin və SuperAdmin role-lara görünməlidir
- Bitrix24-ün yuxarıdakı screenshot-u referans olaraq istifadə olunmalıdır
- ConversationList və ChatArea-nın border-ə yapışmaması (padding) mütləqdir
- **Mobile responsive dizayn mütləqdir** — `2026-03-30_1000_mobile-responsive-uiux.md` spec-indəki breakpoint sistemi (375px, 768px, 1024px) bu layout-a da tətbiq olunmalıdır. Navbar mobile-da hamburger menu-ya keçməli, padding/spacing mobile-a uyğun azalmalıdır
