using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomQuotaPriceToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CustomQuotaPrice",
                table: "Users",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 8, 29, 26, 973, DateTimeKind.Utc).AddTicks(6781));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 30, 8, 29, 26, 973, DateTimeKind.Utc).AddTicks(6785));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 30, 8, 29, 27, 162, DateTimeKind.Utc).AddTicks(2065));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "CustomQuotaPrice", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 30, 8, 29, 27, 162, DateTimeKind.Utc).AddTicks(1276), null, "$2a$11$CQBZISWrPbEnyxLghvRQK.TEMi6x8.LayUWIe9TGhX2vuNDGc0hES" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomQuotaPrice",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 27, 15, 30, 11, 797, DateTimeKind.Utc).AddTicks(8227));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 27, 15, 30, 11, 797, DateTimeKind.Utc).AddTicks(8229));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 27, 15, 30, 11, 930, DateTimeKind.Utc).AddTicks(2596));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 27, 15, 30, 11, 930, DateTimeKind.Utc).AddTicks(2116), "$2a$11$FmRu.jycvN6bmJYC8ge5OuO6i1tZycn4L5zh4dlgPdb0V5.wBCt7C" });
        }
    }
}
