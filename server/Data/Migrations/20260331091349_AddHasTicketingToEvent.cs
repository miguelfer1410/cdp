using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHasTicketingToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasTicketing",
                table: "Events",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 31, 9, 13, 47, 806, DateTimeKind.Utc).AddTicks(6781));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 31, 9, 13, 47, 806, DateTimeKind.Utc).AddTicks(6785));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 31, 9, 13, 48, 8, DateTimeKind.Utc).AddTicks(7711));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 31, 9, 13, 48, 8, DateTimeKind.Utc).AddTicks(6467), "$2a$11$61ntHS.X6dJVGnzYFz2jU.JZxAyv/WbNfhs9tzHOZ/EdBk1LvZ3.2" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasTicketing",
                table: "Events");

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
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 30, 8, 29, 27, 162, DateTimeKind.Utc).AddTicks(1276), "$2a$11$CQBZISWrPbEnyxLghvRQK.TEMi6x8.LayUWIe9TGhX2vuNDGc0hES" });
        }
    }
}
