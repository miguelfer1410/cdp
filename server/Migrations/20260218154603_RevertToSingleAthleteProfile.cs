using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class RevertToSingleAthleteProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AthleteProfiles_UserId",
                table: "AthleteProfiles");

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

            // Remove duplicate AthleteProfiles per user, keeping only the one with the lowest Id
            // This is needed because the previous migration allowed multiple profiles per user
            migrationBuilder.Sql(@"
                DELETE FROM ""AthleteProfiles""
                WHERE ""Id"" NOT IN (
                    SELECT MIN(""Id"")
                    FROM ""AthleteProfiles""
                    GROUP BY ""UserId""
                )
            ");

            migrationBuilder.CreateIndex(
                name: "IX_AthleteProfiles_UserId",
                table: "AthleteProfiles",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AthleteProfiles_UserId",
                table: "AthleteProfiles");

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
    }
}
