# Frontend Task: Employee Drive — Implementation

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-31
**Priority**: P1
**Backend**: Hazırdır — `DriveController` (`/api/drive/*`)

---

## Xülasə

Top navbar-da "Drive" butonu klikləndikdə açılan şəxsi fayl saxlama səhifəsi. Bitrix24 "My Drive" referansı.

**CSS və wireframe spec burada:**
`agents/uiux-developer/outputs/2026-03-31_wireframe_employee-drive.md`
**Bu faylı mütləq oxu — orada bütün CSS class-lar, wireframe-lar, animasiyalar, responsive qaydalar, color token-lar var. Aşağıdakı tapşırıq komponent strukturu, API və state-ə fokuslanır. Dizayn UI/UX spec-dən götürülməlidir.**

---

## 1. Yaradılacaq Komponentlər

| Komponent | Təsvir | UI/UX Spec bölməsi |
|-----------|--------|---------------------|
| `DrivePage.jsx` | Ana səhifə — header, toolbar, content area | Spec §2 (Page Layout), §3 (Container CSS) |
| `DriveHeader.jsx` | "My Drive" başlıq, "+ Add" dropdown, search, recycle bin butonu, quota icon | Spec §4 (Header wireframe + CSS) |
| `DriveBreadcrumb.jsx` | Folder navigation breadcrumb | Spec §5 (Toolbar, breadcrumb CSS) |
| `DriveFileGrid.jsx` | Grid view — large/medium grid toggle | Spec §6 (Grid container CSS) |
| `DriveFileList.jsx` | List/table view | Spec §7 (List view CSS) |
| `DriveFileCard.jsx` | Tək fayl/folder card — icon, thumbnail, ad, metadata | Spec §6.2 (Card wireframe + CSS + states) |
| `DriveSelectionToolbar.jsx` | Seçilmiş fayllar üçün action-lar (Details, Download, Rename, Move, Delete) | Spec §8 (Selection toolbar CSS) |
| `DriveDetailsPanel.jsx` | Sağdan slide-in fayl/folder detalları | Spec §9 (Details panel CSS) |
| `DriveRecycleBin.jsx` | Silinmiş fayllar/folder-lər, restore, empty trash | Spec §10 (Recycle Bin CSS) |
| `DriveContextMenu.jsx` | Sağ klik context menu | Spec §11 (Context menu CSS) |
| `DriveMoveDialog.jsx` | Folder seçmə dialog (move action üçün) | Spec §12 (Move dialog CSS) |
| `DriveQuotaBar.jsx` | Storage usage progress bar (popover) | Spec §13 (Quota CSS) |

**CSS faylı:** `DrivePage.css` — bütün CSS class-lar UI/UX spec-dən götürülür.

---

## 2. Route

`App.jsx`-də yeni route:
```
/drive → DrivePage
```

Top navbar-da "Drive" artıq "Coming soon" əvəzinə bu route-a yönlənsin.

---

## 3. Backend API Endpoint-ləri (Hazırdır)

`services/api.js`-ə əlavə ediləcək funksiyalar:

### Folders
| Funksiya | Endpoint | Method |
|----------|----------|--------|
| `getDriveFolders(parentId, search)` | `GET /api/drive/folders?parentId=&search=` | GET |
| `createDriveFolder(name, parentId)` | `POST /api/drive/folders` | POST |
| `renameDriveFolder(id, name)` | `PUT /api/drive/folders/{id}` | PUT |
| `moveDriveFolder(id, targetFolderId)` | `PUT /api/drive/folders/{id}/move` | PUT |
| `deleteDriveFolder(id)` | `DELETE /api/drive/folders/{id}` | DELETE |

### Files
| Funksiya | Endpoint | Method |
|----------|----------|--------|
| `getDriveFiles(folderId, sortBy, sortOrder, search)` | `GET /api/drive/files?folderId=&sortBy=&sortOrder=&search=` | GET |
| `uploadDriveFile(formData, folderId)` | `POST /api/drive/upload?folderId=` | POST |
| `renameDriveFile(id, name)` | `PUT /api/drive/files/{id}/rename` | PUT |
| `moveDriveFile(id, targetFolderId)` | `PUT /api/drive/files/{id}/move` | PUT |
| `deleteDriveFile(id)` | `DELETE /api/drive/files/{id}` | DELETE |

### Recycle Bin
| Funksiya | Endpoint | Method |
|----------|----------|--------|
| `getDriveTrash()` | `GET /api/drive/trash` | GET |
| `restoreDriveItem(id)` | `PUT /api/drive/trash/{id}/restore` | PUT |
| `permanentDeleteDriveItem(id)` | `DELETE /api/drive/trash/{id}` | DELETE |
| `emptyDriveTrash()` | `DELETE /api/drive/trash` | DELETE |

### Quota
| Funksiya | Endpoint | Method |
|----------|----------|--------|
| `getDriveQuota()` | `GET /api/drive/quota` | GET |

**Response formatları:**
```javascript
// DriveFolderDto
{ id, name, parentFolderId, itemCount, createdAtUtc, updatedAtUtc }

// DriveFileDto
{ id, originalFileName, contentType, fileSizeInBytes, fileType, folderId, width, height, fileUrl, createdAtUtc }

// DriveTrashItemDto
{ id, name, type ("file"|"folder"), fileSizeInBytes, deletedAtUtc }

// DriveQuotaDto
{ usedBytes, totalBytes, usedMB, totalMB, percentage }
```

---

## 4. State Management

```javascript
// DrivePage state
const [currentFolderId, setCurrentFolderId] = useState(null);      // null = root
const [folderPath, setFolderPath] = useState([]);                   // breadcrumb [{id, name}]
const [folders, setFolders] = useState([]);
const [files, setFiles] = useState([]);
const [viewMode, setViewMode] = useState("grid-large");            // "grid-large" | "grid-medium" | "list"
const [selectedItems, setSelectedItems] = useState(new Set());      // {id1, id2, ...}
const [sortBy, setSortBy] = useState("date");
const [sortOrder, setSortOrder] = useState("desc");
const [searchTerm, setSearchTerm] = useState("");
const [showRecycleBin, setShowRecycleBin] = useState(false);
const [detailItem, setDetailItem] = useState(null);                 // sağ panel açıq/bağlı
const [quota, setQuota] = useState(null);
const [loading, setLoading] = useState(true);
```

---

## 5. Əsas Davranışlar

### Folder Navigation
- Folder card-a click → `setCurrentFolderId(folderId)` + `folderPath`-ə əlavə et
- Breadcrumb element-ə click → o folder-ə qayıt, folderPath kəs
- Root-a qayıtmaq → "My Drive" breadcrumb click

### Selection
- Card-a click → navigate (folder) və ya select (file)
- Ctrl+click → multi-select toggle
- Card checkbox → multi-select
- Seçim olanda → `DriveSelectionToolbar` görünür

### Drag & Drop Upload
- Fayl brauzerdən drive-a drag-drop
- Drop zone: drive content area
- Progress indicator upload zamanı

### Context Menu
- Card-a right-click → `DriveContextMenu` açılır
- Actions: Details, Download, Rename, Move, Delete

### Sort
- Default: "By date changed" desc
- Sort dəyişdikdə: API-dən yenidən fetch

### Search
- Debounce 300ms
- Həm folder, həm fayl adlarında axtarış

---

## 6. Empty States (UI/UX spec §14)

- **Boş drive**: folder icon + "Your drive is empty" + "+ Upload files" butonu
- **Boş folder**: "This folder is empty" + "Drag files here or click + Add"
- **Boş recycle bin**: "Recycle Bin is empty" + info text
- **Axtarış nəticəsi yoxdur**: "No results found" + clear search butonu

---

## 7. Responsive (UI/UX spec §15)

- **Desktop (≥1024px)**: tam layout, details panel yan-yana
- **Tablet (768-1023px)**: grid kiçilir, details panel overlay
- **Mobile (<768px)**: list view default, full-screen details overlay

---

## Acceptance Criteria

- [ ] Grid (large + medium) və List view toggle işləyir
- [ ] Folder navigation — breadcrumb ilə irəli/geri
- [ ] Fayl upload — drag-drop + "+ Add" dropdown
- [ ] Selection toolbar — multi-select, download, rename, move, delete
- [ ] Context menu — sağ klik
- [ ] Details panel — fayl metadata, preview göstərir
- [ ] Recycle bin — restore, empty trash, permanent delete
- [ ] Quota bar — usage göstərir, 90%+ warning
- [ ] Sort — name, date, size, type (asc/desc)
- [ ] Search — debounced, real-time filter
- [ ] Empty states — düzgün göstərilir
- [ ] Responsive — mobile/tablet uyğun
- [ ] Bütün CSS UI/UX spec-dən (`2026-03-31_wireframe_employee-drive.md`) götürülüb
