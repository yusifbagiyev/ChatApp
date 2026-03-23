# Backend Developer — ChatApp Code Patterns

> This document teaches the backend-developer agent exactly how to write code in this project. Every pattern is extracted from the real codebase.

## Entity Pattern (Domain Layer)

```csharp
public class Channel : Entity {
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public ChannelType Type { get; private set; }
    public Guid CreatedBy { get; private set; }

    // Read-only collections via backing field
    private readonly List<ChannelMember> _members = [];
    public IReadOnlyCollection<ChannelMember> Members => _members.AsReadOnly();

    // Constructor with validation (NOT data annotations)
    public Channel(string name, string? description, ChannelType type, Guid createdBy) : base() {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Channel name cannot be empty", nameof(name));
        Name = name;
        Description = description;
        Type = type;
        CreatedBy = createdBy;
    }

    // Domain methods — validation only for tracked entities
    public void ValidateAddMember(Guid userId, Guid addedByUserId) {
        if (_members.Any(m => m.UserId == userId))
            throw new InvalidOperationException("User is already a member");
    }

    public void UpdateName(string newName) {
        if (string.IsNullOrWhiteSpace(newName))
            throw new ArgumentException("Channel name cannot be empty");
        Name = newName;
        UpdateTimestamp();
    }
}
```

**Key rules:**
- Properties: `private set` (immutable from outside)
- Collections: backing field `_items` + `AsReadOnly()` public property
- Validation in constructor (not attributes)
- `UpdateTimestamp()` on every mutation
- For tracked entities: use `ValidateOnly()` + `Repository.AddAsync()` pattern (not `_items.Add()`)

## Command Pattern (Application Layer)

```csharp
// Command — always a record, implements IRequest<Result<T>>
public record SendChannelMessageCommand(
    Guid ChannelId,
    Guid SenderId,
    string Content,
    string? FileId = null,
    Guid? ReplyToMessageId = null
) : IRequest<Result<Guid>>;

// Validator — FluentValidation (REQUIRED for every command/query)
public class SendChannelMessageCommandValidator : AbstractValidator<SendChannelMessageCommand> {
    public SendChannelMessageCommandValidator() {
        RuleFor(x => x.ChannelId).NotEmpty();
        RuleFor(x => x.SenderId).NotEmpty();
        RuleFor(x => x.Content).MaximumLength(10000);
        RuleFor(x => x).Must(x => !string.IsNullOrWhiteSpace(x.Content) || !string.IsNullOrWhiteSpace(x.FileId))
            .WithMessage("Message must have content or file attachment");
    }
}

// Handler — implements IRequestHandler<TRequest, TResponse>
public class SendChannelMessageCommandHandler : IRequestHandler<SendChannelMessageCommand, Result<Guid>> {
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEventBus _eventBus;
    private readonly ISignalRNotificationService _signalRNotificationService;

    public async Task<Result<Guid>> Handle(SendChannelMessageCommand request, CancellationToken ct) {
        try {
            // 1. Validate access
            var members = await _unitOfWork.ChannelMembers.GetChannelMembersAsync(request.ChannelId, ct);
            if (!members.Any(m => m.UserId == request.SenderId))
                return Result.Failure<Guid>("You must be a member");

            // 2. Create domain entity
            var message = new ChannelMessage(request.ChannelId, request.SenderId, request.Content, ...);

            // 3. Persist
            await _unitOfWork.ChannelMessages.AddAsync(message, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            // 4. Notify via SignalR
            await _signalRNotificationService.NotifyChannelMessageToMembersAsync(...);

            // 5. Publish domain event
            await _eventBus.PublishAsync(new ChannelMessageSentEvent(...), ct);

            return Result.Success(message.Id);
        } catch (Exception ex) {
            _logger?.LogError(ex, "Error sending message");
            return Result.Failure<Guid>("An error occurred");
        }
    }
}
```

**Handler flow always:** Validate → Create entity → Persist → Notify → Publish event → Return Result

## Query Pattern

```csharp
public record GetChannelMessagesQuery(
    Guid ChannelId, Guid RequestedBy,
    int PageSize = 50, DateTime? BeforeUtc = null
) : IRequest<Result<List<ChannelMessageDto>>>;
```

**Query handler rules:**
- Check access (membership for private channels)
- Use optimized repository methods that return DTOs directly (not entities)
- Cursor-based pagination with `BeforeUtc` parameter
- Return `Result<T>` — never throw for expected failures

## DTO Pattern

```csharp
public record ChannelMessageDto(
    Guid Id, Guid ChannelId, Guid SenderId,
    string SenderFullName, string? SenderAvatarUrl,
    string Content, bool IsEdited, bool IsDeleted,
    DateTime CreatedAtUtc, int ReadByCount, int TotalMemberCount,
    List<ChannelMessageReactionDto>? Reactions = null,
    MessageStatus Status = MessageStatus.Sent
);
```

**DTO rules:** Always `record`, suffix with `Dto`, include all data frontend needs (no N+1 lookups in frontend)

## Controller Pattern

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChannelsController : ControllerBase {
    private readonly IMediator _mediator;  // ONLY IMediator injected

    [HttpPost]
    [RequirePermission("Channels.Create")]
    public async Task<IActionResult> CreateChannel([FromBody] CreateChannelCommand command, CancellationToken ct) {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var result = await _mediator.Send(command with { CreatedBy = userId }, ct);
        if (result.IsFailure) return BadRequest(new { error = result.Error });
        return StatusCode(201, result.Value);
    }
}
```

**Controller rules:**
- `IMediator` is the ONLY dependency
- `GetCurrentUserId()` from JWT claims
- `[RequirePermission("...")]` for authorization
- `command with { UserId = ... }` to inject authenticated user
- Return `BadRequest(new { error = ... })` for failures

## DbContext & Configuration Pattern

```csharp
// DbContext — one per module
public class ChannelsDbContext : DbContext {
    public DbSet<Channel> Channels => Set<Channel>();
    public DbSet<ChannelMessage> ChannelMessages => Set<ChannelMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.ApplyConfiguration(new ChannelConfiguration());
        // Cross-module read model (no migration)
        modelBuilder.Entity<UserReadModel>(entity => {
            entity.ToTable("users");
            entity.ToTable(tb => tb.ExcludeFromMigrations());
        });
    }
}

// Configuration — Fluent API, snake_case columns
public class ChannelConfiguration : IEntityTypeConfiguration<Channel> {
    public void Configure(EntityTypeBuilder<Channel> builder) {
        builder.ToTable("channels");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
        builder.Property(c => c.CreatedAtUtc).HasColumnName("created_at_utc")
            .HasColumnType("timestamp with time zone");
        builder.HasIndex(c => c.Name).IsUnique().HasDatabaseName("ix_channels_name");
    }
}
```

## UnitOfWork Pattern

```csharp
public class UnitOfWork : IUnitOfWork {
    public IChannelRepository Channels { get; }
    public IChannelMemberRepository ChannelMembers { get; }
    public IChannelMessageRepository ChannelMessages { get; }

    public async Task<int> SaveChangesAsync(CancellationToken ct) => await _context.SaveChangesAsync(ct);
    public async Task BeginTransactionAsync(CancellationToken ct) => ...;
    public async Task CommitTransactionAsync(CancellationToken ct) => ...;
    public async Task RollbackTransactionAsync(CancellationToken ct) => ...;
}
```

## Repository Query Optimization

**Batch loading (not N+1):**
```csharp
// WRONG — N+1: separate query per channel for member count
foreach (var channel in channels) {
    channel.MemberCount = await _context.ChannelMembers.CountAsync(m => m.ChannelId == channel.Id);
}

// RIGHT — batch: single query for all member counts
var memberCounts = await _context.ChannelMembers
    .Where(m => channelIds.Contains(m.ChannelId))
    .GroupBy(m => m.ChannelId)
    .Select(g => new { ChannelId = g.Key, Count = g.Count() })
    .ToDictionaryAsync(x => x.ChannelId, x => x.Count);
```

## SignalR Hub Pattern

```csharp
[Authorize]
public class ChatHub : Hub {
    public override async Task OnConnectedAsync() {
        var userId = GetUserId();
        await _connectionManager.AddConnectionAsync(userId, Context.ConnectionId);
        await _presenceService.UserConnectedAsync(userId, Context.ConnectionId);
        await NotifyPresenceToRelatedUsersAsync(userId, "UserOnline");
    }

    public async Task TypingInChannel(Guid channelId, bool isTyping) {
        var memberUserIds = await _channelMemberCache.GetChannelMemberIdsAsync(channelId);
        var recipients = memberUserIds.Where(id => id != GetUserId()).ToList();
        await _signalRNotificationService.NotifyUserTypingInChannelToMembersAsync(...);
    }
}
```

**SignalR rules:**
- Broadcast to user's connections (not groups) for targeted delivery
- `ConnectionManager` tracks connectionId → userId mapping (thread-safe ConcurrentDictionary)
- `PresenceService` tracks online/offline/away status
- Never send same event to both group AND direct connections

## Module Registration Pattern

```csharp
// In DependencyInjection.cs of each module
public static IServiceCollection AddChannelsInfrastructure(this IServiceCollection services, IConfiguration config) {
    services.AddDbContext<ChannelsDbContext>(options =>
        options.UseNpgsql(connectionString, npgsql => {
            npgsql.MigrationsAssembly(typeof(ChannelsDbContext).Assembly.FullName);
            npgsql.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        }));
    services.AddScoped<IUnitOfWork, UnitOfWork>();
    return services;
}

public static IServiceCollection AddChannelsApplication(this IServiceCollection services) {
    services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(CreateChannelCommand).Assembly));
    services.AddValidatorsFromAssembly(typeof(CreateChannelCommand).Assembly);
    services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
    return services;
}
```

## Error Handling

```csharp
// Global exception handler maps exceptions to HTTP status codes:
NotFoundException → 404
ValidationException → 400 (with errors dictionary)
DomainException → 400
Everything else → 500 ("An internal server error occurred")

// Response format
{ "error": "message", "errors": { "Field": ["error1"] }, "timestamp": "2026-03-23T..." }
```

## Best Practices (from research)

1. **One handler per command/query** — never share handlers
2. **Idempotent commands** — same command sent twice should not create duplicates
3. **Early access checks** — validate membership/permissions before expensive queries
4. **Pre-computed DTOs** — calculate read counts, unread, etc. in repository queries, not in memory
5. **Batch loading** — 7 independent queries beats 300+ correlated subqueries
6. **Compiled queries** — use for hot-path lookups (`EF.CompileAsyncQuery`)
7. **Rate limiting** — consider for message sending and file upload endpoints
8. **MessagePack for SignalR** — consider for high-throughput scenarios (smaller payload than JSON)
