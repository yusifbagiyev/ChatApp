# Backend Task: Avatar File Cleanup & Storage Optimization

**From**: Product Owner
**To**: Backend Developer
**Date**: 2026-03-28
**Priority**: P1

---

## Xülasə

Hal-hazırda yeni avatar yüklənəndə köhnə fayl diskdə qalır — storage boş yerə dolur. 4 əsas düzəliş lazımdır:

1. **Yeni `Avatar.Upload` permission** yaradılmalı və regular user-lərə assign edilməli
2. Profil şəkli yüklənəndə köhnə faylı sil (disk + DB)
3. Department avatar yüklənəndə köhnə faylı sil (disk + DB)
4. `DeleteFileCommand`-da fiziki fayl silməni aktiv et (hal-hazırda comment-lənib)

**Mövcud vəziyyət:**
- `Files.Upload` — ümumi fayl yükləmə permission-udur (mesajda attachment). Avatar upload üçün **ayrı permission lazımdır**
- `IFileStorageService.DeleteFileAsync()` mövcuddur və işləyir ama heç bir yerdə çağırılmır
- `DeleteFileCommand` handler-da fiziki silmə comment-lənib (line 81-88)

---

## 1. Yeni Permission: `Avatar.Upload`

**Fayl:** `ChatApp.Modules.Identity.Domain/Constants/Permissions.cs`

Files moduluna yeni permission əlavə et:

```csharp
// Mövcud:
public const string FilesUpload   = "Files.Upload";
public const string FilesDownload = "Files.Download";
public const string FilesDelete   = "Files.Delete";

// YENİ:
public const string FilesUploadAvatar = "Avatar.Upload";
```

`GetAll()` metoduna əlavə et (əgər manual siyahıdırsa).

`GetDefaultForRole` metodunda — **User** role-una `Avatar.Upload` əlavə et:

```csharp
Role.User => new[]
{
    // ... mövcud permissions ...
    FilesUploadAvatar,    // ← YENİ
}
```

**Admin** və **SuperAdmin** role-larına da əlavə et (onlar bütün permission-ları alır).

### Mövcud istifadəçilərə migration ilə assign et

Yeni permission yalnız `GetDefaultForRole`-dan gələcək user-lərə assign edilir. **Mövcud istifadəçilərə** EF Core migration ilə əlavə et:

```csharp
// Migration: AssignAvatarUploadPermissionToExistingUsers
migrationBuilder.Sql(@"
    INSERT INTO user_permissions (id, user_id, permission_name, granted_at_utc)
    SELECT gen_random_uuid(), u.id, 'Avatar.Upload', NOW()
    FROM users u
    WHERE u.is_deleted = false
      AND NOT EXISTS (
          SELECT 1 FROM user_permissions up
          WHERE up.user_id = u.id AND up.permission_name = 'Avatar.Upload'
      );
");
```

> **Qeyd:** `user_permissions` cədvəlinin sütun adlarını yoxla — `id`, `user_id`, `permission_name`, `granted_at_utc` ola bilər. EF Core configuration-a bax və uyğunlaşdır.

### Endpoint-lərdə istifadə et

**Fayl:** `ChatApp.Modules.Files.Api/Controllers/FilesController.cs`

Profil şəkli upload endpoint-ində `Files.Upload` əvəzinə `Avatar.Upload` istifadə et:

```csharp
// Köhnə:
[RequirePermission("Avatar.Upload")]
public async Task<IActionResult> UploadProfilePicture(...)

// Yeni:
[RequirePermission("Avatar.Upload")]
public async Task<IActionResult> UploadProfilePicture(...)
```

Department avatar upload endpoint-ində də:

```csharp
// Köhnə:
[RequirePermission("Avatar.Upload")]
public async Task<IActionResult> UploadDepartmentAvatar(...)

// Yeni:
[RequirePermission("Avatar.Upload")]
public async Task<IActionResult> UploadDepartmentAvatar(...)
```

> **Qeyd:** `Files.Upload` ümumi fayl yükləmə (mesajda attachment) üçün qalır. `Avatar.Upload` yalnız avatar yükləməyə aiddir.

---

## 2. DeleteFileCommand — Fiziki Silməni Aktiv Et

**Fayl:** `ChatApp.Modules.Files.Application/Commands/DeleteFile/DeleteFileCommand.cs`

Handler-da fiziki fayl silmə kodu comment-lənib (təxminən line 81-88). Comment-ləri sil, kodu aktiv et:

```csharp
// Köhnə (comment-lənmiş):
// try
// {
//     await _fileStorageService.DeleteFileAsync(file.StoragePath, cancellationToken);
// }
// catch (Exception ex)
// {
//     _logger?.LogWarning(ex, "Failed to delete physical file {StoragePath}", file.StoragePath);
// }

// Yeni (aktiv):
try
{
    await _fileStorageService.DeleteFileAsync(file.StoragePath, cancellationToken);
}
catch (Exception ex)
{
    _logger?.LogWarning(ex, "Failed to delete physical file {StoragePath}", file.StoragePath);
}
```

Həmçinin `UploadedBy` yoxlamasını genişləndir — admin/system tərəfindən silinməyə icazə ver:

```csharp
// Mövcud — yalnız yükləyən silə bilər:
if (file.UploadedBy != request.RequestedBy)
    return Result.Failure("You can only delete files you uploaded");

// Yeni — admin/system avatar dəyişikliyi zamanı da silə bilsin:
// Bu yoxlamanı yalnız manual delete üçün saxla.
// Avatar cleanup üçün ayrı internal metod istifadə et (aşağıda).
```

---

## 3. Profil Şəkli Upload — Köhnə Avatarı Sil

**Fayl:** `ChatApp.Modules.Files.Api/Controllers/FilesController.cs` — `UploadProfilePicture` metodu (təxminən line 93-151)

Yeni avatar yüklənməzdən əvvəl köhnə avatarı sil:

```csharp
[HttpPost("upload/profile-picture")]
[RequirePermission("Avatar.Upload")]
public async Task<IActionResult> UploadProfilePicture(
    [FromForm] UploadFileRequest request,
    [FromQuery] Guid? targetUserId,
    CancellationToken cancellationToken)
{
    // ... mövcud validasiya ...

    var effectiveUserId = targetUserId ?? callerId;

    // ── YENİ: Köhnə avatar faylını sil ──
    var user = await _mediator.Send(new GetUserQuery(effectiveUserId), cancellationToken);
    if (user is not null && !string.IsNullOrEmpty(user.AvatarUrl))
    {
        await CleanupOldAvatarFile(user.AvatarUrl, cancellationToken);
    }
    // ── YENİ SON ──

    // ... mövcud upload məntiqi ...
}
```

---

## 4. Department Avatar Upload — Köhnə Avatarı Sil

**Fayl:** `ChatApp.Modules.Files.Api/Controllers/FilesController.cs` — `UploadDepartmentAvatar` metodu (təxminən line 207-245)

```csharp
[HttpPost("upload/department-avatar/{companyId:guid}")]
[RequirePermission("Avatar.Upload")]
public async Task<IActionResult> UploadDepartmentAvatar(
    [FromRoute] Guid companyId,
    [FromForm] UploadFileRequest request,
    [FromQuery] Guid? departmentId,
    CancellationToken cancellationToken)
{
    // ── YENİ: Köhnə department avatar faylını sil ──
    if (departmentId.HasValue)
    {
        var dept = await _mediator.Send(
            new GetDepartmentByIdQuery(departmentId.Value), cancellationToken);
        if (dept is not null && !string.IsNullOrEmpty(dept.AvatarUrl))
        {
            await CleanupOldAvatarFile(dept.AvatarUrl, cancellationToken);
        }
    }
    // ── YENİ SON ──

    // ... mövcud upload məntiqi ...
}
```

---

## 5. Ümumi Cleanup Helper Metodu

`FilesController`-a private helper metod əlavə et:

```csharp
private async Task CleanupOldAvatarFile(string avatarUrl, CancellationToken cancellationToken)
{
    try
    {
        // avatarUrl-dan storagePath-i əldə et
        // avatarUrl format: /uploads/company/{cId}/users/{uId}/avatar/{file}
        // storagePath format: uploads/company/{cId}/users/{uId}/avatar/{file}
        var storagePath = avatarUrl.TrimStart('/');

        // DB-dən FileMetadata tap
        var fileMetadata = await _unitOfWork.Files
            .FirstOrDefaultAsync(f => f.StoragePath == storagePath && !f.IsDeleted, cancellationToken);

        if (fileMetadata is not null)
        {
            // Soft delete (DB)
            fileMetadata.Delete("system-avatar-cleanup");

            // Physical delete (disk)
            await _fileStorageService.DeleteFileAsync(fileMetadata.StoragePath, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        else
        {
            // FileMetadata yoxdursa, sadəcə fiziki faylı sil
            await _fileStorageService.DeleteFileAsync(storagePath, cancellationToken);
        }
    }
    catch (Exception ex)
    {
        // Cleanup uğursuz olsa upload-u bloklamır
        _logger?.LogWarning(ex, "Failed to cleanup old avatar file: {AvatarUrl}", avatarUrl);
    }
}
```

> **Qeyd:** `IFileStorageService` və `IUnitOfWork` (və ya `IFileRepository`) inject olunmalıdır. Əgər `FilesController`-da mövcud deyilsə, constructor-a əlavə et.

---

## 5. AssignEmployeeToDepartment — User Avatar Dəyişəndə Köhnə Faylı Sil

**Fayl:** `ChatApp.Modules.Identity.Application/Commands/Employees/AssignEmployeeToDepartmentCommand.cs`

Hal-hazırda department avatarını user-ə set edir (line 80-81):
```csharp
if (!string.IsNullOrEmpty(department.AvatarUrl))
    user.UpdateAvatarUrl(department.AvatarUrl);
```

Bu handler-da fayl silmə lazım deyil — çünki eyni department avatarı bir neçə user tərəfindən istifadə olunur. Yalnız profil şəkli və department avatar **upload** zamanı köhnə faylı sil.

---

## Qeydlər

- `Files.Upload` — mesajda attachment üçün. Avatar upload üçün **`Avatar.Upload`** yeni permission
- `GetDefaultForRole` — hər 3 role-a (`User`, `Admin`, `SuperAdmin`) `Avatar.Upload` əlavə et
- Avatar endpoint-lərində `[RequirePermission("Avatar.Upload")]`, ümumi upload-da `[RequirePermission("Files.Upload")]` qalır
- Cleanup try-catch ilə sarmalanmalıdır — köhnə faylın silinməsi uğursuz olsa, yeni upload bloklanmamalıdır
- `storagePath` ilə `avatarUrl` fərqini nəzərə al — url ön söz `/uploads/` ilə başlaya bilər
