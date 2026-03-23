# Query Optimization

## Purpose
Identify and fix slow queries to maintain database performance.

## Serves Goals
- Query performance

## Inputs
- Slow query reports
- Backend-developer performance findings from `journal/entries/`
- Existing EF Core queries in Infrastructure layer
- `MEMORY.md` (optimization patterns)

## Process
1. Identify slow queries (>500ms)
2. Analyze query execution plan
3. Check index coverage for WHERE, JOIN, ORDER BY clauses
4. Evaluate if query splitting (`SingleQuery` vs `SplitQuery`) is optimal
5. Check for N+1 query patterns in EF Core includes
6. Recommend index additions or query restructuring
7. Verify fix doesn't regress other queries
8. Document optimization with before/after metrics

## Outputs
- `outputs/YYYY-MM-DD_query-optimization.md` (findings, fixes, metrics)
- Journal entry with performance improvements

## Quality Bar
- Every optimization has before/after metrics
- No optimization introduces new N+1 patterns
- Index additions justified by query frequency
- Rollback plan for each change
