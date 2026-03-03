// memo   — komponenti cache-lər; props dəyişmədikdə yenidən render etmə
// useState — lokal state (menyu açıq/bağlı, reaction picker, tooltip)
// useRef   — DOM referansları (menyu div-i, reaction div-i)
// useEffect — kənar klik handler, menyu pozisyonu yoxlama
// useLayoutEffect — reaction picker-in flip (yuxarı/aşağı açılma)
import { memo, useState, useRef, useEffect, useLayoutEffect } from "react";

import {
  getInitials,
  getAvatarColor,
  formatMessageTime,    // "HH:mm" formatı
} from "../utils/chatUtils";

import { QUICK_REACTION_EMOJIS, EXPANDED_REACTION_EMOJIS } from "../utils/emojiConstants";
import MessageActionMenu from "./MessageActionMenu"; // "⋮" menyu komponenti

// MessageBubble — tək bir mesajın balonu
// memo ilə wrap edilib — Chat.jsx-dəki grouped.map() çox element render edir,
// memo olmadan hər yeni mesajda bütün bubbles yenidən render olacaqdı
//
// Props:
//   msg              — mesaj obyekti (id, content, senderId, status, reactions, ...)
//   isOwn            — bu mesaj cari istifadəçinindirsə true (sağa hizalanır)
//   showAvatar       — bu mesajda avatar göstərilsinmi? (son mesajda göstərilir)
//   chatType         — 0=DM, 1=Channel, 2=DepartmentUser
//   selectMode       — çox mesaj seçmə rejimi aktivdirsə true
//   isSelected       — bu mesaj seçilib? (checkbox checked)
//   onReply/onForward/onPin/onFavorite/onSelect/onToggleSelect/onScrollToMessage/onDelete/onEdit/onReaction/onLoadReactionDetails
//                    — Chat.jsx-dən gəlir, useCallback ilə stabildir
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
  onMarkLater,
  readLaterMessageId,
  onSelect,
  onToggleSelect,
  onScrollToMessage,
  onDelete,
  onEdit,
  onReaction,
  onLoadReactionDetails,
}) {
  // --- LOKAL STATE ---

  // showActions — hover olduqda action düymələri göstər (reaction + more)
  const [showActions, setShowActions] = useState(false);

  // menuOpen — "⋮" düyməsinə klik → MessageActionMenu açıq/bağlı
  const [menuOpen, setMenuOpen] = useState(false);

  // reactionOpen — "😊" düyməsinə klik → reaction picker açıq/bağlı
  const [reactionOpen, setReactionOpen] = useState(false);

  // reactionExpanded — "⌄" düyməsinə klik → genişləndirilmiş emoji siyahısı
  const [reactionExpanded, setReactionExpanded] = useState(false);

  // reactionTooltipOpen — hansı emoji-nin tooltip-i açıqdır? (null = heç biri)
  // string: emoji (məsələn "👍") → həmin emoji-nin kim react etdiyini göstər
  const [reactionTooltipOpen, setReactionTooltipOpen] = useState(null);

  // reactionDetailsLoading — API-dən kim react etdi yüklənirkən true
  const [reactionDetailsLoading, setReactionDetailsLoading] = useState(false);

  // --- DOM REFERANSLARI ---
  const menuRef = useRef(null);     // MessageActionMenu div-i
  const reactionRef = useRef(null); // Reaction picker div-i
  const tooltipRef = useRef(null);  // Reaction tooltip div-i

  // --- KƏNAR KLİK HANDLER ---
  // menuOpen YA reactionOpen YA reactionTooltipOpen açıqdırsa event listener qeydiyyat et
  // Klik bunların xaricinə düşdükdə hamısını bağla
  useEffect(() => {
    function handleClickOutside(e) {
      const clickedInsideMenu = menuRef.current && menuRef.current.contains(e.target);
      const clickedInsideReaction = reactionRef.current && reactionRef.current.contains(e.target);
      const clickedInsideTooltip = tooltipRef.current && tooltipRef.current.contains(e.target);

      // Tooltip kənara klikləndikdə bağla (reaction badge-ə klik istisnası)
      if (reactionTooltipOpen && !clickedInsideTooltip && !e.target.closest(".reaction-badge")) {
        setReactionTooltipOpen(null);
      }

      // Menyu + reaction ikisindən kənara klikləndikdə hamısını bağla
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
    // Cleanup — listener-i sil (like removeEventListener in .NET Blazor)
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, reactionOpen, reactionTooltipOpen]);

  // Menyu açıldıqda ekranın altına çıxırsa yuxarıya flip et
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      // getBoundingClientRect() — elementin viewport-a nisbətən koordinatları
      if (rect.bottom > window.innerHeight) {
        menuRef.current.classList.add("flip-up"); // CSS ilə yuxarı aç
      } else {
        menuRef.current.classList.remove("flip-up");
      }
    }
  }, [menuOpen]);

  // Reaction picker açıldıqda/genişləndirildiqdə ekranın yuxarısına çıxırsa aşağıya flip et
  // useLayoutEffect — DOM render olduqdan sonra, paint-dən ƏVVƏL işlə (jump yoxdur)
  useLayoutEffect(() => {
    const el = reactionRef.current;
    if (!el || !reactionOpen) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < 0) {
      el.classList.add("flip-down"); // CSS ilə aşağı aç
    } else {
      el.classList.remove("flip-down");
    }
  }, [reactionOpen, reactionExpanded]);

  // --- JSX RENDER ---
  return (
    // message-row — mesajın tam sırası (checkbox + avatar + bubble)
    // data-bubble-id={msg.id} — handleScrollToMessage-də querySelector üçün
    // data-unread="true" — IntersectionObserver-ın mark-as-read üçün izlədiyi element
    <div
      className={`message-row ${isOwn ? "own" : ""} ${showAvatar ? "has-avatar" : ""} ${isSelected ? "selected" : ""}`}
      data-bubble-id={msg.id}
      // selectMode aktiv + mesaj silinməyibsə klik → toggle select
      onClick={selectMode && !msg.isDeleted ? () => onToggleSelect(msg.id) : undefined}
      // Spread operator ilə şərti data-* atributları əlavə et
      // !isOwn + !msg.isRead → IntersectionObserver üçün lazımdır
      {...(!isOwn &&
        !msg.isRead && {
          "data-unread": "true",
          "data-msg-id": msg.id,
          "data-conv-id":
            chatType === 0 ? msg.conversationId : msg.channelId,
          "data-conv-type": String(chatType), // "0" (string) — dataset always string
        })}
    >
      {/* Seçmə checkbox — selectMode aktiv + silinməmiş mesaj üçün */}
      {selectMode && !msg.isDeleted && (
        <div className={`select-checkbox ${isSelected ? "checked" : ""}`}>
          {isSelected && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      )}

      {/* Avatar slot — yalnız başqasının mesajında (isOwn=false) */}
      {!isOwn && (
        <div className="message-avatar-slot">
          {/* showAvatar — bu sətir qrupun son mesajıdırsa true */}
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

      {/* message-bubble — mesajın vizual balonu */}
      {/* onContextMenu — sağ klik → menyu aç */}
      {/* message-bubble — mesajın vizual balonu */}
      {/* hover trigger burada — yalnız bubble ətrafında action menyu görünsün */}
      <div
        className={`message-bubble ${isOwn ? "own" : ""}`}
        onMouseEnter={selectMode ? undefined : () => setShowActions(true)}
        onMouseLeave={selectMode ? undefined : () => {
          if (!menuOpen && !reactionOpen) setShowActions(false);
        }}
        onContextMenu={selectMode ? undefined : (e) => {
          e.preventDefault();
          setMenuOpen(true);
          setReactionOpen(false);
          setShowActions(true);
        }}
      >
        {/* Forwarded label — yönləndirilmiş mesaj */}
        {msg.isForwarded && !msg.isDeleted && (
          <div className="forwarded-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            <span>Forwarded message</span>
          </div>
        )}

        {/* Reply reference — bu mesaj başqa mesaja reply edirsə */}
        {msg.replyToMessageId && !msg.isDeleted && (
          <div
            className="reply-reference"
            // Reply-a klik → həmin mesaja scroll et
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

        {/* Mesaj məzmunu */}
        <div className="message-content">
          {msg.isDeleted ? (
            // Silinmiş mesaj — məzmun yerinə standart mesaj
            <span className="deleted-message-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              This message was deleted.
            </span>
          ) : (
            msg.content // Normal mesaj məzmunu
          )}
        </div>

        {/* Meta sıra: reactions + "modified" + vaxt + read ticks */}
        <div className="message-meta">
          {/* Reaction badges — bu mesaja olan reaksiyalar */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="reaction-badges">
              {/* Hər emoji üçün badge düyməsi */}
              {msg.reactions.map((r) => (
                <div key={r.emoji} className="reaction-badge-wrapper">
                  <button
                    className="reaction-badge"
                    onClick={async (e) => {
                      e.stopPropagation(); // Bubble-ın onClick-ini tetikləməsin

                      // Eyni emoji-nin tooltip-inə klik → bağla (toggle)
                      if (reactionTooltipOpen === r.emoji) {
                        setReactionTooltipOpen(null);
                        return;
                      }

                      // userFullNames artıq yüklənibsə (SignalR/əvvəlki API-dən) → birbaşa göstər
                      if (r.userFullNames && r.userFullNames.length > 0) {
                        setReactionTooltipOpen(r.emoji);
                        return;
                      }

                      // Yüklənməyibsə API-dən al
                      setReactionTooltipOpen(r.emoji);
                      setReactionDetailsLoading(true);
                      await onLoadReactionDetails(msg.id);
                      setReactionDetailsLoading(false);
                    }}
                  >
                    <span className="reaction-badge-emoji">{r.emoji}</span>
                    {/* count > 1 olduqda sayı göstər */}
                    {r.count > 1 && <span className="reaction-badge-count">{r.count}</span>}
                  </button>

                  {/* Reaction tooltip — kim react etdi? */}
                  {reactionTooltipOpen === r.emoji && (
                    <div className="reaction-tooltip visible" ref={tooltipRef}>
                      {reactionDetailsLoading ? (
                        <div className="reaction-tooltip-item">
                          <span className="reaction-tooltip-name reaction-tooltip-loading">Loading...</span>
                        </div>
                      ) : r.userFullNames && r.userFullNames.length > 0 ? (
                        // Hər react edən istifadəçi üçün avatar + ad
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
                        // Fallback — ad yoxdursa say göstər
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

          {/* "modified" — mesaj redaktə edilmişsə */}
          {msg.isEdited && <span className="message-modified">modified</span>}

          {/* Vaxt — "HH:mm" */}
          <span className="message-time">
            {formatMessageTime(msg.createdAtUtc)}
          </span>

          {/* Read ticks — yalnız öz mesajları üçün, status >= 1 */}
          {/* status: 1=Sent(tək tik), 2=Delivered(ikiqat tik), 3=Read(mavi tik) */}
          {isOwn && msg.status >= 1 && (
            <svg
              className="read-check"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              // status=3 (Read) → mavi, digər → boz
              stroke={msg.status === 3 ? "#46CDF0" : "#9ca3af"}
              strokeWidth="2.5"
            >
              {/* status >= 2 → ikiqat tik (Delivered/Read), 1 → tək tik (Sent) */}
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

        {/* Hover action düymələri + menyular */}
        {/* Yalnız selectMode yox + (hover YA menyu YA reaction açıqdırsa) */}
        {!selectMode && (showActions || menuOpen || reactionOpen) && (
          <div className={`bubble-actions ${isOwn ? "own" : ""}`}>
            {/* Reaction düyməsi — silinmiş mesajda göstərmə */}
            {!msg.isDeleted && (
              <button
                className="bubble-action-btn"
                title="Reactions"
                onClick={() => {
                  setReactionOpen(!reactionOpen); // Toggle
                  setMenuOpen(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>
            )}

            {/* More düyməsi — "⋮" → MessageActionMenu açır */}
            <button
              className="bubble-action-btn"
              title="More"
              onClick={() => {
                setMenuOpen(!menuOpen);
                setReactionOpen(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                onMarkLater={onMarkLater}
                readLaterMessageId={readLaterMessageId}
                onSelect={onSelect}
                onDelete={onDelete}
                onClose={() => {
                  setMenuOpen(false);
                  setShowActions(false);
                }}
              />
            )}

            {/* Reaction picker — silinməmiş mesaj + reactionOpen */}
            {!msg.isDeleted && reactionOpen && (
              <div
                className={`reaction-picker ${isOwn ? "own" : ""}`}
                ref={reactionRef}
              >
                <div className="reaction-quick">
                  {/* reactionExpanded true → genişləndirilmiş, false → sürətli siyahı */}
                  {(reactionExpanded
                    ? EXPANDED_REACTION_EMOJIS
                    : QUICK_REACTION_EMOJIS
                  ).map((emoji) => (
                    <button
                      key={emoji}
                      className="reaction-emoji-btn"
                      onClick={() => {
                        // onReaction — Chat.jsx-dəki handleReaction çağırır
                        onReaction && onReaction(msg, emoji);
                        setReactionOpen(false);
                        setReactionExpanded(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}

                  {/* Genişləndir düyməsi — yalnız collapsed vəziyyətdə göstər */}
                  {!reactionExpanded && (
                    <button
                      className="reaction-expand-btn"
                      onClick={() => setReactionExpanded(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
