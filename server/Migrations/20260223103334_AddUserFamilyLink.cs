using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUserFamilyLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserFamilyLinks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LinkedUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFamilyLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserFamilyLinks_Users_LinkedUserId",
                        column: x => x.LinkedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserFamilyLinks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_UserFamilyLinks_LinkedUserId",
                table: "UserFamilyLinks",
                column: "LinkedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFamilyLinks_UserId_LinkedUserId",
                table: "UserFamilyLinks",
                columns: new[] { "UserId", "LinkedUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserFamilyLinks");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 23, 10, 14, 40, 544, DateTimeKind.Utc).AddTicks(9337));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 23, 10, 14, 40, 544, DateTimeKind.Utc).AddTicks(9339));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 23, 10, 14, 40, 665, DateTimeKind.Utc).AddTicks(9053));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 23, 10, 14, 40, 665, DateTimeKind.Utc).AddTicks(8539), "$2a$11$jtJU6Svlb6jx9bZazJ/05uogPADXzWIlE/QDHVH0QSUFjW0wg.Cwe" });
        }
    }
}
