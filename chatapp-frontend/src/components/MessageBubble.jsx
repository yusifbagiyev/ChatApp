import { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  getInitials,
  getAvatarColor,
  formatMessageTime,
} from "../utils/chatUtils";
import { QUICK_REACTION_EMOJIS, EXPANDED_REACTION_EMOJIS } from "../utils/emojiConstants";
import MessageActionMenu from "./MessageActionMenu";

const MessageBubble = memo(function MessageBubble({
  msg,
  isOwn,
  showAvatar,
  chatType,
  selectMode,
  isSelected,
  onReply,
  onForward,
  onPin,
  onFavorite,
  onSelect,
  onToggleSelect,
  onScrollToMessage,
  onDelete,
  onEdit,
  onReaction,
  onLoadReactionDetails,
}) {
  const [showActions, setShowActions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reactionExpanded, setReactionExpanded] = useState(false);
  const [reactionTooltipOpen, setReactionTooltipOpen] = useState(null); // açıq tooltip-in emoji-si
  const [reactionDetailsLoading, setReactionDetailsLoading] = useState(false);
  const menuRef = useRef(null);
  const reactionRef = useRef(null);
  const tooltipRef = useRef(null);

  // Kənar tıklandıqda menuları + actions panelini + tooltip-i bağla
  useEffect(() => {
    function handleClickOutside(e) {
      const clickedInsideMenu = menuRef.current && menuRef.current.contains(e.target);
      const clickedInsideReaction = reactionRef.current && reactionRef.current.contains(e.target);
      const clickedInsideTooltip = tooltipRef.current && tooltipRef.current.contains(e.target);
      // Tooltip xarici klik
      if (reactionTooltipOpen && !clickedInsideTooltip && !e.target.closest(".reaction-badge")) {
        setReactionTooltipOpen(null);
      }
      if (!clickedInsideMenu && !clickedInsideReaction) {
        setMenuOpen(false);
        setReactionOpen(false);
        setReactionExpanded(false);
        setShowActions(false);
      } else if (!clickedInsideMenu) {
        setMenuOpen(false);
      } else if (!clickedInsideReaction) {
        setReactionOpen(false);
        setReactionExpanded(false);
      }
    }
    if (menuOpen || reactionOpen || reactionTooltipOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, reactionOpen, reactionTooltipOpen]);

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

  // Reaction picker: yuxarıda yer yoxdursa aşağıya flip et
  useLayoutEffect(() => {
    const el = reactionRef.current;
    if (!el || !reactionOpen) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < 0) {
      el.classList.add("flip-down");
    } else {
      el.classList.remove("flip-down");
    }
  }, [reactionOpen, reactionExpanded]);

  return (
    <div
      className={`message-row ${isOwn ? "own" : ""} ${showAvatar ? "has-avatar" : ""} ${isSelected ? "selected" : ""}`}
      data-bubble-id={msg.id}
      onClick={selectMode && !msg.isDeleted ? () => onToggleSelect(msg.id) : undefined}
      onMouseEnter={selectMode ? undefined : () => setShowActions(true)}
      onMouseLeave={selectMode ? undefined : () => {
        if (!menuOpen && !reactionOpen) setShowActions(false);
      }}
      {...(!isOwn &&
        !msg.isRead && {
          "data-unread": "true",
          "data-msg-id": msg.id,
          "data-conv-id":
            chatType === 0 ? msg.conversationId : msg.channelId,
          "data-conv-type": String(chatType),
        })}
    >
      {selectMode && !msg.isDeleted && (
        <div className={`select-checkbox ${isSelected ? "checked" : ""}`}>
          {isSelected && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}
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
      <div
        className={`message-bubble ${isOwn ? "own" : ""}`}
        onContextMenu={selectMode ? undefined : (e) => {
          e.preventDefault();
          setMenuOpen(true);
          setReactionOpen(false);
          setShowActions(true);
        }}
      >
        {msg.isForwarded && !msg.isDeleted && (
          <div className="forwarded-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            <span>Forwarded message</span>
          </div>
        )}
        {msg.replyToMessageId && !msg.isDeleted && (
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
        <div className="message-content">
          {msg.isDeleted ? (
            <span className="deleted-message-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              This message was deleted.
            </span>
          ) : (
            msg.content
          )}
        </div>
        <div className="message-meta">
          {/* Reaction badges — meta sırasının solunda */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="reaction-badges">
              {msg.reactions.map((r) => (
                <div key={r.emoji} className="reaction-badge-wrapper">
                  <button
                    className="reaction-badge"
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Eyni emoji-yə klik → bağla
                      if (reactionTooltipOpen === r.emoji) {
                        setReactionTooltipOpen(null);
                        return;
                      }
                      // Əgər userFullNames artıq mövcuddursa (SignalR/toggle-dan gəlib)
                      if (r.userFullNames && r.userFullNames.length > 0) {
                        setReactionTooltipOpen(r.emoji);
                        return;
                      }
                      // API-dən yüklə
                      setReactionTooltipOpen(r.emoji);
                      setReactionDetailsLoading(true);
                      await onLoadReactionDetails(msg.id);
                      setReactionDetailsLoading(false);
                    }}
                  >
                    <span className="reaction-badge-emoji">{r.emoji}</span>
                    {r.count > 1 && <span className="reaction-badge-count">{r.count}</span>}
                  </button>
                  {reactionTooltipOpen === r.emoji && (
                    <div className="reaction-tooltip visible" ref={tooltipRef}>
                      {reactionDetailsLoading ? (
                        <div className="reaction-tooltip-item">
                          <span className="reaction-tooltip-name reaction-tooltip-loading">Loading...</span>
                        </div>
                      ) : r.userFullNames && r.userFullNames.length > 0 ? (
                        r.userFullNames.map((name, i) => (
                          <div key={i} className="reaction-tooltip-item">
                            <div
                              className="reaction-tooltip-avatar"
                              style={{ background: getAvatarColor(name) }}
                            >
                              {getInitials(name)}
                            </div>
                            <span className="reaction-tooltip-name">{name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="reaction-tooltip-item">
                          <span className="reaction-tooltip-name">
                            {r.count} {r.count === 1 ? "person" : "people"} reacted
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {msg.isEdited && <span className="message-modified">modified</span>}
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
        {!selectMode && (showActions || menuOpen || reactionOpen) && (
          <div className={`bubble-actions ${isOwn ? "own" : ""}`}>
            {!msg.isDeleted && (
              <button
                className="bubble-action-btn"
                title="Reactions"
                onClick={() => {
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
            )}
            <button
              className="bubble-action-btn"
              title="More"
              onClick={() => {
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

            {/* Action menu dropdown */}
            {menuOpen && (
              <MessageActionMenu
                msg={msg}
                isOwn={isOwn}
                menuRef={menuRef}
                onReply={onReply}
                onEdit={onEdit}
                onForward={onForward}
                onPin={onPin}
                onFavorite={onFavorite}
                onSelect={onSelect}
                onDelete={onDelete}
                onClose={() => {
                  setMenuOpen(false);
                  setShowActions(false);
                }}
              />
            )}

            {/* Reaction picker */}
            {!msg.isDeleted && reactionOpen && (
              <div
                className={`reaction-picker ${isOwn ? "own" : ""}`}
                ref={reactionRef}
              >
                <div className="reaction-quick">
                  {(reactionExpanded
                    ? EXPANDED_REACTION_EMOJIS
                    : QUICK_REACTION_EMOJIS
                  ).map((emoji) => (
                    <button
                      key={emoji}
                      className="reaction-emoji-btn"
                      onClick={() => {
                        onReaction && onReaction(msg, emoji);
                        setReactionOpen(false);
                        setReactionExpanded(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  {!reactionExpanded && (
                    <button
                      className="reaction-expand-btn"
                      onClick={() => setReactionExpanded(true)}
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
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;
