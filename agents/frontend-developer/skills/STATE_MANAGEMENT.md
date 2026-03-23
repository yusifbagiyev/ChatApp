# State Management

## Purpose
Design and maintain React state architecture using Context API and custom hooks.

## Serves Goals
- UI responsiveness
- Component quality

## Inputs
- Current state architecture in `src/context/` and `src/hooks/`
- Feature requirements needing new state
- `MEMORY.md` (state patterns that worked)

## Process
1. Identify what state the feature needs (local, shared, global)
2. Local state → `useState` in component
3. Shared state across siblings → lift to parent or custom hook
4. Global state → React Context (follow AuthContext/ToastContext pattern)
5. If state involves API data → custom hook with loading/error handling
6. If state involves SignalR → integrate with existing signalr.js
7. Ensure no prop drilling beyond 2 levels
8. Document state flow for complex features

## Outputs
- Context/hook files in codebase
- Journal entry with state architecture decisions

## Quality Bar
- No unnecessary re-renders (memoize where needed)
- Loading and error states handled
- Follows existing Context + hooks pattern
- State is colocated (as local as possible)
