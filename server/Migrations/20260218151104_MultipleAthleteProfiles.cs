using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class MultipleAthleteProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AthleteProfiles_UserId",
                table: "AthleteProfiles");

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "AthleteProfiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "AthleteProfiles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 15, 11, 4, 281, DateTimeKind.Utc).AddTicks(5998));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 15, 11, 4, 281, DateTimeKind.Utc).AddTicks(6000));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 18, 15, 11, 4, 401, DateTimeKind.Utc).AddTicks(3361));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 18, 15, 11, 4, 401, DateTimeKind.Utc).AddTicks(2831), "$2a$11$qMHikwx5RivDaXo4KSvWw.TyRpt8ocps143a0cjQfWoDkY6ykJBjy" });

            migrationBuilder.CreateIndex(
                name: "IX_AthleteProfiles_UserId",
                table: "AthleteProfiles",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AthleteProfiles_UserId",
                table: "AthleteProfiles");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "AthleteProfiles");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "AthleteProfiles");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 11, 2, 34, 619, DateTimeKind.Utc).AddTicks(3666));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 11, 2, 34, 619, DateTimeKind.Utc).AddTicks(3668));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 18, 11, 2, 34, 754, DateTimeKind.Utc).AddTicks(6747));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 18, 11, 2, 34, 754, DateTimeKind.Utc).AddTicks(6065), "$2a$11$WUbpKx.7ZuLazSe0sgzCCuZCxkpGYBqn3VBT83t4KvPwcNtwHI4uu" });

            migrationBuilder.CreateIndex(
                name: "IX_AthleteProfiles_UserId",
                table: "AthleteProfiles",
                column: "UserId",
                unique: true);
        }
    }
}
