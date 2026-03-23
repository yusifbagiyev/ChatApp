# Migration Management

## Purpose
Create and manage EF Core migrations safely for schema changes.

## Serves Goals
- Migration safety

## Inputs
- Schema design from `outputs/`
- Existing migrations in each module's Infrastructure assembly
- `MEMORY.md` (migration lessons learned)

## Process
1. Read approved schema design
2. Implement entity and configuration in the correct module's Infrastructure
3. Generate migration: `dotnet ef migrations add [Name] --project [Module.Infrastructure]`
4. Review generated migration SQL
5. Test migration forward (apply)
6. Test migration backward (rollback)
7. If data transformation needed, add custom migration steps
8. Document migration for deployment

## Outputs
- Migration files in module Infrastructure assembly
- `outputs/YYYY-MM-DD_migration_[description].md` (migration steps, rollback plan)
- Journal entry with migration status

## Quality Bar
- Migration applies cleanly on empty and populated databases
- Rollback tested and documented
- No data loss in column type changes (explicit data migration)
- Migration scoped to single module (no cross-module migrations)
- Named descriptively: `Add{Entity}Table`, `Add{Column}To{Table}`
