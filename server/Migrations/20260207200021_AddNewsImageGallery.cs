using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNewsImageGallery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NewsImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NewsArticleId = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewsImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NewsImages_NewsArticles_NewsArticleId",
                        column: x => x.NewsArticleId,
                        principalTable: "NewsArticles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 7, 20, 0, 20, 667, DateTimeKind.Utc).AddTicks(1768));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 7, 20, 0, 20, 667, DateTimeKind.Utc).AddTicks(1771));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 7, 20, 0, 20, 866, DateTimeKind.Utc).AddTicks(2775));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 7, 20, 0, 20, 866, DateTimeKind.Utc).AddTicks(2183), "$2a$11$/.Yw9Q72ctHk.s85BVUJaui2fFAExSqo8xfVneTD7iELOrLfnw/Hq" });

            migrationBuilder.CreateIndex(
                name: "IX_NewsImages_NewsArticleId",
                table: "NewsImages",
                column: "NewsArticleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NewsImages");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 7, 16, 53, 40, 287, DateTimeKind.Utc).AddTicks(2232));

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 7, 16, 53, 40, 287, DateTimeKind.Utc).AddTicks(2234));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedAt",
                value: new DateTime(2026, 2, 7, 16, 53, 40, 409, DateTimeKind.Utc).AddTicks(2656));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 7, 16, 53, 40, 409, DateTimeKind.Utc).AddTicks(2260), "$2a$11$tJu6ljQZ4j6WKFD/BSKtne94cw4DE0JQiyhSezcIF58QZv6AfVg3e" });
        }
    }
}
