# Backend Task: Complete Company Isolation

**From**: Product Owner
**To**: Backend Developer
**Date**: 2026-03-26
**Priority**: P0 — Security. 24 endpoints missing company scoping.

---

## Context

Multi-company audit found that most queries/commands return or modify data without checking the caller's company.
SuperAdmin bypasses all company checks (can operate on any company).
All other roles must be restricted to their own company's data.

**Pattern to follow** (already used correctly in `GetUsersQuery`, `SearchUsersQuery`):
```csharp
// Controller extracts from JWT:
var companyId = Guid.TryParse(User.FindFirst("companyId")?.Value, out var cid) ? cid : (Guid?)null;
var isSuperAdmin = User.FindFirst("role")?.Value == "SuperAdmin";

// Query/Command filters:
.Where(x => isSuperAdmin || x.CompanyId == companyId)

// Ownership check in handlers:
if (!isSuperAdmin && entity.CompanyId != callerCompanyId)
    return Result.Failure("Access denied");
```

---

## Fix 1 — Queries

### 1.1 `GetAllDepartmentsQuery`
Add params: `Guid? CompanyId, bool IsSuperAdmin`

```csharp
public record GetAllDepartmentsQuery(Guid? CompanyId, bool IsSuperAdmin) : IRequest<...>;

// In handler:
var query = unitOfWork.Departments.AsQueryable();
if (!IsSuperAdmin && CompanyId.HasValue)
    query = query.Where(d => d.CompanyId == CompanyId.Value);
```

### 1.2 `GetDepartmentByIdQuery`
Add params: `Guid? CallerCompanyId, bool IsSuperAdmin`

```csharp
// After fetching department:
if (!isSuperAdmin && department.CompanyId != callerCompanyId)
    return Result.Failure<DepartmentDto>("Department not found");
```

### 1.3 `GetAllPositionsQuery`
Add params: `Guid? CompanyId, bool IsSuperAdmin`

```csharp
// Positions are scoped via their Department.CompanyId:
var query = unitOfWork.Positions.Include(p => p.Department).AsQueryable();
if (!isSuperAdmin && companyId.HasValue)
    query = query.Where(p => p.Department == null || p.Department.CompanyId == companyId.Value);
```

### 1.4 `GetPositionsByDepartmentQuery`
Add params: `Guid? CallerCompanyId, bool IsSuperAdmin`

```csharp
// After fetching department:
if (!isSuperAdmin && department.CompanyId != callerCompanyId)
    return Result.Failure("Access denied");
```

### 1.5 `GetCompanyByIdQuery`
Add params: `Guid? CallerCompanyId, bool IsSuperAdmin`

```csharp
// After fetching company:
if (!isSuperAdmin && company.Id != callerCompanyId)
    return Result.Failure<CompanyDetailDto>("Access denied");
```

### 1.6 `GetUserQuery`
Add params: `Guid? CallerCompanyId, bool IsSuperAdmin`

```csharp
// After fetching user:
if (!isSuperAdmin && user.CompanyId != callerCompanyId)
    return Result.Failure<UserDetailDto>("User not found");
```

---

## Fix 2 — User CRUD Commands

All user commands below need: `Guid? CallerCompanyId, bool IsSuperAdmin` added.
SuperAdmin check: `if (isSuperAdmin) skip company validation`.

### 2.1 `CreateUserCommand`
- Add `Guid? CallerCompanyId` param
- Set new user's `CompanyId = callerCompanyId` (ignore any CompanyId from request body)
- If `DepartmentId` provided: verify `department.CompanyId == callerCompanyId`
- If `PositionId` provided: verify position's department belongs to same company

### 2.2 `UpdateUserCommand`
- Add `Guid? CallerCompanyId, bool IsSuperAdmin`
- After fetching target user: `if (!isSuperAdmin && user.CompanyId != callerCompanyId) return Failure`

### 2.3 `DeleteUserCommand`
- Same ownership check as UpdateUser

### 2.4 `ActivateUserCommand`
- Same ownership check

### 2.5 `DeactivateUserCommand`
- Same ownership check

### 2.6 `AdminChangePasswordCommand`
- Same ownership check

### 2.7 `AssignPermissionToUserCommand`
- Same ownership check

### 2.8 `RemovePermissionFromUserCommand`
- Same ownership check

---

## Fix 3 — Department Commands

### 3.1 `UpdateDepartmentCommand`
Add `Guid? CallerCompanyId, bool IsSuperAdmin`:
```csharp
// After fetching department:
if (!isSuperAdmin && department.CompanyId != callerCompanyId)
    return Result.Failure("Access denied");
```

### 3.2 `DeleteDepartmentCommand`
Same check.

### 3.3 `AssignDepartmentHeadCommand`
- Check department belongs to caller's company
- Check the user being assigned as head belongs to same company

### 3.4 `RemoveDepartmentHeadCommand`
- Check department belongs to caller's company

### 3.5 `CreateDepartmentCommand` (partial fix)
Currently takes `CompanyId` from request body. Fix:
- Remove `CompanyId` from `CreateDepartmentRequest` DTO
- Controller passes `callerCompanyId` from JWT instead

---

## Fix 4 — Position Commands

### 4.1 `CreatePositionCommand`
Add `Guid? CallerCompanyId, bool IsSuperAdmin`:
- If `DepartmentId` provided: verify `department.CompanyId == callerCompanyId`

### 4.2 `UpdatePositionCommand`
- Fetch position, get its department, check `department.CompanyId == callerCompanyId`

### 4.3 `DeletePositionCommand`
- Same check

---

## Fix 5 — Employee Commands

### 5.1 `AssignEmployeeToDepartmentCommand`
Add `Guid? CallerCompanyId, bool IsSuperAdmin`:
- Check target employee belongs to caller's company
- Check target department belongs to caller's company

### 5.2 `RemoveEmployeeFromDepartmentCommand`
- Check target employee belongs to caller's company

### 5.3 `RemoveSupervisorFromEmployeeCommand`
- Check target employee belongs to caller's company

---

## Fix 6 — Controllers

### 6.1 `UsersController`

Add `GetCompanyClaims()` helper (same pattern as `FilesController`):
```csharp
private (Guid? companyId, bool isSuperAdmin) GetCompanyClaims()
{
    var companyId = Guid.TryParse(User.FindFirst("companyId")?.Value, out var cid) ? cid : (Guid?)null;
    var isSuperAdmin = User.FindFirst("role")?.Value == "SuperAdmin";
    return (companyId, isSuperAdmin);
}
```

Update these actions to extract and pass company claims:
- `CreateUser` → pass `callerCompanyId` to command (NOT from request body)
- `UpdateUser` → pass `callerCompanyId, isSuperAdmin` to command
- `DeleteUser` → same
- `ActivateUser` → same
- `DeactivateUser` → same
- `ChangeUserPassword` → same
- `GetUserById` → pass `callerCompanyId, isSuperAdmin` to query
- `AssignPermissionToUser` → same
- `RemovePermissionFromUser` → same
- `AssignEmployeeToDepartment` → same
- `RemoveEmployeeFromDepartment` → same

### 6.2 `DepartmentsController`

Add `GetCompanyClaims()` helper.

Update:
- `GetAllDepartments` → pass `companyId, isSuperAdmin`
- `GetDepartmentById` → pass `callerCompanyId, isSuperAdmin`
- `CreateDepartment` → pass `callerCompanyId` from JWT (remove `CompanyId` from request body)
- `UpdateDepartment` → pass `callerCompanyId, isSuperAdmin`
- `DeleteDepartment` → same
- `AssignDepartmentHead` → same
- `RemoveDepartmentHead` → same

### 6.3 `PositionsController`

Add `GetCompanyClaims()` helper.

Update all endpoints to pass `callerCompanyId, isSuperAdmin`.

### 6.4 `CompaniesController` — `GetCompanyById`

Update to pass `callerCompanyId, isSuperAdmin` so non-SuperAdmin can only read their own company.

---

## Files to Change

| File | Change |
|------|--------|
| `Queries/Departments/GetAllDepartmentsQuery.cs` | Add CompanyId/IsSuperAdmin filter |
| `Queries/Departments/GetDepartmentByIdQuery.cs` | Add ownership check |
| `Queries/GetPositions/GetAllPositionsQuery.cs` | Add company filter via dept |
| `Queries/GetPositions/GetPositionsByDepartmentQuery.cs` | Add ownership check |
| `Queries/Companies/GetCompanyByIdQuery.cs` | Add ownership check |
| `Queries/GetUser/GetUserQuery.cs` | Add ownership check |
| `Commands/Users/CreateUserCommand.cs` | CompanyId from caller, not body |
| `Commands/Users/UpdateUserCommand.cs` | Add ownership check |
| `Commands/Users/DeleteUserCommand.cs` | Add ownership check |
| `Commands/Users/ActivateUserCommand.cs` | Add ownership check |
| `Commands/Users/DeactivateUserCommand.cs` | Add ownership check |
| `Commands/Users/AdminChangePasswordCommand.cs` | Add ownership check |
| `Commands/Users/AssignPermissionToUserCommand.cs` | Add ownership check |
| `Commands/Users/RemovePermissionFromUserCommand.cs` | Add ownership check |
| `Commands/Departments/UpdateDepartmentCommand.cs` | Add ownership check |
| `Commands/Departments/DeleteDepartmentCommand.cs` | Add ownership check |
| `Commands/Departments/AssignDepartmentHeadCommand.cs` | Add ownership check |
| `Commands/Departments/RemoveDepartmentHeadCommand.cs` | Add ownership check |
| `Commands/Departments/CreateDepartmentCommand.cs` | Remove CompanyId from request DTO |
| `Commands/Positions/CreatePositionCommand.cs` | Add company check via dept |
| `Commands/Positions/UpdatePositionCommand.cs` | Add ownership check |
| `Commands/Positions/DeletePositionCommand.cs` | Add ownership check |
| `Commands/Employees/AssignEmployeeToDepartmentCommand.cs` | Add ownership check |
| `Commands/Employees/RemoveEmployeeFromDepartmentCommand.cs` | Add ownership check |
| `Commands/Employees/RemoveSupervisorFromEmployeeCommand.cs` | Add ownership check |
| `Controllers/UsersController.cs` | Add GetCompanyClaims(), update all actions |
| `Controllers/DepartmentsController.cs` | Add GetCompanyClaims(), update all actions |
| `Controllers/PositionsController.cs` | Add GetCompanyClaims(), update all actions |
| `Controllers/CompaniesController.cs` | Update GetCompanyById |
| `DTOs/Requests/CreateDepartmentRequest.cs` | Remove CompanyId field |

---

## Notes

- No migration needed — this is application logic only, no schema changes
- `GetCurrentUserQuery` is already safe (returns only the requesting user)
- `GetUsersQuery`, `SearchUsersQuery` are already company-scoped — no change needed
- `GetOrganizationHierarchyQuery` is already company-scoped — no change needed
- `GetDepartmentUsersQuery` is already company-scoped — no change needed
- All `Companies.*` commands (Create/Update/Delete/AssignAdmin) are SuperAdmin-only — no change needed
- `LoginCommand`, `RefreshTokenCommand`, `ChangePasswordCommand` are identity operations — no change needed
