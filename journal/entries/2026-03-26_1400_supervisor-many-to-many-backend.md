# Backend Task: Supervisor Many-to-Many Refactor

**From**: Product Owner
**To**: Backend Developer
**Date**: 2026-03-26
**Priority**: P0 — Frontend UserManagement supervisor tab is blocked until this is done

---

## Context

Current implementation: `Employee` has a single `SupervisorId` (FK to another `Employee`).
This is 1:N — one employee can have only one supervisor.

New requirement: **Many-to-many** — one employee can have multiple supervisors.
Solution: `EmployeeSupervisor` junction table.

---

## Current State (what exists)

### Employee entity
```
Employee.SupervisorId (Guid?) — single FK to another Employee
Employee.Supervisor (Employee?) — nav prop
Employee.Subordinates (IReadOnlyCollection<Employee>) — nav prop (reverse 1:N)
Employee.AssignSupervisor(Guid supervisorId) — sets single SupervisorId
Employee.RemoveSupervisor() — clears SupervisorId
Employee.AssignToDepartment(..., Guid? supervisorId) — also sets SupervisorId
```

### Existing commands
- `AssignSupervisorToEmployeeCommand(UserId, SupervisorId)` — overwrites single supervisor
- `RemoveSupervisorFromEmployeeCommand(UserId)` — clears single supervisor

### UserDetailDto
```csharp
Guid? SupervisorId,
string? SupervisorName,
string? SupervisorAvatarUrl,
string? SupervisorPosition,
```

---

## What to Build

### Step 1 — New domain entity: `EmployeeSupervisor`

**File**: `ChatApp.Modules.Identity.Domain/Entities/EmployeeSupervisor.cs`

```csharp
public class EmployeeSupervisor
{
    public Guid EmployeeId { get; private set; }
    public Employee Employee { get; private set; } = null!;

    public Guid SupervisorEmployeeId { get; private set; }
    public Employee SupervisorEmployee { get; private set; } = null!;

    public DateTime AssignedAtUtc { get; private set; }

    private EmployeeSupervisor() { }

    public EmployeeSupervisor(Guid employeeId, Guid supervisorEmployeeId)
    {
        if (employeeId == Guid.Empty) throw new ArgumentException("EmployeeId required");
        if (supervisorEmployeeId == Guid.Empty) throw new ArgumentException("SupervisorEmployeeId required");
        if (employeeId == supervisorEmployeeId) throw new ArgumentException("Employee cannot supervise themselves");

        EmployeeId = employeeId;
        SupervisorEmployeeId = supervisorEmployeeId;
        AssignedAtUtc = DateTime.UtcNow;
    }
}
```

---

### Step 2 — Update `Employee` entity

**File**: `ChatApp.Modules.Identity.Domain/Entities/Employee.cs`

Remove:
- `public Guid? SupervisorId { get; private set; }`
- `public Employee? Supervisor { get; private set; }`
- `private readonly List<Employee> _subordinates`
- `public IReadOnlyCollection<Employee> Subordinates`
- `AssignSupervisor(Guid supervisorId)` method
- `RemoveSupervisor()` method

Add:
```csharp
private readonly List<EmployeeSupervisor> _supervisorLinks = [];
public IReadOnlyCollection<EmployeeSupervisor> SupervisorLinks => _supervisorLinks.AsReadOnly();

private readonly List<EmployeeSupervisor> _subordinateLinks = [];
public IReadOnlyCollection<EmployeeSupervisor> SubordinateLinks => _subordinateLinks.AsReadOnly();

public void AddSupervisor(Guid supervisorEmployeeId)
{
    if (_supervisorLinks.Any(s => s.SupervisorEmployeeId == supervisorEmployeeId))
        return; // idempotent
    _supervisorLinks.Add(new EmployeeSupervisor(Id, supervisorEmployeeId));
    UpdateTimestamp();
}

public void RemoveSupervisor(Guid supervisorEmployeeId)
{
    var link = _supervisorLinks.FirstOrDefault(s => s.SupervisorEmployeeId == supervisorEmployeeId);
    if (link != null)
    {
        _supervisorLinks.Remove(link);
        UpdateTimestamp();
    }
}
```

Also update `AssignToDepartment` — remove `supervisorId` parameter (it no longer belongs here):
```csharp
public void AssignToDepartment(Guid departmentId, Guid? headOfDepartmentId = null)
{
    DepartmentId = departmentId;
    HeadOfDepartmentId = headOfDepartmentId;
    UpdateTimestamp();
}
```

---

### Step 3 — EF Core configuration

**New file**: `ChatApp.Modules.Identity.Infrastructure/Persistence/Configurations/EmployeeSupervisorConfiguration.cs`

```csharp
public class EmployeeSupervisorConfiguration : IEntityTypeConfiguration<EmployeeSupervisor>
{
    public void Configure(EntityTypeBuilder<EmployeeSupervisor> builder)
    {
        builder.ToTable("employee_supervisors");

        builder.HasKey(es => new { es.EmployeeId, es.SupervisorEmployeeId });

        builder.Property(es => es.EmployeeId).HasColumnName("employee_id");
        builder.Property(es => es.SupervisorEmployeeId).HasColumnName("supervisor_employee_id");
        builder.Property(es => es.AssignedAtUtc)
            .HasColumnName("assigned_at_utc")
            .HasColumnType("timestamp with time zone");

        builder.HasOne(es => es.Employee)
            .WithMany(e => e.SupervisorLinks)
            .HasForeignKey(es => es.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(es => es.SupervisorEmployee)
            .WithMany(e => e.SubordinateLinks)
            .HasForeignKey(es => es.SupervisorEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(es => es.EmployeeId)
            .HasDatabaseName("ix_employee_supervisors_employee_id");

        builder.HasIndex(es => es.SupervisorEmployeeId)
            .HasDatabaseName("ix_employee_supervisors_supervisor_id");
    }
}
```

**Update `EmployeeConfiguration.cs`** — remove these blocks:
```csharp
// DELETE these:
builder.Property(e => e.SupervisorId).HasColumnName("supervisor_id");
builder.HasOne(e => e.Supervisor)
    .WithMany(e => e.Subordinates)
    .HasForeignKey(e => e.SupervisorId)
    .OnDelete(DeleteBehavior.SetNull);
builder.HasIndex(e => e.SupervisorId).HasDatabaseName("ix_employees_supervisor_id");
```

---

### Step 4 — Update existing commands

**`AssignSupervisorToEmployeeCommand.cs`** — refactor to use `AddSupervisor()`:

Key changes:
- Fetch employee by `UserId` (include `SupervisorLinks`)
- Fetch supervisor employee by `SupervisorId` (include their `User`)
- Call `employee.AddSupervisor(supervisorEmployee.Id)`
- Validate same company (via `User.CompanyId`) — no cross-company supervisors
- Validate no circular supervision (supervisor's supervisor is not the employee)

**`RemoveSupervisorFromEmployeeCommand.cs`** — add `SupervisorId` parameter:

```csharp
public record RemoveSupervisorFromEmployeeCommand(Guid UserId, Guid SupervisorId) : IRequest<Result>;
```

Change handler to call `employee.RemoveSupervisor(supervisorEmployee.Id)`.

---

### Step 5 — Update DTOs and queries

**`UserDetailDto.cs`** — replace single supervisor fields with list:

```csharp
// Remove:
Guid? SupervisorId,
string? SupervisorName,
string? SupervisorAvatarUrl,
string? SupervisorPosition,

// Add:
List<SupervisorDto> Supervisors,
List<SubordinateDto> Subordinates,
```

**New DTOs** (in same file or separate):
```csharp
public record SupervisorDto(
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    string? Position,
    DateTime AssignedAtUtc
);

public record SubordinateDto(
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    string? Position
);
```

**`GetUserQuery.cs`** and **`GetCurrentUserQuery.cs`** — update Include chain:

```csharp
.Include(u => u.Employee)
    .ThenInclude(e => e.SupervisorLinks)
        .ThenInclude(sl => sl.SupervisorEmployee)
            .ThenInclude(se => se.User)
                .ThenInclude(su => su.Employee)
                    .ThenInclude(emp => emp.Position)
.Include(u => u.Employee)
    .ThenInclude(e => e.SubordinateLinks)
        .ThenInclude(sl => sl.Employee)
            .ThenInclude(e => e.User)
```

Map to `SupervisorDto` list and `SubordinateDto` list when building `UserDetailDto`.

---

### Step 6 — Migration

Name: `AddEmployeeSupervisorTable`

Migration must:
1. Create `employee_supervisors` table with composite PK + FK constraints + indexes
2. Drop `supervisor_id` column from `employees` table
3. **Data migration**: If any `supervisor_id` values exist, insert them into `employee_supervisors` before dropping the column:

```sql
INSERT INTO employee_supervisors (employee_id, supervisor_employee_id, assigned_at_utc)
SELECT id, supervisor_id, NOW()
FROM employees
WHERE supervisor_id IS NOT NULL;
```

---

### Step 7 — Register new configuration

In `IdentityDbContext` (or wherever configurations are registered), add:
```csharp
new EmployeeSupervisorConfiguration()
```

Also register `EmployeeSupervisor` as a `DbSet` if needed.

---

## Files to Change

| File | Action |
|------|--------|
| `Identity.Domain/Entities/EmployeeSupervisor.cs` | **CREATE** |
| `Identity.Domain/Entities/Employee.cs` | Update — remove SupervisorId, add SupervisorLinks/SubordinateLinks |
| `Identity.Infrastructure/.../EmployeeSupervisorConfiguration.cs` | **CREATE** |
| `Identity.Infrastructure/.../EmployeeConfiguration.cs` | Update — remove supervisor_id block |
| `Identity.Application/Commands/Employees/AssignSupervisorToEmployeeCommand.cs` | Update — use AddSupervisor(), add company validation |
| `Identity.Application/Commands/Employees/RemoveSupervisorFromEmployeeCommand.cs` | Update — add SupervisorId param |
| `Identity.Application/DTOs/Responses/UserDetailDto.cs` | Update — single → list |
| `Identity.Application/Queries/GetUser/GetUserQuery.cs` | Update — new Include chain |
| `Identity.Application/Queries/GetUser/GetCurrentUserQuery.cs` | Update — new Include chain |
| `Identity.Infrastructure/Migrations/` | **CREATE** `AddEmployeeSupervisorTable` migration |

---

## Validation Rules

- Employee cannot be their own supervisor
- Supervisor must be in the same company as employee (via `User.CompanyId`)
- No circular supervision: if A supervises B, B cannot supervise A
- Idempotent add: assigning same supervisor twice is a no-op (not an error)

---

## Notes

- `HeadOfDepartmentId` on Employee is unchanged — it's a different denormalization, not related to this task
- Organization hierarchy query (`GetOrganizationHierarchyQuery`) uses denormalized `SupervisorName` string — does NOT use `SupervisorId` FK. No change needed there.
- The `AssignToDepartment` method loses its `supervisorId` parameter — check all callers and update
