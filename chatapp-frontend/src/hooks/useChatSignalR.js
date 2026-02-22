// ─── useChatSignalR.js — Custom Hook: Real-Time Event Handlers ───────────────
// Custom Hook nədir?
//   - "use" ilə başlayan funksiya — React hook-larını (useEffect, useState) istifadə edə bilir
//   - Kodun təkrarlanmasının qarşısını alır — məntiqi komponentdən ayırır
//   - .NET-də: ayrıca service class kimi düşün — ChatHub event listener-ları
//
// Bu hook Chat.jsx-dən çağırılır. Bütün SignalR event handler-larını qurur
// və component unmount olduqda avtomatik olaraq təmizlənir.
//
// "Pure side-effect hook" — heç bir dəyər qaytarmır (returns nothing)

import { useEffect } from "react";
import { startConnection } from "../services/signalr";

export default function useChatSignalR(
  userId,             // Cari istifadəçinin ID-si (öz typing signal-ını ignore etmək üçün)
  setSelectedChat,    // Seçilmiş chat-ı yeniləmək üçün Chat.jsx state setter
  setMessages,        // Mesajlar array-ını yeniləmək üçün
  setConversations,   // Conversation list-i yeniləmək üçün (son mesaj)
  setShouldScrollBottom, // Yeni mesaj gəldikdə aşağı scroll et
  setOnlineUsers,     // Online olan userlərin Set-i
  setTypingUsers,     // Kim yazır — { [conversationId]: true/fullName }
  setPinnedMessages,  // Pinlənmiş mesajlar array-ı
  setCurrentPinIndex, // Pin bar-dakı aktiv index
) {
  // useEffect — komponentin mount olduğunda 1 dəfə işləyir
  // [userId] — dependency array: yalnız userId dəyişəndə yenidən işləyir
  useEffect(() => {
    // conn: SignalR connection obyekti — cleanup funksiyasında istifadə üçün
    let conn = null;

    // ─── handleNewDirectMessage ────────────────────────────────────────────────
    // Server "NewDirectMessage" event-i göndərəndə çağırılır (yeni DM mesaj)
    // 2 işi var:
    //   1. Əgər bu conversation açıqdırsa — messages state-ə əlavə et
    //   2. Conversation list-dəki son mesajı yenilə
    function handleNewDirectMessage(message) {
      // setSelectedChat-ı "functional update" ilə çağırırıq — closure problemi olmasın
      // current → hal-hazırdakı selectedChat dəyəri
      setSelectedChat((current) => {
        if (
          current &&
          current.type === 0 &&                          // DM-dir (type 0)
          current.id === message.conversationId          // Bu conversation açıqdır
        ) {
          setMessages((prev) => {
            // Duplicate check: eyni mesaj artıq varsa əlavə etmə
            // (SignalR + API fallback eyni mesajı 2 dəfə göndərə bilər)
            if (prev.some((m) => m.id === message.id)) return prev;
            setShouldScrollBottom(true);                 // Aşağı scroll et
            return [message, ...prev];                   // Yeni mesajı başa əlavə et (desc order)
          });
        }
        return current; // selectedChat-ı dəyişmə, sadəcə oxu
      });

      // Conversation list-dəki son mesajı yenilə (preview üçün)
      // .map() — hər conversation-ı gəz, uyğun olanı yenilə
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === message.conversationId) {
            // Spread operator: ...c — köhnə bütün xassələri kopyala, sonra override et
            return {
              ...c,
              lastMessage: message.content,
              lastMessageAtUtc: message.createdAtUtc,
            };
          }
          return c; // Uyğun deyilsə — dəyişmədən qaytar
        }),
      );
    }

    // ─── handleNewChannelMessage ───────────────────────────────────────────────
    // handleNewDirectMessage-ın Channel versiyası (type === 1)
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

    // ─── handleMessageRead ────────────────────────────────────────────────────
    // Digər istifadəçi mesajı oxuyanda — mesajın status-unu yenilə (✓✓ mavi)
    // status: 3 = Read (MessageStatus enum)
    function handleMessageRead(data) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === data.messageId) {
            return { ...m, isRead: true, status: 3 }; // Status-u Read-ə yenilə
          }
          return m;
        }),
      );
    }

    // ─── handleUserOnline ─────────────────────────────────────────────────────
    // İstifadəçi online olduqda — onlineUsers Set-ə əlavə et
    // Set nədir? Unikal dəyərlərin kolleksiyası — Array kimi amma duplicate yoxdur
    function handleUserOnline(onlineUserId) {
      setOnlineUsers((prev) => {
        const next = new Set(prev); // Köhnə Set-dən yeni Set yarat (immutability)
        next.add(onlineUserId);     // Online user-i əlavə et
        return next;
      });
    }

    // ─── handleUserOffline ────────────────────────────────────────────────────
    // İstifadəçi offline olduqda — onlineUsers Set-dən sil
    function handleUserOffline(offlineUserId) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(offlineUserId); // Offline user-i sil
        return next;
      });
    }

    // ─── handleUserTypingInConversation ───────────────────────────────────────
    // DM conversation-da digər user yazır/yazmağı dayandırır
    // typingUsers: { [conversationId]: true } — həmin conversation-da yazır
    function handleUserTypingInConversation(conversationId, typingUserId, isTyping) {
      // Özümüzün typing signal-ını ignore et
      if (typingUserId === userId) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          // Computed property: [conversationId] — dəyişən adından key yarat
          return { ...prev, [conversationId]: true };
        } else {
          const next = { ...prev };
          delete next[conversationId]; // Key-i sil — artıq yazmır
          return next;
        }
      });
    }

    // ─── handleUserTypingInChannel ────────────────────────────────────────────
    // Channel-da digər user yazır/yazmağı dayandırır
    // fullName — channel-da "Ali yazır..." göstərmək üçün
    function handleUserTypingInChannel(channelId, typingUserId, fullName, isTyping) {
      if (typingUserId === userId) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return { ...prev, [channelId]: fullName }; // Ad saxla — "Ali yazır..." üçün
        } else {
          const next = { ...prev };
          delete next[channelId];
          return next;
        }
      });
    }

    // ─── handleMessageDeleted ─────────────────────────────────────────────────
    // Başqa user (ya da özümüz başqa cihazdan) mesajı siləndə
    // "Soft delete" — mesajı silirik deyil, isDeleted: true edirik
    // UI-da: "This message was deleted." göstərilir
    function handleMessageDeleted(deletedMsg) {
      setMessages((prev) =>
        prev.map((m) => (m.id === deletedMsg.id ? { ...m, isDeleted: true } : m)),
      );
    }

    // ─── handleMessageEdited ──────────────────────────────────────────────────
    // Mesaj redaktə ediləndə — həm mesajın contentini, həm reply reference-ı yenilə
    function handleMessageEdited(editedMsg) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === editedMsg.id) {
            // Özünü yenilə
            return { ...m, content: editedMsg.content, isEdited: true, editedAtUtc: editedMsg.editedAtUtc };
          }
          // Bu mesajın reply-ı varsa (başqasının cavabıdır) — reply text-ini yenilə
          if (m.replyToMessageId === editedMsg.id) {
            return { ...m, replyToContent: editedMsg.content };
          }
          return m;
        }),
      );
    }

    // ─── handleReactionsUpdated ───────────────────────────────────────────────
    // Reaction əlavə/siliندə — o mesajın reactions array-ını yenilə
    // data: { messageId, reactions: [{ emoji, count, userFullNames }] }
    function handleReactionsUpdated(data) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m,
        ),
      );
    }

    // ─── handleMessagePinned ──────────────────────────────────────────────────
    // Mesaj pinlənəndə — pinnedMessages-ə əlavə et + mesajın isPinned-ini yenilə
    function handleMessagePinned(msgDto) {
      setPinnedMessages((prev) => {
        if (prev.some((m) => m.id === msgDto.id)) return prev; // Artıq var → skip
        // Əlavə et + DESC sırala (ən son pinlənmiş birinci görünsün)
        return [...prev, msgDto].sort(
          (a, b) => new Date(b.pinnedAtUtc) - new Date(a.pinnedAtUtc),
        );
      });
      // Messages state-də də isPinned-i yenilə (pin icon üçün)
      setMessages((prev) =>
        prev.map((m) => (m.id === msgDto.id ? { ...m, isPinned: true, pinnedAtUtc: msgDto.pinnedAtUtc } : m)),
      );
    }

    // ─── handleMessageUnpinned ────────────────────────────────────────────────
    // Mesaj pin-dən çıxarılanda — pinnedMessages-dən sil
    function handleMessageUnpinned(msgDto) {
      setPinnedMessages((prev) => {
        const next = prev.filter((m) => m.id !== msgDto.id); // Həmin mesajı çıxar
        // Pin index-i array uzunluğundan böyük olmasın
        setCurrentPinIndex((idx) => (idx >= next.length ? Math.max(0, next.length - 1) : idx));
        return next;
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgDto.id ? { ...m, isPinned: false, pinnedAtUtc: null } : m)),
      );
    }

    // ─── SignalR Bağlantısını Qur + Handler-ları Register Et ─────────────────
    // startConnection() → Promise qaytarır → .then() ilə uğurlu bağlantıda handler-lar qur
    // conn.on("EventName", handlerFunction) — .NET-də: hub.On<T>("EventName", handler) kimi
    startConnection()
      .then((c) => {
        conn = c; // cleanup üçün saxla
        // Hər event adı — server-dəki ChatHub-da public method/invoke adıdır
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

    // ─── Cleanup Function ─────────────────────────────────────────────────────
    // useEffect-in return etdiyi funksiya — komponent unmount olduqda çağırılır.
    // .NET-də: IDisposable.Dispose() kimi.
    // conn.off() — handler-ları sil. Əks halda memory leak + duplicate event-lər olar.
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
  }, [userId]); // [userId] — yalnız userId dəyişsə yenidən qur (re-login kimi)
}
