# Database Developer — ChatApp Database Guide

> This document teaches the database-developer agent exactly how the ChatApp database is structured and how to work with it.

## Database Overview

- **Engine**: PostgreSQL 15
- **ORM**: Entity Framework Core 10.0.2 (Npgsql provider)
- **Pattern**: Per-module isolated DbContext (no cross-module FKs)
- **Connection**: `Host=postgres;Port=5432;Database=chatapp;Username=postgres;Password=...`
- **Query splitting**: `SplitQuery` behavior (prevents cartesian explosion)

## Current Schema (6 DbContexts)

### IdentityDbContext
| Table | Key Columns | Indexes |
|-------|------------|---------|
| users | id, email, first_name, last_name, password_hash, avatar_url | ix_users_email (unique) |
| employees | id, user_id, company_id, department_id, position_id | ix_employees_user_company |
| companies | id, name | ix_companies_name (unique) |
| departments | id, name, company_id, parent_department_id | ix_departments_company |
| positions | id, name, company_id | |
| permissions | id, user_id, permission_name | ix_permissions_user |
| refresh_tokens | id, user_id, token, expires_at_utc | ix_refresh_tokens_token |

### ChannelsDbContext
| Table | Key Columns | Indexes |
|-------|------------|---------|
| channels | id, name, description, type, created_by, avatar_url | ix_channels_name (unique), ix_channels_type |
| channel_members | id, channel_id, user_id, role, is_hidden, joined_at_utc | ix_channel_members_channel_user (unique) |
| channel_messages | id, channel_id, sender_id, content, file_id, is_edited, is_deleted, is_pinned | ix_channel_messages_channel_created |
| channel_message_reactions | id, message_id, user_id, emoji | ix_reactions_message_user_emoji (unique) |
| channel_message_reads | id, message_id, user_id, read_at_utc | ix_reads_message_user (unique) |
| channel_message_mentions | id, message_id, user_id, mention_type | ix_mentions_message |
| user_favorite_channel_messages | id, user_id, message_id, favorited_at_utc | ix_favorites_user_message (unique) |

### DirectMessagesDbContext
| Table | Key Columns | Indexes |
|-------|------------|---------|
| direct_conversations | id, user1_id, user2_id | ix_conversations_users (unique) |
| direct_messages | id, conversation_id, sender_id, content, file_id, status | ix_messages_conversation_created |

### FilesDbContext
| Table | Key Columns |
|-------|------------|
| files | id, file_name, content_type, size_in_bytes, path, uploaded_by, width, height |

### NotificationsDbContext
| Table | Key Columns |
|-------|------------|
| notifications | id, user_id, type, title, content, is_read, related_entity_id |

### SettingsDbContext
| Table | Key Columns |
|-------|------------|
| user_settings | id, user_id, setting_key, setting_value |

## Naming Conventions

| C# | PostgreSQL |
|----|-----------|
| `ChannelMessage` (class) | `channel_messages` (table) |
| `SenderId` (property) | `sender_id` (column) |
| `CreatedAtUtc` (property) | `created_at_utc` (column, `timestamp with time zone`) |
| `ix_tablename_columns` | Index naming pattern |

## Entity Configuration Pattern (Fluent API)

```csharp
public class ChannelMessageConfiguration : IEntityTypeConfiguration<ChannelMessage> {
    public void Configure(EntityTypeBuilder<ChannelMessage> builder) {
        builder.ToTable("channel_messages");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.ChannelId).HasColumnName("channel_id").IsRequired();
        builder.Property(m => m.SenderId).HasColumnName("sender_id").IsRequired();
        builder.Property(m => m.Content).HasColumnName("content").HasMaxLength(10000);
        builder.Property(m => m.CreatedAtUtc).HasColumnName("created_at_utc")
            .HasColumnType("timestamp with time zone").IsRequired();

        // Indexes
        builder.HasIndex(m => new { m.ChannelId, m.CreatedAtUtc })
            .HasDatabaseName("ix_channel_messages_channel_created");

        // Relationships
        builder.HasOne(m => m.Channel)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

**Rules:**
- ALWAYS use Fluent API (never Data Annotations)
- snake_case for table/column names
- `timestamp with time zone` for all DateTime columns
- Name indexes: `ix_tablename_columns`
- Foreign keys only within same module

## Cross-Module Data Access

```csharp
// In ChannelsDbContext — read-only access to Identity module's users table
modelBuilder.Entity<UserReadModel>(entity => {
    entity.ToTable("users");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Id).HasColumnName("id");
    entity.Property(e => e.FirstName).HasColumnName("first_name");
    entity.ToTable(tb => tb.ExcludeFromMigrations());  // CRITICAL — don't create migrations for this
});
```

**Cross-module rules:**
- Map as read-only model (no navigation properties back)
- `ExcludeFromMigrations()` — this table belongs to another module
- Never create FK constraints to cross-module tables
- Use `IEventBus` for cross-module write operations

## Migration Best Practices

```bash
# Generate migration
dotnet ef migrations add AddReactionTable \
    --project ChatApp.Modules.Channels.Infrastructure \
    --startup-project ChatApp.Api

# Apply migration
dotnet ef database update --project ChatApp.Modules.Channels.Infrastructure --startup-project ChatApp.Api

# Rollback migration
dotnet ef database update PreviousMigrationName --project ... --startup-project ...
```

**Migration rules:**
1. One migration per schema change (don't batch unrelated changes)
2. Name descriptively: `AddReactionTable`, `AddIndexToChannelMessages`, `AddAvatarUrlToChannel`
3. Test both forward and rollback
4. Never auto-apply in production — review SQL first
5. If data transformation needed, add custom SQL in migration's `Up()` method
6. Never change column types without explicit data migration
7. Backward-compatible: add nullable columns first, populate, then add constraint

## Query Optimization Patterns

### Batch Loading (Not N+1)
```csharp
// WRONG — N+1: one query per channel
foreach (var channel in channels) {
    var count = await _context.ChannelMembers.CountAsync(m => m.ChannelId == channel.Id);
}

// RIGHT — single batch query
var counts = await _context.ChannelMembers
    .Where(m => channelIds.Contains(m.ChannelId))
    .GroupBy(m => m.ChannelId)
    .Select(g => new { g.Key, Count = g.Count() })
    .ToDictionaryAsync(x => x.Key, x => x.Count);
```

### Cursor-Based Pagination (Not Offset)
```csharp
// WRONG — offset pagination (slow on large tables)
var messages = await _context.Messages.Skip(page * size).Take(size).ToListAsync();

// RIGHT — cursor pagination
var messages = await _context.Messages
    .Where(m => m.ChannelId == channelId && m.CreatedAtUtc < beforeUtc)
    .OrderByDescending(m => m.CreatedAtUtc)
    .Take(pageSize)
    .ToListAsync();
```

### DTO Projection (Not Full Entity Load)
```csharp
// WRONG — loads full entity then maps
var entity = await _context.Channels.Include(c => c.Members).FirstOrDefaultAsync(c => c.Id == id);
return new ChannelDto(entity.Id, entity.Name, entity.Members.Count, ...);

// RIGHT — project to DTO in query
var dto = await (from c in _context.Channels
    where c.Id == id
    select new ChannelDto {
        Id = c.Id,
        Name = c.Name,
        MemberCount = c.Members.Count(),
        ...
    }).FirstOrDefaultAsync();
```

## Index Strategy

### When to Add Indexes
1. **WHERE clause columns** — any column used in `Where()` frequently
2. **JOIN columns** — foreign keys used in `Join()` or `Include()`
3. **ORDER BY columns** — columns used in `OrderBy()` / `OrderByDescending()`
4. **Unique constraints** — enforce data integrity (email, channel name)
5. **Composite indexes** — for queries that filter on multiple columns together

### Index Types for Chat Data
```sql
-- Standard B-tree: equality and range queries
CREATE INDEX ix_channel_messages_channel_created
ON channel_messages (channel_id, created_at_utc DESC);

-- Partial index: only non-deleted messages
CREATE INDEX ix_messages_active
ON channel_messages (channel_id, created_at_utc) WHERE is_deleted = false;

-- Covering index: avoid table lookup
CREATE INDEX ix_members_channel_user
ON channel_members (channel_id, user_id) INCLUDE (role, is_hidden);

-- BRIN index: for time-series data
CREATE INDEX ix_messages_created_brin
ON channel_messages USING BRIN (created_at_utc);
```

## PostgreSQL Chat-Specific Tips

1. **TIMESTAMPTZ everywhere** — never use `timestamp without time zone`
2. **UUID primary keys** — `gen_random_uuid()` for default values
3. **Soft deletes**: use `is_deleted` flag + partial index `WHERE is_deleted = false`
4. **Full-text search**: `tsvector` column + GIN index for message search
5. **Connection pooling**: consider PgBouncer for production (EF Core opens many connections)
6. **Autovacuum tuning**: messaging tables have high INSERT rate — tune `autovacuum_vacuum_scale_factor` to 0.05
7. **Table partitioning**: consider `pg_partman` for messages table if it grows beyond millions of rows (partition by month)

## Performance Monitoring Queries

```sql
-- Find slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 20;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE 'pk_%';

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC;

-- Dead tuples (need vacuum)
SELECT relname, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000 ORDER BY n_dead_tup DESC;
```
