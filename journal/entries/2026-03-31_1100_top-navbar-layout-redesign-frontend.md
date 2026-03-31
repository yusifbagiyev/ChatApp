# Frontend Task: Top Navbar Layout Redesign

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-31
**Priority**: P0 — CRITICAL (April demo üçün)
**Depends On**: `2026-03-31_1000_top-navbar-layout-redesign-uiux.md` (UI/UX spec)

---

## Xülasə

Sol vertical sidebar silinir, əvəzinə yuxarıda horizontal top navbar implementasiya olunur. Bitrix24 dizayn yanaşmasına keçid. UI/UX spec-i oxuduqdan sonra implement et.

---

## 1. Silinəcək Komponentlər

- Sol sidebar (Sidebar.jsx-dəki vertical icon bar) — tamamilə sil
- Sidebar ilə bağlı CSS — sil
- Sidebar-ın Chat.jsx-dəki layout-dan çıxar

---

## 2. Yaradılacaq / Dəyişdiriləcək Komponentlər

### 2.1 TopNavbar.jsx (YENİ)

Yeni komponent — horizontal navigation bar:

**Struktur:**
```
Sol: Logo/Icon
Mərkəz: NavItem[] — Feed, Messages, Drive, Admin Panel, Settings, Notifications
Sağ: UserAvatar + FullName + LogoutButton
```

**Funksionallıq:**
- React Router `useLocation()` ilə aktiv səhifəni müəyyən et
- Admin Panel yalnız Admin/SuperAdmin-ə görünsün (AuthContext-dən role oxu)
- Notifications-da unread count badge (API-dən çək)
- Feed, Drive, Settings, Notifications — bu səhifələrə keçid aktiv olsun, amma səhifə məzmunu olaraq sadəcə "Coming soon — Bu bölmə tezliklə aktiv olacaq" göstərsin (mərkəzdə icon + text). Butonlar disabled/grayed-out olmasın, normal görünsün
- Logout button — AuthContext-dən `logout()` çağır

### 2.2 Chat.jsx — Layout Dəyişikliyi

- Sol sidebar-ı layout-dan çıxar
- Content area: `padding` əlavə et (ConversationList sol, ChatArea sağ — border-lərə yapışmasın)
- `gap` əlavə et ConversationList və ChatArea arasına
- Body/container background dəyişdir (açıq boz, panellər white)

### 2.3 App.jsx — Routing Dəyişikliyi

- TopNavbar-ı bütün authenticated route-ların yuxarısına qoy
- Login səhifəsində navbar göstərmə

---

## 3. CSS Dəyişiklikləri

- Sidebar.css → silinəcək
- Yeni: TopNavbar.css
- Chat.css → layout grid/flex yenidən qurulacaq (sidebar column silinir)
- Body/root background: `#f0f2f5` (və ya oxşar)
- Panel effekti: conversation list və chat area-ya `border-radius` + `box-shadow`

---

## 4. Qeydlər

- UI/UX spec-i (journal `2026-03-31_1000`) oxu — orada ölçülər, spacing, responsive qaydalar var
- Mövcud funksionallığa toxunma (mesaj göndərmə, SignalR, conversation switch və s.)
- Yalnız layout və navigation dəyişir
- Test et: navbar-dan Messages → Admin Panel keçidi düzgün işləyir
- Test et: responsive (tablet/mobile) davranışı
- **Mobile responsive mütləqdir** — `2026-03-30_1000_mobile-responsive-uiux.md` breakpoint sisteminə uyğun olmalıdır. Navbar mobile-da hamburger menu-ya çevrilməli, padding/spacing kiçilməlidir
