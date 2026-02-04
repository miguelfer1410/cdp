using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactInfo",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "Schedule",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "InstitutionalPartners");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "InstitutionalPartners");

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetToken",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetTokenExpires",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "MemberSince", "PasswordHash", "PasswordResetToken", "PasswordResetTokenExpires" },
                values: new object[] { new DateTime(2026, 2, 4, 14, 47, 57, 824, DateTimeKind.Utc).AddTicks(5955), new DateTime(2026, 2, 4, 14, 47, 57, 824, DateTimeKind.Utc).AddTicks(5948), "$2a$11$KgBx5YVd9jU8bTX.Fb0fZuKlLazpxRaHK7TKhzpET4CntpzIH5eG.", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordResetToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PasswordResetTokenExpires",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "ContactInfo",
                table: "Sports",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "Sports",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Schedule",
                table: "Sports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "InstitutionalPartners",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "InstitutionalPartners",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "MemberSince", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 4, 11, 20, 55, 736, DateTimeKind.Utc).AddTicks(2856), new DateTime(2026, 2, 4, 11, 20, 55, 736, DateTimeKind.Utc).AddTicks(2851), "$2a$11$Xmm7cvZz6aeZs85GbJNazu3XjAlWPz45l83i9HI6JI7BtsFPeLRCW" });
        }
    }
}
