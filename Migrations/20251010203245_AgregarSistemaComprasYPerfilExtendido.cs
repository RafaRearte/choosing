using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace choosing.Migrations
{
    /// <inheritdoc />
    public partial class AgregarSistemaComprasYPerfilExtendido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Ciudad",
                table: "Usuarios",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoPostal",
                table: "Usuarios",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Direccion",
                table: "Usuarios",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Dni",
                table: "Usuarios",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaNacimiento",
                table: "Usuarios",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provincia",
                table: "Usuarios",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompraId",
                table: "invitados",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CompradoPorUsuarioId",
                table: "invitados",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Confirmado",
                table: "invitados",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCreacion",
                table: "invitados",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Compras",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    EventoId = table.Column<int>(type: "int", nullable: false),
                    FechaCompra = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    CantidadEntradas = table.Column<int>(type: "int", nullable: false),
                    MontoTotal = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "pendiente"),
                    MetodoPago = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TransaccionId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    FechaPago = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NotasInternas = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Compras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Compras_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Compras_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_invitados_CompradoPorUsuarioId",
                table: "invitados",
                column: "CompradoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_invitados_CompraId",
                table: "invitados",
                column: "CompraId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_Estado",
                table: "Compras",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_EventoId",
                table: "Compras",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_FechaCompra",
                table: "Compras",
                column: "FechaCompra");

            migrationBuilder.CreateIndex(
                name: "IX_Compras_UsuarioId",
                table: "Compras",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_invitados_Compras_CompraId",
                table: "invitados",
                column: "CompraId",
                principalTable: "Compras",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_invitados_Usuarios_CompradoPorUsuarioId",
                table: "invitados",
                column: "CompradoPorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_invitados_Compras_CompraId",
                table: "invitados");

            migrationBuilder.DropForeignKey(
                name: "FK_invitados_Usuarios_CompradoPorUsuarioId",
                table: "invitados");

            migrationBuilder.DropTable(
                name: "Compras");

            migrationBuilder.DropIndex(
                name: "IX_invitados_CompradoPorUsuarioId",
                table: "invitados");

            migrationBuilder.DropIndex(
                name: "IX_invitados_CompraId",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "Ciudad",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CodigoPostal",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Direccion",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Dni",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "FechaNacimiento",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Provincia",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CompraId",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "CompradoPorUsuarioId",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "Confirmado",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "FechaCreacion",
                table: "invitados");
        }
    }
}
