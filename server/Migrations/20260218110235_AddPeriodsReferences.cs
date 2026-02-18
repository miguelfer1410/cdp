using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPeriodsReferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PeriodMonth",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PeriodYear",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 11, 2, 34, 619, DateTimeKind.Utc).AddTicks(3666));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 11, 2, 34, 619, DateTimeKind.Utc).AddTicks(3668));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 18, 11, 2, 34, 754, DateTimeKind.Utc).AddTicks(6747));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 18, 11, 2, 34, 754, DateTimeKind.Utc).AddTicks(6065), "$2a$11$WUbpKx.7ZuLazSe0sgzCCuZCxkpGYBqn3VBT83t4KvPwcNtwHI4uu" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PeriodMonth",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PeriodYear",
                table: "Payments");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 10, 47, 56, 109, DateTimeKind.Utc).AddTicks(8836));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 10, 47, 56, 109, DateTimeKind.Utc).AddTicks(8838));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 18, 10, 47, 56, 232, DateTimeKind.Utc).AddTicks(1801));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 18, 10, 47, 56, 232, DateTimeKind.Utc).AddTicks(1295), "$2a$11$RabPw.mDpDFE9JzUd9cKu.xufVjqxPtqsi1oaGPOHilcGIQ6BuLR2" });
        }
    }
}
