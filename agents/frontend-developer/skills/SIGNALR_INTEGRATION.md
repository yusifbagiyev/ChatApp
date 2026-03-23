# SignalR Integration

## Purpose
Integrate frontend with SignalR hubs for real-time messaging, notifications, and presence.

## Serves Goals
- Real-time reliability

## Inputs
- Backend developer SignalR event contract from `outputs/`
- Existing SignalR setup in `src/services/signalr.js`
- Existing hooks: `useChatSignalR`
- `MEMORY.md` (reconnection patterns)

## Process
1. Read SignalR event contract from backend-developer
2. Add new event handlers in `signalr.js` service
3. Create or update custom hook for the feature
4. Handle connection states: connecting, connected, reconnecting, disconnected
5. Implement reconnection logic with backoff
6. Update UI to reflect real-time state changes
7. Test with simulated connection drops

## Outputs
- Updated signalr.js and hooks in codebase
- Journal entry with integration notes

## Quality Bar
- All events from contract are handled
- Reconnection works automatically
- UI reflects connection state to user
- No direct SignalR usage outside signalr.js service
