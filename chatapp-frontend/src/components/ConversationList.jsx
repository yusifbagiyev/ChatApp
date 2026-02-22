// Utility funksiyaları import et
import { getInitials, getAvatarColor, formatTime } from "../utils/chatUtils";

// ConversationList komponenti — sol panel, söhbət siyahısı
// Props:
//   conversations   — bütün söhbətlər array-i (Chat.jsx state-dən gəlir)
//   selectedChatId  — aktiv seçilmiş chatın id-si (highlight üçün)
//   searchText      — axtarış mətn sahəsinin dəyəri
//   onSearchChange  — axtarış mətn dəyişdikdə çağırılır
//   onSelectChat    — istifadəçi söhbətə klikləyəndə çağırılır
//   isLoading       — söhbətlər yüklənirkən true
// .NET ekvivalenti: LeftPanel.razor — @foreach söhbət siyahısı
function ConversationList({
  conversations,
  selectedChatId,
  searchText,
  onSearchChange,
  onSelectChat,
  isLoading,
}) {
  // Client-side filter — searchText-ə görə söhbət siyahısını filtrə et
  // .filter() — şərtə uyan elementləri qaytarır (like LINQ .Where())
  // toLowerCase() — böyük/kiçik hərf fərqini aradan qaldır (case-insensitive)
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="conversation-panel">
      {/* Panel başlığı — axtarış sahəsi */}
      <div className="conversation-panel-header">
        <div className="search-wrapper">
          {/* SVG axtarış ikonu */}
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
          {/* onChange — hər dəfə dəyişdikdə parent-ə bildir (setSearchText çağrılır) */}
          <input
            type="text"
            placeholder="Find employee or chat"
            className="search-input"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Söhbət siyahısı */}
      <div className="conversation-list">
        {/* Şərti render — 3 hal: yüklənir / boşdur / siyahı göstər */}
        {isLoading ? (
          // Yüklənir...
          <div className="loading-state">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          // Nəticə yoxdur
          <div className="empty-state">No conversations yet</div>
        ) : (
          // .map() — hər söhbət üçün JSX render et (like @foreach in Blazor)
          filteredConversations.map((c) => (
            <div
              key={c.id}  // React-ın list key-i — hər element unikal olmalıdır
              // Template literal ilə dinamik className:
              // selectedChatId === c.id → "selected" class əlavə et (mavi vurğu)
              className={`conversation-item ${selectedChatId === c.id ? "selected" : ""}`}
              onClick={() => onSelectChat(c)} // Klikləndikdə Chat.jsx-ə bu söhbəti göndər
            >
              {/* Avatar — adın baş hərflərindən rəngli dairə */}
              <div
                className="conversation-avatar"
                style={{ background: getAvatarColor(c.name) }} // addan deterministik rəng
              >
                {getInitials(c.name)} {/* "John Doe" → "JD" */}
              </div>

              {/* Söhbət məlumatı — ad, tarix, son mesaj, oxunmamış sayı */}
              <div className="conversation-info">
                {/* Üst sıra: ad (solda) + tarix (sağda) */}
                <div className="conversation-top-row">
                  <span className="conversation-name">{c.name}</span>
                  <span className="conversation-time">
                    {/* formatTime — "HH:mm" və ya "DD/MM" formatı */}
                    {formatTime(c.lastMessageAtUtc)}
                  </span>
                </div>

                {/* Alt sıra: son mesaj preview (solda) + unread badge (sağda) */}
                <div className="conversation-bottom-row">
                  <span className="conversation-preview">
                    {/* type=2 (DepartmentUser) → vəzifə adını göstər */}
                    {/* type=0/1 → son mesaj mətnini göstər */}
                    {c.type === 2
                      ? c.positionName || "User"
                      : c.lastMessage || "No messages yet"}
                  </span>
                  {/* Oxunmamış mesaj sayı — yalnız unreadCount > 0 olduqda görünür */}
                  {c.unreadCount > 0 && (
                    <span className="unread-badge">{c.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ConversationList;
