import { useMemo } from "react";

// ChatStatusBar — mesaj input sahəsinin üstündə sabit yer tutan status bar
// Həmişə render olunur (sabit hündürlük), content olduqda dolu, olmadıqda boş
function ChatStatusBar({
  selectedChat,
  messages,
  userId,
  typingUsers,
  lastReadTimestamp,
  channelMembers,
  onOpenReadersPanel,
}) {
  const lastOwnMessage = useMemo(() => {
    return messages.find((m) => m.senderId === userId && !m.isDeleted);
  }, [messages, userId]);

  const lastMessage = messages.length > 0 ? messages[0] : null;
  const isLastMessageOwn = lastMessage && lastMessage.senderId === userId;

  // Content hesabla — null olarsa boş bar görsənəcək
  const content = useMemo(() => {
    // Typing — ən yüksək prioritet
    const typingValue = typingUsers[selectedChat?.id];
    if (typingValue) {
      const typingText =
        !selectedChat || selectedChat.isNotes || selectedChat.type === 2
          ? typeof typingValue === "string"
            ? `${typingValue} is typing`
            : "is typing"
          : selectedChat.type === 0
            ? "is typing"
            : `${typingValue} is typing`;

      return (
        <>
          <span className="status-bar-typing-dots">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
          <span className="status-bar-typing">{typingText}</span>
        </>
      );
    }

    // Notes / DepartmentUser / chat yoxdursa — boş
    if (!selectedChat || selectedChat.isNotes || selectedChat.type === 2) {
      return null;
    }

    // Son mesaj özümünkü deyilsə — boş
    if (!lastOwnMessage || !isLastMessageOwn) return null;

    // DM — "Viewed: today, 11:30"
    if (selectedChat.type === 0) {
      if (lastOwnMessage.status !== 3) return null;

      const readTime = lastReadTimestamp[selectedChat.id];
      if (!readTime) return null;

      const now = new Date();
      const isToday = readTime.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = readTime.toDateString() === yesterday.toDateString();

      let dateLabel;
      if (isToday) {
        dateLabel = "today";
      } else if (isYesterday) {
        dateLabel = "yesterday";
      } else {
        dateLabel = readTime.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      const timeStr = readTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <>
          <svg className="status-bar-tick" viewBox="0 0 16 11">
            <polyline points="1 5.5 5 9.5 11 1" />
            <polyline points="5.5 5.5 9.5 9.5 15 1" />
          </svg>
          <span className="status-bar-viewed">
            Viewed: {dateLabel}, {timeStr}
          </span>
        </>
      );
    }

    // Channel — "Viewed by X and Y more"
    if (selectedChat.type === 1) {
      const readByIds = lastOwnMessage.readBy || [];
      if (readByIds.length === 0) return null;

      const membersMap = channelMembers[selectedChat.id] || {};
      const readerNames = readByIds
        .map((id) => membersMap[id]?.fullName)
        .filter(Boolean);

      if (readerNames.length === 0) return null;

      const firstName = readerNames[0];
      const moreCount = readerNames.length - 1;

      return (
        <>
          <svg className="status-bar-tick" viewBox="0 0 16 11">
            <polyline points="1 5.5 5 9.5 11 1" />
            <polyline points="5.5 5.5 9.5 9.5 15 1" />
          </svg>
          <span className="status-bar-viewed">
            Viewed by {firstName}
            {moreCount > 0 && (
              <>
                {" and "}
                <button
                  className="status-bar-more-btn"
                  onClick={() =>
                    onOpenReadersPanel({
                      messageId: lastOwnMessage.id,
                      readByIds,
                    })
                  }
                >
                  {moreCount} more
                </button>
              </>
            )}
          </span>
        </>
      );
    }

    return null;
  }, [selectedChat, typingUsers, lastOwnMessage, isLastMessageOwn, lastReadTimestamp, channelMembers, onOpenReadersPanel]);

  return (
    <div className={`chat-status-bar${content ? " has-content" : ""}`}>
      {content}
    </div>
  );
}

export default ChatStatusBar;
