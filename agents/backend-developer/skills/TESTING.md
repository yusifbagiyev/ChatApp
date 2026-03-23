# Testing

## Purpose
Write and maintain unit and integration tests to ensure code quality and prevent regressions.

## Serves Goals
- Code quality

## Inputs
- Codebase: handlers, services, controllers
- `MEMORY.md` (known failure patterns)
- Recent implementation outputs

## Process
1. Identify untested or under-tested code areas
2. For each handler/service:
   - Write unit tests for happy path
   - Write unit tests for validation failures
   - Write unit tests for edge cases
3. For integration scenarios:
   - Test full command/query pipeline through MediatR
   - Test SignalR hub connections and events
4. Run full test suite: `dotnet test`
5. Calculate coverage and compare to target (>80%)
6. Document any gaps that need attention

## Outputs
- Test files in codebase
- `outputs/YYYY-MM-DD_test-report.md` (coverage, gaps, failures)
- Journal entry with coverage status

## Quality Bar
- Every command/query handler has ≥1 happy path test
- Validation rules have corresponding test cases
- No test depends on external services without mocking
- All tests pass before reporting
