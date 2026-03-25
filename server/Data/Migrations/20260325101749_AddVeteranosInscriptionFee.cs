using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVeteranosInscriptionFee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "InscriptionFeeVeteranos",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 25, 10, 17, 48, 249, DateTimeKind.Utc).AddTicks(4743));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 25, 10, 17, 48, 249, DateTimeKind.Utc).AddTicks(4745));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 25, 10, 17, 48, 426, DateTimeKind.Utc).AddTicks(2281));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 25, 10, 17, 48, 426, DateTimeKind.Utc).AddTicks(1479), "$2a$11$/7ACemWl/25NzCdzNalI7.8WQcDYMtfkplOLcAbSrBIcf2Xx2lZRa" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InscriptionFeeVeteranos",
                table: "Sports");

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
    }
}
