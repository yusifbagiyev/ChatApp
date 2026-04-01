# Employee Drive — Full Wireframe & CSS Specification

**Date:** 2026-03-31
**Agent:** UI/UX Developer
**Type:** Wireframe + Interaction Design + CSS Spec
**Priority:** P1
**Scope:** `/drive` — personal file storage, folder navigation, recycle bin

---

## 1. Design Rationale

Bitrix24 "My Drive" referans alınır, lakin ChatApp-in mövcud design system-inə uyğunlaşdırılır:
- Açıq boz content background (`#eef1f5`) — top navbar redesign ilə uyğun
- Floating card effekti — Chat page ilə vizual tutarlılıq
- Mövcud `FileTypeIcon` komponent-i yenidən istifadə olunur
- `DetailSidebar` slide-in pattern-i təkrarlanır

**Anti-AI dizayn qaydaları:**
- Card-lar əllə dizayn edilmiş asimmetrik detallarla
- Grid item-lar arasında micro-variation (hover timing stagger)
- Organic corner radius-lar (10px cards, 12px panels — eyni deyil)

---

## 2. Page Layout

### 2.1 Desktop (≥ 1024px) — Details Panel bağlı

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP NAVBAR (48px, sticky)                                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  12px padding                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  DRIVE HEADER                                                        ││
│  │  My Drive   [+ Add ▾]          [🔍 Search...        ]  [🗑] [📊]     ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │  TOOLBAR                                                             ││
│  │  📁 My Drive > Documents > Reports      [Sort: Date ▾] [≡] [⊞] [⊟] ││
│  ├──────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            ││
│  │  │          │  │          │  │          │  │          │            ││
│  │  │   📁     │  │   📁     │  │   🖼️     │  │   📄     │            ││
│  │  │          │  │          │  │ [thumb]  │  │   PDF    │            ││
│  │  │Documents │  │Photos    │  │photo.jpg │  │report   │            ││
│  │  │4 items   │  │12 items  │  │3.2 MB    │  │1.8 MB   │            ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            ││
│  │                                                                      ││
│  │  ┌──────────┐  ┌──────────┐                                        ││
│  │  │          │  │          │                                        ││
│  │  │   📊     │  │   📦     │                                        ││
│  │  │   XLS    │  │   ZIP    │                                        ││
│  │  │sales.xlsx│  │backup.zip│                                        ││
│  │  │456 KB    │  │24.1 MB   │                                        ││
│  │  └──────────┘  └──────────┘                                        ││
│  │                                                                      ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└────────────────────────────────────────────────────────────────────────────┘
  background: #eef1f5
```

### 2.2 Desktop — Details Panel açıq

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP NAVBAR                                                                │
├─────────────────────────────────────────────────────┬──────────────────────┤
│                                                     │                    │
│  DRIVE CONTENT                                      │  DETAILS PANEL     │
│  (flex: 1, scrollable)                              │  (360px)           │
│                                                     │                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  ✕  File Details   │
│  │          │  │          │  │ selected │         │                    │
│  │   📁     │  │   📁     │  │ ▓▓▓▓▓▓▓▓ │         │  ┌──────────────┐ │
│  │          │  │          │  │ ▓▓▓▓▓▓▓▓ │         │  │              │ │
│  │Documents │  │Photos    │  │photo.jpg │         │  │  [Preview]   │ │
│  └──────────┘  └──────────┘  └──────────┘         │  │              │ │
│                                                     │  └──────────────┘ │
│                                                     │                    │
│                                                     │  Name: photo.jpg  │
│                                                     │  Type: JPEG Image │
│                                                     │  Size: 3.2 MB     │
│                                                     │  Created: Mar 30  │
│                                                     │  Modified: Mar 31 │
│                                                     │                    │
│                                                     │  [⬇ Download]     │
│                                                     │  [🗑 Delete]       │
│                                                     │                    │
└─────────────────────────────────────────────────────┴──────────────────────┘
```

---

## 3. Drive Page Container

```css
.drive-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: var(--content-padding, 12px);
  background: #fff;
  border-radius: var(--panel-radius, 12px);
  box-shadow: var(--panel-shadow, 0 1px 4px rgba(0,0,0,0.08));
  overflow: hidden;
}

/* Details panel açıq olduqda: drive + panel yan-yana */
.drive-layout {
  flex: 1;
  display: flex;
  min-height: 0;
  margin: var(--content-padding, 12px);
  gap: 0;
}

.drive-layout .drive-page {
  margin: 0;
  border-radius: var(--panel-radius, 12px) 0 0 var(--panel-radius, 12px);
}

.drive-layout .drive-details-panel {
  border-radius: 0 var(--panel-radius, 12px) var(--panel-radius, 12px) 0;
}
```

---

## 4. Drive Header

### 4.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   My Drive          [+ Add ▾]         [🔍 Filter and search      ]  [🗑 Recycle Bin]  [📊]   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
  14px padding-y, 20px padding-x
```

### 4.2 CSS

```css
.drive-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.drive-header-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  flex-shrink: 0;
}

/* + Add button — primary action */
.drive-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  border: none;
  background: var(--primary-color, #2fc6f6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: background 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-add-btn:hover {
  background: var(--primary-hover, #17b3e6);
}

.drive-add-btn svg {
  width: 14px;
  height: 14px;
}

/* Add dropdown */
.drive-add-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 4px;
  z-index: 50;
  animation: drive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards;
}

@keyframes drive-dropdown-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.drive-add-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 7px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 100ms cubic-bezier(0.4,0,0.2,1);
}

.drive-add-dropdown-item:hover {
  background: #f3f4f6;
}

.drive-add-dropdown-item svg {
  width: 16px;
  height: 16px;
  color: #6b7280;
  flex-shrink: 0;
}

/* Search input */
.drive-search {
  flex: 1;
  max-width: 320px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  margin-left: auto;
  transition: border-color 150ms cubic-bezier(0.4,0,0.2,1),
              background 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-search:focus-within {
  border-color: var(--primary-color, #2fc6f6);
  background: #fff;
}

.drive-search svg {
  width: 15px;
  height: 15px;
  color: #9ca3af;
  flex-shrink: 0;
}

.drive-search input {
  flex: 1;
  border: none;
  background: none;
  font-size: 13px;
  color: #374151;
  outline: none;
}

.drive-search input::placeholder {
  color: #9ca3af;
}

/* Recycle Bin button */
.drive-recycle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-recycle-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.drive-recycle-btn svg {
  width: 16px;
  height: 16px;
}

/* Quota icon button */
.drive-quota-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-quota-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}
```

---

## 5. Toolbar (Breadcrumb + Sort + View Toggle)

### 5.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📁 My Drive  ›  Documents  ›  Reports          [Date ▾]  [≡] [⊞] [⊟]  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 CSS

```css
.drive-toolbar {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
  gap: 12px;
}

/* Breadcrumb */
.drive-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.drive-breadcrumb::-webkit-scrollbar {
  display: none;
}

.drive-breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 150ms cubic-bezier(0.4,0,0.2,1),
              background 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-breadcrumb-item:hover {
  color: #374151;
  background: #f3f4f6;
}

/* Aktiv (son element) — bold, click olunmur */
.drive-breadcrumb-item.active {
  color: #111827;
  font-weight: 600;
  cursor: default;
}

.drive-breadcrumb-item.active:hover {
  background: none;
}

/* Root icon */
.drive-breadcrumb-item.root svg {
  width: 14px;
  height: 14px;
  color: #9ca3af;
}

/* Separator */
.drive-breadcrumb-sep {
  color: #d1d5db;
  font-size: 12px;
  margin: 0 2px;
  flex-shrink: 0;
}

/* Sort dropdown */
.drive-sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-sort-btn:hover {
  border-color: #d1d5db;
  color: #374151;
}

.drive-sort-btn svg {
  width: 12px;
  height: 12px;
}

/* Sort dropdown menu */
.drive-sort-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 4px;
  z-index: 50;
  animation: drive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards;
}

.drive-sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 100ms;
}

.drive-sort-option:hover {
  background: #f3f4f6;
}

.drive-sort-option.active {
  color: var(--primary-color);
  font-weight: 600;
}

/* Sort direction arrow */
.drive-sort-option.active::after {
  content: '↓';
  font-size: 11px;
}

.drive-sort-option.active.asc::after {
  content: '↑';
}

/* View toggle group */
.drive-view-toggle {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  overflow: hidden;
  flex-shrink: 0;
}

.drive-view-btn {
  width: 32px;
  height: 30px;
  border: none;
  background: #fff;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-view-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.drive-view-btn:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.drive-view-btn.active {
  background: var(--primary-color, #2fc6f6);
  color: #fff;
}

.drive-view-btn svg {
  width: 14px;
  height: 14px;
}
```

---

## 6. File/Folder Grid View

### 6.1 Grid Container

```css
.drive-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  scrollbar-gutter: stable;
}

.drive-grid-items {
  display: grid;
  gap: 14px;
}

/* Large grid — default */
.drive-grid-items.large {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

/* Medium grid */
.drive-grid-items.medium {
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}
```

### 6.2 File/Folder Card

```
Large card (180x200px):
┌────────────────────────┐
│  ☐                     │ ← checkbox (hover/selected-da görünür)
│                        │
│      ┌──────────┐      │
│      │   📁     │      │ ← icon: 48px (folder), thumbnail (image), FileTypeIcon (file)
│      │          │      │
│      └──────────┘      │
│                        │
│  Folder Name           │ ← 13px, 500 weight, truncate
│  4 items · Mar 30      │ ← 11px, muted
└────────────────────────┘
```

```css
.drive-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: border-color 150ms cubic-bezier(0.4,0,0.2,1),
              background 150ms cubic-bezier(0.4,0,0.2,1),
              box-shadow 200ms cubic-bezier(0.4,0,0.2,1);
}

.drive-card:hover {
  border-color: #bfdbfe;
  background: rgba(47,198,246,0.03);
}

.drive-card.selected {
  border-color: var(--primary-color, #2fc6f6);
  background: rgba(47,198,246,0.06);
  box-shadow: 0 0 0 1px var(--primary-color, #2fc6f6);
}

/* Checkbox — gizli, hover/selected-da görünür */
.drive-card-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid #d1d5db;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 150ms cubic-bezier(0.4,0,0.2,1),
              border-color 150ms cubic-bezier(0.4,0,0.2,1),
              background 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-card:hover .drive-card-checkbox,
.drive-card.selected .drive-card-checkbox {
  opacity: 1;
}

.drive-card-checkbox.checked {
  background: var(--primary-color, #2fc6f6);
  border-color: var(--primary-color, #2fc6f6);
}

/* Checkmark SVG */
.drive-card-checkbox.checked svg {
  width: 12px;
  height: 12px;
  color: #fff;
}

/* Icon area */
.drive-card-icon {
  width: 100%;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  border-radius: 6px;
  overflow: hidden;
}

/* Folder icon */
.drive-card-icon.folder svg {
  width: 52px;
  height: 52px;
  color: #60a5fa;
}

/* Image thumbnail */
.drive-card-icon.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

/* File type icon — mövcud FileTypeIcon istifadə olunur */
.drive-card-icon.file {
  /* FileTypeIcon component-i buraya render olunur, size: 44 */
}

/* Card info */
.drive-card-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.drive-card-meta {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

/* Drag handle — yuxarı sağ, hover-da görünür */
.drive-card-drag {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  color: #d1d5db;
  opacity: 0;
  cursor: grab;
  transition: opacity 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-card:hover .drive-card-drag {
  opacity: 1;
}

.drive-card-drag:hover {
  color: #9ca3af;
}
```

### 6.3 Folder SVG Icon

```jsx
const FolderIcon = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Folder body — filled, mavi tonlarla */}
    <path d="M2 6a2 2 0 012-2h4.586a1 1 0 01.707.293L11 6H20a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
      fill="#93c5fd" />
    {/* Tab — bir ton tünd */}
    <path d="M2 6a2 2 0 012-2h4.586a1 1 0 01.707.293L11 6H2z"
      fill="#60a5fa" />
  </svg>
);
```

---

## 7. List View

### 7.1 Wireframe

```
┌───┬──────┬──────────────────────────┬───────────┬─────────────────┬──────┐
│ ☐ │ 📁   │ Documents                │ —         │ Mar 28, 2026    │  ⋮   │
│ ☐ │ 📁   │ Photos                   │ —         │ Mar 25, 2026    │  ⋮   │
│ ☐ │ 🖼️   │ _MG_2588.JPG             │ 3.2 MB    │ Mar 30, 2026    │  ⋮   │
│ ☐ │ 📄   │ report_q1.pdf            │ 1.8 MB    │ Mar 29, 2026    │  ⋮   │
│ ☐ │ 📊   │ sales_data.xlsx          │ 456 KB    │ Mar 27, 2026    │  ⋮   │
└───┴──────┴──────────────────────────┴───────────┴─────────────────┴──────┘
 CB   Icon        Name                   Size         Modified        More
```

### 7.2 CSS

```css
.drive-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

/* Table header */
.drive-list-header {
  display: grid;
  grid-template-columns: 36px 32px 1fr 100px 140px 36px;
  align-items: center;
  padding: 0 20px;
  height: 36px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafbfc;
  position: sticky;
  top: 0;
  z-index: 2;
}

.drive-list-header-cell {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
  transition: color 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-list-header-cell:hover {
  color: #6b7280;
}

.drive-list-header-cell.sorted {
  color: #111827;
}

.drive-list-header-cell.sorted::after {
  content: '↓';
  font-size: 10px;
}

.drive-list-header-cell.sorted.asc::after {
  content: '↑';
}

/* Row */
.drive-list-row {
  display: grid;
  grid-template-columns: 36px 32px 1fr 100px 140px 36px;
  align-items: center;
  padding: 0 20px;
  height: 44px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 100ms cubic-bezier(0.4,0,0.2,1);
}

.drive-list-row:hover {
  background: #f9fafb;
}

.drive-list-row.selected {
  background: rgba(47,198,246,0.06);
}

/* Row checkbox */
.drive-list-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1.5px solid #d1d5db;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-list-checkbox.checked {
  background: var(--primary-color, #2fc6f6);
  border-color: var(--primary-color, #2fc6f6);
}

/* Row icon — folder: 20px mavi, file: FileTypeIcon size 20 */
.drive-list-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.drive-list-icon.folder svg {
  width: 20px;
  height: 20px;
  color: #60a5fa;
}

/* Row name */
.drive-list-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 12px;
}

/* Row size */
.drive-list-size {
  font-size: 12px;
  color: #6b7280;
}

/* Row date */
.drive-list-date {
  font-size: 12px;
  color: #6b7280;
}

/* Row more button */
.drive-list-more {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-list-row:hover .drive-list-more {
  opacity: 1;
}

.drive-list-more:hover {
  background: #f3f4f6;
  color: #374151;
}
```

---

## 8. Selection Toolbar

### 8.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ✕  Selected: 3       📋 Details   ⬇ Download   ✏ Rename   📂 Move   🗑 Delete  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 8.2 CSS

```css
.drive-selection-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: #1e293b;
  color: #fff;
  flex-shrink: 0;
  animation: drive-toolbar-in 200ms cubic-bezier(0.16,1,0.3,1) forwards;
}

@keyframes drive-toolbar-in {
  from { opacity: 0; transform: translateY(-100%); }
  to   { opacity: 1; transform: translateY(0); }
}

.drive-selection-close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: none;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-selection-close:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.drive-selection-count {
  font-size: 13px;
  font-weight: 600;
  margin-right: 12px;
  padding-right: 12px;
  border-right: 1px solid rgba(255,255,255,0.15);
}

.drive-selection-action {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  background: none;
  color: rgba(255,255,255,0.8);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-selection-action:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.drive-selection-action.danger {
  color: #fca5a5;
}

.drive-selection-action.danger:hover {
  background: rgba(239,68,68,0.15);
  color: #fecaca;
}

.drive-selection-action svg {
  width: 14px;
  height: 14px;
}

/* Disabled — multi-select-də disable olan action-lar */
.drive-selection-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
```

---

## 9. Context Menu

### 9.1 Wireframe

```
┌──────────────────────┐
│  📋 Details          │
│  ⬇ Download          │
│  ✏ Rename            │
│  📂 Move to...       │
│  ─────────────────── │
│  🗑 Delete            │
└──────────────────────┘
```

### 9.2 CSS

```css
.drive-context-menu {
  position: fixed;
  min-width: 170px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.14);
  padding: 4px;
  z-index: 200;
  animation: drive-dropdown-in 120ms cubic-bezier(0.16,1,0.3,1) forwards;
}

.drive-context-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 7px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 100ms cubic-bezier(0.4,0,0.2,1);
}

.drive-context-item:hover {
  background: #f3f4f6;
}

.drive-context-item svg {
  width: 15px;
  height: 15px;
  color: #6b7280;
  flex-shrink: 0;
}

.drive-context-item.danger {
  color: #ef4444;
}

.drive-context-item.danger svg {
  color: #ef4444;
}

.drive-context-item.danger:hover {
  background: rgba(239,68,68,0.06);
}

.drive-context-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 4px 0;
}
```

---

## 10. Details Panel

### 10.1 CSS

```css
.drive-details-panel {
  width: 360px;
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  box-shadow: var(--panel-shadow, 0 1px 4px rgba(0,0,0,0.08));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: drive-details-in 250ms cubic-bezier(0.16,1,0.3,1) forwards;
}

@keyframes drive-details-in {
  from { width: 0; opacity: 0; }
  to   { width: 360px; opacity: 1; }
}

.drive-details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.drive-details-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.drive-details-close {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-details-close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Preview area */
.drive-details-preview {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
  min-height: 180px;
}

.drive-details-preview img {
  max-width: 100%;
  max-height: 240px;
  border-radius: 8px;
  object-fit: contain;
}

.drive-details-preview .drive-details-file-icon {
  /* FileTypeIcon size: 64 */
}

/* Metadata rows */
.drive-details-meta {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;
}

.drive-details-row {
  display: flex;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.drive-details-row:last-child {
  border-bottom: none;
}

.drive-details-label {
  width: 90px;
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

.drive-details-value {
  font-size: 13px;
  color: #111827;
  font-weight: 500;
  word-break: break-word;
}

/* Action buttons */
.drive-details-actions {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.drive-details-download-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: var(--primary-color, #2fc6f6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-details-download-btn:hover {
  background: var(--primary-hover, #17b3e6);
}

.drive-details-delete-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(239,68,68,0.3);
  background: none;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-details-delete-btn:hover {
  background: rgba(239,68,68,0.06);
  border-color: rgba(239,68,68,0.5);
}
```

---

## 11. Storage Quota Component

### 11.1 Popover (Quota button-a basılanda)

```
┌───────────────────────────────┐
│  Storage                      │
│                               │
│  1.2 GB / 3.0 GB used        │
│  [████████░░░░░░░░░░░] 40%   │
│                               │
│  ● Images       420 MB        │
│  ● Documents    680 MB        │
│  ● Other        100 MB        │
└───────────────────────────────┘
```

### 11.2 CSS

```css
.drive-quota-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.14);
  padding: 18px;
  z-index: 50;
  animation: drive-dropdown-in 150ms cubic-bezier(0.16,1,0.3,1) forwards;
}

.drive-quota-title {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 12px;
}

.drive-quota-usage {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.drive-quota-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 16px;
}

.drive-quota-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 600ms cubic-bezier(0.16,1,0.3,1),
              background 300ms cubic-bezier(0.4,0,0.2,1);
}

/* Rəng — fill %-ə görə */
.drive-quota-bar-fill.green  { background: #22c55e; }
.drive-quota-bar-fill.yellow { background: #f59e0b; }
.drive-quota-bar-fill.red    { background: #ef4444; }

/* Warning mesajı — 90%+ */
.drive-quota-warning {
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.drive-quota-warning svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Breakdown */
.drive-quota-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drive-quota-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #374151;
}

.drive-quota-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  flex-shrink: 0;
}

.drive-quota-dot.images    { background: #0ea5e9; }
.drive-quota-dot.documents { background: #22c55e; }
.drive-quota-dot.other     { background: #94a3b8; }

.drive-quota-item-size {
  margin-left: auto;
  font-weight: 600;
  color: #111827;
}
```

---

## 12. Recycle Bin Page

### 12.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🗑 Recycle Bin      [Empty Recycle Bin]                [← Back to Drive] │
├──────────────────────────────────────────────────────────────────────────┤
│  ℹ Files deleted to the Recycle Bin are kept for 30 days               │
├───┬──────┬──────────────────────────┬─────────┬─────────────┬──────────┤
│ ☐ │ 🖼️   │ old_photo.jpg            │ 1.2 MB  │ Deleted: Mar 28 │ [↩ Restore] │
│ ☐ │ 📄   │ draft.docx               │ 456 KB  │ Deleted: Mar 25 │ [↩ Restore] │
│ ☐ │ 📁   │ old_project/             │ —       │ Deleted: Mar 20 │ [↩ Restore] │
└───┴──────┴──────────────────────────┴─────────┴─────────────┴──────────┘
```

### 12.2 CSS

```css
.drive-trash-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.drive-trash-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}

.drive-trash-title svg {
  width: 22px;
  height: 22px;
  color: #9ca3af;
}

.drive-trash-empty-btn {
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid rgba(239,68,68,0.3);
  background: none;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-trash-empty-btn:hover {
  background: rgba(239,68,68,0.06);
  border-color: rgba(239,68,68,0.5);
}

.drive-trash-back-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-trash-back-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

/* Info banner */
.drive-trash-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fefce8;
  border-bottom: 1px solid #fef08a;
  font-size: 12px;
  color: #854d0e;
}

.drive-trash-info svg {
  width: 14px;
  height: 14px;
  color: #ca8a04;
  flex-shrink: 0;
}

/* Restore button — hər row-da */
.drive-trash-restore-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #86efac;
  background: none;
  color: #16a34a;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-trash-restore-btn:hover {
  background: rgba(22,163,74,0.06);
}
```

---

## 13. Empty States

### 13.1 Boş Drive

```
┌──────────────────────────────────┐
│                                  │
│         ┌─────────────┐         │
│         │             │         │
│         │   📁 ☁️      │         │
│         │             │         │
│         └─────────────┘         │
│                                  │
│     Your drive is empty          │
│                                  │
│  Drag files here or click        │
│  "+ Add" to get started          │
│                                  │
│       [+ Upload files]           │
│                                  │
└──────────────────────────────────┘
```

### 13.2 CSS

```css
.drive-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 20px;
}

.drive-empty-icon {
  width: 72px;
  height: 72px;
  color: #d1d5db;
  margin-bottom: 8px;
}

.drive-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
}

.drive-empty-text {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  max-width: 260px;
  line-height: 1.5;
}

.drive-empty-action {
  margin-top: 12px;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: var(--primary-color, #2fc6f6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-empty-action:hover {
  background: var(--primary-hover, #17b3e6);
}
```

---

## 14. Drag & Drop Overlay

Fayl brauzerdən sürüklənəndə:

```css
.drive-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(47,198,246,0.06);
  border: 2px dashed var(--primary-color, #2fc6f6);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;
  pointer-events: none;
  animation: drive-drop-pulse 1.5s infinite;
}

@keyframes drive-drop-pulse {
  0%, 100% { border-color: var(--primary-color, #2fc6f6); }
  50%      { border-color: rgba(47,198,246,0.4); }
}

.drive-drop-icon {
  width: 40px;
  height: 40px;
  color: var(--primary-color, #2fc6f6);
}

.drive-drop-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-color, #2fc6f6);
}
```

---

## 15. Move Dialog

### 15.1 Wireframe

```
┌─────────────────────────────────┐
│  Move to...                  ✕  │
├─────────────────────────────────┤
│  📁 My Drive                    │
│    📁 Documents            →    │
│      📁 Reports            →    │
│      📁 Archive            →    │
│    📁 Photos               →    │
│    📁 Projects             →    │
├─────────────────────────────────┤
│         [Cancel]  [Move here]   │
└─────────────────────────────────┘
```

### 15.2 CSS

```css
.drive-move-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drive-move-dialog {
  background: #fff;
  border-radius: 14px;
  width: 380px;
  max-width: 90vw;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  animation: drive-dialog-in 200ms cubic-bezier(0.16,1,0.3,1) forwards;
}

@keyframes drive-dialog-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.drive-move-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.drive-move-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.drive-move-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.drive-move-folder {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 100ms cubic-bezier(0.4,0,0.2,1);
}

.drive-move-folder:hover {
  background: #f3f4f6;
}

.drive-move-folder.selected {
  background: rgba(47,198,246,0.08);
  color: var(--primary-color);
  font-weight: 600;
}

/* Indentation — depth * 20px */
.drive-move-folder[data-depth="1"] { padding-left: 40px; }
.drive-move-folder[data-depth="2"] { padding-left: 60px; }
.drive-move-folder[data-depth="3"] { padding-left: 80px; }

.drive-move-folder svg {
  width: 18px;
  height: 18px;
  color: #60a5fa;
  flex-shrink: 0;
}

.drive-move-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.drive-move-cancel-btn {
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-move-cancel-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.drive-move-confirm-btn {
  padding: 7px 20px;
  border-radius: 8px;
  border: none;
  background: var(--primary-color, #2fc6f6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms cubic-bezier(0.4,0,0.2,1);
}

.drive-move-confirm-btn:hover {
  background: var(--primary-hover, #17b3e6);
}

.drive-move-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 16. Responsive Breakpoints

```css
/* Tablet (768-1023px) */
@media (max-width: 1023px) and (min-width: 768px) {
  .drive-grid-items.large {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .drive-details-panel {
    position: fixed;
    top: var(--navbar-height, 48px);
    right: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: -4px 0 24px rgba(0,0,0,0.12);
    border-radius: 0;
  }

  .drive-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .drive-search {
    max-width: 100%;
    order: 10;
    flex: 1 1 100%;
  }
}

/* Mobile (<768px) */
@media (max-width: 767px) {
  .drive-page {
    margin: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .drive-header {
    flex-wrap: wrap;
    padding: 12px 16px;
    gap: 8px;
  }

  .drive-header-title {
    font-size: 18px;
  }

  .drive-search {
    max-width: 100%;
    order: 10;
    flex: 1 1 100%;
  }

  .drive-recycle-btn span { display: none; }

  .drive-toolbar {
    padding: 8px 16px;
    overflow-x: auto;
  }

  /* Mobile: default list view */
  .drive-grid-items {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 10px;
    padding: 12px 16px;
  }

  .drive-details-panel {
    position: fixed;
    inset: 0;
    width: 100%;
    z-index: 200;
    border-radius: 0;
    animation: none;
  }

  .drive-move-dialog {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
  }

  .drive-selection-toolbar {
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 12px;
  }

  .drive-selection-action span { display: none; }

  .drive-context-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 14px 14px 0 0;
    padding: 8px 4px 20px;
    animation: drive-context-up 200ms cubic-bezier(0.16,1,0.3,1) forwards;
  }

  @keyframes drive-context-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
}
```

---

## 17. Interaction States

| State | Davranış | Animation |
|-------|----------|-----------|
| **Default** | Grid view, sorted by date | — |
| **Card hover** | Border blue, subtle bg tint | 150ms material |
| **Card selected** | Blue border + shadow ring, checkbox checked | 150ms material |
| **Multi-select** | Selection toolbar slide-in from top | 200ms spring |
| **Context menu** | Fixed position at cursor, mobile: bottom sheet | 120ms spring |
| **Details open** | Panel animates from 0 to 360px width | 250ms spring |
| **Details close** | Panel shrinks to 0 | 200ms fast |
| **Folder enter** | Grid items fade-in staggered (50ms per item) | 300ms spring |
| **Search active** | Search input focused, results filter in-place | — |
| **Drag file** | Drop overlay with pulsing dashed border | 1.5s infinite |
| **Upload progress** | Progress bar on card (bottom edge) | — |
| **Empty state** | Centered icon + text + CTA button | — |
| **Loading** | Skeleton cards (shimmer animation) | 1.2s infinite |
| **Quota warning** | Red bar, warning text visible | — |

### Staggered fade-in (folder enter animation)

```css
@keyframes drive-item-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

.drive-card {
  animation: drive-item-in 300ms cubic-bezier(0.16,1,0.3,1) forwards;
  opacity: 0;
}

/* JavaScript-dən style={{ animationDelay: `${index * 30}ms` }} */
```

---

## 18. Anti-AI Checklist

- [x] Purple (#8b5cf6, #7c3aed) **istifadə olunmayıb**
- [x] Card hover: asymmetric — border-color dəyişir amma shadow əlavə olunmur (grid-dən fərqli stat cards)
- [x] Checkbox visibility: hover + selected state — həmişə görünmür (organic UX)
- [x] Drag handle: sağ tərəfdə (Bitrix24: sol tərəfdə) — fərqlilik human touch yaradır
- [x] Selection toolbar: tünd dark (#1e293b) — card-ların ağ bg-si ilə kontrast
- [x] Context menu: mobile-da bottom sheet, desktop-da cursor-a yapışan — platform-aware
- [x] Folder icon: dual-tone mavi (tab tünd, body açıq) — flat deyil, subtle depth
- [x] Quota bar: 3 rəng intervallı (green/yellow/red) — gradient deyil, stepped
- [x] Drop overlay: dashed border pulsing — solid border deyil
- [x] FORBIDDEN: `ease`, `ease-in-out`, `linear` — yalnız cubic-bezier
- [x] NO glassmorphism, NO gradient buttons, NO uniform shadows

---

## 19. CSS Class Naming

Bütün Drive komponentləri `drive-` prefix istifadə edir:

| Prefix | Komponent |
|--------|-----------|
| `drive-page` | Ana container |
| `drive-header` | Header bar |
| `drive-toolbar` | Breadcrumb + sort + view |
| `drive-breadcrumb` | Navigation breadcrumb |
| `drive-grid` | Grid view container |
| `drive-card` | File/folder card |
| `drive-list` | List view |
| `drive-selection` | Selection toolbar |
| `drive-context` | Context menu |
| `drive-details` | Details panel |
| `drive-quota` | Storage quota |
| `drive-trash` | Recycle bin |
| `drive-move` | Move dialog |
| `drive-drop` | Drag & drop overlay |
| `drive-empty` | Empty states |

---

## 20. Handoff Notes for Frontend Developer

1. **FileTypeIcon** — mövcud `FileTypeIcon.jsx` yenidən istifadə olunur (size prop ilə)
2. **Grid view default** — desktop-da large grid, mobile-da medium grid
3. **Context menu position** — `event.clientX/Y` ilə yerləşdirilir, viewport edge detection lazımdır
4. **Details panel** — responsive: desktop-da inline (width animation), tablet-da fixed overlay, mobile-da fullscreen
5. **Drag & drop** — `dragenter/dragleave/drop` event-ləri, `e.preventDefault()` mütləqdir
6. **Staggered animation** — `style={{ animationDelay: `${index * 30}ms` }}` JSX-dən keçirilir, max 20 item stagger
7. **Quota bar rəng** — JS-dən: `pct < 70 ? 'green' : pct < 90 ? 'yellow' : 'red'`
8. **Selection** — `Set()` istifadə et, Ctrl+click: toggle, Shift+click: range select
9. **Sort state** — `localStorage`-da saxla (`drive-sort-by`, `drive-view-mode`)
10. **Recycle Bin** — eyni page component-in `mode="trash"` prop-u ilə
11. **Upload** — mövcud `useFileUpload` hook uyğunlaşdırıla bilər, compression disabled
12. **Move dialog** — recursive folder tree fetch, current item disabled (özünə move olunmaz)
13. **Mobile context menu** — bottom sheet pattern, backdrop ilə bağlanır
