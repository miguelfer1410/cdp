using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddEscalaoAgeAndSports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxAge",
                table: "Escalaos",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinAge",
                table: "Escalaos",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EscalaoSports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EscalaoId = table.Column<int>(type: "int", nullable: false),
                    SportId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EscalaoSports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EscalaoSports_Escalaos_EscalaoId",
                        column: x => x.EscalaoId,
                        principalTable: "Escalaos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EscalaoSports_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 26,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 27,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 28,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 29,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 33,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 34,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 35,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 4, 9, 14, 22, 945, DateTimeKind.Utc).AddTicks(2096));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 4, 9, 14, 22, 945, DateTimeKind.Utc).AddTicks(2097));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 4, 9, 14, 23, 246, DateTimeKind.Utc).AddTicks(3832));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 4, 9, 14, 23, 246, DateTimeKind.Utc).AddTicks(3308), "$2a$11$Ak49O0JcMV5K3A6qmVUg..6.6I4QiLSZi1iy.A9Rsw317bDmj9hK." });

            migrationBuilder.CreateIndex(
                name: "IX_EscalaoSports_EscalaoId",
                table: "EscalaoSports",
                column: "EscalaoId");

            migrationBuilder.CreateIndex(
                name: "IX_EscalaoSports_SportId",
                table: "EscalaoSports",
                column: "SportId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EscalaoSports");

            migrationBuilder.DropColumn(
                name: "MaxAge",
                table: "Escalaos");

            migrationBuilder.DropColumn(
                name: "MinAge",
                table: "Escalaos");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 2, 11, 49, 40, 514, DateTimeKind.Utc).AddTicks(6630));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 2, 11, 49, 40, 514, DateTimeKind.Utc).AddTicks(6634));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 2, 11, 49, 40, 719, DateTimeKind.Utc).AddTicks(1446));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 2, 11, 49, 40, 719, DateTimeKind.Utc).AddTicks(627), "$2a$11$NGBRMJUSJ75AKwCOCm9R4e00juLqOwtJX2tziCScAQJTyXiolS5ai" });
        }
    }
}
