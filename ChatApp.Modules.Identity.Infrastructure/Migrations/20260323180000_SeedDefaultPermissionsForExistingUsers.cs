using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultPermissionsForExistingUsers : Migration
    {
        // Default User role permissions — Permissions.GetDefaultForRole(Role.User) ilə eynidir
        private static readonly string[] DefaultPermissions =
        [
            "Users.Read",
            "Messages.Send",
            "Messages.Read",
            "Messages.Edit",
            "Messages.Delete",
            "Files.Upload",
            "Files.Delete",
            "Files.Download",
            "Channels.Create",
            "Channels.Read"
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Bütün mövcud istifadəçilərə default permission-ları əlavə et (əgər yoxdursa)
            foreach (var permission in DefaultPermissions)
            {
                migrationBuilder.Sql($@"
                    INSERT INTO user_permissions (id, user_id, permission_name, created_at_utc, updated_at_utc)
                    SELECT gen_random_uuid(), u.id, '{permission}', NOW(), NOW()
                    FROM users u
                    WHERE NOT EXISTS (
                        SELECT 1 FROM user_permissions up
                        WHERE up.user_id = u.id AND up.permission_name = '{permission}'
                    );
                ");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback — yalnız bu migration-ın əlavə etdiyi permission-ları silir
            foreach (var permission in DefaultPermissions)
            {
                migrationBuilder.Sql($@"
                    DELETE FROM user_permissions
                    WHERE permission_name = '{permission}';
                ");
            }
        }
    }
}
