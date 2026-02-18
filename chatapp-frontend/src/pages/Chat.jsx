import {
  useState,
  useEffect,
  useLayoutEffect,
  useContext,
  useRef,
} from "react";

import {
  startConnection,
  joinConversation,
  leaveConversation,
  joinChannel,
  leaveChannel,
  getConnection,
} from "../services/signalr";

import { flushSync } from "react-dom";
import { AuthContext } from "../context/AuthContext";
import { apiGet, apiPost } from "../services/api";

import Sidebar from "../components/Sidebar";
import ConversationList from "../components/ConversationList";
import MessageBubble from "../components/MessageBubble";
import {
  getInitials,
  getAvatarColor,
  getLastSeenText,
  groupMessagesByDate,
} from "../utils/chatUtils";

import "./Chat.css";

function Chat() {
  const { user, logout } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const scrollRestoreRef = useRef(null);
  const [shouldScrollBottom, setShouldScrollBottom] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const [activeMessageId, setActiveMessageId] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

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

    function handleUserOnline(userId) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    }

    function handleUserOffline(userId) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }

    function handleUserTypingInConversation(conversationId, userId, isTyping) {
      if (userId === user.id) return;
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

    function handleUserTypingInChannel(channelId, userId, fullName, isTyping) {
      if (userId === user.id) return;
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
      }
    };
  }, [user.id]);

  useEffect(() => {
    if (shouldScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      setShouldScrollBottom(false);
    }
  }, [messages, shouldScrollBottom]);

  // Scroll position restore — paint-dən ƏVVƏL işləyir, tullanma olmur
  useLayoutEffect(() => {
    const area = messagesAreaRef.current;
    const saved = scrollRestoreRef.current;
    if (area && saved) {
      const heightDiff = area.scrollHeight - saved.scrollHeight;
      area.scrollTop = saved.scrollTop + heightDiff;
      scrollRestoreRef.current = null;
    }
  }, [messages]);

  // Mark visible messages as read (IntersectionObserver)
  useEffect(() => {
    const area = messagesAreaRef.current;
    if (!area || !selectedChat) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const msgId = entry.target.dataset.msgId;
            const convId = entry.target.dataset.convId;
            const convType = entry.target.dataset.convType;

            if (convType === "0") {
              apiPost(`/api/conversations/${convId}/messages/${msgId}/read`);
            } else if (convType === "1") {
              apiPost(`/api/channels/${convId}/messages/${msgId}/mark-as-read`);
            }

            observer.unobserve(entry.target);
          }
        }
      },
      {
        root: area,
        threshold: 0.5,
      },
    );

    const unreadElements = area.querySelectorAll("[data-unread='true']");
    unreadElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, selectedChat]);

  async function loadConversations() {
    try {
      const data = await apiGet(
        "/api/unified-conversations?pageNumber=1&pageSize=50",
      );
      setConversations(data.items);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Type enum: 0 = Conversation, 1 = Channel, 2 = DepartmentUser
  async function handleSelectChat(chat) {
    // Leave previous group
    if (selectedChat) {
      if (selectedChat.type === 0) {
        leaveConversation(selectedChat.id);
      } else if (selectedChat.type === 1) {
        leaveChannel(selectedChat.id);
      }
    }

    setSelectedChat(chat);
    setMessages([]);
    hasMoreRef.current = true;
    try {
      let endpoint = "";
      if (chat.type === 0) {
        endpoint = `/api/conversations/${chat.id}/messages?pageSize=30`;
      } else if (chat.type === 1) {
        endpoint = `/api/channels/${chat.id}/messages?pageSize=30`;
      } else {
        return;
      }
      const data = await apiGet(endpoint);
      setShouldScrollBottom(true);
      setMessages(data);

      // Join new group
      if (chat.type === 0) {
        joinConversation(chat.id);

        // Check online status of other user
        if (chat.otherUserId) {
          const conn = getConnection();
          if (conn) {
            try {
              const statusMap = await conn.invoke("GetOnlineStatus", [
                chat.otherUserId,
              ]);
              if (statusMap && statusMap[chat.otherUserId]) {
                setOnlineUsers((prev) => {
                  const next = new Set(prev);
                  next.add(chat.otherUserId);
                  return next;
                });
              }
            } catch (err) {
              console.error("Failed to get online status:", err);
            }
          }
        }
      } else if (chat.type === 1) {
        joinChannel(chat.id);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessages([]);
    }
  }

  async function handleSendMessage() {
    if (!messageText.trim() || !selectedChat) return;

    const text = messageText.trim();
    setMessageText("");

    try {
      let endpoint = "";
      if (selectedChat.type === 0) {
        endpoint = `/api/conversations/${selectedChat.id}/messages`;
      } else if (selectedChat.type === 1) {
        endpoint = `/api/channels/${selectedChat.id}/messages`;
      } else {
        return;
      }

      await apiPost(endpoint, { content: text });

      // Mesajları yenidən yüklə (SignalR fallback)
      const messagesEndpoint =
        selectedChat.type === 0
          ? `/api/conversations/${selectedChat.id}/messages?pageSize=30`
          : `/api/channels/${selectedChat.id}/messages?pageSize=30`;
      const data = await apiGet(messagesEndpoint);
      setShouldScrollBottom(true);
      setMessages(data);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  function sendTypingSignal() {
    if (!selectedChat || selectedChat.type === 2) return;
    const conn = getConnection();
    if (!conn) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      if (selectedChat.type === 0) {
        conn.invoke(
          "TypingInConversation",
          selectedChat.id,
          selectedChat.otherUserId,
          true,
        );
      } else if (selectedChat.type === 1) {
        conn.invoke("TypingInChannel", selectedChat.id, true);
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (selectedChat.type === 0) {
        conn.invoke(
          "TypingInConversation",
          selectedChat.id,
          selectedChat.otherUserId,
          false,
        );
      } else if (selectedChat.type === 1) {
        conn.invoke("TypingInChannel", selectedChat.id, false);
      }
    }, 2000);
  }

  function handleKeyDown(e) {
    sendTypingSignal();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  async function handleScrollUp() {
    const area = messagesAreaRef.current;
    if (!area) return;
    if (loadingMoreRef.current) return;
    if (!hasMoreRef.current) return;
    if (!selectedChat) return;

    // Blazor pattern: 1 viewport height threshold
    const threshold = area.clientHeight;
    if (area.scrollTop > threshold) return;

    const oldestMsg = messages[messages.length - 1];
    if (!oldestMsg) return;

    const beforeDate = oldestMsg.createdAtUtc || oldestMsg.sentAt;
    if (!beforeDate) return;

    let endpoint = "";
    if (selectedChat.type === 0) {
      endpoint = `/api/conversations/${selectedChat.id}/messages?pageSize=30&before=${encodeURIComponent(beforeDate)}`;
    } else if (selectedChat.type === 1) {
      endpoint = `/api/channels/${selectedChat.id}/messages?pageSize=30&before=${encodeURIComponent(beforeDate)}`;
    }
    if (!endpoint) return;

    loadingMoreRef.current = true;

    try {
      const olderMessages = await apiGet(endpoint);

      if (!olderMessages || olderMessages.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      // Save scroll position, then update — useLayoutEffect will restore
      scrollRestoreRef.current = {
        scrollHeight: area.scrollHeight,
        scrollTop: area.scrollTop,
      };
      flushSync(() => {
        setMessages((prev) => [...prev, ...olderMessages]);
      });
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      loadingMoreRef.current = false;
    }
  }

  return (
    <div className="main-layout">
      <Sidebar onLogout={logout} />

      <div className="main-content">
        <ConversationList
          conversations={conversations}
          selectedChatId={selectedChat?.id}
          searchText={searchText}
          onSearchChange={setSearchText}
          onSelectChat={handleSelectChat}
          isLoading={isLoading}
        />

        <div className="chat-panel">
          {selectedChat ? (
            <>
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
                  <button className="header-action-btn" title="Pin">
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

              <div
                className="messages-area"
                ref={messagesAreaRef}
                onScroll={handleScrollUp}
              >
                {(() => {
                  const grouped = groupMessagesByDate([...messages].reverse());
                  return grouped.map((item, index) => {
                    if (item.type === "date") {
                      return (
                        <div key={`date-${index}`} className="date-separator">
                          <span>{item.label}</span>
                        </div>
                      );
                    }
                    const msg = item.data;
                    const isOwn = msg.senderId === user.id;

                    // Avatar yalnız son mesajda görünür (növbəti mesaj fərqli senderId-dən və ya date separator-dursa)
                    const nextItem = grouped[index + 1];
                    const showAvatar =
                      !nextItem ||
                      nextItem.type === "date" ||
                      nextItem.data.senderId !== msg.senderId;

                    return (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        selectedChat={selectedChat}
                        activeMessageId={activeMessageId}
                        setActiveMessageId={setActiveMessageId}
                      />
                    );
                  });
                })()}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-area">
                <button className="input-action-btn" title="Attach">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Enter @ to mention a person or chat"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="input-action-btn" title="Emoji">
                  <svg
                    width="20"
                    height="20"
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
                  className="send-btn"
                  title="Send"
                  onClick={handleSendMessage}
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
            </>
          ) : (
            <div className="chat-empty">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c0c0c0"
                strokeWidth="1"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h2>Select a chat</h2>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
