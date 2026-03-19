// ─── useChannelManagement.js — Custom Hook: Channel Yaratma/Redaktə + Üzv İdarəsi ─
// Bu hook channel paneli və add member paneli ilə bağlı state-ləri,
// üzv idarəsi funksiyalarını və debounced search effektini idarə edir.
// handleOpenCreateChannel, handleEditChannel, handleChannelCreated, handleChannelUpdated
// Chat.jsx-də qalır — çoxlu cross-cutting dependency var.

import { useState, useRef, useEffect, useMemo } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";

// ─── useChannelManagement ────────────────────────────────────────────────────
// selectedChat: hansı chat açıqdır
// conversations: bütün söhbət siyahısı (addMemberUsers memo üçün)
// channelMembers: channel üzvlərinin lookup map-i
// setChannelMembers: channel üzvlərini yeniləmək üçün
// showMembersPanel: members paneli açıqdırsa refreshChannelMembers paneli də yeniləyir
// loadMembersPanelPage: useSidebarPanels-dən gələn paginated yükləmə funksiyası
export default function useChannelManagement(selectedChat, conversations, channelMembers, setChannelMembers, showMembersPanel, loadMembersPanelPage) {

  // ─── Channel yaratma/redaktə state-ləri ────────────────────────────────────
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [editChannelData, setEditChannelData] = useState(null);

  // ─── Add member state-ləri ─────────────────────────────────────────────────
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [addMemberSearchActive, setAddMemberSearchActive] = useState(false);
  const [addMemberSelected, setAddMemberSelected] = useState(new Set());
  const [addMemberInviting, setAddMemberInviting] = useState(false);
  const [addMemberSearchResults, setAddMemberSearchResults] = useState([]);
  const [addMemberShowHistory, setAddMemberShowHistory] = useState(true);

  // ─── Error feedback state — istifadəçiyə xəta göstərmək üçün ─────────────
  const [inviteError, setInviteError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // ─── Ref ───────────────────────────────────────────────────────────────────
  const addMemberRef = useRef(null);

  // ─── refreshChannelMembers ─────────────────────────────────────────────────
  // Channel members cache-ini yenilə + members paneli açıqdırsa onu da yenilə
  async function refreshChannelMembers(channelId) {
    try {
      const members = await apiGet(`/api/channels/${channelId}/members?take=100`);
      // Tam member obj saxla — handleInviteMembers ilə eyni format
      setChannelMembers((prev) => ({
        ...prev,
        [channelId]: members.reduce((map, m) => ({ ...map, [m.userId]: m }), {}),
      }));
      // Members paneli açıqdırsa — paneli də yenilə
      if (showMembersPanel) {
        loadMembersPanelPage(channelId, 0, true);
      }
    } catch (err) {
      console.error("Failed to refresh channel members:", err);
    }
  }

  // ─── handleMakeAdmin ───────────────────────────────────────────────────────
  async function handleMakeAdmin(targetUserId) {
    setActionError(null);
    try {
      await apiPut(`/api/channels/${selectedChat.id}/members/${targetUserId}/role`, { newRole: 2 });
      await refreshChannelMembers(selectedChat.id);
    } catch {
      setActionError("Admin etmək mümkün olmadı");
    }
  }

  // ─── handleRemoveAdmin ─────────────────────────────────────────────────────
  async function handleRemoveAdmin(targetUserId) {
    setActionError(null);
    try {
      await apiPut(`/api/channels/${selectedChat.id}/members/${targetUserId}/role`, { newRole: 1 });
      await refreshChannelMembers(selectedChat.id);
    } catch {
      setActionError("Admin statusunu silmək mümkün olmadı");
    }
  }

  // ─── handleRemoveFromChat ──────────────────────────────────────────────────
  async function handleRemoveFromChat(targetUserId) {
    setActionError(null);
    try {
      await apiDelete(`/api/channels/${selectedChat.id}/members/${targetUserId}`);
      await refreshChannelMembers(selectedChat.id);
    } catch {
      setActionError("Üzvü silmək mümkün olmadı");
    }
  }

  // ─── handleInviteMembers ───────────────────────────────────────────────────
  // Promise.all ilə paralel invite — 10 user üçün 10 ardıcıl request əvəzinə 1 batch
  async function handleInviteMembers() {
    if (addMemberSelected.size === 0 || !selectedChat) return;
    setAddMemberInviting(true);
    try {
      const results = await Promise.allSettled(
        [...addMemberSelected].map((userId) =>
          apiPost(`/api/channels/${selectedChat.id}/members`, {
            userId,
            showChatHistory: addMemberShowHistory,
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        setInviteError(`${failed.length} üzvü dəvət etmək mümkün olmadı`);
      }

      await refreshChannelMembers(selectedChat.id);
      setShowAddMember(false);
      setAddMemberSearch("");
      setAddMemberSearchActive(false);
      setAddMemberSelected(new Set());
      setAddMemberShowHistory(true);
    } catch {
      setInviteError("Üzvləri dəvət edərkən xəta baş verdi");
    } finally {
      setAddMemberInviting(false);
    }
  }

  // ─── Add member panel açılanda channel members yenilə ─────────────────────
  useEffect(() => {
    if (!showAddMember || !selectedChat || selectedChat.type !== 1) return;
    let cancelled = false;
    (async () => {
      try {
        const members = await apiGet(`/api/channels/${selectedChat.id}/members?take=100`);
        if (cancelled) return;
        setChannelMembers((prev) => ({
          ...prev,
          [selectedChat.id]: members.reduce((map, m) => ({ ...map, [m.userId]: m }), {}),
        }));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddMember]);

  // ─── Add member debounced backend search ───────────────────────────────────
  useEffect(() => {
    const query = addMemberSearch.trim();
    if (query.length < 2) {
      setAddMemberSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await apiGet(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (cancelled) return;
        setAddMemberSearchResults(data || []);
      } catch {
        if (!cancelled) setAddMemberSearchResults([]);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [addMemberSearch]);

  // ─── addMemberUsers memo ───────────────────────────────────────────────────
  // DM conversations-dan artıq channel üzvü olmayanları göstər
  const addMemberUsers = useMemo(() => {
    if (!showAddMember || !selectedChat) return [];
    const existingIds = channelMembers[selectedChat.id]
      ? new Set(Object.keys(channelMembers[selectedChat.id]))
      : new Set();
    return conversations
      .filter((c) => c.type === 0 && !c.isNotes && c.otherUserId && !existingIds.has(c.otherUserId))
      .map((c) => ({
        id: c.otherUserId,
        fullName: c.name,
        avatarUrl: c.avatarUrl,
        position: c.otherUserPosition || "User",
      }));
  }, [showAddMember, selectedChat, conversations, channelMembers]);

  // ─── resetChannelState — handleSelectChat-da çağırılır ─────────────────────
  function resetChannelState() {
    setShowAddMember(false);
    setAddMemberSearch("");
    setAddMemberSearchActive(false);
    setAddMemberSelected(new Set());
    setInviteError(null);
    setActionError(null);
  }

  return {
    // Channel create/edit
    showCreateChannel, setShowCreateChannel,
    editChannelData, setEditChannelData,
    // Add member
    showAddMember, setShowAddMember,
    addMemberSearch, setAddMemberSearch,
    addMemberSearchActive, setAddMemberSearchActive,
    addMemberSelected, setAddMemberSelected,
    addMemberInviting, addMemberShowHistory, setAddMemberShowHistory,
    addMemberSearchResults, addMemberUsers,
    addMemberRef,
    // Error feedback
    inviteError, setInviteError,
    actionError, setActionError,
    // Functions
    refreshChannelMembers,
    handleMakeAdmin, handleRemoveAdmin, handleRemoveFromChat,
    handleInviteMembers,
    resetChannelState,
  };
}
