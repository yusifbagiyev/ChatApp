// useState — komponent daxili state (like C# reactive property)
// useRef — re-render etmədən dəyər saxlamaq (timer id, DOM referansı)
// useEffect — side effect (API çağrısı, event listener, cleanup)
import { useState, useRef, useEffect } from "react";

// Utility funksiyaları import et
import { getInitials, getAvatarColor, formatTime } from "../utils/chatUtils";

// API servis — backend-ə HTTP GET request göndərmək üçün
import { apiGet } from "../services/api";

// ConversationList komponenti — sol panel, söhbət siyahısı
// Props:
//   conversations   — bütün söhbətlər array-i (Chat.jsx state-dən gəlir)
//   selectedChatId  — aktiv seçilmiş chatın id-si (highlight üçün)
//   searchText      — axtarış mətn sahəsinin dəyəri
//   onSearchChange  — axtarış mətn dəyişdikdə çağırılır
//   onSelectChat    — istifadəçi söhbətə klikləyəndə çağırılır
//   isLoading       — söhbətlər yüklənirkən true
//   onSelectSearchUser    — search nəticəsindən user seçildikdə
//   onSelectSearchChannel — search nəticəsindən channel seçildikdə
//   onMarkAllAsRead       — bütün oxunmamış mesajları oxunmuş işarələ
// .NET ekvivalenti: LeftPanel.razor — @foreach söhbət siyahısı
function ConversationList({
  conversations,
  selectedChatId,
  searchText,
  onSearchChange,
  onSelectChat,
  isLoading,
  userId,
  typingUsers,
  onCreateChannel,
  onSelectSearchUser,
  onSelectSearchChannel,
  onMarkAllAsRead,
}) {
  // --- Search mode state-ləri ---
  // searchMode — true olduqda conversation siyahısı gizlənir, search nəticələri görünür
  const [searchMode, setSearchMode] = useState(false);
  // searchResults — backend-dən gələn nəticələr: { users: [], channels: [] }
  const [searchResults, setSearchResults] = useState(null);
  // searchLoading — API çağırılarkən true (loading spinner üçün)
  const [searchLoading, setSearchLoading] = useState(false);
  // Debounce timer ref — hər keystroke-da əvvəlki timer-i sıfırlamaq üçün
  const searchTimerRef = useRef(null);

  // panelRef — conversation-panel DOM referansı (search mode kənar klik bağlama üçün)
  const panelRef = useRef(null);

  // --- Filter dropdown state ---
  // filterOpen — filter dropdown açıq/bağlı
  const [filterOpen, setFilterOpen] = useState(false);
  // filterRef — dropdown DOM referansı (kənar klik bağlama üçün)
  const filterRef = useRef(null);

  // --- Debounced search effect ---
  // searchText dəyişdikdə 300ms gözlə, sonra API çağır
  // searchMode aktiv olmasa çağırma
  useEffect(() => {
    // Search mode deyilsə heç nə etmə
    if (!searchMode) return;

    // Əvvəlki timer-i ləğv et (debounce)
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // 2 hərfdən az → nəticələri sıfırla
    if (searchText.length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    // 300ms debounce — istifadəçi yazmağı dayandırdıqdan sonra API çağır
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        // Hər iki endpoint-i paralel çağır (users + channels)
        const [users, channels] = await Promise.all([
          apiGet(`/api/users/search?q=${encodeURIComponent(searchText)}`),
          apiGet(`/api/channels/search?query=${encodeURIComponent(searchText)}`),
        ]);
        setSearchResults({
          users: users || [],
          channels: channels || [],
        });
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults({ users: [], channels: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    // Cleanup — komponent unmount olduqda və ya dependency dəyişdikdə timer-i sil
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchText, searchMode]);

  // --- Filter dropdown kənar klik bağlama ---
  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  // --- Search mode kənar klik bağlama ---
  // Conversation paneldən kənarda (məs. chat panel) klik → search bağla
  useEffect(() => {
    if (!searchMode) return;
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        exitSearchMode();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchMode]);

  // handleSearchFocus — search input-a fokus olduqda search mode-a keç
  function handleSearchFocus() {
    setSearchMode(true);
  }

  // handleSearchKeyDown — ESC basıldıqda search mode-dan çıx
  function handleSearchKeyDown(e) {
    if (e.key === "Escape") {
      exitSearchMode();
    }
  }

  // exitSearchMode — search mode bağla, input təmizlə
  function exitSearchMode() {
    setSearchMode(false);
    onSearchChange(""); // Input-u təmizlə
    setSearchResults(null);
    setSearchLoading(false);
  }

  // handleSelectUser — search nəticəsindən user-ə klik
  function handleSelectUser(user) {
    onSelectSearchUser(user);
    exitSearchMode();
  }

  // handleSelectChannel — search nəticəsindən channel-ə klik
  function handleSelectChannel(channel) {
    onSelectSearchChannel(channel);
    exitSearchMode();
  }

  // Client-side filter — searchMode deyilsə mövcud conversation-ları filtrə et
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  // --- Search nəticələrinin render funksiyası ---
  function renderSearchResults() {
    // Yüklənir
    if (searchLoading) {
      return <div className="loading-state">Searching...</div>;
    }

    // Nəticə yoxdur və ya hələ yazmayıb
    if (!searchResults) {
      return (
        <div className="search-no-results">
          Type at least 2 characters to search
        </div>
      );
    }

    const { users, channels } = searchResults;
    const hasResults = users.length > 0 || channels.length > 0;

    if (!hasResults) {
      return <div className="search-no-results">No results found</div>;
    }

    return (
      <>
        {/* Users bölməsi */}
        {users.length > 0 && (
          <>
            <div className="search-section-title">Users</div>
            {users.map((u) => (
              <div
                key={u.id}
                className="search-result-item"
                onClick={() => handleSelectUser(u)}
              >
                <div
                  className="search-result-avatar"
                  style={{ background: getAvatarColor(u.fullName) }}
                >
                  {getInitials(u.fullName)}
                </div>
                <div className="search-result-info">
                  <div className="search-result-name">{u.fullName}</div>
                  {u.position && (
                    <div className="search-result-detail">{u.position}</div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Channels bölməsi */}
        {channels.length > 0 && (
          <>
            <div className="search-section-title">Channels</div>
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="search-result-item"
                onClick={() => handleSelectChannel(ch)}
              >
                <div
                  className="search-result-avatar"
                  style={{ background: getAvatarColor(ch.name) }}
                >
                  {getInitials(ch.name)}
                </div>
                <div className="search-result-info">
                  <div className="search-result-name">{ch.name}</div>
                  {ch.memberCount != null && (
                    <div className="search-result-detail">
                      {ch.memberCount} members
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <div className="conversation-panel" ref={panelRef}>
      <div className="conversation-panel-header">
        {/* Filter button — dropdown ilə "Mark all as read" */}
        <div className="filter-dropdown-wrapper" ref={filterRef}>
          <button
            className="header-icon-btn"
            title="Filter"
            onClick={() => setFilterOpen((prev) => !prev)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
          </button>
          {/* Filter dropdown — "Mark all as read" butonu */}
          {filterOpen && (
            <div className="filter-dropdown">
              <button
                className="filter-dropdown-item"
                onClick={() => {
                  onMarkAllAsRead();
                  setFilterOpen(false);
                  exitSearchMode();
                }}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>

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
          {/* Controlled input — value state-dən gəlir */}
          {/* onFocus → search mode başla, onKeyDown → ESC ilə bağla */}
          <input
            type="text"
            placeholder="Find employee or chat"
            className="search-input"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={handleSearchFocus}
            onKeyDown={handleSearchKeyDown}
          />
          {/* Search mode-da X button göstər — search bağlamaq üçün */}
          {searchMode && (
            <button className="search-clear-btn" onClick={exitSearchMode}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {/* Yeni söhbət düyməsi — Bitrix24 stili */}
        <button className="header-icon-btn create-btn" title="New group" onClick={onCreateChannel}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Söhbət siyahısı / Search nəticələri */}
      <div className="conversation-list">
        {/* Search mode aktiv → search nəticələri göstər */}
        {searchMode ? (
          renderSearchResults()
        ) : isLoading ? (
          // Yüklənir...
          <div className="loading-state">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          // Nəticə yoxdur
          <div className="empty-state">No conversations yet</div>
        ) : (
          filteredConversations.map((c) => {
            // Öz mesajımdırmı? — tick icon göstərmək üçün
            const isOwnLastMessage = c.lastMessageSenderId === userId;

            // Preview mətni — tiplərə görə fərqlənir
            let previewContent;
            // Preview-un solunda əlavə icon/avatar olacaqmı?
            let previewPrefix = null;

            if (c.draft) {
              // Draft varsa — qırmızı "Draft:" prefix ilə göstər
              previewPrefix = <span className="preview-draft-label">Draft:</span>;
              previewContent = c.draft;
            } else if (c.type === 2) {
              // DepartmentUser → vəzifə adı
              previewContent = c.positionName || "User";
            } else if (!c.lastMessage) {
              previewContent = "No messages yet";
            } else if (c.isNotes) {
              // Notes — ↩ icon ilə
              previewPrefix = <span className="preview-reply-icon"><svg viewBox="0 0 16 16"><path d="M14 3v4c0 1.1-.9 2-2 2H4m0 0l3-3M4 9l3 3"/></svg></span>;
              previewContent = c.lastMessage;
            } else if (isOwnLastMessage) {
              // Öz mesajım (DM/Channel) — ↩ icon + mətn
              previewPrefix = <span className="preview-reply-icon"><svg viewBox="0 0 16 16"><path d="M14 3v4c0 1.1-.9 2-2 2H4m0 0l3-3M4 9l3 3"/></svg></span>;
              previewContent = c.lastMessage;
            } else if (c.type === 1 && c.lastMessageSenderFullName) {
              // Channel + başqasının mesajı → kiçik avatar + mətn
              previewPrefix = (
                <span
                  className="preview-sender-avatar"
                  style={{ background: getAvatarColor(c.lastMessageSenderFullName) }}
                >
                  {getInitials(c.lastMessageSenderFullName)}
                </span>
              );
              previewContent = c.lastMessage;
            } else {
              // DM — qarşı tərəfin mesajı → sadəcə mətn
              previewContent = c.lastMessage;
            }

            return (
              <div
                key={c.id}
                className={`conversation-item ${selectedChatId === c.id ? "selected" : ""}`}
                onClick={() => onSelectChat(c)}
              >
                {/* Avatar + typing indicator wrapper */}
                <div className="conversation-avatar-wrapper">
                  <div
                    className="conversation-avatar"
                    style={{ background: c.isNotes ? "#2FC6F6" : getAvatarColor(c.name) }}
                  >
                    {c.isNotes ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    ) : (
                      getInitials(c.name)
                    )}
                  </div>
                  {/* Typing indicator — avatar-ın sağ-aşağı küncündə animasiyalı dots */}
                  {typingUsers[c.id] && (
                    <span className="avatar-typing-indicator">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  )}
                </div>

                {/* Söhbət məlumatı */}
                <div className="conversation-info">
                  {/* Üst sıra: ad + tick + tarix */}
                  <div className="conversation-top-row">
                    <span className="conversation-name">{c.name}</span>
                    <div className="conversation-time-wrapper">
                      {/* Tick icon — time-ın solunda, yalnız öz mesajımda (Notes-da yox) */}
                      {isOwnLastMessage && c.type !== 2 && !c.isNotes && c.lastMessage && (
                        <span className={`preview-tick ${c.lastMessageStatus === "Read" ? "read" : ""}`}>
                          <svg viewBox="0 0 16 11">
                            <polyline points="1 5.5 5 9.5 11 1" />
                            {c.lastMessageStatus === "Read" && (
                              <polyline points="5.5 5.5 9.5 9.5 15 1" />
                            )}
                          </svg>
                        </span>
                      )}
                      <span className="conversation-time">
                        {formatTime(c.lastMessageAtUtc)}
                      </span>
                    </div>
                  </div>

                  {/* Alt sıra: preview + unread badge */}
                  <div className="conversation-bottom-row">
                    <span className="conversation-preview">
                      {previewPrefix}
                      {previewContent}
                    </span>
                    {/* Read later icon — mesaj səviyyəsində mark varsa bookmark göstər */}
                    {c.lastReadLaterMessageId && (
                      <span className="read-later-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </span>
                    )}
                    {c.unreadCount > 0 && (
                      <span className="unread-badge">{c.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
