# Drive File Picker — Implementation Plan

## Məqsəd
Attach menyu-da "File on Drive" butonu — klik edəndə drive fayllarını browse edib seçə bilən panel açılır.

## Yanaşma: Option B — birbaşa fileId ilə mesaj göndər
Drive faylları artıq serverdədir → re-upload lazım deyil. `apiPost(endpoint, { fileId })` ilə birbaşa göndəririk.

## Dəyişikliklər

### 1. `DriveFilePicker.jsx` + `DriveFilePicker.css` (YENİ)
- Modal overlay (FilePreviewPanel pattern: fixed inset, zc-modal)
- Header: "Select one or more documents" + X butonu
- Breadcrumb: "My Drive > Subfolder" — naviqasiya
- Content: folder/fayl siyahısı (getDriveContents API)
  - Folder: klik → içinə daxil ol
  - Fayl: checkbox ilə seç/seçimi götür
  - Şəkil fayllar üçün thumbnail (getFileUrl)
- Footer: "N file(s) selected" + SELECT DOCUMENT / CANCEL
- Validasiya: MAX_UPLOAD_FILES (10), MAX_FILE_SIZE (100MB), isAllowedFileExtension
- State: currentFolderId, folderPath[], selectedFiles Map, loading, error
- Escape → bağla, AbortController fetch üçün

### 2. `ChatInputArea.jsx` (DƏYİŞİKLİK)
- "File on Bitrix24" → "File on Drive" (enabled)
- `drivePickerOpen` state əlavə et
- Klik → `setDrivePickerOpen(true)` + attach menu bağla
- Yeni prop: `onSelectDriveFiles`
- `<DriveFilePicker onSelect={...} onClose={...} />` render et

### 3. `Chat.jsx` (DƏYİŞİKLİK)
- `handleSendDriveFiles(driveFiles)` funksiya əlavə et
  - Hər fayl üçün ayrı mesaj: `apiPost(endpoint, { fileId: file.id })`
  - Birinci mesaja replyTo və text əlavə oluna bilər
  - Optimistic UI message yaratma
  - ConversationList yenilənməsi
- ChatInputArea-ya `onSelectDriveFiles={handleSendDriveFiles}` prop ötür

## Fayl siyahısı
| Fayl | Əməliyyat |
|------|-----------|
| `components/DriveFilePicker.jsx` | YENİ |
| `components/DriveFilePicker.css` | YENİ |
| `components/ChatInputArea.jsx` | DƏYİŞİKLİK |
| `pages/Chat.jsx` | DƏYİŞİKLİK |
