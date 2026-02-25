using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNormalFeesToSport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FeeNormalNormal",
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeeNormalNormal",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "FeeNormalSibling",
                table: "Sports");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 25, 9, 59, 29, 72, DateTimeKind.Utc).AddTicks(6703));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 25, 9, 59, 29, 72, DateTimeKind.Utc).AddTicks(6708));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 25, 9, 59, 29, 195, DateTimeKind.Utc).AddTicks(4834));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 25, 9, 59, 29, 195, DateTimeKind.Utc).AddTicks(4355), "$2a$11$vW2QxjcpKuIPHva89hMFmO20WIuLbs58PtvDAvxL7yJXOCaw7NBSa" });
        }
    }
}
