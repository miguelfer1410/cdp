using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CdpApi.Migrations
{
    public partial class AddEscalaoRequest : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            // EscalaoRequests table
            migrationBuilder.CreateTable(
                name: "EscalaoRequests",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AthleteProfileId = table.Column<int>(nullable: false),
                    DocumentUrl = table.Column<string>(maxLength: 500, nullable: false),
                    Status = table.Column<int>(nullable: false, defaultValue: 0),
                    AdminNote = table.Column<string>(maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    ReviewedAt = table.Column<DateTime>(nullable: true),
                    ReviewedByUserId = table.Column<int>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EscalaoRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EscalaoRequests_AthleteProfiles_AthleteProfileId",
                        column: x => x.AthleteProfileId,
                        principalTable: "AthleteProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EscalaoRequests_AthleteProfileId",
                table: "EscalaoRequests",
                column: "AthleteProfileId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "EscalaoRequests");
            migrationBuilder.DropColumn(name: "Escalao", table: "AthleteProfiles");
        }
    }
}