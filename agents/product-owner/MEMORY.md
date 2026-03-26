# Product Owner Memory

> This file is private to the product-owner agent. Updated after reviews with confirmed patterns.

## What Works
- Steps 14 (Channels), 15 (Files), 17 (Search) were completed ahead of schedule
- Bug-fix-then-feature pattern: user fixes bugs as they arise, then moves to next feature
- Direct messaging approach: user prefers "just fix it" over discussion

## What Doesn't Work
- Virtual scrolling — caused UI problems, banned from project (use pagination instead)
- Overcomplicated plans — user wants action, not planning sessions
- tasks/lessons.md — deprecated, lessons now live in agent-specific files
- **Relying on `git status` alone** — committed work is invisible there. ALWAYS check `git log` too

## Patterns Noticed
- User works on 2 PCs — progress must always be trackable via git/todo.md
- User is learning React — frontend code is written by user, agent explains concepts
- Bug fixes and existing code changes — agent does directly
- User communicates in Azerbaijani but all docs must be in English
- **Backend Developer commits work independently** — PO must check `git log` not just `git status`

## User / Stakeholder Signals
- Hard deadline for MVP (flexible, user said "don't worry about deadline")
- Demo planned for April 2026 to corporate clients
- Sole developer/orchestrator, agents are the team
- Target: 300-500 employee corporate companies, business/sales sector

## Process Improvements
- Keep tasks/todo.md updated after every session — it syncs across 2 PCs via GitHub
- Mark steps complete based on actual code analysis, not assumptions
- **ALWAYS run `git log --oneline -10` + `git status` together when reviewing agent work**
- **After reviewing, update todo.md to reflect actual completed state**
- **When assigning tasks, be specific about which journal entry to read**

## Mistakes Made
- 2026-03-25: Reported migration as "not done" when it was already committed. Caused: only checked `git status`, missed `git log`. Fix: always check both.

## Last Updated
- 2026-03-26
