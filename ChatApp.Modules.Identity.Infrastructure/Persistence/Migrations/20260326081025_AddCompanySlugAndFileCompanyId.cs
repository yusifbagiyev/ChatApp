using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.Identity.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanySlugAndFileCompanyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "slug",
                table: "companies",
                type: "character varying(250)",
                maxLength: 250,
                nullable: false,
                defaultValue: "");

            // Mövcud şirkətlər üçün slug-ı addan generasiya et
            migrationBuilder.Sql(@"
                UPDATE companies
                SET slug = trim(both '-' from
                    regexp_replace(
                        regexp_replace(
                            regexp_replace(lower(trim(name)), '[^a-z0-9\s-]', '', 'g'),
                        '\s+', '-', 'g'),
                    '-+', '-', 'g'))
                WHERE slug = '';
            ");

            migrationBuilder.CreateIndex(
                name: "ix_companies_slug",
                table: "companies",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_companies_slug",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "slug",
                table: "companies");
        }
    }
}
