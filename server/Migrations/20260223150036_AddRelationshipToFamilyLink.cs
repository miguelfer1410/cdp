using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddRelationshipToFamilyLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Relationship",
                table: "UserFamilyLinks",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 23, 15, 0, 36, 157, DateTimeKind.Utc).AddTicks(1026));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 23, 15, 0, 36, 157, DateTimeKind.Utc).AddTicks(1028));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 23, 15, 0, 36, 278, DateTimeKind.Utc).AddTicks(1010));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 23, 15, 0, 36, 278, DateTimeKind.Utc).AddTicks(596), "$2a$11$aVm.nqn4L3zLhuUPxd3sbuoKKiPWNnhB5vsPyIZr6MZT5ubnFPe1." });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Relationship",
                table: "UserFamilyLinks");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 23, 10, 33, 34, 314, DateTimeKind.Utc).AddTicks(5462));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 23, 10, 33, 34, 314, DateTimeKind.Utc).AddTicks(5464));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 23, 10, 33, 34, 449, DateTimeKind.Utc).AddTicks(8183));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 23, 10, 33, 34, 449, DateTimeKind.Utc).AddTicks(7763), "$2a$11$PpMqDJaN7Mfs5WrsF8Ro6OutWR1jIfNNWUpcKhcgjgdWhxmsUTU8K" });
        }
    }
}
