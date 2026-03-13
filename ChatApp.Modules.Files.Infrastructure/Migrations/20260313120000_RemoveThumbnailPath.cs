using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.Files.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveThumbnailPath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "thumbnail_path",
                table: "file_metadata");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "thumbnail_path",
                table: "file_metadata",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }
    }
}
