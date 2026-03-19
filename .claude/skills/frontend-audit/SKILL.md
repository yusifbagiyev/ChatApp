---
name: frontend-audit
description: >
  Comprehensive frontend code audit, design quality review, and performance optimization skill.
  Use this skill whenever the user asks to review, audit, analyze, or improve frontend code — 
  whether for design quality, performance, accessibility, UX, color harmony, memory leaks, 
  N+1 query detection, code optimization, or ensuring the output doesn't look AI-generated.
  Also trigger when the user mentions "frontend problems", "UI review", "design audit", 
  "code quality check", "performance issues", "memory leak", "optimize my frontend",
  "rənglərin uyğunluğu", "dizayn analizi", "kod optimizasiyası", "performans", or any 
  variation of reviewing/improving existing frontend code. This skill covers BOTH new code 
  creation with anti-AI-aesthetic principles AND auditing/fixing existing codebases.
  If the user uploads or references any .html, .jsx, .tsx, .vue, .css, .scss file and asks 
  for review, improvement, or analysis — use this skill immediately.
---

# Frontend Audit & Design Quality Skill

This skill performs deep, multi-dimensional analysis of frontend code. It catches real problems, proposes battle-tested fixes, and ensures every UI output feels human-crafted — never generic or AI-generated.

## When This Skill Activates

- User asks to audit, review, or improve frontend code
- User wants design/color/UX analysis of existing interfaces
- User asks to fix performance issues, memory leaks, or optimization problems
- User wants to ensure their UI doesn't look AI-generated
- User references existing frontend files and wants improvements
- User asks to redesign or modernize an existing interface

## Workflow

### Phase 1: Reconnaissance

Before writing a single line of analysis, gather intelligence:

1. **Read all source files** — every .html, .jsx, .tsx, .vue, .css, .scss, .js, .ts file in scope
2. **Map the component tree** — understand parent-child relationships, data flow, shared state
3. **Identify the tech stack** — React? Vue? Vanilla? What CSS approach? What build tool?
4. **Catalog all external dependencies** — CDN scripts, npm packages, Google Fonts, icon libraries
5. **Screenshot or mentally render** — understand what the user actually sees

### Phase 2: Multi-Dimensional Audit

Read `references/audit-checklist.md` for the complete checklist. Run every applicable check against the codebase. The audit covers seven domains:

1. **Design Authenticity** — Does it look human-designed or AI-generated?
2. **Color & Visual Harmony** — Are colors intentional, harmonious, and accessible?
3. **Typography & Spacing** — Are fonts distinctive? Is vertical rhythm maintained?
4. **UX & Interaction Flow** — Are transitions smooth? Is navigation intuitive?
5. **Code Quality & Optimization** — Is the code DRY, performant, well-structured?
6. **Performance & Memory** — Are there leaks, unnecessary re-renders, heavy payloads?
7. **Data Fetching & Queries** — N+1 problems, over-fetching, missing caching?

### Phase 3: Report Structure

For each finding, provide:

```
PROBLEM: [Concise description of the actual issue found]
LOCATION: [Exact file, line number, or component]
SEVERITY: Critical | High | Medium | Low
EVIDENCE: [The specific code or pattern that proves this is real]
FIX: [Concrete code change — not vague advice]
SAFE: [Confirm the fix doesn't break existing functionality and explain why]
```

Group findings by domain. Start with Critical/High severity. Always include before/after code.

### Phase 4: Implementation

When applying fixes:
- **Never modify code you haven't read first** — always `view` the file immediately before editing
- **One fix at a time** — apply, verify, then move to the next
- **Test mentally** — trace the fix through all code paths that touch the changed area
- **Preserve behavior** — the fix must not alter existing working functionality unless explicitly asked
- **Comment non-obvious changes** — explain WHY, not WHAT

## Anti-AI Aesthetic Principles

Read `references/anti-ai-design.md` for the full guide. The core principle: AI-generated UIs share recognizable patterns. This skill actively avoids them.

**Banned patterns (these scream "AI made this"):**
- Purple-to-blue gradients on white backgrounds
- Inter, Roboto, Arial as primary fonts
- Perfectly symmetrical card grids with identical border-radius
- Generic hero sections with centered text + gradient button
- Overly uniform spacing (everything 16px or 24px)
- Shadows that are all identical (`box-shadow: 0 4px 6px rgba(0,0,0,0.1)`)
- Color palettes that are too "safe" — 3 blues + gray + white
- Emoji or icon-heavy section headers
- Tailwind defaults without customization

**What human designers actually do:**
- Mix font weights unexpectedly (light heading + bold body sometimes)
- Use asymmetric layouts with intentional tension
- Choose ONE hero color and build around it with neutrals
- Add texture — noise, grain, subtle patterns, real photography
- Break the grid occasionally for visual interest
- Use whitespace dramatically — not uniformly
- Pick fonts with personality that match the brand
- Create hierarchy through size contrast, not just weight
- Add micro-interactions that feel earned, not decorative

## Performance Optimization Priorities

Read `references/performance-guide.md` for implementation details.

Priority order for performance fixes:
1. **Memory leaks** — Event listeners not cleaned up, intervals not cleared, subscriptions not unsubscribed, detached DOM nodes
2. **Unnecessary re-renders** — Missing React.memo, inline objects/functions in JSX, missing dependency arrays
3. **Bundle size** — Unused imports, heavy libraries for simple tasks, missing code splitting
4. **Network waterfall** — Sequential requests that could be parallel, missing prefetch, no caching strategy
5. **Layout thrashing** — Reading and writing DOM in loops, forced synchronous layouts
6. **Image optimization** — Missing lazy loading, no srcset, uncompressed assets
7. **CSS performance** — Expensive selectors, unnecessary repaints, missing will-change

## Color Harmony Analysis

When evaluating colors:
1. Extract all color values from the codebase (hex, rgb, hsl, CSS variables)
2. Map them on a color wheel — check for intentional harmony (complementary, analogous, triadic, split-complementary)
3. Check contrast ratios against WCAG AA (4.5:1 for normal text, 3:1 for large text)
4. Verify dark/light mode consistency if applicable
5. Test for color blindness accessibility (deuteranopia, protanopia, tritanopia)
6. Ensure the palette has clear hierarchy: primary action color, secondary, neutral, danger/success/warning

## N+1 Query Detection

In frontend context, N+1 manifests as:
- Rendering a list where each item triggers its own API call
- useEffect inside mapped components that each fetch their own data
- GraphQL queries that resolve nested fields one-by-one
- WebSocket subscriptions created per-item instead of per-list

Fix pattern: Batch requests, use parent-level data fetching, implement DataLoader patterns, or restructure the API contract.

## Critical Safety Rules

These are non-negotiable:
- **NEVER apply a fix without reading the current file state** — files change between edits
- **NEVER assume a problem exists** — find the actual code, show it, prove it
- **NEVER suggest fixes that change visible behavior** unless the user explicitly asks for redesign
- **ALWAYS explain the blast radius** of each change — what else could be affected?
- **ALWAYS preserve existing event handlers, state management, and data flow**
- **If unsure whether a fix is safe, say so** — don't guess

## Reference Files

- `references/audit-checklist.md` — Complete 80+ point checklist for systematic auditing
- `references/anti-ai-design.md` — Detailed guide on creating human-looking designs
- `references/performance-guide.md` — Performance optimization patterns with code examples
