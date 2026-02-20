function SelectToolbar({
  selectedCount,
  hasOthersSelected,
  onExit, onDelete, onForward,
  deleteConfirmOpen, setDeleteConfirmOpen,
}) {
  return (
    <>
      <div className="select-toolbar">
        <div className="select-toolbar-inner">
          <div className="select-toolbar-left">
            <button className="select-toolbar-close" onClick={onExit}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <span className="select-toolbar-count">
              Messages ({selectedCount})
            </span>
          </div>
          <div className="select-toolbar-divider" />
          <div className="select-toolbar-right">
            <button
              className="select-action-btn select-delete-btn"
              disabled={selectedCount === 0 || hasOthersSelected}
              onClick={() => setDeleteConfirmOpen(true)}
              title={hasOthersSelected ? "You cannot delete someone else's message" : ""}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Delete</span>
            </button>
            <button
              className="select-action-btn select-forward-btn"
              disabled={selectedCount === 0}
              onClick={onForward}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 17 20 12 15 7" />
                <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
              </svg>
              <span>Forward</span>
            </button>
          </div>
        </div>
      </div>
      {deleteConfirmOpen && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <span>Do you want to delete the selected messages ({selectedCount})?</span>
              <button className="delete-confirm-close" onClick={() => setDeleteConfirmOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="delete-confirm-actions">
              <button
                className="delete-confirm-btn"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  onDelete();
                }}
              >
                DELETE
              </button>
              <button className="delete-cancel-btn" onClick={() => setDeleteConfirmOpen(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SelectToolbar;
