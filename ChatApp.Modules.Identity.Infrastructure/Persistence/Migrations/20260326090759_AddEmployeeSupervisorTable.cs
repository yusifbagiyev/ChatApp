using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.Identity.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeSupervisorTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Əvvəlcə yeni cədvəli yarat
            migrationBuilder.CreateTable(
                name: "employee_supervisors",
                columns: table => new
                {
                    employee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    supervisor_employee_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_employee_supervisors", x => new { x.employee_id, x.supervisor_employee_id });
                    table.ForeignKey(
                        name: "FK_employee_supervisors_employees_employee_id",
                        column: x => x.employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_employee_supervisors_employees_supervisor_employee_id",
                        column: x => x.supervisor_employee_id,
                        principalTable: "employees",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_employee_supervisors_employee_id",
                table: "employee_supervisors",
                column: "employee_id");

            migrationBuilder.CreateIndex(
                name: "ix_employee_supervisors_supervisor_id",
                table: "employee_supervisors",
                column: "supervisor_employee_id");

            // Mövcud supervisor_id dəyərlərini yeni many-to-many cədvələ köçür
            migrationBuilder.Sql(@"
                INSERT INTO employee_supervisors (employee_id, supervisor_employee_id, assigned_at_utc)
                SELECT id, supervisor_id, NOW() AT TIME ZONE 'UTC'
                FROM employees
                WHERE supervisor_id IS NOT NULL;
            ");

            // Köhnə supervisor_id kolonunu sil
            migrationBuilder.DropForeignKey(
                name: "FK_employees_employees_supervisor_id",
                table: "employees");

            migrationBuilder.DropIndex(
                name: "ix_employees_supervisor_id",
                table: "employees");

            migrationBuilder.DropColumn(
                name: "supervisor_id",
                table: "employees");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "employee_supervisors");

            migrationBuilder.AddColumn<Guid>(
                name: "supervisor_id",
                table: "employees",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_employees_supervisor_id",
                table: "employees",
                column: "supervisor_id");

            migrationBuilder.AddForeignKey(
                name: "FK_employees_employees_supervisor_id",
                table: "employees",
                column: "supervisor_id",
                principalTable: "employees",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
