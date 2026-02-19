import {
  useState,
  useEffect,
  useLayoutEffect,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from "react";

import {
  startConnection,
  joinConversation,
  leaveConversation,
  joinChannel,
  leaveChannel,
  getConnection,
} from "../services/signalr";

import { AuthContext } from "../context/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";

import Sidebar from "../components/Sidebar";
import ConversationList from "../components/ConversationList";
import MessageBubble from "../components/MessageBubble";
import ForwardPanel from "../components/ForwardPanel";
import PinnedBar, { PinnedExpanded } from "../components/PinnedBar";
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
  const hasMoreDownRef = useRef(false);
  const scrollRestoreRef = useRef(null);
  const pendingHighlightRef = useRef(null);
  const [shouldScrollBottom, setShouldScrollBottom] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiPanelRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [pinBarExpanded, setPinBarExpanded] = useState(false);
  const [currentPinIndex, setCurrentPinIndex] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const scrollRafRef = useRef(null);
  const inputRef = useRef(null);

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
          // Reply reference yenilə
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
        // currentPinIndex sınırdan çıxmasın
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
  }, [user.id]);

  useEffect(() => {
    if (shouldScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      setShouldScrollBottom(false);
    }
  }, [messages, shouldScrollBottom, pinnedMessages]);

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

  // getAround-dan sonra hədəf mesaja scroll + highlight
  useLayoutEffect(() => {
    const messageId = pendingHighlightRef.current;
    if (!messageId) return;
    pendingHighlightRef.current = null;

    const area = messagesAreaRef.current;
    if (!area) return;

    const target = area.querySelector(`[data-bubble-id="${messageId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "instant", block: "center" });
      target.classList.add("highlight-message");
      setTimeout(() => target.classList.remove("highlight-message"), 3000);
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

  async function loadPinnedMessages(chat) {
    try {
      let endpoint = "";
      if (chat.type === 0) {
        endpoint = `/api/conversations/${chat.id}/messages/pinned`;
      } else if (chat.type === 1) {
        endpoint = `/api/channels/${chat.id}/messages/pinned`;
      } else {
        return;
      }
      const data = await apiGet(endpoint);
      // Ən sonuncu pinlənmiş birinci görünsün (DESC by pinnedAtUtc)
      const sorted = (data || []).sort(
        (a, b) => new Date(b.pinnedAtUtc) - new Date(a.pinnedAtUtc),
      );
      setPinnedMessages(sorted);
    } catch (err) {
      console.error("Failed to load pinned messages:", err);
      setPinnedMessages([]);
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
    setPinnedMessages([]);
    setPinBarExpanded(false);
    setCurrentPinIndex(0);
    setSelectMode(false);
    setSelectedMessages(new Set());
    setReplyTo(null);
    setEditMessage(null);
    setForwardMessage(null);
    setEmojiOpen(false);
    setDeleteConfirmOpen(false);
    hasMoreRef.current = true;
    hasMoreDownRef.current = false;
    try {
      let msgEndpoint = "";
      let pinEndpoint = "";
      if (chat.type === 0) {
        msgEndpoint = `/api/conversations/${chat.id}/messages?pageSize=30`;
        pinEndpoint = `/api/conversations/${chat.id}/messages/pinned`;
      } else if (chat.type === 1) {
        msgEndpoint = `/api/channels/${chat.id}/messages?pageSize=30`;
        pinEndpoint = `/api/channels/${chat.id}/messages/pinned`;
      } else {
        return;
      }

      // Mesajlar + pinned mesajları paralel yüklə
      const [msgData, pinData] = await Promise.all([
        apiGet(msgEndpoint),
        apiGet(pinEndpoint).catch(() => []),
      ]);

      // Pinned mesajları DESC sıralayıb eyni anda set et (bir dəfə scroll)
      const sortedPins = (pinData || []).sort(
        (a, b) => new Date(b.pinnedAtUtc) - new Date(a.pinnedAtUtc),
      );
      setPinnedMessages(sortedPins);
      setShouldScrollBottom(true);
      setMessages(msgData);

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
      // Textarea-ya focus ver
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessages([]);
    }
  }

  async function handleForward(targetChat) {
    if (!forwardMessage) return;

    const fwd = forwardMessage;
    // Panel dərhal bağlansın (optimistic)
    setForwardMessage(null);

    try {
      let endpoint = "";
      if (targetChat.type === 0) {
        endpoint = `/api/conversations/${targetChat.id}/messages`;
      } else if (targetChat.type === 1) {
        endpoint = `/api/channels/${targetChat.id}/messages`;
      } else {
        return;
      }

      if (fwd.isMultiSelect) {
        // Çoxlu mesaj forward — hər birini ardıcıl göndər
        const allMessages = [...messages].reverse(); // chronological order
        const selectedMsgs = allMessages.filter((m) => fwd.ids.includes(m.id));
        for (const m of selectedMsgs) {
          await apiPost(endpoint, { content: m.content, isForwarded: true });
        }
        handleExitSelectMode();
      } else {
        await apiPost(endpoint, { content: fwd.content, isForwarded: true });
      }

      // Conversation list-i yenilə (son mesaj görsənsin)
      loadConversations();

      // Əgər forward edilən chat açıqdırsa, mesajları da yenilə
      if (selectedChat && selectedChat.id === targetChat.id) {
        const messagesEndpoint =
          selectedChat.type === 0
            ? `/api/conversations/${selectedChat.id}/messages?pageSize=30`
            : `/api/channels/${selectedChat.id}/messages?pageSize=30`;
        const data = await apiGet(messagesEndpoint);
        hasMoreDownRef.current = false;
        setShouldScrollBottom(true);
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to forward message:", err);
    }
  }

  const handlePinMessage = useCallback(async (msg) => {
    if (!selectedChat) return;
    try {
      let endpoint = "";
      if (selectedChat.type === 0) {
        endpoint = `/api/conversations/${selectedChat.id}/messages/${msg.id}/pin`;
      } else if (selectedChat.type === 1) {
        endpoint = `/api/channels/${selectedChat.id}/messages/${msg.id}/pin`;
      } else {
        return;
      }

      if (msg.isPinned) {
        await apiDelete(endpoint);
      } else {
        await apiPost(endpoint);
      }

      // Pinned messages + messages state yenilə
      loadPinnedMessages(selectedChat);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, isPinned: !msg.isPinned } : m,
        ),
      );
    } catch (err) {
      console.error("Failed to pin/unpin message:", err);
    }
  }, [selectedChat]);

  const handleFavoriteMessage = useCallback(async (msg) => {
    if (!selectedChat) return;
    try {
      let endpoint = "";
      if (selectedChat.type === 0) {
        endpoint = `/api/conversations/${selectedChat.id}/messages/${msg.id}/favorite`;
      } else if (selectedChat.type === 1) {
        endpoint = `/api/channels/${selectedChat.id}/messages/${msg.id}/favorite`;
      } else {
        return;
      }
      await apiPost(endpoint);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  }, [selectedChat]);

  // Select mode handlers
  const handleEnterSelectMode = useCallback((msgId) => {
    setSelectMode(true);
    setSelectedMessages(new Set([msgId]));
  }, []);

  const handleToggleSelect = useCallback((msgId) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  }, []);

  const handleExitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedMessages(new Set());
  }, []);

  const handleForwardSelected = useCallback(() => {
    if (selectedMessages.size === 0) return;
    // Forward panel-i açmaq üçün ilk seçilmiş mesajı set edirik
    // Sonra ForwardPanel-dən chat seçildikdə bütün mesajları forward edəcəyik
    setForwardMessage({ isMultiSelect: true, ids: [...selectedMessages] });
  }, [selectedMessages]);

  // Bubble action-dan tək mesaj silmə (təsdiq olmadan)
  const handleDeleteMessage = useCallback(async (msg) => {
    if (!selectedChat) return;
    try {
      const endpoint = selectedChat.type === 0
        ? `/api/conversations/${selectedChat.id}/messages/${msg.id}`
        : `/api/channels/${selectedChat.id}/messages/${msg.id}`;
      await apiDelete(endpoint);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isDeleted: true } : m)),
      );
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  }, [selectedChat]);

  // Select mode-da seçilmiş mesajları silmə (təsdiq formasından sonra çağırılır)
  const handleDeleteSelected = useCallback(async () => {
    if (!selectedChat || selectedMessages.size === 0) return;
    try {
      const ids = [...selectedMessages];
      const base = selectedChat.type === 0
        ? `/api/conversations/${selectedChat.id}/messages`
        : `/api/channels/${selectedChat.id}/messages`;

      if (ids.length > 5) {
        await apiPost(`${base}/batch-delete`, { messageIds: ids });
      } else {
        await Promise.all(ids.map((id) => apiDelete(`${base}/${id}`)));
      }

      setMessages((prev) =>
        prev.map((m) => (ids.includes(m.id) ? { ...m, isDeleted: true } : m)),
      );
      handleExitSelectMode();
    } catch (err) {
      console.error("Failed to delete selected messages:", err);
    }
  }, [selectedChat, selectedMessages, handleExitSelectMode]);

  function handlePinBarClick(messageId) {
    handleScrollToMessage(messageId);
    // Növbəti pinlənmiş mesaja keç
    setCurrentPinIndex((prev) =>
      prev >= pinnedMessages.length - 1 ? 0 : prev + 1,
    );
  }

  async function handleSendMessage() {
    if (!messageText.trim() || !selectedChat) return;

    const text = messageText.trim();
    setMessageText("");

    // Textarea hündürlüyünü resetlə
    const textarea = document.querySelector(".message-input");
    if (textarea) textarea.style.height = "auto";

    // Edit mode — mesajı redaktə et
    if (editMessage) {
      const editingMsg = editMessage;
      setEditMessage(null);
      try {
        const endpoint = selectedChat.type === 0
          ? `/api/conversations/${selectedChat.id}/messages/${editingMsg.id}`
          : `/api/channels/${selectedChat.id}/messages/${editingMsg.id}`;
        await apiPut(endpoint, { newContent: text });
        // Optimistic UI — həm mesajın content-i, həm reply reference-ları yenilə
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === editingMsg.id) {
              return { ...m, content: text, isEdited: true, editedAtUtc: new Date().toISOString() };
            }
            if (m.replyToMessageId === editingMsg.id) {
              return { ...m, replyToContent: text };
            }
            return m;
          }),
        );
      } catch (err) {
        console.error("Failed to edit message:", err);
      }
      return;
    }

    setReplyTo(null);

    try {
      let endpoint = "";
      if (selectedChat.type === 0) {
        endpoint = `/api/conversations/${selectedChat.id}/messages`;
      } else if (selectedChat.type === 1) {
        endpoint = `/api/channels/${selectedChat.id}/messages`;
      } else {
        return;
      }

      await apiPost(endpoint, {
        content: text,
        replyToMessageId: replyTo ? replyTo.id : null,
      });

      // Mesajları yenidən yüklə (SignalR fallback)
      const messagesEndpoint =
        selectedChat.type === 0
          ? `/api/conversations/${selectedChat.id}/messages?pageSize=30`
          : `/api/channels/${selectedChat.id}/messages?pageSize=30`;
      const data = await apiGet(messagesEndpoint);
      hasMoreDownRef.current = false;
      setShouldScrollBottom(true);
      setMessages(data);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  // Emoji panel kənara tıklandıqda bağlansın
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(e.target) &&
        !e.target.closest(".emoji-btn")
      ) {
        setEmojiOpen(false);
      }
    }
    if (emojiOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiOpen]);

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

  const handleScrollToMessage = useCallback(async (messageId) => {
    const area = messagesAreaRef.current;
    if (!area || !selectedChat) return;

    // Əvvəlcə DOM-da yoxla — mesaj artıq yüklənibsə birbaşa scroll et
    let el = area.querySelector(`[data-bubble-id="${messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-message");
      setTimeout(() => el.classList.remove("highlight-message"), 3000);
      return;
    }

    // Mesaj DOM-da yoxdur — around endpoint ilə yüklə
    try {
      let endpoint = "";
      if (selectedChat.type === 0) {
        endpoint = `/api/conversations/${selectedChat.id}/messages/around/${messageId}`;
      } else if (selectedChat.type === 1) {
        endpoint = `/api/channels/${selectedChat.id}/messages/around/${messageId}`;
      } else {
        return;
      }

      const data = await apiGet(endpoint);
      hasMoreRef.current = true;
      hasMoreDownRef.current = true;

      // Ref ilə scroll+highlight-i saxla — setMessages sonrası useEffect-də icra olunacaq
      pendingHighlightRef.current = messageId;
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages around target:", err);
    }
  }, [selectedChat]);

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

    // Yarım viewport hündürlüyü threshold
    const threshold = area.clientHeight / 2;
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
    setLoadingOlder(true);

    try {
      const olderMessages = await apiGet(endpoint);

      if (!olderMessages || olderMessages.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      // Save scroll position — useLayoutEffect restore edəcək
      scrollRestoreRef.current = {
        scrollHeight: area.scrollHeight,
        scrollTop: area.scrollTop,
      };
      setMessages((prev) => [...prev, ...olderMessages]);
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingOlder(false);
    }
  }

  async function handleScrollDown() {
    const area = messagesAreaRef.current;
    if (!area) return;
    if (loadingMoreRef.current) return;
    if (!hasMoreDownRef.current) return;
    if (!selectedChat) return;

    // Aşağıya yaxınlaşanda yüklə (1 viewport threshold)
    const threshold = area.clientHeight;
    const distanceFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
    if (distanceFromBottom > threshold) return;

    // messages array-da ən yeni mesaj — index 0 (desc sıralama)
    const newestMsg = messages[0];
    if (!newestMsg) return;

    const afterDate = newestMsg.createdAtUtc || newestMsg.sentAt;
    if (!afterDate) return;

    let endpoint = "";
    if (selectedChat.type === 0) {
      endpoint = `/api/conversations/${selectedChat.id}/messages/after?date=${encodeURIComponent(afterDate)}&limit=30`;
    } else if (selectedChat.type === 1) {
      endpoint = `/api/channels/${selectedChat.id}/messages/after?date=${encodeURIComponent(afterDate)}&limit=30`;
    }
    if (!endpoint) return;

    loadingMoreRef.current = true;

    try {
      const newerMessages = await apiGet(endpoint);

      if (!newerMessages || newerMessages.length === 0) {
        hasMoreDownRef.current = false;
        return;
      }

      setMessages((prev) => [...newerMessages.reverse(), ...prev]);
    } catch (err) {
      console.error("Failed to load newer messages:", err);
    } finally {
      loadingMoreRef.current = false;
    }
  }

  function handleScroll() {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      handleScrollUp();
      handleScrollDown();
    });
  }

  // Memoize: messages array reverse + grouping — yalnız messages dəyişəndə yenidən hesablanır
  const grouped = useMemo(
    () => groupMessagesByDate([...messages].reverse()),
    [messages],
  );

  // Seçilmiş mesajlardan hər hansı biri başqasınındırsa Delete disable olsun
  const hasOthersSelected = useMemo(() => {
    if (selectedMessages.size === 0) return false;
    return [...selectedMessages].some((id) => {
      const m = messages.find((msg) => msg.id === id);
      return m && m.senderId !== user.id;
    });
  }, [selectedMessages, messages, user.id]);

  // Stabilize callback references — React.memo yenidən render etməsin
  const handleReply = useCallback((m) => {
    setReplyTo(m);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleForwardMsg = useCallback((m) => {
    setForwardMessage(m);
  }, []);

  const handleEditMsg = useCallback((m) => {
    setEditMessage(m);
    setReplyTo(null);
    setMessageText(m.content);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleReaction = useCallback(async (msg, emoji) => {
    if (!selectedChat) return;
    try {
      let result;
      if (selectedChat.type === 0) {
        result = await apiPut(
          `/api/conversations/${selectedChat.id}/messages/${msg.id}/reactions/toggle`,
          { reaction: emoji },
        );
      } else if (selectedChat.type === 1) {
        result = await apiPost(
          `/api/channels/${selectedChat.id}/messages/${msg.id}/reactions/toggle`,
          { reaction: emoji },
        );
      } else {
        return;
      }
      // Optimistic UI — API response-dan reactions-ı al
      const reactions = result.reactions || result;
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, reactions } : m)),
      );
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  }, [selectedChat]);

  // Reaction badge-ə klik edildikdə detail-ləri (kim react edib) yüklə
  const handleLoadReactionDetails = useCallback(async (messageId) => {
    if (!selectedChat) return null;
    try {
      let endpoint = "";
      if (selectedChat.type === 0) {
        endpoint = `/api/conversations/${selectedChat.id}/messages/${messageId}/reactions`;
      } else if (selectedChat.type === 1) {
        endpoint = `/api/channels/${selectedChat.id}/messages/${messageId}/reactions`;
      } else {
        return null;
      }
      const details = await apiGet(endpoint);
      // Messages state-ində reaction-ları detail ilə yenilə
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: details } : m)),
      );
      return details;
    } catch (err) {
      console.error("Failed to load reaction details:", err);
      return null;
    }
  }, [selectedChat]);

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
                  <button
                    className="header-action-btn"
                    title="Pin"
                    onClick={() => pinnedMessages.length > 0 && setPinBarExpanded((v) => !v)}
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

              {loadingOlder && <div className="loading-older" />}

              {pinnedMessages.length > 0 && (
                <PinnedBar
                  pinnedMessages={pinnedMessages}
                  currentPinIndex={currentPinIndex}
                  onToggleExpand={() => setPinBarExpanded((v) => !v)}
                  onPinClick={handlePinBarClick}
                />
              )}

              {pinBarExpanded && pinnedMessages.length > 0 && (
                <PinnedExpanded
                  pinnedMessages={pinnedMessages}
                  onToggleExpand={() => setPinBarExpanded(false)}
                  onScrollToMessage={handleScrollToMessage}
                  onUnpin={handlePinMessage}
                />
              )}

              <div
                className="messages-area"
                ref={messagesAreaRef}
                onScroll={handleScroll}
              >
                {grouped.map((item, index) => {
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
                      chatType={selectedChat.type}
                      selectMode={selectMode}
                      isSelected={selectedMessages.has(msg.id)}
                      onReply={handleReply}
                      onForward={handleForwardMsg}
                      onPin={handlePinMessage}
                      onFavorite={handleFavoriteMessage}
                      onSelect={handleEnterSelectMode}
                      onToggleSelect={handleToggleSelect}
                      onScrollToMessage={handleScrollToMessage}
                      onDelete={handleDeleteMessage}
                      onEdit={handleEditMsg}
                      onReaction={handleReaction}
                      onLoadReactionDetails={handleLoadReactionDetails}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {selectMode ? (
                <>
                  <div className="select-toolbar">
                    <div className="select-toolbar-inner">
                      <div className="select-toolbar-left">
                        <button className="select-toolbar-close" onClick={handleExitSelectMode}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        <span className="select-toolbar-count">
                          Messages ({selectedMessages.size})
                        </span>
                      </div>
                      <div className="select-toolbar-divider" />
                      <div className="select-toolbar-right">
                        <button
                          className="select-delete-btn"
                          disabled={selectedMessages.size === 0 || hasOthersSelected}
                          onClick={() => setDeleteConfirmOpen(true)}
                          title={hasOthersSelected ? "You cannot delete someone else's message" : ""}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Delete</span>
                        </button>
                        <button
                          className="select-forward-btn"
                          disabled={selectedMessages.size === 0}
                          onClick={handleForwardSelected}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 17 20 12 15 7" />
                            <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                          </svg>
                          <span>Forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {deleteConfirmOpen && (
                    <div className="delete-confirm-overlay" onClick={() => setDeleteConfirmOpen(false)}>
                      <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-confirm-header">
                          <span>Do you want to delete the selected messages ({selectedMessages.size})?</span>
                          <button className="delete-confirm-close" onClick={() => setDeleteConfirmOpen(false)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                        <div className="delete-confirm-actions">
                          <button
                            className="delete-confirm-btn"
                            onClick={() => {
                              setDeleteConfirmOpen(false);
                              handleDeleteSelected();
                            }}
                          >
                            DELETE
                          </button>
                          <button className="delete-cancel-btn" onClick={() => setDeleteConfirmOpen(false)}>
                            CANCEL
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
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
                    maxLength={4000}
                    rows={1}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyDown}
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
                    onClick={handleSendMessage}
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
              )}

              {/* Emoji picker panel */}
              {emojiOpen && (
                <div className="emoji-panel" ref={emojiPanelRef}>
                  <div className="emoji-panel-header">Smileys and people</div>
                  <div className="emoji-panel-grid">
                    {[
                      "😀","😃","😄","😁","😆","😅","🤣","😂",
                      "🙂","🙃","😉","😊","😇","🥰","😍","🤩",
                      "😘","😗","😚","😙","😋","😛","😜","🤪",
                      "😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨",
                      "😐","😑","😶","😏","😒","🙄","😬","🤥",
                      "😌","😔","😪","🤤","😴","😷","🤒","🤕",
                      "🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠",
                      "🥳","😎","🤓","🧐","😕","😟","🙁","😮",
                      "😯","😲","😳","🥺","😦","😧","😨","😰",
                      "😥","😢","😭","😱","😖","😣","😞","😓",
                      "😩","😫","🥱","😤","😡","😠","🤬","😈",
                      "👿","💀","👋","👍","👎","👏","🙏","💪",
                      "🤝","❤️","🔥","💯","⭐","🎉","✅","❌",
                    ].map((emoji) => (
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

              {forwardMessage && (
                <ForwardPanel
                  conversations={conversations}
                  onForward={handleForward}
                  onClose={() => setForwardMessage(null)}
                />
              )}
            </>
          ) : (
            <div className="chat-empty">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8899aa"
                strokeWidth="1.2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h2>Select a chat to start communicating</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
