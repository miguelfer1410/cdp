using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class LinkTeamsToEscalaos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EscalaoId",
                table: "Teams",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("UPDATE Teams SET EscalaoId = (SELECT TOP 1 Id FROM Escalaos WHERE Name = Teams.Category)");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Teams");

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

            migrationBuilder.CreateIndex(
                name: "IX_Teams_EscalaoId",
                table: "Teams",
                column: "EscalaoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_Escalaos_EscalaoId",
                table: "Teams",
                column: "EscalaoId",
                principalTable: "Escalaos",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teams_Escalaos_EscalaoId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Teams_EscalaoId",
                table: "Teams");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Teams",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql("UPDATE Teams SET Category = (SELECT TOP 1 Name FROM Escalaos WHERE Id = Teams.EscalaoId)");

            migrationBuilder.DropColumn(
                name: "EscalaoId",
                table: "Teams");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 2, 11, 12, 54, 910, DateTimeKind.Utc).AddTicks(5560));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 2, 11, 12, 54, 910, DateTimeKind.Utc).AddTicks(5561));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 3, 2, 11, 12, 55, 35, DateTimeKind.Utc).AddTicks(1944));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 2, 11, 12, 55, 33, DateTimeKind.Utc).AddTicks(5603), "$2a$11$MqjbWSOmpvRcuznwM6gPEus9bjNMHTrJWcOJxSVgxnzTuD8YXdEY2" });
        }
    }
}
