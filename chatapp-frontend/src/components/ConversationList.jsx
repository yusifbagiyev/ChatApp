// Utility funksiyaları import et
import { getInitials, getAvatarColor, formatTime } from "../utils/chatUtils";

// ConversationList komponenti — sol panel, söhbət siyahısı
// Props:
//   conversations   — bütün söhbətlər array-i (Chat.jsx state-dən gəlir)
//   selectedChatId  — aktiv seçilmiş chatın id-si (highlight üçün)
//   searchText      — axtarış mətn sahəsinin dəyəri
//   onSearchChange  — axtarış mətn dəyişdikdə çağırılır
//   onSelectChat    — istifadəçi söhbətə klikləyəndə çağırılır
//   isLoading       — söhbətlər yüklənirkən true
// .NET ekvivalenti: LeftPanel.razor — @foreach söhbət siyahısı
function ConversationList({
  conversations,
  selectedChatId,
  searchText,
  onSearchChange,
  onSelectChat,
  isLoading,
  userId,
  typingUsers,
  onCreateChannel,
}) {
  // Client-side filter — searchText-ə görə söhbət siyahısını filtrə et
  // .filter() — şərtə uyan elementləri qaytarır (like LINQ .Where())
  // toLowerCase() — böyük/kiçik hərf fərqini aradan qaldır (case-insensitive)
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="conversation-panel">
      <div className="conversation-panel-header">
        {/* Panel başlığı — filter ikonu */}
        <button className="header-icon-btn" title="Filter">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
        </button>
        <div className="search-wrapper">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {/* Controlled input — value state-dən gəlir */}
          {/* onChange — hər dəfə dəyişdikdə parent-ə bildir (setSearchText çağrılır) */}
          <input
            type="text"
            placeholder="Find employee or chat"
            className="search-input"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {/* Yeni söhbət düyməsi — Bitrix24 stili */}
        <button className="header-icon-btn create-btn" title="New group" onClick={onCreateChannel}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Söhbət siyahısı */}
      <div className="conversation-list">
        {/* Şərti render — 3 hal: yüklənir / boşdur / siyahı göstər */}
        {isLoading ? (
          // Yüklənir...
          <div className="loading-state">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          // Nəticə yoxdur
          <div className="empty-state">No conversations yet</div>
        ) : (
          filteredConversations.map((c) => {
            // Öz mesajımdırmı? — tick icon göstərmək üçün
            const isOwnLastMessage = c.lastMessageSenderId === userId;

            // Preview mətni — tiplərə görə fərqlənir
            let previewContent;
            // Preview-un solunda əlavə icon/avatar olacaqmı?
            let previewPrefix = null;

            if (c.draft) {
              // Draft varsa — qırmızı "Draft:" prefix ilə göstər
              previewPrefix = <span className="preview-draft-label">Draft:</span>;
              previewContent = c.draft;
            } else if (c.type === 2) {
              // DepartmentUser → vəzifə adı
              previewContent = c.positionName || "User";
            } else if (!c.lastMessage) {
              previewContent = "No messages yet";
            } else if (c.isNotes) {
              // Notes — ↩ icon ilə
              previewPrefix = <span className="preview-reply-icon"><svg viewBox="0 0 16 16"><path d="M14 3v4c0 1.1-.9 2-2 2H4m0 0l3-3M4 9l3 3"/></svg></span>;
              previewContent = c.lastMessage;
            } else if (isOwnLastMessage) {
              // Öz mesajım (DM/Channel) — ↩ icon + mətn
              previewPrefix = <span className="preview-reply-icon"><svg viewBox="0 0 16 16"><path d="M14 3v4c0 1.1-.9 2-2 2H4m0 0l3-3M4 9l3 3"/></svg></span>;
              previewContent = c.lastMessage;
            } else if (c.type === 1 && c.lastMessageSenderFullName) {
              // Channel + başqasının mesajı → kiçik avatar + mətn
              previewPrefix = (
                <span
                  className="preview-sender-avatar"
                  style={{ background: getAvatarColor(c.lastMessageSenderFullName) }}
                >
                  {getInitials(c.lastMessageSenderFullName)}
                </span>
              );
              previewContent = c.lastMessage;
            } else {
              // DM — qarşı tərəfin mesajı → sadəcə mətn
              previewContent = c.lastMessage;
            }

            return (
              <div
                key={c.id}
                className={`conversation-item ${selectedChatId === c.id ? "selected" : ""}`}
                onClick={() => onSelectChat(c)}
              >
                {/* Avatar + typing indicator wrapper */}
                <div className="conversation-avatar-wrapper">
                  <div
                    className="conversation-avatar"
                    style={{ background: c.isNotes ? "#2FC6F6" : getAvatarColor(c.name) }}
                  >
                    {c.isNotes ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    ) : (
                      getInitials(c.name)
                    )}
                  </div>
                  {/* Typing indicator — avatar-ın sağ-aşağı küncündə animasiyalı dots */}
                  {typingUsers[c.id] && (
                    <span className="avatar-typing-indicator">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  )}
                </div>

                {/* Söhbət məlumatı */}
                <div className="conversation-info">
                  {/* Üst sıra: ad + tick + tarix */}
                  <div className="conversation-top-row">
                    <span className="conversation-name">{c.name}</span>
                    <div className="conversation-time-wrapper">
                      {/* Tick icon — time-ın solunda, yalnız öz mesajımda (Notes-da yox) */}
                      {isOwnLastMessage && c.type !== 2 && !c.isNotes && c.lastMessage && (
                        <span className={`preview-tick ${c.lastMessageStatus === "Read" ? "read" : ""}`}>
                          <svg viewBox="0 0 16 11">
                            <polyline points="1 5.5 5 9.5 11 1" />
                            {c.lastMessageStatus === "Read" && (
                              <polyline points="5.5 5.5 9.5 9.5 15 1" />
                            )}
                          </svg>
                        </span>
                      )}
                      <span className="conversation-time">
                        {formatTime(c.lastMessageAtUtc)}
                      </span>
                    </div>
                  </div>

                  {/* Alt sıra: preview + unread badge */}
                  <div className="conversation-bottom-row">
                    <span className="conversation-preview">
                      {previewPrefix}
                      {previewContent}
                    </span>
                    {/* Read later icon — mesaj səviyyəsində mark varsa bookmark göstər */}
                    {c.lastReadLaterMessageId && (
                      <span className="read-later-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </span>
                    )}
                    {c.unreadCount > 0 && (
                      <span className="unread-badge">{c.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
