# API Development

## Purpose
Implement new API endpoints and backend features following ChatApp's modular monolith architecture.

## Serves Goals
- API reliability
- Performance

## Inputs
- Product-owner requirement from `outputs/`
- Database-developer schema design from `outputs/`
- `knowledge/STRATEGY.md` (priorities)
- `MEMORY.md` (proven patterns, technical decisions)
- Existing module structure in ChatApp codebase

## Process
1. Read the feature requirement and acceptance criteria
2. Identify which module this belongs to (Channels, DirectMessages, Files, Identity, Notifications, Search, Settings)
3. If new module needed → flag for human decision
4. Design the CQRS commands and queries:
   - Command: `Create{Entity}Command`, `Update{Entity}Command`, `Delete{Entity}Command`
   - Query: `Get{Entity}Query`, `Get{Entity}ListQuery`
5. Create DTOs in Application layer
6. Create FluentValidation validators for each command/query
7. Implement handlers using repository + UnitOfWork
8. Create controller endpoints in Api layer
9. If real-time needed → create/update SignalR hub
10. Run existing tests to verify no regressions
11. Document API contract for frontend-developer

## Outputs
- Implementation in ChatApp codebase
- `outputs/YYYY-MM-DD_implementation_[feature].md` (API contract, endpoints, SignalR events)
- Journal entry with what was built

## Quality Bar
- Follows module structure: Domain → Application → Infrastructure → Api
- All commands/queries have FluentValidation
- No direct DB access from controllers (CQRS only)
- No cross-module direct references
- Error responses use `Result<T>` wrapper

## Tools
- .NET CLI (`dotnet build`, `dotnet test`)
- EF Core CLI (for migration verification)
