using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AcceptRejectFamilyRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 11, 9, 36, 56, 581, DateTimeKind.Utc).AddTicks(1771));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 11, 9, 36, 56, 581, DateTimeKind.Utc).AddTicks(1773));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 11, 9, 36, 56, 699, DateTimeKind.Utc).AddTicks(9323));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 11, 9, 36, 56, 699, DateTimeKind.Utc).AddTicks(8886), "$2a$11$BIsIu14lAbUfG7cZtyOHD.tFf35O4DgLz.j/J6.IBa2aRkKrHANqS" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 14, 28, 20, 368, DateTimeKind.Utc).AddTicks(5553));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 14, 28, 20, 368, DateTimeKind.Utc).AddTicks(5554));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 9, 14, 28, 20, 490, DateTimeKind.Utc).AddTicks(6123));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 9, 14, 28, 20, 490, DateTimeKind.Utc).AddTicks(5768), "$2a$11$xr5UzZc5MgqZ6eIF3CTklOG6QHGOWGqnCqUd.d33LeZswbZno6Sja" });
        }
    }
}
