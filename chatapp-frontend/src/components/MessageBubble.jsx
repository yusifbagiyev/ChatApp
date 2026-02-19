import { useState, useRef, useEffect } from "react";
import {
  getInitials,
  getAvatarColor,
  formatMessageTime,
} from "../utils/chatUtils";

function MessageBubble({
  msg,
  isOwn,
  showAvatar,
  selectedChat,
  activeMessageId,
  setActiveMessageId,
  onReply,
  onScrollToMessage,
}) {
  const [showActions, setShowActions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reactionExpanded, setReactionExpanded] = useState(false);
  const menuRef = useRef(null);
  const reactionRef = useRef(null);

  // Başqa mesaj aktiv olanda bu mesajın panellərini bağla
  useEffect(() => {
    if (activeMessageId && activeMessageId !== msg.id) {
      setMenuOpen(false);
      setReactionOpen(false);
      setReactionExpanded(false);
      setShowActions(false);
    }
  }, [activeMessageId, msg.id]);

  // Kənar tıklandıqda menuları bağla
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (reactionRef.current && !reactionRef.current.contains(e.target)) {
        setReactionOpen(false);
        setReactionExpanded(false);
      }
    }
    if (menuOpen || reactionOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, reactionOpen]);

  // Menu açılanda aşağıda yer yoxdursa yuxarıya aç
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        menuRef.current.classList.add("flip-up");
      } else {
        menuRef.current.classList.remove("flip-up");
      }
    }
  }, [menuOpen]);

  return (
    <div
      className={`message-row ${isOwn ? "own" : ""} ${showAvatar ? "has-avatar" : ""}`}
      data-bubble-id={msg.id}
      onMouseEnter={() => {
        setActiveMessageId(msg.id);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        if (!menuOpen && !reactionOpen) setShowActions(false);
      }}
      {...(!isOwn &&
        !msg.isRead && {
          "data-unread": "true",
          "data-msg-id": msg.id,
          "data-conv-id":
            selectedChat.type === 0 ? msg.conversationId : msg.channelId,
          "data-conv-type": String(selectedChat.type),
        })}
    >
      {!isOwn && (
        <div className="message-avatar-slot">
          {showAvatar && (
            <div
              className="message-avatar"
              style={{
                background: getAvatarColor(msg.senderFullName),
              }}
            >
              {getInitials(msg.senderFullName)}
            </div>
          )}
        </div>
      )}
      <div className={`message-bubble ${isOwn ? "own" : ""}`}>
        {msg.replyToMessageId && (
          <div
            className="reply-reference"
            onClick={() => onScrollToMessage && onScrollToMessage(msg.replyToMessageId)}
          >
            <div className="reply-reference-bar" />
            <div className="reply-reference-body">
              <span className="reply-reference-name">
                {msg.replyToSenderName}
              </span>
              <span className="reply-reference-text">
                {msg.replyToContent}
              </span>
            </div>
          </div>
        )}
        <div className="message-content">{msg.content}</div>
        <div className="message-meta">
          <span className="message-time">
            {formatMessageTime(msg.createdAtUtc)}
          </span>
          {isOwn && msg.status >= 1 && (
            <svg
              className="read-check"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={msg.status === 3 ? "#46CDF0" : "#9ca3af"}
              strokeWidth="2.5"
            >
              {msg.status >= 2 ? (
                <>
                  <polyline points="18 6 7 17 2 12" />
                  <polyline points="22 6 11 17 8 14" />
                </>
              ) : (
                <polyline points="20 6 9 17 4 12" />
              )}
            </svg>
          )}
        </div>

        {/* Hover action buttons + menus — bubble-ın child-ı, position: absolute */}
        {(showActions || menuOpen || reactionOpen) && (
          <div className={`bubble-actions ${isOwn ? "own" : ""}`}>
            <button
              className="bubble-action-btn"
              title="Reactions"
              onClick={() => {
                setActiveMessageId(msg.id);
                setReactionOpen(!reactionOpen);
                setMenuOpen(false);
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
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            <button
              className="bubble-action-btn"
              title="More"
              onClick={() => {
                setActiveMessageId(msg.id);
                setMenuOpen(!menuOpen);
                setReactionOpen(false);
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
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {/* Action menu dropdown — bubble-actions-ın child-ı */}
            {menuOpen && (
              <div className={`action-menu ${isOwn ? "own" : ""}`} ref={menuRef}>
                <button
                  className="action-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onReply(msg);
                  }}
                >
                  <span>Reply</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                  </svg>
                </button>
                <button
                  className="action-menu-item"
                  onClick={() => {
                    navigator.clipboard.writeText(msg.content);
                    setMenuOpen(false);
                  }}
                >
                  <span>Copy</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                {isOwn && (
                  <button
                    className="action-menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>Edit</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
                <button
                  className="action-menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>Forward</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="15 17 20 12 15 7" />
                    <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                  </svg>
                </button>
                <button
                  className="action-menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>Pin</span>
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
                <button
                  className="action-menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>Add to Favorites</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
                <button
                  className="action-menu-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>Select</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </button>
                {isOwn && (
                  <button
                    className="action-menu-item delete"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>Delete</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Reaction picker — bubble-actions-ın child-ı */}
            {reactionOpen && (
              <div
                className={`reaction-picker ${isOwn ? "own" : ""}`}
                ref={reactionRef}
              >
                <div className="reaction-quick">
                  {["👍", "😂", "❤️", "😟", "🔥"].map((emoji) => (
                    <button
                      key={emoji}
                      className="reaction-emoji-btn"
                      onClick={() => {
                        setReactionOpen(false);
                        setReactionExpanded(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    className="reaction-expand-btn"
                    onClick={() => setReactionExpanded(!reactionExpanded)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                {reactionExpanded && (
                  <div className="reaction-grid">
                    {[
                      "👍",
                      "😂",
                      "❤️",
                      "😟",
                      "🔥",
                      "😮",
                      "🤝",
                      "💯",
                      "😴",
                      "❌",
                      "✅",
                      "🤓",
                      "😊",
                      "😍",
                      "😢",
                      "😎",
                      "🤢",
                      "😡",
                      "👿",
                      "🤣",
                      "💩",
                      "💪",
                      "👏",
                      "🙏",
                      "👎",
                      "😘",
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        className="reaction-emoji-btn"
                        onClick={() => {
                          setReactionOpen(false);
                          setReactionExpanded(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
