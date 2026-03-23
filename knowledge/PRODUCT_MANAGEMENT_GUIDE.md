# Product Owner — ChatApp Product Management Guide

> This document teaches the product-owner agent how to manage the ChatApp product professionally.

## Product Context

ChatApp is a real-time messaging platform for companies (Bitrix24 style). Current state:
- **Backend**: Complete and working (7 modules)
- **Frontend**: Active React migration from Blazor (Step 14 of 19)
- **Remaining features**: Channels CRUD, Notifications, Search, Settings, User management

## Requirement Writing Template

```markdown
# Feature: [Name]

## User Story
As a [persona], I want [action] so that [outcome].

## Acceptance Criteria (Given/When/Then)

### AC1: [Scenario name]
- **Given** [precondition]
- **When** [action]
- **Then** [expected result]

### AC2: [Scenario name]
- **Given** [precondition]
- **When** [action]
- **Then** [expected result]

## Data Requirements
- Entities needed: [list]
- New fields: [list]
- API endpoints: [list]

## UI Requirements
- Screen/component: [description]
- Interaction: [flow description]
- States: default, loading, error, empty

## Dependencies
- Requires: [other features/modules]
- Blocks: [features waiting on this]

## Agent Assignments
- database-developer: [schema work needed]
- backend-developer: [API work needed]
- uiux-developer: [design work needed]
- frontend-developer: [UI work needed]

## Size Estimate
- [ ] Small (1-2 days per agent)
- [ ] Medium (3-5 days per agent)
- [ ] Large (1-2 weeks per agent)
```

## Acceptance Criteria Best Practices

**Good criteria are:**
- **Testable** — can be verified as pass/fail
- **Specific** — no ambiguous language ("should", "might", "approximately")
- **Complete** — covers happy path, error path, edge cases
- **Independent** — each criterion can be verified alone

**Examples for ChatApp:**

```markdown
### AC: Send message in channel
- Given I am a member of #general channel
- When I type "Hello" and press Enter
- Then the message appears in the chat with "Sending..." status
- And within 2 seconds, status changes to "Sent" (single checkmark)
- And all online channel members see the message in real-time

### AC: Send message when offline
- Given I am in a conversation but have no internet
- When I type "Hello" and press Enter
- Then the message appears with "Failed" status (red indicator)
- And a "Retry" button appears next to the message

### AC: Maximum message length
- Given I am composing a message
- When I type more than 10,000 characters
- Then the input stops accepting characters
- And a character counter shows "10000/10000" in red
```

## Backlog Prioritization: RICE Framework

| Factor | Question | Score |
|--------|----------|-------|
| **R**each | How many users does this affect? | 1-10 |
| **I**mpact | How much does it improve experience? | 0.25 (minimal), 0.5 (low), 1 (medium), 2 (high), 3 (massive) |
| **C**onfidence | How sure are we about the estimates? | 50%-100% |
| **E**ffort | How many person-weeks? | 0.5-10 |

**RICE Score = (Reach × Impact × Confidence) / Effort**

**ChatApp priority stack (suggested):**
1. P0: Complete React migration (Steps 14-19) — users can't use the app without this
2. P1: Channel CRUD + member management — core feature gap
3. P1: Notifications — user engagement depends on this
4. P2: Search — power user feature
5. P2: User settings — preferences
6. P3: User management/profiles — admin feature

## Sprint Planning Process

### 1. Capacity Check
- Read agent journal entries for blockers and capacity
- Check: is any agent overloaded? blocked? waiting on another?
- Typical sprint: 1 week for this team size

### 2. Item Selection
- Pull from top of prioritized backlog
- Verify each item has:
  - [ ] Acceptance criteria (≥3 per item)
  - [ ] Assigned agent(s)
  - [ ] Dependencies resolved
  - [ ] Size estimate

### 3. Dependency Ordering
```
database-developer (schema) → backend-developer (API) → frontend-developer (UI)
                                                       ↑
uiux-developer (design) ──────────────────────────────┘
```
- Schema must be ready before backend can implement
- UX design can run parallel with schema work
- Frontend needs both API contract and UX design

### 4. Sprint Goal
One sentence that answers: "What can we show at the end of this sprint?"

**Examples:**
- "Users can create, join, and send messages in public channels"
- "Real-time notifications appear when users receive messages in other conversations"
- "Users can search across all messages and channels by keyword"

## Definition of Done

A feature is "Done" when:
- [ ] All acceptance criteria pass
- [ ] Backend tests written and passing
- [ ] Frontend implements all UX states (default, loading, error, empty)
- [ ] No console errors in browser
- [ ] Works on both desktop and mobile viewports
- [ ] Code reviewed by backend/frontend agent
- [ ] Journal entry written with implementation notes

## Vertical Slicing

**Never plan horizontal slices** (e.g., "build all database tables for 3 features").

**Always plan vertical slices** — a thin, end-to-end working feature:

```
WRONG (horizontal):
Sprint 1: Design all schemas → Sprint 2: Build all APIs → Sprint 3: Build all UIs

RIGHT (vertical):
Sprint 1: Channel creation (schema + API + UI, end-to-end)
Sprint 2: Channel messaging (schema + API + UI, end-to-end)
Sprint 3: Channel members (schema + API + UI, end-to-end)
```

Each sprint delivers something demoable and testable.

## Story Mapping

For larger features, break into User Activity → User Tasks → Stories:

```
Activity: Channel Messaging
├── Task: Create Channel
│   ├── Story: Create public channel (name, description)
│   ├── Story: Create private channel (invite-only)
│   └── Story: Set channel avatar
├── Task: Manage Members
│   ├── Story: Invite members from department tree
│   ├── Story: Remove member
│   └── Story: Change member role (Admin/Member)
├── Task: Send Messages
│   ├── Story: Text message
│   ├── Story: File attachment
│   ├── Story: Reply to message
│   └── Story: Mention @user
└── Task: Message Actions
    ├── Story: Edit message
    ├── Story: Delete message
    ├── Story: Pin message
    └── Story: React with emoji
```

## Weekly Review Checklist

1. **Gather**: Read all agent outputs and journal entries from the week
2. **Score**: Compare KPIs to targets (sprint completion %, features shipped, rework rate)
3. **Analyze**:
   - What shipped successfully? Why?
   - What didn't ship? What blocked it?
   - Any requirements that needed rework? Why was the spec unclear?
4. **Action**:
   - Update backlog priorities based on learnings
   - Remove/archive items no longer relevant
   - Add new items discovered during implementation
5. **Log**: Write weekly summary to `journal/entries/`

## Communication Rules

- Write requirements BEFORE agents start work (not during)
- If a requirement changes mid-sprint, log the change in journal with reason
- Every requirement must reference which AUDIENCE.md persona it serves
- Never create features that don't map to a KPI from AGENT.md
