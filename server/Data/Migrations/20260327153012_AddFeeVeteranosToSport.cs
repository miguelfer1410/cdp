using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFeeVeteranosToSport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FeeVeteranos",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeeVeteranos",
                table: "Sports");

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
    }
}
