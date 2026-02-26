// Utility funksiyaları import et
import { getInitials, getAvatarColor, getLastSeenText } from "../utils/chatUtils";

// ChatHeader komponenti — chat panelinin yuxarı başlığı
// Props:
//   selectedChat     — seçilmiş chat obyekti (ad, tip, otherUserId, ...)
//   onlineUsers      — Set<userId> — online olan istifadəçilər
//   pinnedMessages   — pinlənmiş mesajlar array-i (pin button aktiv/deaktiv üçün)
//   onTogglePinExpand — pin list-i genişləndir/yığ (Chat.jsx-dən gəlir)
function ChatHeader({ selectedChat, onlineUsers, pinnedMessages, onTogglePinExpand }) {
  return (
    <div className="chat-header">
      {/* Sol tərəf: avatar + ad + status */}
      <div className="chat-header-left">
        {/* Avatar — addan rəngli dairə */}
        <div
          className="chat-header-avatar"
          style={{ background: getAvatarColor(selectedChat.name) }}
        >
          {getInitials(selectedChat.name)}
        </div>

        <div className="chat-header-info">
          {/* Birinci sıra: ad + real-time status (typing / online / last seen) */}
          <div className="chat-header-name-row">
            <span className="chat-header-name">
              {selectedChat.name}
            </span>

            {/* Mute icon — conversation muted olduqda adın yanında göstər */}
            {selectedChat.isMuted && (
              <span className="chat-header-mute-icon" title="Muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              </span>
            )}

            {/* Status yalnız DM (type=0) üçün: Online / Last Seen */}
            {!selectedChat.isNotes &&
              selectedChat.type === 0 &&
              (onlineUsers.has(selectedChat.otherUserId) ? (
                <span className="status-online">Online</span>
              ) : (
                <span className="status-offline">
                  {getLastSeenText(
                    selectedChat.otherUserLastSeenAtUtc,
                  )}
                </span>
              ))}
          </div>

          {/* İkinci sıra: vəzifə / üzv sayı / "Your personal notes" */}
          <span className="chat-header-status">
            {selectedChat.isNotes
              ? "Your personal notes"
              : selectedChat.type === 0
                // DM — digər istifadəçinin vəzifəsi
                ? selectedChat.otherUserPosition ||
                  selectedChat.otherUserRole ||
                  "User"
                : selectedChat.type === 1
                  // Channel — üzv sayı
                  ? `${selectedChat.memberCount || 0} members`
                  // DepartmentUser (type=2) — vəzifə adı
                  : selectedChat.positionName || "User"}
          </span>
        </div>
      </div>

      {/* Sağ tərəf: action düymələri */}
      <div className="chat-header-actions">
        {/* Search düyməsi — TODO: axtarış panel aç */}
        <button className="header-action-btn" title="Search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        {/* Pin düyməsi — pinnedMessages varsa PinnedExpanded-i aç/bağla */}
        {/* pinnedMessages.length > 0 şərti olmadıqda button klik edilə bilməz */}
        <button
          className="header-action-btn"
          title="Pin"
          onClick={() => pinnedMessages.length > 0 && onTogglePinExpand()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="17" x2="12" y2="22" />
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
