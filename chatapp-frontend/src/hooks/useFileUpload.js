// ─── useFileUpload.js — Custom Hook: Fayl Seçmə State İdarəsi ──────────────
// Bu hook fayl yükləmə UI state-lərini və sadə handler-ləri idarə edir.
// handleSendFiles Chat.jsx-də qalır — çoxlu cross-cutting dependency var.

import { useState } from "react";

export default function useFileUpload() {

  // ─── State-lər ────────────────────────────────────────────────────────────
  const [selectedFiles, setSelectedFiles] = useState([]);       // Seçilmiş fayllar (File[])
  const [uploadProgress, setUploadProgress] = useState(null);   // Upload progress (0-100)
  const [isUploading, setIsUploading] = useState(false);        // Upload prosesi davam edir

  // ─── handleFilesSelected — attach menu-dan fayl seçildikdə ────────────────
  function handleFilesSelected(files) {
    setSelectedFiles((prev) => [...prev, ...files]);
  }

  // ─── handleRemoveFile — preview paneldən faylı sil ─────────────────────────
  function handleRemoveFile(index) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── handleReorderFiles — drag-drop ilə faylın sırasını dəyiş ─────────────
  function handleReorderFiles(fromIndex, toIndex) {
    setSelectedFiles((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr;
    });
  }

  // ─── handleClearFiles — bütün faylları sil (preview paneli bağla) ──────────
  function handleClearFiles() {
    setSelectedFiles([]);
    setUploadProgress(null);
    setIsUploading(false);
  }

  return {
    selectedFiles,
    setSelectedFiles,
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    handleFilesSelected,
    handleRemoveFile,
    handleReorderFiles,
    handleClearFiles,
  };
}
