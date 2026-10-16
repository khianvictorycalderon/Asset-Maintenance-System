using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetRegistry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "assets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tag = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Active"),
                    condition = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Good"),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    criticality = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Medium"),
                    date_added = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "CURRENT_DATE"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "TIMEZONE('UTC', NOW())"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "TIMEZONE('UTC', NOW())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assets", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_assets_date_added",
                table: "assets",
                column: "date_added");

            migrationBuilder.CreateIndex(
                name: "IX_assets_tag",
                table: "assets",
                column: "tag",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "assets");
        }
    }
}
