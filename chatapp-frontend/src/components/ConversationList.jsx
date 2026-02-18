import { getInitials, getAvatarColor, formatTime } from "../utils/chatUtils";

function ConversationList({
  conversations,
  selectedChatId,
  searchText,
  onSearchChange,
  onSelectChat,
  isLoading,
}) {
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="conversation-panel">
      <div className="conversation-panel-header">
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
          <input
            type="text"
            placeholder="Find employee or chat"
            className="search-input"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="conversation-list">
        {isLoading ? (
          <div className="loading-state">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="empty-state">No conversations yet</div>
        ) : (
          filteredConversations.map((c) => (
            <div
              key={c.id}
              className={`conversation-item ${selectedChatId === c.id ? "selected" : ""}`}
              onClick={() => onSelectChat(c)}
            >
              <div
                className="conversation-avatar"
                style={{ background: getAvatarColor(c.name) }}
              >
                {getInitials(c.name)}
              </div>
              <div className="conversation-info">
                <div className="conversation-top-row">
                  <span className="conversation-name">{c.name}</span>
                  <span className="conversation-time">
                    {formatTime(c.lastMessageAtUtc)}
                  </span>
                </div>
                <div className="conversation-bottom-row">
                  <span className="conversation-preview">
                    {c.type === 2
                      ? c.positionName || "User"
                      : c.lastMessage || "No messages yet"}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="unread-badge">{c.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ConversationList;
