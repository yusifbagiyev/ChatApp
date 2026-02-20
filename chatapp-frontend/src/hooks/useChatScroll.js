import { useState, useRef } from "react";
import { apiGet } from "../services/api";
import { getChatEndpoint, MESSAGE_PAGE_SIZE } from "../utils/chatUtils";

/**
 * Infinite scroll hook for chat messages area.
 * Handles loading older (scroll up) and newer (scroll down) messages.
 * Uses RAF-throttled scroll handler for performance.
 */
export default function useChatScroll(messagesAreaRef, messages, selectedChat, setMessages) {
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const hasMoreDownRef = useRef(false);
  const scrollRestoreRef = useRef(null);
  const scrollRafRef = useRef(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  async function handleScrollUp() {
    const area = messagesAreaRef.current;
    if (!area) return;
    if (loadingMoreRef.current) return;
    if (!hasMoreRef.current) return;
    if (!selectedChat) return;

    // Yarim viewport hundurluyu threshold
    const threshold = area.clientHeight / 2;
    if (area.scrollTop > threshold) return;

    const oldestMsg = messages[messages.length - 1];
    if (!oldestMsg) return;

    const beforeDate = oldestMsg.createdAtUtc || oldestMsg.sentAt;
    if (!beforeDate) return;

    const base = getChatEndpoint(selectedChat.id, selectedChat.type, "/messages");
    if (!base) return;
    const endpoint = `${base}?pageSize=${MESSAGE_PAGE_SIZE}&before=${encodeURIComponent(beforeDate)}`;

    loadingMoreRef.current = true;
    setLoadingOlder(true);

    try {
      const olderMessages = await apiGet(endpoint);

      if (!olderMessages || olderMessages.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      // Save scroll position — useLayoutEffect restore edecek
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

    // Asagiya yaxinlasanda yukle (1 viewport threshold)
    const threshold = area.clientHeight;
    const distanceFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
    if (distanceFromBottom > threshold) return;

    // messages array-da en yeni mesaj — index 0 (desc siralama)
    const newestMsg = messages[0];
    if (!newestMsg) return;

    const afterDate = newestMsg.createdAtUtc || newestMsg.sentAt;
    if (!afterDate) return;

    const base = getChatEndpoint(selectedChat.id, selectedChat.type, "/messages/after");
    if (!base) return;
    const endpoint = `${base}?date=${encodeURIComponent(afterDate)}&limit=${MESSAGE_PAGE_SIZE}`;

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

  return { handleScroll, hasMoreRef, hasMoreDownRef, loadingOlder, scrollRestoreRef };
}
