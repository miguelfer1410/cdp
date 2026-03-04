using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddGenderToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Gender",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 4, 10, 10, 11, 446, DateTimeKind.Utc).AddTicks(8197));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 4, 10, 10, 11, 446, DateTimeKind.Utc).AddTicks(8199));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 4, 10, 10, 11, 580, DateTimeKind.Utc).AddTicks(2271));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Gender", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 4, 10, 10, 11, 580, DateTimeKind.Utc).AddTicks(1817), 3, "$2a$11$t8EB7lWuZTDGMuDpoDVsg.OWnJVc0FXIW83Zsv9zohwGisfe4dwdC" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 4, 9, 39, 1, 546, DateTimeKind.Utc).AddTicks(2507));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 4, 9, 39, 1, 546, DateTimeKind.Utc).AddTicks(2509));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 4, 9, 39, 1, 671, DateTimeKind.Utc).AddTicks(5029));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 4, 9, 39, 1, 671, DateTimeKind.Utc).AddTicks(4562), "$2a$11$pzBncG7s9Lc7/xz9jqjSc.tcb5BXvWwisXaZnsaFmGfBwgqhA5bDi" });
        }
    }
}
