using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace ChatApp.Shared.Infrastructure.Authorization
{
    public class PermissionAuthorizationHandler(
        ILogger<PermissionAuthorizationHandler> logger) : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
                return Task.CompletedTask;

            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";

            // SuperAdmin bütün permission yoxlamalarını bypass edir
            var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (roleClaim == "SuperAdmin")
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            // JWT-dəki permission claim-lərdən yoxla
            var permissions = context.User.FindAll("permission").Select(c => c.Value).ToList();

            if (permissions.Contains(requirement.PermissionName))
            {
                context.Succeed(requirement);
            }
            else
            {
                logger.LogWarning(
                    "User {UserId} does not have required permission {Permission}. User permissions: {UserPermissions}",
                    userId,
                    requirement.PermissionName,
                    string.Join(", ", permissions));
            }

            return Task.CompletedTask;
        }
    }
}
