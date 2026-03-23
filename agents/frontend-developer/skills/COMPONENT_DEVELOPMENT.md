# Component Development

## Purpose
Build React components that implement UX designs and integrate with backend APIs.

## Serves Goals
- Component quality
- UI responsiveness

## Inputs
- UX developer wireframes and interaction specs from `outputs/`
- Backend developer API contract from `outputs/`
- `knowledge/BRAND.md` (visual guidelines)
- `MEMORY.md` (proven component patterns)
- Existing components in `chatapp-frontend/src/components/`

## Process
1. Read UX spec for component behavior and all states
2. Read API contract for data shape and endpoints
3. Check if similar component exists (reuse/extend vs create new)
4. Create component in `src/components/`
5. Use `api.js` for all REST calls
6. Use existing context (AuthContext, ToastContext) for shared state
7. Create custom hook if component logic is reusable
8. Handle all states: loading, error, empty, default
9. Ensure responsive design (mobile + desktop)
10. Test component behavior

## Outputs
- Component files in codebase
- `outputs/YYYY-MM-DD_frontend_[feature].md` (component summary)
- Journal entry with implementation notes

## Quality Bar
- All interaction states from UX spec implemented
- Uses api.js service layer (no direct fetch)
- Responsive on mobile and desktop
- No hardcoded strings or API URLs
- Follows existing component patterns in the codebase
