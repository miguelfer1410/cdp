using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Users",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BirthDate",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nif",
                table: "Users",
                type: "nvarchar(9)",
                maxLength: 9,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "Users",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Address", "BirthDate", "City", "CreatedAt", "Nif", "PasswordHash", "Phone", "PostalCode" },
                values: new object[] { null, null, null, new DateTime(2026, 2, 2, 9, 32, 28, 920, DateTimeKind.Utc).AddTicks(8964), null, "$2a$11$HegCNxIkAF4FcJx5qrL5d.A9tdk7DDdA4UxR7slTsPNnthmbnpMqC", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BirthDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Nif",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 1, 28, 14, 36, 43, 218, DateTimeKind.Utc).AddTicks(5232), "$2a$11$6fh46OG14o7yedhUIHS5u.X2ExeybpAtgUclcgmyPjSQBe.eunIda" });
        }
    }
}
