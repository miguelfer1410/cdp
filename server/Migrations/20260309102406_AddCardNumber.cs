using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCardNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CardNumber",
                table: "MemberProfiles",
                type: "int",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CardNumber",
                table: "MemberProfiles");

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
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 4, 10, 10, 11, 580, DateTimeKind.Utc).AddTicks(1817), "$2a$11$t8EB7lWuZTDGMuDpoDVsg.OWnJVc0FXIW83Zsv9zohwGisfe4dwdC" });
        }
    }
}
