# Frontend Task: File Upload — conversationId/channelId FormData-ya Əlavə Et

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-29
**Priority**: P0 — CRITICAL BUG

---

## ⛔ CİDDİ XƏBƏRDARLIQ

**Bu tapşırıqda YANLIŞ, YARYMÇIQ və ya ATILANMIŞ bir iş olmamalıdır.**

Frontend developer kimi sən artıq dəfələrlə tapşırıqları atlamısan, yarımçıq buraxmısan. Bu son xəbərdarlıqdır. Tapşırığın HƏR BƏNDİNİ oxu, HƏR BƏNDİNİ implementasiya et, HƏR BƏNDİNİ yoxla. "Bitirdim" deməmişdən əvvəl hər faylı aç, dəyişikliyin orada olduğunu təsdiqlə.

---

## Problem

İstifadəçi DM-də və ya channel-da fayl yükləyəndə, fayl `drive/` folderinə düşür. Səbəb: `useFileUploadManager.js`-da FormData yaradılarkən `conversationId` və `channelId` **əlavə olunmur**.

Backend düzgündür — `UploadFileRequest` DTO-da `ConversationId` və `ChannelId` field-ləri mövcuddur. `DetermineStorageDirectory()` düzgün yoxlayır. Problem yalnız frontend-dədir.

---

## Düzəliş

**Fayl:** `chatapp-frontend/src/hooks/useFileUploadManager.js` (və ya fayl upload hook-u harada olursa olsun)

`processUpload` funksiyasında (təxminən line 92-93), FormData yaradıldıqdan sonra `conversationId` və ya `channelId` əlavə et:

```js
const formData = new FormData();
formData.append("file", task.file);

// Conversation/Channel kontekstini əlavə et
if (task.chatType === 0 || task.chatType === 2) {
  // DM (0) və ya DepartmentUser (2) — conversationId göndər
  formData.append("conversationId", task.chatId);
} else if (task.chatType === 1) {
  // Channel — channelId göndər
  formData.append("channelId", task.chatId);
}
```

> **DİQQƏT:** `task.chatType` dəyərlərini yoxla — 0, 1, 2 düzgün mapping-dir yoxsa string-dir? Kodu oxu, təsdiqlə, sonra yaz.

---

## Yoxlama Siyahısı

- [ ] `formData.append("conversationId", task.chatId)` — DM kontekstində əlavə olunur
- [ ] `formData.append("channelId", task.chatId)` — Channel kontekstində əlavə olunur
- [ ] `chatType` dəyərləri düzgün yoxlanılır (0/1/2 və ya string)
- [ ] Test: DM-də şəkil yüklə → `images/direct_messages/{convId}/` altına düşməlidir
- [ ] Test: Channel-da sənəd yüklə → `files/channel_messages/{chId}/` altına düşməlidir
- [ ] Test: `drive/` folderinə heç nə düşməməlidir (kontekstli uploadlarda)

---

## Qeydlər

- Backend tam düzgündür — `FilesController`, `UploadFileRequest`, `DetermineStorageDirectory` hamısı mövcuddur
- Problem YALNIZ frontend-dədir — FormData-ya context field-ləri əlavə olunmur
- Bu bug səbəbindən bütün yüklənmiş fayllar yanlış qovluğa düşür
