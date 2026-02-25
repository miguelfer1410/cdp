using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyFeeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeeEscalao1Sibling",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "FeeEscalao2Sibling",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "FeeNormalSibling",
                table: "Sports");

            migrationBuilder.RenameColumn(
                name: "InscriptionFeeDiscount",
                table: "Sports",
                newName: "FeeDiscount");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 25, 15, 36, 44, 859, DateTimeKind.Utc).AddTicks(4624));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 25, 15, 36, 44, 859, DateTimeKind.Utc).AddTicks(4626));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 25, 15, 36, 44, 991, DateTimeKind.Utc).AddTicks(781));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 25, 15, 36, 44, 991, DateTimeKind.Utc).AddTicks(289), "$2a$11$NqbT6S1d9fF73ih5N0B4ROrgAF.Ir5iY/eb1W/RB5UfWHOHjRYQdC" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FeeDiscount",
                table: "Sports",
                newName: "InscriptionFeeDiscount");

            migrationBuilder.AddColumn<decimal>(
                name: "FeeEscalao1Sibling",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FeeEscalao2Sibling",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FeeNormalSibling",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 25, 12, 32, 43, 210, DateTimeKind.Utc).AddTicks(2637));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 25, 12, 32, 43, 210, DateTimeKind.Utc).AddTicks(2639));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 25, 12, 32, 43, 332, DateTimeKind.Utc).AddTicks(8292));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 25, 12, 32, 43, 332, DateTimeKind.Utc).AddTicks(7839), "$2a$11$OLbwsl.eZOtgk88hoRge5uXrui64wwgwk4ydRRY9WIkpGs9mBVp3u" });
        }
    }
}
