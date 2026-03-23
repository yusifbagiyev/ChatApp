# Code Review

## Purpose
Review code for architecture compliance, quality, and consistency with ChatApp patterns.

## Serves Goals
- Code quality
- Module consistency

## Inputs
- Code changes (new files, modified files)
- ChatApp architecture patterns
- `MEMORY.md` (past review findings)

## Process
1. Check module boundary compliance (no cross-module references)
2. Verify CQRS pattern adherence (commands/queries through MediatR)
3. Check FluentValidation exists for all commands/queries
4. Verify Repository + UnitOfWork usage (no direct DbContext in handlers)
5. Check error handling uses `Result<T>` pattern
6. Review naming conventions (consistent with existing code)
7. Check for security issues (SQL injection, auth bypass, JWT exposure)
8. Verify no business logic in controllers
9. Document findings and recommendations

## Outputs
- `outputs/YYYY-MM-DD_code-review.md` (findings, recommendations)
- Journal entry with review summary

## Quality Bar
- Every finding has severity (Critical / Warning / Suggestion)
- Critical issues block approval
- Recommendations reference existing codebase patterns
