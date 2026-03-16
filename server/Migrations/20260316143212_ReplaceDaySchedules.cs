using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceDaySchedules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 16, 14, 32, 11, 573, DateTimeKind.Utc).AddTicks(8116));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 16, 14, 32, 11, 573, DateTimeKind.Utc).AddTicks(8118));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 16, 14, 32, 11, 708, DateTimeKind.Utc).AddTicks(9168));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 16, 14, 32, 11, 708, DateTimeKind.Utc).AddTicks(8718), "$2a$11$NULTco5.SOMFh7lsnoawV.mh/RDTnN5l4rG7nK.OsX1WW2Q89xDc." });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 16, 14, 26, 51, 304, DateTimeKind.Utc).AddTicks(8007));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 16, 14, 26, 51, 304, DateTimeKind.Utc).AddTicks(8008));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 16, 14, 26, 51, 463, DateTimeKind.Utc).AddTicks(8007));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 16, 14, 26, 51, 463, DateTimeKind.Utc).AddTicks(7260), "$2a$11$FpQ3tLFtzIDLQK5jeRwg7uC3EtDFMwFcQP2VWLUh1QnzXqgoHPudq" });
        }
    }
}
