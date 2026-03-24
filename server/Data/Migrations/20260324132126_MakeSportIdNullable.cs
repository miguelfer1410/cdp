using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeSportIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "SportId",
                table: "Events",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 24, 13, 21, 25, 375, DateTimeKind.Utc).AddTicks(8159));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 24, 13, 21, 25, 375, DateTimeKind.Utc).AddTicks(8160));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 24, 13, 21, 25, 516, DateTimeKind.Utc).AddTicks(5528));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 24, 13, 21, 25, 516, DateTimeKind.Utc).AddTicks(4894), "$2a$11$8JfeMGNUTCy6uOOu02iNlevdMIzh5pMRrR.YDAXTZ8ZI9BiaaRSXy" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "SportId",
                table: "Events",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 23, 11, 20, 57, 906, DateTimeKind.Utc).AddTicks(7645));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 23, 11, 20, 57, 906, DateTimeKind.Utc).AddTicks(7647));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 23, 11, 20, 58, 45, DateTimeKind.Utc).AddTicks(4145));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 23, 11, 20, 58, 45, DateTimeKind.Utc).AddTicks(3638), "$2a$11$ouXqMlPbaiUJSxMFZLo9MO2udkVdlaurx3T.TnOG82Oo3qkFzlDrS" });
        }
    }
}
