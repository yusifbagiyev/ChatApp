# Frontend Task: downloadUrl → fileUrl rename

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-31
**Priority**: P0 — Bütün avatar uploadlar sınıqdır

---

## Problem

Backend `FileUploadResult.DownloadUrl` → `FileUploadResult.FileUrl` olaraq dəyişdirilib (commit 664167e). Amma frontend hələ köhnə `downloadUrl` property adını axtarır. Nəticədə **heç bir avatar/logo upload** işləmir — upload olunur amma URL saxlanılmır.

---

## Düzəliş

Bütün `downloadUrl` referanslarını `fileUrl` ilə əvəz et:

### 1. CompanyManagement.jsx (line 41)
```
res?.downloadUrl → res?.fileUrl
res.downloadUrl → res.fileUrl
```

### 2. ChannelPanel.jsx (lines 542, 543, 544, 574)
```
uploadResult?.downloadUrl → uploadResult?.fileUrl
uploadResult.downloadUrl → uploadResult.fileUrl
```

### 3. UserProfilePanel.jsx (lines 459, 461)
```
result.downloadUrl → result.fileUrl
```

### 4. Chat.jsx (lines 1475, 1476, 1477)
```
result?.downloadUrl → result?.fileUrl
result.downloadUrl → result.fileUrl
```

### 5. DepartmentManagement.jsx (line 417)
```
result.downloadUrl → result.fileUrl
```

### 6. HierarchyView.jsx (lines 118, 602)
```
result.downloadUrl → result.fileUrl
```

---

## Cəmi: 6 fayl, 13 yer — hamısında `downloadUrl` → `fileUrl`
