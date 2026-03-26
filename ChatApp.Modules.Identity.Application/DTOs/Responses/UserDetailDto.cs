namespace ChatApp.Modules.Identity.Application.DTOs.Responses
{
    /// <summary>
    /// İstifadəçi detalları. Role field-indən isAdmin/isSuperAdmin derive olunur.
    /// Supervisors — many-to-many siyahısı (köhnə single SupervisorId əvəzinə).
    /// </summary>
    public record UserDetailDto(
        Guid Id,
        string FirstName,
        string LastName,
        string Email,
        string Role,
        Guid? CompanyId,
        string? Position,
        Guid? PositionId,
        string? AvatarUrl,
        string? AboutMe,
        DateTime? DateOfBirth,
        string? WorkPhone,
        DateTime? HiringDate,
        DateTime? LastVisit,
        bool IsActive,
        Guid? DepartmentId,
        string? DepartmentName,
        List<SupervisorDto> Supervisors,
        bool IsHeadOfDepartment,
        string? HeadOfDepartmentName,
        List<SubordinateDto> Subordinates,
        List<string> Permissions,
        DateTime CreatedAtUtc,
        DateTime UpdatedAtUtc,
        DateTime? PasswordChangedAt)
    {
        public string FullName => $"{FirstName} {LastName}";
    };

    public record SupervisorDto(
        Guid UserId,
        string FullName,
        string? AvatarUrl,
        string? Position,
        DateTime AssignedAtUtc);

    public record SubordinateDto(
        Guid Id,
        string FullName,
        string? Position,
        string? AvatarUrl,
        bool IsActive);
}
