# UI/UX Developer — ChatApp Design Guide

> This document teaches the uiux-developer agent how to design for ChatApp. It covers the Bitrix24 design language, proven patterns, anti-AI design principles, and accessibility requirements.

## Design Identity: Bitrix24 Style

ChatApp follows **Bitrix24** design language, NOT WhatsApp/Telegram/Slack.

**Bitrix24 characteristics:**
- 3-column layout: Navigation sidebar (60px) + Conversation list (380px) + Chat panel (flex)
- Dense information display (more data per screen)
- Corporate/professional feel (not casual messaging)
- Inline dropdowns under inputs (not floating modals)
- Hierarchy-based member picker with department tree
- Sidebar panels that slide in from right

## Color System

```css
/* Primary */
--primary-color: #2fc6f6 (cyan/blue — main action color)
--selected-chat: #00ace3 (darker variant for selected state)

/* Messages */
--bubble-own: #e9fecb (light green — outgoing)
--bubble-other: #ffffff (white — incoming)

/* Neutrals (11-level scale) */
--gray-50 through --gray-900

/* Semantic */
--success-color: #10b981 (green)
--error-color: #ef4444 (red)
--warning-color: #f59e0b (yellow)
--info-color: #3b82f6 (blue)
```

**Color rules:**
- 60-30-10 rule: 60% neutrals, 30% #2fc6f6 accent areas, 10% semantic colors
- User avatars: hash-based deterministic color from name (same name = always same color)
- "Already a member" state: `opacity: 0.6`, yellow label `#e9a23b`

## Component Design Specs

### Message Bubble
- Own messages: right-aligned, `--bubble-own` background
- Other messages: left-aligned, `--bubble-other` background
- Avatar + name + timestamp + status indicator
- Image messages: max-height 400px, shimmer loading, fade-in on load
- File messages: file type icon + name + size + download button
- Reactions: inline row below message, emoji + count, highlight if user reacted
- Reply: quoted block above message content
- Forwarded: "Forwarded" label
- States: sending (opacity 0.7), sent, delivered (double check), read (blue double check), failed (red)

### Conversation List Item
- Avatar (40px) + Name + Last message preview + Time
- Unread badge: circular, `--primary-color` background, white text
- Mention badge: "@" indicator when user is mentioned
- Selected state: `--selected-chat` background
- Typing indicator: "typing..." replaces last message preview

### Sidebar Panels
- Slide in from right, 350px width
- Tabs: Files & Media, Links, Members, Favorites
- Files grid: 3x2 preview (max 6 items), avatar overlay on each item
- Member list: searchable, scrollable, role badges (Owner, Admin, Member)
- Close button top-right

### Dropdown Menus
- Position: viewport-aware (auto-flip if near edge)
- Bitrix24 rule: dropdowns appear UNDER the trigger element (position: absolute), not as centered modals
- Member picker: hierarchy tree with department expansion + search auto-expand

## Animation Standards

```css
/* Timing */
--transition-fast: 150ms ease    /* Hover, focus */
--transition-base: 200ms ease   /* Panel open/close */
--transition-slow: 300ms ease   /* Page transitions */

/* Standard animations */
dropdownIn: scale(0.92) → 1, translateY(-4px) → 0     /* Dropdown open */
chipIn: scale(0.8) → 1                                  /* Tag/chip add */
checkPop: scale(0.5) → 1                               /* Checkbox animation */
fadeSlide: translateY(-8px) → 0                          /* Settings body */
shimmer: gradient slide (image loading)                  /* Skeleton */
badgePop: scale(0) → 1.15 → 1                          /* Unread badge */
```

**Animation rules:**
- Only animate `transform` and `opacity` (GPU composited)
- Respect `prefers-reduced-motion`
- Button press: `transform: scale(0.97)` on `:active`
- Disabled: `opacity: 0.4; cursor: not-allowed; filter: grayscale(30%)`

## Anti-AI Design Rules

> ChatApp must look human-designed, not AI-generated. These patterns are BANNED:

| Banned Pattern | Why | Do Instead |
|---------------|-----|-----------|
| Purple-to-blue gradient hero | #1 AI fingerprint | Solid colors with intentional accent |
| Inter/Roboto/Poppins as primary font | Overused by AI | Use fonts with personality |
| Identical card grids (same shadow, padding) | AI uniformity | Vary card sizes, make one dominant |
| `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` everywhere | AI shadow monoculture | Vary shadow depth per elevation |
| Perfectly symmetrical layouts | Unnatural | Mix alignment, use asymmetric splits |
| Uniform 16px/24px spacing everywhere | Robotic | Use custom values, vary by section |

**Human design techniques:**
- Mix font weights unexpectedly
- Break the grid occasionally for visual interest
- Add texture — noise, grain, subtle patterns
- Use whitespace dramatically, not uniformly
- Create hierarchy through size contrast, not just weight

## Chat/Messaging UX Best Practices

### 1. Input Bar Always Visible
- Persistent at bottom of chat panel
- Never hidden behind scroll
- Show reply preview above input when replying
- File preview strip above input for pending uploads

### 2. Delivery Status Indicators
- Sending: clock icon or reduced opacity
- Sent: single checkmark
- Delivered: double checkmark (gray)
- Read: double checkmark (blue/colored)
- Failed: red exclamation with retry option

### 3. Typing Indicators
- Show "Name is typing..." with animated dots
- 2-second debounce (don't flash on/off)
- Multiple typers: "Name1, Name2 are typing..."
- Replace last message preview in conversation list

### 4. Message Grouping
- Group consecutive messages from same sender (no repeated avatar/name)
- Date separators between days ("Today", "Yesterday", "Monday, March 14")
- "New messages" divider when returning to unread conversation
- Time shown on each message, but name/avatar only on first in group

### 5. Scroll Behavior
- Auto-scroll to bottom on new message (only if already at bottom)
- Scroll position preserved when loading older messages (useLayoutEffect + flushSync)
- "Jump to bottom" floating button when scrolled up with unread count badge
- Infinite scroll up for message history (cursor-based pagination)

### 6. Empty States
- New conversation: friendly prompt to send first message
- No search results: helpful suggestions
- No members: invite prompt
- Empty channel: channel purpose/description display

### 7. Keyboard Navigation
- Enter to send (Shift+Enter for newline)
- Escape to close panels/modals
- Tab to navigate interactive elements
- Arrow keys in conversation list

## Accessibility Requirements (WCAG 2.1 AA)

1. **ARIA roles**: Message area uses `role="log"` with `aria-live="polite"`
2. **Color contrast**: All text 4.5:1 minimum, UI controls 3:1 minimum
3. **Focus management**: Move focus to new panel when opened, return when closed
4. **Screen reader**: Avatar alt text, button labels, status announcements
5. **Keyboard**: All features accessible without mouse
6. **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables animations

## Interaction State Checklist

**Every component spec must define ALL of these states:**

| State | Description |
|-------|-------------|
| Default | Normal resting state |
| Hover | Mouse over (desktop only) |
| Active/Pressed | Mouse down or tap |
| Focus | Keyboard focus (visible ring) |
| Disabled | Non-interactive, grayed out |
| Loading | Skeleton or spinner |
| Error | Red border/text, error message |
| Empty | No data, guidance text |
| Selected | Active/chosen item |
| Overflow | Long text truncation/wrap |

## Design Handoff Template

When handing off to frontend-developer, provide:

```markdown
## Component: [Name]

### Layout
- [Text wireframe or description]

### States
- Default: [description]
- Hover: [description]
- Loading: [skeleton/spinner]
- Error: [message, style]
- Empty: [guidance text]

### Responsive
- Desktop: [behavior]
- Tablet: [behavior]
- Mobile: [behavior]

### Interactions
- Click: [what happens]
- Keyboard: [shortcuts]
- Animation: [timing, easing]

### Accessibility
- ARIA role: [role]
- Screen reader: [announcement]
- Focus: [management]
```
