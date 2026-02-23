using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyAssociationRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FamilyAssociationRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequesterId = table.Column<int>(type: "int", nullable: false),
                    FamilyMemberName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FamilyMemberNif = table.Column<string>(type: "nvarchar(9)", maxLength: 9, nullable: true),
                    FamilyMemberBirthDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RequesterMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    SeenAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamilyAssociationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FamilyAssociationRequests_Users_RequesterId",
                        column: x => x.RequesterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_FamilyAssociationRequests_RequesterId",
                table: "FamilyAssociationRequests",
                column: "RequesterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FamilyAssociationRequests");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 15, 46, 2, 732, DateTimeKind.Utc).AddTicks(5320));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 15, 46, 2, 732, DateTimeKind.Utc).AddTicks(5322));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 18, 15, 46, 2, 860, DateTimeKind.Utc).AddTicks(130));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 18, 15, 46, 2, 859, DateTimeKind.Utc).AddTicks(9824), "$2a$11$P2cLmzp5e7lCQR77s1Vr0O7/px83krXhwLd0j2GyZFXEOuqzLuAkO" });
        }
    }
}
