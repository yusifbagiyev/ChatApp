# Journal Entry

- **Date**: 2026-04-01 16:00
- **Source**: devops-security
- **Tags**: frontend, bug, security, handoff

## What Happened

- During production testing from a foreign country (Cloudflare Managed Challenge verified successfully), after login → logout, the browser console shows:
  - `GET /api/users/me` → 401 (Unauthorized)
  - `POST /api/auth/refresh` → 400 (Bad Request)
- These errors occur because the frontend continues making API calls after logout clears the token.
- Additionally, staying on the login page after logout triggers:
  - `GET /api/users/me` → 401
  - `POST /api/auth/refresh` → 400
  - `GET /api/auth/signalr-token` → 401
  - SignalR reconnect attempt fails: "Failed to complete negotiation with the server"
- This means frontend keeps polling/reconnecting even when user is unauthenticated.

## Why It Matters

- Console errors visible to end users are unprofessional and may confuse developers debugging real issues.
- The logout flow should cleanly stop all API calls and SignalR connections before clearing tokens.
- Unauthenticated SignalR reconnect attempts and API polling create unnecessary backend load.
- Every failed request is a wasted round-trip to the server.

## Action Items

- [ ] **@product-owner**: Prioritize this as a UX/quality bug
- [ ] **@frontend-developer**: Fix logout flow — stop SignalR connection, cancel pending API requests, then clear tokens
- [ ] **@frontend-developer**: Ensure login page does NOT attempt /api/users/me or SignalR connection when no token exists
- [ ] **@backend-developer**: Verify that 401/400 responses after logout don't trigger unnecessary audit logs

## Related

- Discovered during Cloudflare WAF testing (non-AZ country access)
- Production URL: https://ittech.az
