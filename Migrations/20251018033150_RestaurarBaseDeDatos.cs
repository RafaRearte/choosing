using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace choosing.Migrations
{
    /// <inheritdoc />
    public partial class RestaurarBaseDeDatos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CodigoAcceso",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "CodigoAdmin",
                table: "Eventos");

            migrationBuilder.DropColumn(
                name: "CodigoStats",
                table: "Eventos");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoAcceso",
                table: "Eventos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CodigoAdmin",
                table: "Eventos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoStats",
                table: "Eventos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
