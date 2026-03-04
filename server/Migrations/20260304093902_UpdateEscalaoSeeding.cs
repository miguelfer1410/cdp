using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEscalaoSeeding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EscalaoSports_EscalaoId",
                table: "EscalaoSports");

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 7, 0 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 9, 8 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 11, 10 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 13, 12 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 15, 14 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 17, 16 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 19, 18 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 99, 20 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 6, 0 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 11, 10 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 15, 14 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 9, 8 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 13, 12 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 13, 13 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 12, 12 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 15, 14 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 15, 15 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 18,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 19, 18 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 19,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 19, 19 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 20,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 17, 16 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 21,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 10, 9 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 22,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 12, 11 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 23,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 8, 7 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 24,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 10, 8 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 25,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 7, 0 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 26,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 99, 20 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 27,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 99, 18 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 28,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 13, 12 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 29,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 14, 14 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 30,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 14, 13 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 31,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 16, 15 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 32,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 16, 16 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 33,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 16, 15 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 34,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 18, 17 });

            migrationBuilder.UpdateData(
                table: "Escalaos",
                keyColumn: "Id",
                keyValue: 35,
                columns: new[] { "MaxAge", "MinAge" },
                values: new object[] { 9, 8 });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 4, 9, 39, 1, 546, DateTimeKind.Utc).AddTicks(2507));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 4, 9, 39, 1, 546, DateTimeKind.Utc).AddTicks(2509));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 4, 9, 39, 1, 671, DateTimeKind.Utc).AddTicks(5029));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 4, 9, 39, 1, 671, DateTimeKind.Utc).AddTicks(4562), "$2a$11$pzBncG7s9Lc7/xz9jqjSc.tcb5BXvWwisXaZnsaFmGfBwgqhA5bDi" });

            migrationBuilder.CreateIndex(
                name: "IX_EscalaoSports_EscalaoId_SportId",
                table: "EscalaoSports",
                columns: new[] { "EscalaoId", "SportId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EscalaoSports_EscalaoId_SportId",
                table: "EscalaoSports");

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
        }
    }
}
