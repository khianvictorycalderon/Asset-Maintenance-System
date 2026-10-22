using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignmentsEmployeeLogic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "asset_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    asset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    supervisor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_by = table.Column<Guid>(type: "uuid", nullable: true),
                    date_assigned = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "CURRENT_DATE"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "TIMEZONE('UTC', NOW())"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "TIMEZONE('UTC', NOW())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_asset_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_asset_assignments_assets_asset_id",
                        column: x => x.asset_id,
                        principalTable: "assets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_asset_assignments_users_assigned_by",
                        column: x => x.assigned_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_asset_assignments_users_supervisor_id",
                        column: x => x.supervisor_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "personnel_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    personnel_id = table.Column<Guid>(type: "uuid", nullable: false),
                    supervisor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_by = table.Column<Guid>(type: "uuid", nullable: true),
                    date_assigned = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "CURRENT_DATE"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "TIMEZONE('UTC', NOW())"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "TIMEZONE('UTC', NOW())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_personnel_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_personnel_assignments_users_assigned_by",
                        column: x => x.assigned_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_personnel_assignments_users_personnel_id",
                        column: x => x.personnel_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_personnel_assignments_users_supervisor_id",
                        column: x => x.supervisor_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_asset_assignments_asset_id",
                table: "asset_assignments",
                column: "asset_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_asset_assignments_assigned_by",
                table: "asset_assignments",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "IX_asset_assignments_date_assigned",
                table: "asset_assignments",
                column: "date_assigned");

            migrationBuilder.CreateIndex(
                name: "IX_asset_assignments_supervisor_id",
                table: "asset_assignments",
                column: "supervisor_id");

            migrationBuilder.CreateIndex(
                name: "IX_personnel_assignments_assigned_by",
                table: "personnel_assignments",
                column: "assigned_by");

            migrationBuilder.CreateIndex(
                name: "IX_personnel_assignments_date_assigned",
                table: "personnel_assignments",
                column: "date_assigned");

            migrationBuilder.CreateIndex(
                name: "IX_personnel_assignments_personnel_id",
                table: "personnel_assignments",
                column: "personnel_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_personnel_assignments_supervisor_id",
                table: "personnel_assignments",
                column: "supervisor_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "asset_assignments");

            migrationBuilder.DropTable(
                name: "personnel_assignments");
        }
    }
}
