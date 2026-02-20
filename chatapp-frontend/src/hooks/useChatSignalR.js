import { useEffect } from "react";
import { startConnection } from "../services/signalr";

/**
 * SignalR connection lifecycle hook.
 * Sets up all real-time message handlers and cleans up on unmount.
 * Pure side-effect hook — returns nothing.
 */
export default function useChatSignalR(
  userId,
  setSelectedChat,
  setMessages,
  setConversations,
  setShouldScrollBottom,
  setOnlineUsers,
  setTypingUsers,
  setPinnedMessages,
  setCurrentPinIndex,
) {
  useEffect(() => {
    let conn = null;

    function handleNewDirectMessage(message) {
      setSelectedChat((current) => {
        if (
          current &&
          current.type === 0 &&
          current.id === message.conversationId
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            setShouldScrollBottom(true);
            return [message, ...prev];
          });
        }
        return current;
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === message.conversationId) {
            return {
              ...c,
              lastMessage: message.content,
              lastMessageAtUtc: message.createdAtUtc,
            };
          }
          return c;
        }),
      );
    }

    function handleNewChannelMessage(message) {
      setSelectedChat((current) => {
        if (current && current.type === 1 && current.id === message.channelId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            setShouldScrollBottom(true);
            return [message, ...prev];
          });
        }
        return current;
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === message.channelId) {
            return {
              ...c,
              lastMessage: message.content,
              lastMessageAtUtc: message.createdAtUtc,
            };
          }
          return c;
        }),
      );
    }

    function handleMessageRead(data) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === data.messageId) {
            return { ...m, isRead: true, status: 3 };
          }
          return m;
        }),
      );
    }

    function handleUserOnline(onlineUserId) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(onlineUserId);
        return next;
      });
    }

    function handleUserOffline(offlineUserId) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(offlineUserId);
        return next;
      });
    }

    function handleUserTypingInConversation(conversationId, typingUserId, isTyping) {
      if (typingUserId === userId) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return { ...prev, [conversationId]: true };
        } else {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        }
      });
    }

    function handleUserTypingInChannel(channelId, typingUserId, fullName, isTyping) {
      if (typingUserId === userId) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return { ...prev, [channelId]: fullName };
        } else {
          const next = { ...prev };
          delete next[channelId];
          return next;
        }
      });
    }

    // Delete SignalR handlers
    function handleMessageDeleted(deletedMsg) {
      setMessages((prev) =>
        prev.map((m) => (m.id === deletedMsg.id ? { ...m, isDeleted: true } : m)),
      );
    }

    // Edit SignalR handlers
    function handleMessageEdited(editedMsg) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === editedMsg.id) {
            return { ...m, content: editedMsg.content, isEdited: true, editedAtUtc: editedMsg.editedAtUtc };
          }
          // Reply reference yenile
          if (m.replyToMessageId === editedMsg.id) {
            return { ...m, replyToContent: editedMsg.content };
          }
          return m;
        }),
      );
    }

    // Reaction SignalR handlers
    function handleReactionsUpdated(data) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m,
        ),
      );
    }

    // Pin/Unpin SignalR handlers
    function handleMessagePinned(msgDto) {
      setPinnedMessages((prev) => {
        if (prev.some((m) => m.id === msgDto.id)) return prev;
        return [...prev, msgDto].sort(
          (a, b) => new Date(b.pinnedAtUtc) - new Date(a.pinnedAtUtc),
        );
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgDto.id ? { ...m, isPinned: true, pinnedAtUtc: msgDto.pinnedAtUtc } : m)),
      );
    }

    function handleMessageUnpinned(msgDto) {
      setPinnedMessages((prev) => {
        const next = prev.filter((m) => m.id !== msgDto.id);
        // currentPinIndex sinirdan cixmasin
        setCurrentPinIndex((idx) => (idx >= next.length ? Math.max(0, next.length - 1) : idx));
        return next;
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgDto.id ? { ...m, isPinned: false, pinnedAtUtc: null } : m)),
      );
    }

    startConnection()
      .then((c) => {
        conn = c;
        conn.on("NewDirectMessage", handleNewDirectMessage);
        conn.on("NewChannelMessage", handleNewChannelMessage);
        conn.on("MessageRead", handleMessageRead);
        conn.on("UserOnline", handleUserOnline);
        conn.on("UserOffline", handleUserOffline);
        conn.on("UserTypingInConversation", handleUserTypingInConversation);
        conn.on("UserTypingInChannel", handleUserTypingInChannel);
        conn.on("DirectMessagePinned", handleMessagePinned);
        conn.on("DirectMessageUnpinned", handleMessageUnpinned);
        conn.on("ChannelMessagePinned", handleMessagePinned);
        conn.on("ChannelMessageUnpinned", handleMessageUnpinned);
        conn.on("DirectMessageDeleted", handleMessageDeleted);
        conn.on("ChannelMessageDeleted", handleMessageDeleted);
        conn.on("DirectMessageEdited", handleMessageEdited);
        conn.on("ChannelMessageEdited", handleMessageEdited);
        conn.on("ChannelMessageReactionsUpdated", handleReactionsUpdated);
        conn.on("DirectMessageReactionToggled", handleReactionsUpdated);
      })
      .catch((err) => console.error("SignalR connection failed:", err));

    return () => {
      if (conn) {
        conn.off("NewDirectMessage", handleNewDirectMessage);
        conn.off("NewChannelMessage", handleNewChannelMessage);
        conn.off("MessageRead", handleMessageRead);
        conn.off("UserOnline", handleUserOnline);
        conn.off("UserOffline", handleUserOffline);
        conn.off("UserTypingInConversation", handleUserTypingInConversation);
        conn.off("UserTypingInChannel", handleUserTypingInChannel);
        conn.off("DirectMessagePinned", handleMessagePinned);
        conn.off("DirectMessageUnpinned", handleMessageUnpinned);
        conn.off("ChannelMessagePinned", handleMessagePinned);
        conn.off("ChannelMessageUnpinned", handleMessageUnpinned);
        conn.off("DirectMessageDeleted", handleMessageDeleted);
        conn.off("ChannelMessageDeleted", handleMessageDeleted);
        conn.off("DirectMessageEdited", handleMessageEdited);
        conn.off("ChannelMessageEdited", handleMessageEdited);
        conn.off("ChannelMessageReactionsUpdated", handleReactionsUpdated);
        conn.off("DirectMessageReactionToggled", handleReactionsUpdated);
      }
    };
  }, [userId]);
}
