using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.Identity.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiCompanySupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_companies_users_head_of_company_id",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "is_super_admin",
                table: "users");

            migrationBuilder.AddColumn<Guid>(
                name: "company_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "companies",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "companies",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "logo_url",
                table: "companies",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_company_id",
                table: "users",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "ix_companies_is_active",
                table: "companies",
                column: "is_active");

            migrationBuilder.AddForeignKey(
                name: "FK_companies_users_head_of_company_id",
                table: "companies",
                column: "head_of_company_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_users_companies_company_id",
                table: "users",
                column: "company_id",
                principalTable: "companies",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_companies_users_head_of_company_id",
                table: "companies");

            migrationBuilder.DropForeignKey(
                name: "FK_users_companies_company_id",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_users_company_id",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_companies_is_active",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "company_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "description",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "is_active",
                table: "companies");

            migrationBuilder.DropColumn(
                name: "logo_url",
                table: "companies");

            migrationBuilder.AddColumn<bool>(
                name: "is_super_admin",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_companies_users_head_of_company_id",
                table: "companies",
                column: "head_of_company_id",
                principalTable: "users",
                principalColumn: "id");
        }
    }
}
