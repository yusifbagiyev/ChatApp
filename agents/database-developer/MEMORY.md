# Database Developer Memory

> This file is private to the database-developer agent. Updated after weekly reviews with confirmed patterns.

## What Works
<!-- Proven schema patterns with evidence -->

### PostgreSQL `timestamptz` — Requires `DateTimeKind.Utc` (2026-03-24)
- PostgreSQL `timestamp with time zone` column maps to .NET `DateTime` in EF Core
- EF Core / Npgsql rejects `DateTime` with `Kind=Unspecified` at runtime
- Root cause: frontend date inputs (`YYYY-MM-DD`) → .NET parses as `Kind=Unspecified`
- **Rule**: Any `DateTime` value going into a `timestamptz` column MUST be `Kind=Utc` or `Kind=Local`
- **Fix location**: Command Handler (application layer), not in domain entity or DB migration
  ```csharp
  DateTime.SpecifyKind(value, DateTimeKind.Utc)
  ```
- All date-only fields from HTTP requests are affected: `DateOfBirth`, `HiringDate`, etc.

## What Doesn't Work
<!-- Anti-patterns to avoid with evidence -->

## Patterns Noticed
<!-- Emerging signals needing more data -->

## Schema Decisions
<!-- Why certain designs were chosen -->

## Performance Insights
<!-- Index strategies, query patterns that proved effective -->

## Process Improvements
<!-- How this agent's own workflow should improve -->

## Last Updated
-
