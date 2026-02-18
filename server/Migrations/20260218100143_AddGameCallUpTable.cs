using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddGameCallUpTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GameCallUps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventId = table.Column<int>(type: "int", nullable: false),
                    AthleteId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameCallUps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GameCallUps_AthleteProfiles_AthleteId",
                        column: x => x.AthleteId,
                        principalTable: "AthleteProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GameCallUps_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 10, 1, 42, 774, DateTimeKind.Utc).AddTicks(2300));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 10, 1, 42, 774, DateTimeKind.Utc).AddTicks(2301));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 18, 10, 1, 42, 960, DateTimeKind.Utc).AddTicks(8330));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 18, 10, 1, 42, 960, DateTimeKind.Utc).AddTicks(7482), "$2a$11$/vPl.aKvvVuC0gBWbM9mc.dBNp6qeu.N2gRRzFwrhVRSSydy6.yKG" });

            migrationBuilder.CreateIndex(
                name: "IX_GameCallUps_AthleteId",
                table: "GameCallUps",
                column: "AthleteId");

            migrationBuilder.CreateIndex(
                name: "IX_GameCallUps_EventId_AthleteId",
                table: "GameCallUps",
                columns: new[] { "EventId", "AthleteId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GameCallUps");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 9, 40, 16, 773, DateTimeKind.Utc).AddTicks(4544));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 18, 9, 40, 16, 773, DateTimeKind.Utc).AddTicks(4546));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 18, 9, 40, 16, 977, DateTimeKind.Utc).AddTicks(550));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 18, 9, 40, 16, 976, DateTimeKind.Utc).AddTicks(9554), "$2a$11$zKwKq5xpGkd6fHhwQ23qleNGZlqaZCsuNKBTZIfA.B2dx/eutqEBy" });
        }
    }
}
