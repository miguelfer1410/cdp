using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMinisInscriptionFees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "InscriptionFeeMinis",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "InscriptionFeeMinisDiscount",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InscriptionFeeMinis",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "InscriptionFeeMinisDiscount",
                table: "Sports");

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
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 23, 11, 6, 59, 979, DateTimeKind.Utc).AddTicks(3557), "$2a$11$eZZkKwH8gbhCtPLfe5OOw.T2dsA4QUPl8A2CyaEe1OZ4pA.uxaSvu" });
        }
    }
}
