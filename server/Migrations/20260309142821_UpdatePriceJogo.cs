using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePriceJogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TicketPriceNonSocio",
                table: "Events",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TicketPriceSocio",
                table: "Events",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 14, 28, 20, 368, DateTimeKind.Utc).AddTicks(5553));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 14, 28, 20, 368, DateTimeKind.Utc).AddTicks(5554));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 9, 14, 28, 20, 490, DateTimeKind.Utc).AddTicks(6123));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 9, 14, 28, 20, 490, DateTimeKind.Utc).AddTicks(5768), "$2a$11$xr5UzZc5MgqZ6eIF3CTklOG6QHGOWGqnCqUd.d33LeZswbZno6Sja" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TicketPriceNonSocio",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "TicketPriceSocio",
                table: "Events");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 12, 38, 12, 570, DateTimeKind.Utc).AddTicks(91));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 9, 12, 38, 12, 570, DateTimeKind.Utc).AddTicks(93));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 9, 12, 38, 12, 704, DateTimeKind.Utc).AddTicks(3474));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 9, 12, 38, 12, 704, DateTimeKind.Utc).AddTicks(2986), "$2a$11$67F/Ym2pBxkpNiEvtOaVxuiyjUl1VWPrj17Z5z8Zl.p/pgq08KNN." });
        }
    }
}
