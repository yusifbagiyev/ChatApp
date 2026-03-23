# Schema Design

## Purpose
Design database schemas for new features that maintain data integrity and query performance.

## Serves Goals
- Schema quality
- Data integrity

## Inputs
- Product-owner requirements from `outputs/`
- Existing module DbContexts and entity configurations
- `MEMORY.md` (proven schema patterns)
- ChatApp module structure

## Process
1. Read feature requirement and identify data needs
2. Determine which module this belongs to (never cross module boundaries)
3. Design entities with properties and types
4. Define relationships (one-to-many, many-to-many)
5. Specify constraints (NOT NULL, UNIQUE, CHECK)
6. Design indexes based on expected query patterns
7. Consider soft delete vs hard delete
8. Plan for full-text search needs (if applicable to Search module)
9. Write entity configuration using Fluent API pattern
10. Document schema for backend-developer

## Outputs
- `outputs/YYYY-MM-DD_schema_[feature].md` (entity diagram, relationships, indexes)
- Journal entry with design decisions

## Quality Bar
- Every entity has a primary key (GUID preferred in ChatApp)
- Foreign keys stay within module boundary
- Indexes defined for all expected query patterns
- Naming follows existing conventions (PascalCase entities, camelCase columns)
- Fluent API configuration specified (not data annotations)
