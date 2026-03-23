using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddRegulationAcceptanceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AcceptedRegulation",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "RegulationAcceptedAt",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 23, 11, 6, 59, 735, DateTimeKind.Utc).AddTicks(5769));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 23, 11, 6, 59, 735, DateTimeKind.Utc).AddTicks(5771));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 23, 11, 6, 59, 979, DateTimeKind.Utc).AddTicks(5135));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AcceptedRegulation", "CreatedAt", "PasswordHash", "RegulationAcceptedAt" },
                values: new object[] { false, new DateTime(2026, 3, 23, 11, 6, 59, 979, DateTimeKind.Utc).AddTicks(3557), "$2a$11$eZZkKwH8gbhCtPLfe5OOw.T2dsA4QUPl8A2CyaEe1OZ4pA.uxaSvu", null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedRegulation",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RegulationAcceptedAt",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 18, 9, 35, 25, 182, DateTimeKind.Utc).AddTicks(9226));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 18, 9, 35, 25, 182, DateTimeKind.Utc).AddTicks(9228));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 18, 9, 35, 25, 352, DateTimeKind.Utc).AddTicks(8107));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 18, 9, 35, 25, 352, DateTimeKind.Utc).AddTicks(7513), "$2a$11$hXnHk/FkJl2XBDYbTWFCwOcuOR0PWtGVLH9qfXdwPzX9EGFJnEqmi" });
        }
    }
}
