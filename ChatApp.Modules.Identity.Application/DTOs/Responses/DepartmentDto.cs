namespace ChatApp.Modules.Identity.Application.DTOs.Responses
{
    public record DepartmentDto(
        Guid Id,
        Guid CompanyId,
        string Name,
        Guid? ParentDepartmentId,
        string? ParentDepartmentName,
        Guid? HeadOfDepartmentId,
        string? HeadOfDepartmentName,
        string? AvatarUrl,
        DateTime CreatedAtUtc);
}