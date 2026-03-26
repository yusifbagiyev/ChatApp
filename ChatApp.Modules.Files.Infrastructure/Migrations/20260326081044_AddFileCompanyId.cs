using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.Files.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFileCompanyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "company_id",
                table: "file_metadata",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_file_metadata_company_id",
                table: "file_metadata",
                column: "company_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_file_metadata_company_id",
                table: "file_metadata");

            migrationBuilder.DropColumn(
                name: "company_id",
                table: "file_metadata");
        }
    }
}
