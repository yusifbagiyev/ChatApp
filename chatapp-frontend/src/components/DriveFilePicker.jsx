// DriveFilePicker — drive-dan fayl seçmə modalı
// Chat-da "File on Drive" seçildikdə açılır, istifadəçi öz drive fayllarını browse edib seçə bilir
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { getDriveContents, getFileUrl } from "../services/api";
import { MAX_FILE_SIZE, MAX_UPLOAD_FILES, formatFileSize, isAllowedFileExtension } from "../utils/chatUtils";
import { useToast } from "../context/ToastContext";
import FileTypeIcon from "./FileTypeIcon";
import "./DriveFilePicker.css";

function DriveFilePicker({ onSelect, onClose }) {
  const { showToast } = useToast();

  // State — cari folder, breadcrumb path, data, selection
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]); // [{ id, name }]
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState(new Map()); // id → file obj
  const abortRef = useRef(null);

  // Folder məzmununu yüklə
  const fetchContents = useCallback(async (folderId) => {
    // Əvvəlki request-i ləğv et
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const data = await getDriveContents(folderId, "name", "asc", null, null, 200);
      // Abort olunubsa nəticəni ignore et
      if (controller.signal.aborted) return;
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (err) {
      if (err.name === "AbortError") return;
      showToast("Failed to load drive contents", "error");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [showToast]);

  // İlk yüklənmə və folder dəyişikliyi
  useEffect(() => {
    fetchContents(currentFolderId);
  }, [currentFolderId, fetchContents]);

  // Unmount — ləğv et
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Escape ilə bağla
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Folder-ə daxil ol
  const enterFolder = useCallback((folder) => {
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  }, []);

  // Breadcrumb naviqasiyası — My Drive və ya aralıq folder-ə qayıt
  const navigateTo = useCallback((index) => {
    if (index === -1) {
      // Root (My Drive)
      setFolderPath([]);
      setCurrentFolderId(null);
    } else {
      const target = folderPath[index];
      setFolderPath(prev => prev.slice(0, index + 1));
      setCurrentFolderId(target.id);
    }
  }, [folderPath]);

  // Fayl seçimi toggle
  const toggleFile = useCallback((file) => {
    // Validasiya — extension
    if (!isAllowedFileExtension(file.originalFileName)) {
      showToast("This file type is not allowed", "error");
      return;
    }
    // Validasiya — ölçü
    if (file.fileSizeInBytes > MAX_FILE_SIZE) {
      showToast("File size exceeds 100 MB limit", "error");
      return;
    }

    setSelectedFiles(prev => {
      const next = new Map(prev);
      if (next.has(file.id)) {
        next.delete(file.id);
      } else {
        // Max limit yoxla
        if (next.size >= MAX_UPLOAD_FILES) {
          showToast(`Maximum ${MAX_UPLOAD_FILES} files can be selected`, "warning");
          return prev;
        }
        next.set(file.id, file);
      }
      return next;
    });
  }, [showToast]);

  // Seçimi təsdiqlə
  const handleConfirm = useCallback(() => {
    if (selectedFiles.size === 0) return;
    onSelect(Array.from(selectedFiles.values()));
  }, [selectedFiles, onSelect]);

  // Şəkil faylı olub-olmadığını yoxla
  const isImage = (contentType) => contentType?.startsWith("image/");

  return (
    <div className="drive-picker-overlay" onClick={onClose}>
      <div className="drive-picker-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="drive-picker-header">
          <h3 className="drive-picker-title">Select one or more documents</h3>
          <button className="drive-picker-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="drive-picker-breadcrumb">
          <button
            className={`drive-picker-crumb${folderPath.length === 0 ? " active" : ""}`}
            onClick={() => navigateTo(-1)}
          >
            My Drive
          </button>
          {folderPath.map((item, i) => (
            <span key={item.id} className="drive-picker-crumb-item">
              <span className="drive-picker-crumb-sep">/</span>
              <button
                className={`drive-picker-crumb${i === folderPath.length - 1 ? " active" : ""}`}
                onClick={() => navigateTo(i)}
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>

        {/* Content */}
        <div className="drive-picker-content">
          {loading ? (
            <div className="drive-picker-loading">
              <div className="drive-picker-spinner" />
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="drive-picker-empty">This folder is empty</div>
          ) : (
            <>
              {/* Column header */}
              <div className="drive-picker-row header">
                <span className="drive-picker-col-name">Name</span>
                <span className="drive-picker-col-size">Size</span>
                <span className="drive-picker-col-date">Modified on</span>
              </div>

              {/* Folder-lər */}
              {folders.map(folder => (
                <div
                  key={folder.id}
                  className="drive-picker-row folder"
                  onClick={() => enterFolder(folder)}
                >
                  <span className="drive-picker-col-name">
                    <svg className="drive-picker-folder-icon" width="20" height="20" viewBox="0 0 24 24" fill="#f9c74f" stroke="#e5a100" strokeWidth="1">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="drive-picker-item-name">{folder.name}</span>
                  </span>
                  <span className="drive-picker-col-size">{folder.itemCount ?? 0} items</span>
                  <span className="drive-picker-col-date">
                    {new Date(folder.updatedAtUtc || folder.createdAtUtc).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                </div>
              ))}

              {/* Fayllar */}
              {files.map(file => {
                const selected = selectedFiles.has(file.id);
                return (
                  <div
                    key={file.id}
                    className={`drive-picker-row file${selected ? " selected" : ""}`}
                    onClick={() => toggleFile(file)}
                  >
                    <span className="drive-picker-col-name">
                      <input
                        type="checkbox"
                        className="drive-picker-checkbox"
                        checked={selected}
                        readOnly
                      />
                      {isImage(file.contentType) && file.serveUrl ? (
                        <img
                          className="drive-picker-thumb"
                          src={getFileUrl(file.serveUrl)}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <FileTypeIcon fileName={file.originalFileName} size={24} />
                      )}
                      <span className="drive-picker-item-name">{file.originalFileName}</span>
                    </span>
                    <span className="drive-picker-col-size">{formatFileSize(file.fileSizeInBytes)}</span>
                    <span className="drive-picker-col-date">
                      {new Date(file.createdAtUtc).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="drive-picker-footer">
          <span className="drive-picker-count">
            {selectedFiles.size > 0 && `${selectedFiles.size} file(s) selected`}
          </span>
          <div className="drive-picker-actions">
            <button
              className="drive-picker-btn primary"
              disabled={selectedFiles.size === 0}
              onClick={handleConfirm}
            >
              SELECT DOCUMENT
            </button>
            <button className="drive-picker-btn cancel" onClick={onClose}>
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(DriveFilePicker);
