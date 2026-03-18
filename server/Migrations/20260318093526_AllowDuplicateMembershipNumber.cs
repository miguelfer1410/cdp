using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AllowDuplicateMembershipNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MemberProfiles_MembershipNumber",
                table: "MemberProfiles");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 18, 9, 35, 25, 182, DateTimeKind.Utc).AddTicks(9226));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 18, 9, 35, 25, 182, DateTimeKind.Utc).AddTicks(9228));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 18, 9, 35, 25, 352, DateTimeKind.Utc).AddTicks(8107));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 18, 9, 35, 25, 352, DateTimeKind.Utc).AddTicks(7513), "$2a$11$hXnHk/FkJl2XBDYbTWFCwOcuOR0PWtGVLH9qfXdwPzX9EGFJnEqmi" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberProfiles_MembershipNumber",
                table: "MemberProfiles",
                column: "MembershipNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MemberProfiles_MembershipNumber",
                table: "MemberProfiles");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 17, 18, 53, 19, 786, DateTimeKind.Utc).AddTicks(6558));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 17, 18, 53, 19, 786, DateTimeKind.Utc).AddTicks(6562));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 17, 18, 53, 19, 931, DateTimeKind.Utc).AddTicks(9778));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 17, 18, 53, 19, 931, DateTimeKind.Utc).AddTicks(9240), "$2a$11$sm2eLsOXxDi91Z1UBP56deLlvtusAy0JEkifZt.H2TSBw0k5tl.U2" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberProfiles_MembershipNumber",
                table: "MemberProfiles",
                column: "MembershipNumber",
                unique: true);
        }
    }
}
