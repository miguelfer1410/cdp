using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSportFeeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FeeEscalao1Normal",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FeeEscalao1Sibling",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FeeEscalao2Normal",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FeeEscalao2Sibling",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "InscriptionFeeDiscount",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "InscriptionFeeNormal",
                table: "Sports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "QuotaIncluded",
                table: "Sports",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Escalao",
                table: "AthleteTeams",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "InscriptionPaid",
                table: "AthleteTeams",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "InscriptionPaidDate",
                table: "AthleteTeams",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 24, 18, 31, 48, 832, DateTimeKind.Utc).AddTicks(1354));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 24, 18, 31, 48, 832, DateTimeKind.Utc).AddTicks(1356));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 24, 18, 31, 49, 4, DateTimeKind.Utc).AddTicks(6843));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 24, 18, 31, 49, 4, DateTimeKind.Utc).AddTicks(6208), "$2a$11$OOtv2frdFOpreS5c1qvtC.dO1ru/ude5aSUb.nUlYMfAZzHbCVnUS" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeeEscalao1Normal",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "FeeEscalao1Sibling",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "FeeEscalao2Normal",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "FeeEscalao2Sibling",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "InscriptionFeeDiscount",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "InscriptionFeeNormal",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "QuotaIncluded",
                table: "Sports");

            migrationBuilder.DropColumn(
                name: "Escalao",
                table: "AthleteTeams");

            migrationBuilder.DropColumn(
                name: "InscriptionPaid",
                table: "AthleteTeams");

            migrationBuilder.DropColumn(
                name: "InscriptionPaidDate",
                table: "AthleteTeams");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 23, 15, 0, 36, 157, DateTimeKind.Utc).AddTicks(1026));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 23, 15, 0, 36, 157, DateTimeKind.Utc).AddTicks(1028));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 23, 15, 0, 36, 278, DateTimeKind.Utc).AddTicks(1010));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 23, 15, 0, 36, 278, DateTimeKind.Utc).AddTicks(596), "$2a$11$aVm.nqn4L3zLhuUPxd3sbuoKKiPWNnhB5vsPyIZr6MZT5ubnFPe1." });
        }
    }
}
