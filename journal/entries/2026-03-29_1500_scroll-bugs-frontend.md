# Frontend Task: 3 Critical Scroll Bugs

**From**: Product Owner
**To**: Frontend Developer
**Date**: 2026-03-29
**Priority**: P0 — User-visible bugs

---

## Bug 1: Others' file/image messages don't auto-scroll

### Root Cause

`useChatSignalR.js` lines 99-103:

```js
if (message.senderId === userId && showScrollDownRef?.current) {
  setShouldScrollBottom(true);
}
```

This ONLY triggers scroll for own messages. Others' messages never trigger scroll — even when user is at the bottom. The `Chat.jsx` fallback (lines 725-732) has a `gap < 80` threshold that works for text messages (~40px) but fails for file/image messages (200-400px height).

### Fix

Replace the condition to scroll for ANY new message when user is at bottom:

```js
// useChatSignalR.js — handleNewMessage, after message processing:

// Auto-scroll: user aşağıdadırsa, hər yeni mesajda scroll et
if (!showScrollDownRef?.current) {
  setShouldScrollBottom(true);
}
```

`showScrollDownRef.current === false` means user is near bottom (scroll-down button is not visible). This works for both own and others' messages, text and file.

> **Note:** The previous fix for own messages used this same ref. The logic was accidentally limited to `senderId === userId`. Remove that check.

---

## Bug 2: Others' text messages cause jump up then down

### Root Cause

Race condition between 3 simultaneous operations:

1. New message added to DOM → `scrollHeight` increases
2. `ChatStatusBar` re-memoizes → may change height (typing indicator appears/disappears)
3. `useLayoutEffect` (lines 725-732) gap calculation becomes unreliable

The `gap < 80` check runs after DOM mutation but ChatStatusBar height may still be changing. Result: scroll fires at wrong position → visual "jump up then down".

### Fix

Remove the `messages` dependency auto-scroll (lines 725-732) entirely. It's redundant if Bug 1 fix is applied — `setShouldScrollBottom(true)` in useChatSignalR already triggers the proper `useLayoutEffect` (lines 709-721) with `scrollToBottom()` + fallback.

```js
// Chat.jsx — DELETE or DISABLE lines 725-732:
// This useLayoutEffect is no longer needed because:
// 1. useChatSignalR now triggers setShouldScrollBottom for all messages (Bug 1 fix)
// 2. The shouldScrollBottom useLayoutEffect (lines 709-721) handles scroll correctly
// 3. This gap-based scroll causes race conditions with ChatStatusBar

// REMOVE:
// useLayoutEffect(() => {
//   const area = messagesAreaRef.current;
//   if (!area) return;
//   const gap = area.scrollHeight - area.scrollTop - area.clientHeight;
//   if (gap > 0 && gap < 80) {
//     area.scrollTop = area.scrollHeight;
//   }
// }, [messages]);
```

If this useLayoutEffect is needed for OTHER cases (e.g., message edit, delete), narrow it:

```js
useLayoutEffect(() => {
  const area = messagesAreaRef.current;
  if (!area || programmaticScrollRef.current) return;
  const gap = area.scrollHeight - area.scrollTop - area.clientHeight;
  if (gap > 0 && gap < 40) {
    area.scrollTop = area.scrollHeight;
  }
}, [messages]);
```

Key changes:
- Skip if `programmaticScrollRef.current` is true (already scrolling)
- Reduce threshold from 80 to 40 (only tiny gaps, not new messages)

---

## Bug 3: ChatStatusBar causes double scroll on conversation entry

### Root Cause

When conversation opens:
1. `setShouldScrollBottom(true)` → useLayoutEffect fires → `scrollToBottom()` (line 715)
2. ChatStatusBar renders with dynamic height (0px → 28-32px when "Viewed" content appears)
3. `setTimeout(scrollToBottom, 150)` fallback fires → scrolls again (line 717)
4. User sees: scroll → ChatStatusBar appears → scroll again

### Fix

Give ChatStatusBar a **fixed minimum height** so it doesn't cause layout shift:

```css
/* ChatStatusBar.css */
.chat-status-bar {
  min-height: 28px;  /* Reserve space even when empty */
  /* ... existing styles ... */
}
```

OR better — move ChatStatusBar OUTSIDE the scroll container so its height doesn't affect scrollHeight:

If ChatStatusBar is inside `.messages-area` (scroll container), moving it outside means its height changes won't affect scroll calculations. But this may require layout restructuring.

**Simpler approach — single smart scroll with requestAnimationFrame:**

```js
// Chat.jsx lines 709-721: Replace double scroll with single smart scroll
useLayoutEffect(() => {
  if (!shouldScrollBottom) return;
  setShouldScrollBottom(false);
  programmaticScrollRef.current = true;

  // Single scroll after all layout is complete
  scrollToBottom();
  requestAnimationFrame(() => {
    scrollToBottom();  // After paint — catches ChatStatusBar + lazy images
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 200);
  });
}, [shouldScrollBottom, scrollToBottom]);
```

Key change: Replace `setTimeout(scrollToBottom, 150)` with `requestAnimationFrame` — fires right after next paint (not arbitrary 150ms), catches ChatStatusBar height without visible double scroll.

---

## Test Scenarios

### Bug 1:
1. Open DM with another user
2. Stay at bottom of chat
3. Other user sends an image/file
4. **Expected:** Auto-scroll to show the new file message
5. **Verify:** Also works when other user sends text

### Bug 2:
1. Open DM, stay at bottom
2. Other user sends text message
3. **Expected:** Message appears smoothly, no jump
4. **Verify:** No visual "up then down" shift

### Bug 3:
1. Open a conversation where last messages have "Viewed" status
2. **Expected:** Single smooth scroll to bottom
3. **Verify:** No visible double-scroll or jitter

### Regression:
1. Scroll up in conversation, other user sends message
2. **Expected:** NO auto-scroll (user is reading history)
3. Scroll-down button should appear instead

---

## Reference: Previous Own-Message Scroll Fix

The own-message scroll jump was fixed by:
1. Preserving `createdAtUtc` from optimistic message (prevents timestamp-based re-sort)
2. Using `_optimistic: true` flag with 200ms delayed removal
3. Using `_stableKey` for React key stability

These patterns should be preserved — the new fix should NOT break own-message scroll behavior.
