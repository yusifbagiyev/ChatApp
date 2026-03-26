# Backend Task: Role Assignment Restriction Fix

**From**: Product Owner
**To**: Backend Developer
**Date**: 2026-03-26
**Priority**: P0 — Security. Admin can currently assign any role including SuperAdmin.

---

## Problem

Two commands are missing caller-role validation for role assignment:

### Issue 1 — `CreateUserCommand`
- Has `CallerCompanyId` but NOT `IsSuperAdmin` parameter
- No restriction on what role can be assigned
- An Admin can currently create a user with `Role.Admin` or `Role.SuperAdmin`

### Issue 2 — `UpdateUserCommand`
- Has both `CallerCompanyId` and `IsSuperAdmin` parameters ✅
- BUT lines 155-156 apply role change without any caller check:
  ```csharp
  if (request.Role.HasValue)
      user.ChangeRole(request.Role.Value);  // ← no restriction
  ```
- An Admin can currently escalate any user to `Role.Admin` or `Role.SuperAdmin`

---

## Business Rules

| Caller | Can assign |
|--------|-----------|
| SuperAdmin | `Role.User`, `Role.Admin`, `Role.SuperAdmin` |
| Admin | `Role.User` only |

---

## Fix 1 — `CreateUserCommand`

Add `bool IsSuperAdmin = false` parameter:

```csharp
public record CreateUserCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    Role Role,
    Guid DepartmentId,
    Guid? PositionId,
    string? AvatarUrl,
    string? AboutMe,
    DateTime? DateOfBirth,
    string? WorkPhone,
    DateTime? HiringDate,
    Guid? CallerCompanyId = null,
    bool IsSuperAdmin = false   // ← add this
) : IRequest<Result<Guid>>;
```

In handler, after the department company check, add:

```csharp
// Admin yalnız User rolu verə bilər
if (!command.IsSuperAdmin && command.Role != Role.User)
    return Result.Failure<Guid>("Admins can only create users with the User role");
```

### Update `UsersController.CreateUser`

Pass `isSuperAdmin` to the command:

```csharp
var (callerCompanyId, isSuperAdmin) = GetCompanyClaims();

var command = new CreateUserCommand(
    request.FirstName,
    request.LastName,
    request.Email,
    request.Password,
    request.Role,
    request.DepartmentId,
    request.PositionId,
    request.AvatarUrl,
    request.AboutMe,
    request.DateOfBirth,
    request.WorkPhone,
    request.HiringDate,
    callerCompanyId,
    isSuperAdmin);   // ← add this
```

---

## Fix 2 — `UpdateUserCommand`

In handler, replace:

```csharp
if (request.Role.HasValue)
    user.ChangeRole(request.Role.Value);
```

With:

```csharp
if (request.Role.HasValue)
{
    // Admin yalnız User rolu verə bilər
    if (!request.IsSuperAdmin && request.Role.Value != Role.User)
        return Result.Failure("Admins can only assign the User role");

    user.ChangeRole(request.Role.Value);
}
```

---

## Files to Change

| File | Change |
|------|--------|
| `Commands/Users/CreateUserCommand.cs` | Add `IsSuperAdmin` param + role restriction check |
| `Controllers/UsersController.cs` | Pass `isSuperAdmin` to `CreateUserCommand` |
| `Commands/Users/UpdateUserCommand.cs` | Add caller-role check before `ChangeRole()` |

No migration needed.
