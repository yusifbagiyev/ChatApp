import { getInitials, getAvatarColor, getLastSeenText } from "../utils/chatUtils";

function ChatHeader({ selectedChat, typingUsers, onlineUsers, pinnedMessages, onTogglePinExpand }) {
  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <div
          className="chat-header-avatar"
          style={{ background: getAvatarColor(selectedChat.name) }}
        >
          {getInitials(selectedChat.name)}
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name-row">
            <span className="chat-header-name">
              {selectedChat.name}
            </span>
            {!selectedChat.isNotes &&
              selectedChat.type === 0 &&
              (typingUsers[selectedChat.id] ? (
                <span className="status-typing">is typing...</span>
              ) : onlineUsers.has(selectedChat.otherUserId) ? (
                <span className="status-online">Online</span>
              ) : (
                <span className="status-offline">
                  {getLastSeenText(
                    selectedChat.otherUserLastSeenAtUtc,
                  )}
                </span>
              ))}
          </div>
          <span className="chat-header-status">
            {selectedChat.isNotes
              ? "Your personal notes"
              : selectedChat.type === 0
                ? selectedChat.otherUserPosition ||
                  selectedChat.otherUserRole ||
                  "User"
                : selectedChat.type === 1
                  ? `${selectedChat.memberCount || 0} members`
                  : selectedChat.positionName || "User"}
          </span>
        </div>
      </div>
      <div className="chat-header-actions">
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
