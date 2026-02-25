// ─── chatUtils.js — Pure Utility Functions ───────────────────────────────────
// Bu faylda heç bir React yoxdur — sadə JavaScript funksiyaları.
// .NET-də: static helper class kimi. Komponentlər bu funksiyaları import edib istifadə edir.

// ─── Constants ────────────────────────────────────────────────────────────────
// "export const" — bu sabitlər birbaşa import edilə bilər:
// import { MESSAGE_PAGE_SIZE } from "../utils/chatUtils"

export const MESSAGE_PAGE_SIZE = 30;          // Hər dəfə neçə mesaj yüklənir
export const CONVERSATION_PAGE_SIZE = 50;     // Conversation list-i neçəyə qədər yüklənir
export const HIGHLIGHT_DURATION_MS = 3000;   // Scroll-dan sonra mesajın 3 saniyə vurğulanması
export const TYPING_DEBOUNCE_MS = 2000;      // Yazmağı dayandırandan 2 saniyə sonra "yazır" biter
export const MESSAGE_MAX_LENGTH = 4000;      // Mesaj maksimum uzunluğu
export const BATCH_DELETE_THRESHOLD = 5;     // 5-dən çox mesaj → batch delete API istifadə et

// ─── getChatEndpoint ──────────────────────────────────────────────────────────
// Chat tipinə görə doğru API URL-i qaytar.
// type 0 = DM (Direct Message/Conversation), type 1 = Channel
export function getChatEndpoint(chatId, chatType, path = "") {
  if (chatType === 0) return `/api/conversations/${chatId}${path}`; // DM
  if (chatType === 1) return `/api/channels/${chatId}${path}`;      // Channel
  return null; // type 2 (DepartmentUser) — endpoint yoxdur
}

// ─── Avatar Color Palette ─────────────────────────────────────────────────────
// Avatar üçün istifadə olunan 12 rəng. Tailwind/CSS color palette-dən.
// getAvatarColor() bu array-dən hash ilə rəng seçir.
const avatarColors = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6d28d9", // purple
  "#db2777", // rose
  "#ea580c", // orange
  "#0891b2", // sky
];

// ─── getInitials ──────────────────────────────────────────────────────────────
// İstifadəçinin adından 2 hərf götürür. Avatar-da mətn kimi göstərilir.
// "Ali Hasanov" → "AH"
// "Ali" → "A"
// null/undefined → "?"
export function getInitials(name) {
  if (!name) return "?";                        // Ad yoxdur → sual işarəsi
  const parts = name.split(" ");                // "Ali Hasanov" → ["Ali", "Hasanov"]
  if (parts.length >= 2) {
    // parts[0][0] → "A" (Alinin ilk hərfi)
    // parts[1][0] → "H" (Hasanovun ilk hərfi)
    // .toUpperCase() → böyük hərfə çevir
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name[0].toUpperCase();                 // Yalnız 1 söz varsa → ilk hərfi qaytar
}

// ─── getAvatarColor ───────────────────────────────────────────────────────────
// İstifadəçi adından deterministik rəng hesablayır.
// Eyni ad hər zaman eyni rəngi qaytarır (hash-based).
// "Ali" → həmişə indigo, "Leyla" → həmişə pink kimi.
//
// Hash nədir? Bir string-i rəqəmə çevirmək üçün riyazi əməliyyat.
export function getAvatarColor(name) {
  if (!name) return avatarColors[0];            // Ad yoxdur → ilk rəng (indigo)
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    // charCodeAt(i): hərfin ASCII kodu (məsələn "A" = 65)
    // (hash << 5) - hash: hash * 31 — bu hash funksiyasında standart çarpan
    // Hər hərf hash-ə əlavə olunur
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Math.abs(hash): mənfi ola bilər, mütləq dəyər götür
  // % avatarColors.length: 0-11 arasında index əldə et
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ─── formatTime ──────────────────────────────────────────────────────────────
// Conversation list-dəki son mesajın vaxtını formatlaşdırır.
// Bu gün → "14:30", Dünən → "Yesterday", Bu həftə → "Mon", Köhnə → "Jan 5"
// .NET-də: DateTime.ToString("HH:mm") kimi amma daha "ağıllı"
export function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);             // string-dən Date obyekti
  const now = new Date();                        // İndiki vaxt
  // Günlər arasındakı fərq: millisaniyəni → günə çevir
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Bu gün → "14:30" formatı (Azərbaycan locale)
    return date.toLocaleTimeString("az-AZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffDays === 1) {
    return "Yesterday";                          // Dünən
  } else if (diffDays < 7) {
    // Bu həftə → qısa gün adı: "Mon", "Tue"...
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    // 7 gündən köhnə → "Jan 5" formatı
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

// ─── formatMessageTime ────────────────────────────────────────────────────────
// Mesaj bubble-ında görünən vaxt (sadəcə saat:dəqiqə).
// "2026-02-21T14:30:00Z" → "14:30"
export function formatMessageTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("az-AZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── getLastSeenText ──────────────────────────────────────────────────────────
// Chat header-da "Last seen X min ago" mətnini qaytarır.
// Fərqli vaxt intervalları üçün fərqli mətn.
export function getLastSeenText(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;                              // Millisaniyə fərqi
  const diffMins = Math.floor(diffMs / 60000);            // Dəqiqə fərqi
  const diffHours = Math.floor(diffMs / 3600000);         // Saat fərqi
  const diffDays = Math.floor(diffMs / 86400000);         // Gün fərqi

  if (diffMins < 1) return "Last seen just now";
  if (diffMins < 60) return `Last seen ${diffMins} min ago`;      // Template literal: ${variable}
  if (diffHours < 24) return `Last seen ${diffHours} hours ago`;  // .NET-də: $"Last seen {hours} hours ago"
  return `Last seen ${diffDays} days ago`;
}

// ─── groupMessagesByDate ──────────────────────────────────────────────────────
// Mesajları tarixə görə qruplaşdırır — aralarına date separator əlavə edir.
//
// Input: [msg1(today), msg2(today), msg3(yesterday)]
// Output: [
//   { type: "date", label: "Friday, February 21, 2026" },
//   { type: "message", data: msg3 },
//   { type: "date", label: "Saturday, February 22, 2026" },
//   { type: "message", data: msg1 },
//   { type: "message", data: msg2 },
// ]
//
// Chat.jsx bu array-i .map() ilə render edir:
//   type === "date" → <div class="date-separator">
//   type === "readLater" → <div class="read-later-separator">
//   type === "message" → <MessageBubble />
//
// readLaterMessageId (optional) — "sonra oxu" olaraq işarələnmiş mesajın id-si.
// Varsa, həmin mesajdan ƏVVƏL "Read later" separator əlavə olunur.
export function groupMessagesByDate(msgs, readLaterMessageId) {
  const groups = [];
  let currentDate = "";                          // Hal-hazırdakı tarix label-i

  for (const msg of msgs) {
    // createdAtUtc-dan tarix label-i əldə et: "Friday, February 21, 2026"
    const msgDate = new Date(msg.createdAtUtc).toLocaleDateString("en-US", {
      weekday: "long",   // "Friday"
      month: "long",     // "February"
      day: "numeric",    // "21"
    });

    // Yeni tarix başlayırsa — date separator əlavə et
    if (msgDate !== currentDate) {
      currentDate = msgDate;                     // Cari tarixi yenilə
      groups.push({ type: "date", label: msgDate }); // Separator əlavə et
    }

    // Read later separator — işarələnmiş mesajdan ƏVVƏL göstər
    if (readLaterMessageId && msg.id === readLaterMessageId) {
      groups.push({ type: "readLater" });
    }

    groups.push({ type: "message", data: msg }); // Mesajı əlavə et
  }
  return groups;
}
