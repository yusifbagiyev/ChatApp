using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.Channels.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChannelCompanyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_channels_name",
                table: "channels");

            migrationBuilder.AddColumn<Guid>(
                name: "company_id",
                table: "channels",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // Mövcud kanalları seed şirkətinə aid et
            migrationBuilder.Sql(@"
                UPDATE channels
                SET company_id = '20000000-0000-0000-0000-000000000001'
                WHERE company_id = '00000000-0000-0000-0000-000000000000';
            ");

            migrationBuilder.CreateIndex(
                name: "ix_channels_company_id",
                table: "channels",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "ix_channels_company_name",
                table: "channels",
                columns: new[] { "company_id", "name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_channels_company_id",
                table: "channels");

            migrationBuilder.DropIndex(
                name: "ix_channels_company_name",
                table: "channels");

            migrationBuilder.DropColumn(
                name: "company_id",
                table: "channels");

            migrationBuilder.CreateIndex(
                name: "ix_channels_name",
                table: "channels",
                column: "name",
                unique: true);
        }
    }
}
