// ─── useChatScroll.js — Custom Hook: Infinite Scroll for Chat ────────────────
// Bu hook chat mesajları üçün "infinite scroll" (sonsuz scroll) məntiğini idarə edir.
//
// Problem: Chat-ı açanda yalnız son 30 mesaj yüklənir.
//   - Yuxarı scroll etdikdə → köhnə mesajlar yüklənir (load older)
//   - "Around" mesaja scroll etdikdə aşağı scroll edəndə → yeni mesajlar yüklənir (load newer)
//
// Mühüm anlayışlar:
//   - useRef vs useState fərqi: useRef render etmədən dərhal dəyişir (sinxron flag üçün ideal)
//   - requestAnimationFrame (RAF): scroll event-i çox sürətli işləyir, RAF ilə throttle edirik
//   - scrollRestoreRef: köhnə mesajlar yüklənəndə scroll pozisiyası qaçmasın

import { useState, useRef } from "react";
import { apiGet } from "../services/api";
import { getChatEndpoint, MESSAGE_PAGE_SIZE } from "../utils/chatUtils";

// ─── useChatScroll ────────────────────────────────────────────────────────────
// messagesAreaRef: scroll olan div-in DOM referansı
// messages: hal-hazırdakı mesajlar array-ı (ən yeni index 0-da, ən köhnə sonda)
// selectedChat: hansı chat açıqdır
// setMessages: messages state-ini yeniləmək üçün
export default function useChatScroll(messagesAreaRef, messages, selectedChat, setMessages) {

  // ─── useRef-lər ─────────────────────────────────────────────────────────────
  // useRef nədir? DOM referansı ya da "mutable container" üçün.
  // useState-dən fərqi: dəyişdikdə component re-render ETMEZ.
  // Bu flag-lar üçün idealdır — "yükləmə gedir/getmir?" yoxlamaq lazımdır.

  // loadingMoreRef: hal-hazırda köhnə/yeni mesajlar yüklənirmi? (race condition önləmək üçün)
  const loadingMoreRef = useRef(false);

  // hasMoreRef: yuxarıda daha köhnə mesaj varmı? false → daha yükləmə
  const hasMoreRef = useRef(true);

  // hasMoreDownRef: aşağıda daha yeni mesaj varmı? (around scroll zamanı)
  const hasMoreDownRef = useRef(false);

  // scrollRestoreRef: köhnə mesajlar yüklənəndə scroll pozisiyasını saxla
  // useLayoutEffect-də restore edilir — "sıçrama" olmasın
  const scrollRestoreRef = useRef(null);

  // scrollRafRef: requestAnimationFrame ID-si — throttling üçün
  const scrollRafRef = useRef(null);

  // loadingOlder: "köhnə mesajlar yüklənir" spinner-i göstərmək üçün (UI state)
  // Bu useState-dir — UI-ya təsir edir
  const [loadingOlder, setLoadingOlder] = useState(false);

  // ─── handleScrollUp ──────────────────────────────────────────────────────────
  // İstifadəçi yuxarı scroll edəndə → köhnə mesajları yüklə
  // "Cursor-based pagination" — ən köhnə mesajın tarixi "before" cursor kimi istifadə olunur
  async function handleScrollUp() {
    const area = messagesAreaRef.current; // DOM elementini al
    if (!area) return;                    // DOM hələ mount olmayıbsa → çıx

    // Guard clause-lar: şərtlər ödənmədikdə dərhal çıx
    if (loadingMoreRef.current) return;   // Artıq yükləmə gedir → bir daha yükləmə
    if (!hasMoreRef.current) return;      // Daha köhnə mesaj yoxdur → yükləmə
    if (!selectedChat) return;            // Chat seçilməyib → yükləmə

    // Threshold: scroll-un yuxarıdan yarım viewport-dan az olması lazımdır
    // clientHeight = görünən hissənin hündürlüyü (məsələn 600px)
    // scrollTop = yuxarıdan nə qədər aşağı scroll edilib (0 = ən yuxarı)
    const threshold = area.clientHeight / 2;
    if (area.scrollTop > threshold) return; // Hələ yuxarıya çatmayıb → yükləmə

    // Ən köhnə mesaj — array-ın sonundakı element (desc order: index 0 = ən yeni)
    const oldestMsg = messages[messages.length - 1];
    if (!oldestMsg) return;

    // Bu mesajın tarixi — cursor kimi istifadə edilir
    const beforeDate = oldestMsg.createdAtUtc || oldestMsg.sentAt;
    if (!beforeDate) return;

    // API endpoint: ?before=2026-02-15T12:00:00Z&pageSize=30
    // Server bu tarixdən əvvəlki 30 mesajı qaytarır
    const base = getChatEndpoint(selectedChat.id, selectedChat.type, "/messages");
    if (!base) return;
    const endpoint = `${base}?pageSize=${MESSAGE_PAGE_SIZE}&before=${encodeURIComponent(beforeDate)}`;

    // Yükləmə başlayır
    loadingMoreRef.current = true;  // Race condition flag (re-render etmez)
    setLoadingOlder(true);           // Spinner göstər (re-render edir)

    try {
      const olderMessages = await apiGet(endpoint);

      // Backend boş array qaytardı → daha köhnə mesaj yoxdur
      if (!olderMessages || olderMessages.length === 0) {
        hasMoreRef.current = false; // Bir daha yuxarı scroll edəndə sorğu göndərmə
        return;
      }

      // Scroll pozisiyasını yadda saxla (yeni mesajlar render olunmadan əvvəl)
      // scrollHeight: div-in ümumi hündürlüyü (görünən + gizli)
      // scrollTop: yuxarıdan nə qədər aşağı scroll edilib
      scrollRestoreRef.current = {
        scrollHeight: area.scrollHeight,
        scrollTop: area.scrollTop,
      };

      // Köhnə mesajları messages array-ının SONUNA əlavə et
      // (Yeni mesajlar yuxarıda, köhnə mesajlar aşağıda — desc order)
      // Deduplication: around mode-da overlap ola bilər, eyni id-li mesajları əlavə etmə
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const unique = olderMessages.filter((m) => !existingIds.has(m.id));
        if (unique.length === 0) {
          hasMoreRef.current = false; // Hamısı dublikatdır → daha köhnə yoxdur
          return prev;
        }
        return [...prev, ...unique];
      });

      // useLayoutEffect (Chat.jsx-də) bu dəyişikliyi görüb scroll-u restore edəcək
    } catch (err) {
      console.error("Failed to load older messages:", err);
      // "Session expired" → session bitib, daha API call etmə
      // Bu, 401 infinite retry loop-un qarşısını alır:
      //   scroll → 401 → refresh fail → throw → catch buraya düşür → hasMore=false → loop bitdi
      if (err.message === "Session expired") {
        hasMoreRef.current = false;
      }
    } finally {
      // Hər halda — yükləmə bitdi
      loadingMoreRef.current = false;
      setLoadingOlder(false); // Spinner gizlə
    }
  }

  // ─── handleScrollDown ────────────────────────────────────────────────────────
  // İstifadəçi aşağı scroll edəndə → daha yeni mesajları yüklə
  // Bu yalnız "around" scroll zamanı lazımdır (köhnə mesaja jump etdikdə)
  async function handleScrollDown() {
    const area = messagesAreaRef.current;
    if (!area) return;
    if (loadingMoreRef.current) return;
    if (!hasMoreDownRef.current) return; // Normal chat-da false — yalnız around modunda true
    if (!selectedChat) return;

    // Aşağıya 1 viewport məsafəyə yaxınlaşdıqda yüklə
    const threshold = area.clientHeight;
    // scrollHeight - scrollTop - clientHeight = dibin qalanmış məsafəsi
    const distanceFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
    if (distanceFromBottom > threshold) return; // Hələ kifayət qədər aşağı deyil

    // messages array-ın index 0-dakı element — ən yeni mesaj
    const newestMsg = messages[0];
    if (!newestMsg) return;

    const afterDate = newestMsg.createdAtUtc || newestMsg.sentAt;
    if (!afterDate) return;

    // API endpoint: /messages/after?date=...&limit=30
    const base = getChatEndpoint(selectedChat.id, selectedChat.type, "/messages/after");
    if (!base) return;
    const endpoint = `${base}?date=${encodeURIComponent(afterDate)}&limit=${MESSAGE_PAGE_SIZE}`;

    loadingMoreRef.current = true;

    try {
      const newerMessages = await apiGet(endpoint);

      if (!newerMessages || newerMessages.length === 0) {
        hasMoreDownRef.current = false; // Daha yeni mesaj yoxdur
        return;
      }

      // .reverse() — server ən köhnəni birinci qaytarır, biz ən yenini birinci istəyirik
      // Deduplication: around mode-da overlap ola bilər, eyni id-li mesajları əlavə etmə
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const unique = newerMessages.filter((m) => !existingIds.has(m.id));
        if (unique.length === 0) {
          hasMoreDownRef.current = false; // Hamısı dublikatdır → daha yeni yoxdur
          return prev;
        }
        return [...unique.reverse(), ...prev];
      });
    } catch (err) {
      console.error("Failed to load newer messages:", err);
      // "Session expired" → daha aşağıya yükləmə cəhd etmə
      if (err.message === "Session expired") {
        hasMoreDownRef.current = false;
      }
    } finally {
      loadingMoreRef.current = false;
    }
  }

  // ─── handleScroll ─────────────────────────────────────────────────────────────
  // Hər scroll event-i üçün çağırılan throttled funksiya.
  // requestAnimationFrame (RAF): bir frame-dən çox çağırılmaz (~16ms-də bir = 60fps)
  // Scroll event-i saniyədə 100+ dəfə ata bilər — RAF ilə yalnız 60 dəfəyə endiririk
  function handleScroll() {
    // Artıq RAF gözlənilirsə → skip et (throttle effekti)
    if (scrollRafRef.current) return;

    // requestAnimationFrame: növbəti "çerçivə" (frame) render edilməmişdən əvvəl işlə
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null; // Sıfırla — növbəti scroll event-i üçün hazır ol
      handleScrollUp();            // Yuxarı scroll yoxla
      handleScrollDown();          // Aşağı scroll yoxla
    });
  }

  // ─── Return ───────────────────────────────────────────────────────────────────
  // Bu hook-dan lazım olan hər şeyi return et.
  // Chat.jsx bunları alıb istifadə edir:
  //   - handleScroll: messages-area-nın onScroll prop-una verilir
  //   - hasMoreRef, hasMoreDownRef: handleSelectChat-da sıfırlanır
  //   - loadingOlder: "yüklənir" spinner-i göstərmək üçün
  //   - scrollRestoreRef: useLayoutEffect-də scroll bərpası üçün
  return { handleScroll, hasMoreRef, hasMoreDownRef, loadingOlder, scrollRestoreRef };
}
