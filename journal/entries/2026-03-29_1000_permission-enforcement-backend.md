# Backend Task: Permission Enforcement — Dərhal Effekt

**From**: Product Owner
**To**: Backend Developer
**Date**: 2026-03-29
**Priority**: P0 — CRITICAL BUG

---

## Problem

Admin paneldən istifadəçinin permission-unu siləndə, həmin istifadəçi yenə də o action-u icra edə bilir. Səhifəni refresh etsə belə backend bloklamır. Yalnız logout/login-dən sonra effekt görünür.

**Kök səbəb:** `PermissionAuthorizationHandler` yalnız JWT claims-dən oxuyur. Permission dəyişəndə JWT yenilənmir — köhnə token-dəki claims ilə işləyir. Access token 15 dəqiqə qüvvədədir, amma refresh hər 12 dəqiqədə olur.

**Əlavə kök səbəb (ARTIQ DÜZƏLDİLİB):** Admin role üçün permission-lar hardcoded qaytarılırdı (`GetDefaultForRole`). Bu artıq düzəldilib — indi yalnız SuperAdmin hardcoded-dir.

---

## Həll: Cached DB Check + Cache Invalidation

`PermissionAuthorizationHandler`-ı JWT claims-dən deyil, DB-dən (cache ilə) oxumağa keçir. Permission dəyişəndə cache invalidate edilir → növbəti request dərhal yeni permission-ları görür.

### Addım 1: PermissionAuthorizationHandler — DB-dən oxu (cached)

**Fayl:** `ChatApp.Shared.Infrastructure/Authorization/PermissionAuthorizationHandler.cs`

```csharp
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(30);

    public PermissionAuthorizationHandler(
        IServiceProvider serviceProvider,
        IMemoryCache cache)
    {
        _serviceProvider = serviceProvider;
        _cache = cache;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true)
            return;

        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                       ?? context.User.FindFirst("sub");
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userId))
            return;

        // Roluna bax — SuperAdmin həmişə bütün permissionlara sahibdir
        var roleClaim = context.User.FindFirst("role")?.Value;
        if (roleClaim == "SuperAdmin")
        {
            context.Succeed(requirement);
            return;
        }

        // Cache-dən permission-ları al (yoxdursa DB-dən yüklə)
        var cacheKey = $"user_permissions:{userId}";
        if (!_cache.TryGetValue(cacheKey, out HashSet<string> permissions))
        {
            using var scope = _serviceProvider.CreateScope();
            var unitOfWork = scope.ServiceProvider
                .GetRequiredService<IUnitOfWork>();

            var userPermissions = await unitOfWork.UserPermissions
                .Where(up => up.UserId == userId)
                .Select(up => up.PermissionName)
                .ToListAsync();

            permissions = new HashSet<string>(userPermissions);
            _cache.Set(cacheKey, permissions, CacheDuration);
        }

        if (permissions.Contains(requirement.PermissionName))
            context.Succeed(requirement);
    }
}
```

> **Qeyd:** `IUnitOfWork`-da `UserPermissions` property-si `DbSet<UserPermission>` olmalıdır. Yoxdursa, mövcud repository-dən istifadə et.

### Addım 2: Cache Invalidation — Permission Dəyişəndə

**Fayl:** `ChatApp.Modules.Identity.Application/Commands/Users/AssignPermissionToUserCommand.cs`

`IMemoryCache` inject et, `SaveChangesAsync`-dən sonra cache-i sil:

```csharp
public class AssignPermissionToUserCommandHandler(
    IUnitOfWork unitOfWork,
    ILogger<AssignPermissionToUserCommandHandler> logger,
    IMemoryCache cache)    // ← YENİ
{
    // ... mövcud kod ...

    await unitOfWork.SaveChangesAsync(cancellationToken);

    // Cache invalidate — dərhal effekt
    cache.Remove($"user_permissions:{command.UserId}");

    logger.LogInformation("Permission {Permission} assigned to user {UserId}",
        command.PermissionName, command.UserId);
    return Result.Success();
}
```

**Fayl:** `ChatApp.Modules.Identity.Application/Commands/Users/RemovePermissionFromUserCommand.cs`

Eyni şəkildə:

```csharp
public class RemovePermissionFromUserCommandHandler(
    IUnitOfWork unitOfWork,
    ILogger<RemovePermissionFromUserCommandHandler> logger,
    IMemoryCache cache)    // ← YENİ
{
    // ... mövcud kod ...

    unitOfWork.UserPermissions.Remove(permission);
    await unitOfWork.SaveChangesAsync(cancellationToken);

    // Cache invalidate — dərhal effekt
    cache.Remove($"user_permissions:{command.UserId}");

    logger.LogInformation("Permission {Permission} removed from user {UserId}",
        command.PermissionName, command.UserId);
    return Result.Success();
}
```

### Addım 3: DI Registration

**Fayl:** `ChatApp.Api/Program.cs` (və ya `DependencyInjection.cs`)

`IMemoryCache` artıq register olunub yoxsa yoxla. Yoxdursa:

```csharp
builder.Services.AddMemoryCache();
```

`PermissionAuthorizationHandler` artıq `AddScoped` ilə register olunub — yenidən register etməyə ehtiyac yoxdur. Constructor dəyişdi, amma DI avtomatik həll edəcək.

---

## Nəticə

- Permission dəyişəndə cache invalidate olur → **0 saniyə gecikmə**
- Cache miss olduqda DB-dən yüklənir → **max 30 saniyə** (normal şəraitdə)
- SuperAdmin üçün DB check yoxdur — JWT-dəki role claim-dən oxunur (performans)
- JWT claims artıq authorization üçün istifadə olunmur — yalnız userId və role

---

## Test Ssenarisi

1. Admin paneldən istifadəçinin `Messages.Send` permission-unu sil
2. **Logout etmədən**, həmin istifadəçi mesaj göndərməyə çalışsın
3. Backend **403 Forbidden** qaytarmalıdır
4. Frontend-də UI gizlənməlidir (frontend tapşırığı)
