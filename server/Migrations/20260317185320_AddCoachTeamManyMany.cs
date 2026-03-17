using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCoachTeamManyMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CoachProfiles_Teams_TeamId",
                table: "CoachProfiles");

            migrationBuilder.DropIndex(
                name: "IX_CoachProfiles_TeamId",
                table: "CoachProfiles");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "CoachProfiles");

            migrationBuilder.CreateTable(
                name: "CoachTeams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CoachProfileId = table.Column<int>(type: "int", nullable: false),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachTeams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachTeams_CoachProfiles_CoachProfileId",
                        column: x => x.CoachProfileId,
                        principalTable: "CoachProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CoachTeams_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "IX_CoachTeams_CoachProfileId_TeamId",
                table: "CoachTeams",
                columns: new[] { "CoachProfileId", "TeamId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CoachTeams_TeamId",
                table: "CoachTeams",
                column: "TeamId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoachTeams");

            migrationBuilder.AddColumn<int>(
                name: "TeamId",
                table: "CoachProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 16, 15, 32, 11, 69, DateTimeKind.Utc).AddTicks(3997));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 16, 15, 32, 11, 69, DateTimeKind.Utc).AddTicks(3999));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 16, 15, 32, 11, 188, DateTimeKind.Utc).AddTicks(6070));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 16, 15, 32, 11, 188, DateTimeKind.Utc).AddTicks(5639), "$2a$11$dLTRbu3j2IBeMQMXHzFmb.9Qk3m.Hm1b14oYkM/zvKQKjKJV0THWq" });

            migrationBuilder.CreateIndex(
                name: "IX_CoachProfiles_TeamId",
                table: "CoachProfiles",
                column: "TeamId");

            migrationBuilder.AddForeignKey(
                name: "FK_CoachProfiles_Teams_TeamId",
                table: "CoachProfiles",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
