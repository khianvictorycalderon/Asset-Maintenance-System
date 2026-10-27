using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "maintenance_tasks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    supervisor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_by = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "TIMEZONE('UTC', NOW())"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "TIMEZONE('UTC', NOW())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_maintenance_tasks", x => x.id);
                    table.ForeignKey(
                        name: "FK_maintenance_tasks_users_assigned_by",
                        column: x => x.assigned_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_maintenance_tasks_users_supervisor_id",
                        column: x => x.supervisor_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "maintenance_task_assignees",
                columns: table => new
                {
                    task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    personnel_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_maintenance_task_assignees", x => new { x.task_id, x.personnel_id });
                    table.ForeignKey(
                        name: "FK_maintenance_task_assignees_maintenance_tasks_task_id",
                        column: x => x.task_id,
                        principalTable: "maintenance_tasks",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_maintenance_task_assignees_users_personnel_id",
                        column: x => x.personnel_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_task_assignees_personnel_id",
                table: "maintenance_task_assignees",
                column: "personnel_id");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_tasks_assigned_by",
                table: "maintenance_tasks",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_tasks_status",
                table: "maintenance_tasks",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_tasks_supervisor_id_due_at",
                table: "maintenance_tasks",
                columns: new[] { "supervisor_id", "due_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "maintenance_task_assignees");

            migrationBuilder.DropTable(
                name: "maintenance_tasks");
        }
    }
}
