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
  joinConversation,
  leaveConversation,
  joinChannel,
  leaveChannel,
  getConnection,
} from "../services/signalr";

import useChatSignalR from "../hooks/useChatSignalR";
import useChatScroll from "../hooks/useChatScroll";

import { AuthContext } from "../context/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";

import Sidebar from "../components/Sidebar";
import ConversationList from "../components/ConversationList";
import MessageBubble from "../components/MessageBubble";
import ForwardPanel from "../components/ForwardPanel";
import ChatHeader from "../components/ChatHeader";
import ChatInputArea from "../components/ChatInputArea";
import SelectToolbar from "../components/SelectToolbar";
import PinnedBar, { PinnedExpanded } from "../components/PinnedBar";
import {
  groupMessagesByDate,
  getChatEndpoint,
  MESSAGE_PAGE_SIZE,
  CONVERSATION_PAGE_SIZE,
  HIGHLIGHT_DURATION_MS,
  TYPING_DEBOUNCE_MS,
  BATCH_DELETE_THRESHOLD,
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const inputRef = useRef(null);

  const { handleScroll, hasMoreRef, hasMoreDownRef, loadingOlder, scrollRestoreRef } = useChatScroll(messagesAreaRef, messages, selectedChat, setMessages);

  useEffect(() => {
    loadConversations();
  }, []);

  useChatSignalR(user.id, setSelectedChat, setMessages, setConversations, setShouldScrollBottom, setOnlineUsers, setTypingUsers, setPinnedMessages, setCurrentPinIndex);

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
      setTimeout(() => target.classList.remove("highlight-message"), HIGHLIGHT_DURATION_MS);
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
        `/api/unified-conversations?pageNumber=1&pageSize=${CONVERSATION_PAGE_SIZE}`,
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
      const endpoint = getChatEndpoint(chat.id, chat.type, "/messages/pinned");
      if (!endpoint) return;
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
      const msgBase = getChatEndpoint(chat.id, chat.type, "/messages");
      if (!msgBase) return;
      const msgEndpoint = `${msgBase}?pageSize=${MESSAGE_PAGE_SIZE}`;
      const pinEndpoint = `${msgBase}/pinned`;

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
      const endpoint = getChatEndpoint(targetChat.id, targetChat.type, "/messages");
      if (!endpoint) return;

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
        const data = await apiGet(`${getChatEndpoint(selectedChat.id, selectedChat.type, "/messages")}?pageSize=${MESSAGE_PAGE_SIZE}`);
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
      const endpoint = getChatEndpoint(selectedChat.id, selectedChat.type, `/messages/${msg.id}/pin`);
      if (!endpoint) return;

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
      const endpoint = getChatEndpoint(selectedChat.id, selectedChat.type, `/messages/${msg.id}/favorite`);
      if (!endpoint) return;
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
      const endpoint = getChatEndpoint(selectedChat.id, selectedChat.type, `/messages/${msg.id}`);
      if (!endpoint) return;
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
      const base = getChatEndpoint(selectedChat.id, selectedChat.type, "/messages");
      if (!base) return;

      if (ids.length > BATCH_DELETE_THRESHOLD) {
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
        const endpoint = getChatEndpoint(selectedChat.id, selectedChat.type, `/messages/${editingMsg.id}`);
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
      const endpoint = getChatEndpoint(selectedChat.id, selectedChat.type, "/messages");
      if (!endpoint) return;

      await apiPost(endpoint, {
        content: text,
        replyToMessageId: replyTo ? replyTo.id : null,
      });

      // Mesajları yenidən yüklə (SignalR fallback)
      const data = await apiGet(`${endpoint}?pageSize=${MESSAGE_PAGE_SIZE}`);
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
    }, TYPING_DEBOUNCE_MS);
  }

  const handleScrollToMessage = useCallback(async (messageId) => {
    const area = messagesAreaRef.current;
    if (!area || !selectedChat) return;

    // Əvvəlcə DOM-da yoxla — mesaj artıq yüklənibsə birbaşa scroll et
    let el = area.querySelector(`[data-bubble-id="${messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight-message");
      setTimeout(() => el.classList.remove("highlight-message"), HIGHLIGHT_DURATION_MS);
      return;
    }

    // Mesaj DOM-da yoxdur — around endpoint ilə yüklə
    try {
      const endpoint = getChatEndpoint(selectedChat.id, selectedChat.type, `/messages/around/${messageId}`);
      if (!endpoint) return;

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
      const endpoint = getChatEndpoint(selectedChat.id, selectedChat.type, `/messages/${msg.id}/reactions/toggle`);
      if (!endpoint) return;
      // DM uses PUT, Channel uses POST for reaction toggle
      const result = selectedChat.type === 0
        ? await apiPut(endpoint, { reaction: emoji })
        : await apiPost(endpoint, { reaction: emoji });
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
      const endpoint = getChatEndpoint(selectedChat.id, selectedChat.type, `/messages/${messageId}/reactions`);
      if (!endpoint) return null;
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
              <ChatHeader
                selectedChat={selectedChat}
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
                pinnedMessages={pinnedMessages}
                onTogglePinExpand={() => setPinBarExpanded((v) => !v)}
              />

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
                <SelectToolbar
                  selectedCount={selectedMessages.size}
                  hasOthersSelected={hasOthersSelected}
                  onExit={handleExitSelectMode}
                  onDelete={handleDeleteSelected}
                  onForward={handleForwardSelected}
                  deleteConfirmOpen={deleteConfirmOpen}
                  setDeleteConfirmOpen={setDeleteConfirmOpen}
                />
              ) : (
              <ChatInputArea
                messageText={messageText}
                setMessageText={setMessageText}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                editMessage={editMessage}
                setEditMessage={setEditMessage}
                emojiOpen={emojiOpen}
                setEmojiOpen={setEmojiOpen}
                emojiPanelRef={emojiPanelRef}
                inputRef={inputRef}
                onSend={handleSendMessage}
                onKeyDown={handleKeyDown}
                onTyping={sendTypingSignal}
              />
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
