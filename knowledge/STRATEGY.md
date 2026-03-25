# ChatApp Strategy

## Vision

Deliver a production-ready Bitrix24-style corporate messaging platform for mid-size companies (300-500 employees). Initial deployment to select corporate clients, with potential for commercial SaaS offering upon proven success.

## Current Priorities (ranked)

1. **MVP Completion by March 31, 2026** — All core features working end-to-end
2. **Demo Readiness by April 2026** — Stable, polished UI ready for client demonstration
3. **Bug Fixes & Polish** — Fix known issues before demo, ensure smooth UX
4. **Performance Optimization** — Fast load times, smooth scrolling, responsive UI for 300-500 concurrent users

## This Quarter's Goals (Q1 2026)

| Goal | Metric | Current | Target |
|------|--------|---------|--------|
| MVP Feature Completion | Features implemented (of core set) | ~80% | 100% |
| Bug-Free Core Flows | Critical bugs in DM/Channel/Files | TBD | 0 |
| Demo Readiness | Can demo full workflow without crashes | No | Yes |
| Frontend Migration | Steps completed (of 19) | 15/19 | 19/19 |

## MVP Scope (Must Have by March 31)

- Direct Messaging (complete)
- Channels with CRUD, members, messages (complete)
- File uploads & downloads (complete)
- Search across conversations (complete)
- Notifications UI
- Settings panel (theme, privacy, notification preferences)
- User profiles & basic management
- Sidebar navigation (Contacts, Channels, Settings panels)

## Not Doing Deliberately

- **Dark mode** — Deferred to post-MVP
- **Mobile optimization** — Desktop-first for corporate environment
- **Voice/Video calls** — Out of MVP scope
- **Message threading** — Simple reply/quote is sufficient for MVP
- **SaaS multi-tenancy** — Single-tenant deployment first
- **TypeScript migration** — JavaScript is sufficient for current stage
- **Virtual scrolling** — Proven to cause UI issues, using pagination instead
- **Advanced admin dashboard** — Basic user management only for MVP
