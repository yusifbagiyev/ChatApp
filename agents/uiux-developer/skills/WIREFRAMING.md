# Wireframing

## Purpose
Create detailed wireframes and component specs for new features.

## Serves Goals
- Design consistency
- Design handoff quality

## Inputs
- Product-owner requirements from `outputs/`
- User research findings from `outputs/`
- `knowledge/BRAND.md` (visual style)
- `knowledge/AUDIENCE.md` (user context)
- `MEMORY.md` (proven layout patterns)
- Existing UI patterns in ChatApp

## Process
1. Read feature requirement and user research
2. Review existing ChatApp UI patterns for consistency
3. Define page/component layout (text-based wireframe)
4. Specify component hierarchy and relationships
5. Define content for each element (labels, placeholders, help text)
6. Specify responsive behavior (desktop → tablet → mobile)
7. List all component states: default, hover, active, disabled, loading, error, empty
8. Note accessibility requirements (ARIA labels, keyboard nav, contrast)
9. Write handoff notes for frontend-developer

## Outputs
- `outputs/YYYY-MM-DD_wireframe_[feature].md`
- Journal entry with design summary

## Quality Bar
- Every component has all interaction states defined
- Responsive behavior specified
- Consistent with existing ChatApp UI patterns
- Accessibility notes included
- Clear enough for frontend-developer to implement without questions
