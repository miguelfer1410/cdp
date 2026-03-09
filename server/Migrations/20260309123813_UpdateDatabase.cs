using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 12, 38, 12, 570, DateTimeKind.Utc).AddTicks(91));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 12, 38, 12, 570, DateTimeKind.Utc).AddTicks(93));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 9, 12, 38, 12, 704, DateTimeKind.Utc).AddTicks(3474));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 9, 12, 38, 12, 704, DateTimeKind.Utc).AddTicks(2986), "$2a$11$67F/Ym2pBxkpNiEvtOaVxuiyjUl1VWPrj17Z5z8Zl.p/pgq08KNN." });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 10, 24, 5, 607, DateTimeKind.Utc).AddTicks(7380));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 10, 24, 5, 607, DateTimeKind.Utc).AddTicks(7382));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 9, 10, 24, 5, 777, DateTimeKind.Utc).AddTicks(7397));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 9, 10, 24, 5, 777, DateTimeKind.Utc).AddTicks(6715), "$2a$11$TIAkdgi/AaWAYqhn6PT4hOTBJD/AbCMt6wO6KDL9VYiZyd/2FGK5G" });
        }
    }
}
