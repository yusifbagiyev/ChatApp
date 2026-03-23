# Interaction Design

## Purpose
Define detailed interaction patterns, animations, and user flows for features.

## Serves Goals
- Usability
- Design consistency

## Inputs
- Wireframes from `outputs/`
- `knowledge/BRAND.md` (tone, feel)
- `MEMORY.md` (proven interaction patterns)
- Existing ChatApp interaction patterns

## Process
1. Read wireframe for the feature
2. Define user flow: step-by-step actions and system responses
3. Specify micro-interactions (button feedback, loading indicators, transitions)
4. Define error handling UX (inline errors, toasts, modals)
5. Define real-time behavior (how does UI update when SignalR events arrive?)
6. Specify keyboard shortcuts if applicable
7. Define empty states (first-time use, no data)
8. Document edge cases (long text, special characters, concurrent users)

## Outputs
- `outputs/YYYY-MM-DD_interaction_[feature].md`
- Journal entry with interaction decisions

## Quality Bar
- User flow covers happy path + error path
- Real-time update behavior specified
- Empty states designed (not just "no data")
- Edge cases documented
- Consistent with existing ChatApp interactions
