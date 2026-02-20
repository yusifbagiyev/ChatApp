import { TEXT_INPUT_EMOJIS } from "../utils/emojiConstants";
import { MESSAGE_MAX_LENGTH } from "../utils/chatUtils";

function ChatInputArea({
  messageText, setMessageText,
  replyTo, setReplyTo,
  editMessage, setEditMessage,
  emojiOpen, setEmojiOpen,
  emojiPanelRef, inputRef,
  onSend, onKeyDown, onTyping,
}) {
  return (
    <>
      <div className="message-input-area">
        {replyTo && (
          <div className="reply-preview">
            <svg
              className="reply-preview-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00ace3"
              strokeWidth="2"
            >
              <path d="M3 21c0 0 1-6 6-10h4V6l8 8-8 8v-5H9c-3 0-6 4-6 4z" />
            </svg>
            <div className="reply-preview-body">
              <span className="reply-preview-name">
                {replyTo.senderFullName}
              </span>
              <span className="reply-preview-text">
                {replyTo.content}
              </span>
            </div>
            <button
              className="reply-preview-close"
              onClick={() => setReplyTo(null)}
            >
              <svg
                width="18"
                height="18"
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
        )}
        {editMessage && (
          <div className="edit-preview">
            <svg
              className="edit-preview-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00ace3"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <div className="edit-preview-body">
              <span className="edit-preview-name">Edit message</span>
              <span className="edit-preview-text">{editMessage.content}</span>
            </div>
            <button
              className="edit-preview-close"
              onClick={() => {
                setEditMessage(null);
                setMessageText("");
              }}
            >
              <svg
                width="18"
                height="18"
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
        )}
        <div className="message-input-wrapper">
          <button className="input-icon-btn" title="Attach">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            className="message-input"
            placeholder="Enter @ to mention a person or chat"
            value={messageText}
            maxLength={MESSAGE_MAX_LENGTH}
            rows={1}
            onChange={(e) => {
              setMessageText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={onKeyDown}
          />
          <button
            className={`input-icon-btn emoji-btn ${emojiOpen ? "active" : ""}`}
            title="Emoji"
            onClick={() => setEmojiOpen(!emojiOpen)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
          <button
            className={`send-btn ${messageText.trim() ? "" : "disabled"}`}
            title="Send"
            onClick={onSend}
            disabled={!messageText.trim()}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Emoji picker panel */}
      {emojiOpen && (
        <div className="emoji-panel" ref={emojiPanelRef}>
          <div className="emoji-panel-header">Smileys and people</div>
          <div className="emoji-panel-grid">
            {TEXT_INPUT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="emoji-panel-btn"
                onClick={() => {
                  setMessageText((prev) => prev + emoji);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default ChatInputArea;
