# Backend Task: Organization Hierarchy — Fix Root-Level Users

**From**: Product Owner
**To**: Backend Developer
**Date**: 2026-03-27
**Priority**: P0 — Users panel-də istifadəçilər company altında deyil, root-da görünür

---

## Problem

`GetOrganizationHierarchyQuery.BuildHierarchy` metodunda departamenti olmayan bütün userlər birbaşa root-a əlavə edilir:

```csharp
// Add users with no department to root  ← YANLIŞ
var usersWithoutDepartment = userNodes
    .Where(u => !u.DepartmentId.HasValue)
    .Select(u => u with { Level = 0 })
    .ToList();
result.AddRange(usersWithoutDepartment);
```

Bu səbəbdən `Aqil Zeynalov` (166 Logistics-in admini, departamentsiz) və `Super Admin` (heç bir şirkəti yoxdur) company node-larının yanında ayrıca top-level node kimi görünür.

**Düzgün davranış:**
- Departamenti olmayan, amma şirkəti olan user → həmin şirkətin `Children` siyahısına əlavə edilir
- Şirkəti olmayan user (SuperAdmin) → hierarchy-dən tamamilə çıxarılır

---

## Fix 1 — `OrganizationHierarchyNodeDto.cs`

User node-larının şirkətini izləmək üçün `CompanyId` field-i əlavə et:

```csharp
public record OrganizationHierarchyNodeDto(
    NodeType Type,
    Guid Id,
    string Name,
    int Level,
    Guid? ParentDepartmentId,
    string? HeadOfDepartmentName,
    Guid? HeadOfDepartmentId,
    int UserCount,
    string? Email,
    string? Role,
    bool IsActive,
    string? AvatarUrl,
    string? PositionName,
    Guid? DepartmentId,
    DateTime? CreatedAtUtc,
    List<OrganizationHierarchyNodeDto> Children,
    int SubordinateCount = 0,
    string? SupervisorName = null,
    bool IsDepartmentHead = false,
    Guid? CompanyId = null    // ← əlavə et
);
```

---

## Fix 2 — `GetOrganizationHierarchyQuery.cs`

### 2a. `userNodes` yaradılarkən `CompanyId` set et

```csharp
var userNodes = users.Select(u => new OrganizationHierarchyNodeDto(
    Type: NodeType.User,
    Id: u.Id,
    Name: u.FullName,
    Level: 0,
    ParentDepartmentId: null,
    HeadOfDepartmentName: null,
    HeadOfDepartmentId: null,
    UserCount: 0,
    Email: u.Email,
    Role: u.Role.ToString(),
    IsActive: u.IsActive,
    AvatarUrl: u.AvatarUrl,
    PositionName: u.Employee?.Position?.Name,
    DepartmentId: u.Employee?.DepartmentId,
    CreatedAtUtc: u.CreatedAtUtc,
    Children: new List<OrganizationHierarchyNodeDto>(),
    CompanyId: u.CompanyId    // ← əlavə et
)).ToList();
```

### 2b. `BuildHierarchy` — root-a əlavə etmə, şirkətin altına əlavə et

**Əvvəl:**
```csharp
// Add users with no department to root
var usersWithoutDepartment = userNodes
    .Where(u => !u.DepartmentId.HasValue)
    .Select(u => u with { Level = 0 })
    .ToList();
result.AddRange(usersWithoutDepartment);
```

**Sonra:**
```csharp
// Şirkəti olan, departamentsiz userləri şirkətlərinin altına əlavə et
// Şirkəti olmayan userlər (SuperAdmin) hierarchy-dən çıxarılır
var noDeptUsersByCompany = userNodes
    .Where(u => !u.DepartmentId.HasValue && u.CompanyId.HasValue)
    .GroupBy(u => u.CompanyId!.Value)
    .ToDictionary(g => g.Key, g => g.ToList());
```

`foreach (var company in companies)` bloku içində, `companyNode` yaradılmadan əvvəl:

```csharp
// Şirkətin departamentsiz userlərini companyChildren-a əlavə et
if (noDeptUsersByCompany.TryGetValue(company.Id, out var noDeptUsers))
{
    foreach (var u in noDeptUsers.OrderBy(u => u.Name))
        companyChildren.Add(u with { Level = 1 });
}
```

---

## Fix 3 — `users` query-sindən SuperAdmin-i çıxar

Handler-də `usersQuery` yaradılarkən:

```csharp
var usersQuery = unitOfWork.Users
    .Include(u => u.Employee)
        .ThenInclude(e => e!.Position)
    .Where(u => u.CompanyId.HasValue)   // ← şirkətsiz userləri (SuperAdmin) çıxar
    .AsNoTracking()
    .AsQueryable();
```

---

## Fayllar

| Fayl | Dəyişiklik |
|------|-----------|
| `DTOs/Responses/OrganizationHierarchyNodeDto.cs` | `Guid? CompanyId = null` əlavə et |
| `Queries/Organization/GetOrganizationHierarchyQuery.cs` | `userNodes`-a CompanyId set et; `usersQuery`-yə `.Where(u => u.CompanyId.HasValue)`; `BuildHierarchy`-də root əvəzinə company altına əlavə et |

Migration lazım deyil.
