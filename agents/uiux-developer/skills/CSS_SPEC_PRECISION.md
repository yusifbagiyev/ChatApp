# CSS Spec Precision — Dizayn Spec Yazarkən Texniki Dəqiqlik

## Purpose
Dizayn spec-lərini CSS texniki məhdudiyyətlərini nəzərə alaraq yazmaq.
Yanlış CSS spec → frontend developer düzəltmək məcburiyyətində qalır → spec ilə kod arasında uyğunsuzluq yaranır.

## Serves Goals
- Design handoff quality
- Bitrix24 consistency
- Anti-AI design

---

## 1. Table Row Pseudo-Elements — CRITICAL

**Yanlış (spec yazmayın):**
```css
/* <tr> elementinə ::before işləmir — render edilmir */
.cm-row::before { ... }
.um-row::before { ... }
```

**Düzgün:**
```css
/* Həmişə td:first-child::before istifadə et */
.cm-row td:first-child { position: relative; }
.cm-row td:first-child::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--primary-color);
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.cm-row:hover td:first-child::before { transform: scaleY(1); }
.cm-row:hover td { background: #f0f8ff; }
```

**Niyə:** HTML spec-ə görə `<tr>`, `<thead>`, `<tbody>` elementləri box model-da "anonymous" sayılır — pseudo-element support yoxdur.

---

## 2. Table Overflow — Position:Absolute Dropdown-lar

**Yanlış:**
```css
.cm-table-wrap {
  overflow: hidden;  /* position:absolute dropdown-ları kəsir! */
}
```

**Düzgün:**
```css
.cm-table-wrap {
  overflow: visible;  /* dropdown-lar table-dan çıxa bilir */
  /* Əvəzinə border-radius + clip üçün: */
  border-radius: 10px;
  border: 1px solid var(--gray-200);
}
```

**Niyə:** `overflow: hidden` olan parent-in içindəki `position: absolute` elementlər parent-in həndəsəsindən kənara çıxanda kəsilir. Table action dropdown-ları buna məruz qalır.

---

## 3. CSS Variable Scope Konflikti

**Problem:** Global CSS-dən (məs. Login.css, App.css) gələn dəyişənlər admin komponentlərə leak edə bilər. Login.css purple `--primary-color` istifadə edərsə, admin panel-in primary rəngi dəyişər.

**Həll:** Admin panel root elementinə yerli scope:
```css
/* AdminPanel.css */
.ap-page {
  --primary-color: #2fc6f6;
  --primary-hover: #17b3e6;
  /* bütün istifadə olunan dəyişənlər yerli olaraq override edilir */
}
```

**Spec-də qeyd et:** Hər admin panel spec-inin sonuna əlavə et:
> Frontend Developer: `ap-page` scope-una CSS dəyişənlərini override et — xarici CSS-in leak edə biləcəyini yoxla.

---

## 4. Dark Hero Section — Side Panel Pattern

Frontend developer company detail panel-ə nav sidebar-ın rəngi ilə dark hero section əlavə etdi:
```css
.cm-detail-hero {
  background: linear-gradient(135deg, #1a2332 0%, #243447 100%);
  padding: 28px 24px 22px;
}
```

**Bu pattern gözəldir — gələcək spec-lərdə istifadə et:**
- Slide panel-lərdə əsas entity-nin (şirkət, istifadəçi) hero section-ı nav rəngi (`#1a2332`) ilə başlayır
- Logo, ad, status hero-da göstərilir
- Panel body-si ağ fonunda detallar üçün istifadə olunur

**Nə vaxt tətbiq et:** Entity detail panel (view-only, read + edit actions) açıldığında.
**Nə vaxt tətbiq etmə:** Create/edit form panel-lərində — orada kontekst deyil, form lazımdır.

---

## 5. scrollbar-gutter: stable

```css
.ap-content {
  overflow-y: auto;
  scrollbar-gutter: stable;  /* scroll zamanı layout shift olmasın */
}
```

**Spec-də qeyd et:** Scrollable content area olan hər komponentdə `scrollbar-gutter: stable` əlavə et.

---

## 6. Animasiya Eğrileri — Anti-AI Standartları

| Kontekst | Curve | Niyə |
|----------|-------|------|
| Element açılır (panel, dropdown, field-in) | `cubic-bezier(0.16, 1, 0.3, 1)` | Spring — natural, overshoot yoxdur |
| Element bağlanır (panel-out, section-leave) | `cubic-bezier(0.4, 0, 1, 1)` | Sürətli çıxış — diqqəti saxlamır |
| Hover keçidləri | `cubic-bezier(0.4, 0, 0.2, 1)` | Material easing — rahat |
| Chevron rotate | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring overshoot — canlı hiss |

**YASAQ:** `ease`, `ease-in-out`, `linear` — AI dizaynı əlamətidir.

---

## 7. Spec Yazmadan Əvvəl Yoxla

Hər spec-in CSS bölməsini yazmadan əvvəl bu sualları ver:

- [ ] `::before`/`::after` hansı HTML elementinə tətbiq olunur? (`<tr>`, `<td>`, `<li>`, `<div>`)
- [ ] `position: absolute` child-ları olan parent-in `overflow` dəyəri nədir?
- [ ] Başqa CSS fayllarından gələ biləcək dəyişən konflikti var?
- [ ] Scrollable container-larda `scrollbar-gutter: stable` varmı?
- [ ] Animasiya curve-ləri anti-AI standartlarına uyğundur?

---

## 8. Frontend Developer-in Yaxşı Qərarlarını Sənəkləşdir

Frontend implement edərkən spec-dən kənar amma yaxşı qərarlar versə, bunları bu faylda qeyd et ki, gələn spec-lərdə istifadə edilsin.

**Mövcud pattern-lər:**
- Dark hero section in detail panels (company detail, entity view panels)
- `overflow: visible` on table-wrap when dropdowns present
- `td:first-child::before` for row accent in tables
- CSS var scope override on root element
- `scrollbar-gutter: stable` on scroll containers
