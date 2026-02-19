import { getInitials, getAvatarColor } from "../utils/chatUtils";

function PinnedBar({
  pinnedMessages,
  currentPinIndex,
  onPinClick,
  onToggleExpand,
}) {
  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const currentMsg = pinnedMessages[currentPinIndex] || pinnedMessages[0];
  const total = pinnedMessages.length;

  return (
    <div
      className="pinned-bar"
      onClick={() => onPinClick(currentMsg.id)}
    >
      <div className="pinned-bar-body">
        <span className="pinned-bar-title">Pinned messages</span>
        <span className="pinned-bar-preview">
          <strong>{currentMsg.senderFullName}:</strong> {currentMsg.content}
        </span>
      </div>

      <div
        className="pinned-bar-right"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="pinned-bar-count">
          {currentPinIndex + 1} / {total}
        </span>
        <button
          className="pinned-bar-btn"
          title="Show all pinned"
          onClick={onToggleExpand}
        >
          <svg
            width="16"
            height="16"
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

function PinnedExpanded({
  pinnedMessages,
  onToggleExpand,
  onScrollToMessage,
  onUnpin,
}) {
  return (
    <div className="pinned-expanded">
      <div className="pinned-expanded-header">
        <span>Pinned messages: {pinnedMessages.length}</span>
        <button
          className="pinned-expanded-close"
          onClick={onToggleExpand}
          title="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="pinned-expanded-list">
        {pinnedMessages.map((msg) => (
          <div
            key={msg.id}
            className="pinned-expanded-item"
            onClick={() => onScrollToMessage(msg.id)}
          >
            <div
              className="pinned-expanded-avatar"
              style={{ background: getAvatarColor(msg.senderFullName) }}
            >
              {getInitials(msg.senderFullName)}
            </div>
            <div className="pinned-expanded-info">
              <span className="pinned-expanded-name">
                {msg.senderFullName}
              </span>
              <span className="pinned-expanded-text">{msg.content}</span>
            </div>
            <button
              className="pinned-expanded-unpin"
              title="Unpin"
              onClick={(e) => {
                e.stopPropagation();
                onUnpin(msg);
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PinnedBar;
export { PinnedExpanded };
