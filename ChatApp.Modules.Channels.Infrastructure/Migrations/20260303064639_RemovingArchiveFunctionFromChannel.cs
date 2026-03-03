using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.Channels.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemovingArchiveFunctionFromChannel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_channels_is_archived",
                table: "channels");

            migrationBuilder.DropColumn(
                name: "archived_at_utc",
                table: "channels");

            migrationBuilder.DropColumn(
                name: "is_archived",
                table: "channels");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "archived_at_utc",
                table: "channels",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_archived",
                table: "channels",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_channels_is_archived",
                table: "channels",
                column: "is_archived");
        }
    }
}
