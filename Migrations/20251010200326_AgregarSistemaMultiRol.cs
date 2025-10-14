using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace choosing.Migrations
{
    /// <inheritdoc />
    public partial class AgregarSistemaMultiRol : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TipoUsuario = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Apellido = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    UltimoLogin = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Organizadores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    NombreEmpresa = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CuitCuil = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Direccion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Provincia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Ciudad = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CodigoPostal = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    PlanSuscripcion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "free"),
                    FechaInicioPlan = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaFinPlan = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EventosPermitidos = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    Activo = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizadores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Organizadores_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Eventos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Ubicacion = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    ConfiguracionJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CodigoAcceso = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: ""),
                    CodigoAdmin = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CodigoStats = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PermitirAccesoPostEvento = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    OrganizadorId = table.Column<int>(type: "int", nullable: true),
                    VentaPublica = table.Column<bool>(type: "bit", nullable: false),
                    PrecioEntrada = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    CapacidadMaxima = table.Column<int>(type: "int", nullable: true),
                    EntradasVendidas = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ConfigTabla = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConfigEtiqueta = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Eventos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Eventos_Organizadores_OrganizadorId",
                        column: x => x.OrganizadorId,
                        principalTable: "Organizadores",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FeedbackConfig",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventoId = table.Column<int>(type: "int", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackConfig", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbackConfig_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Feedbacks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventoId = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Feedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Feedbacks_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invitados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    dni = table.Column<int>(type: "int", nullable: true),
                    info_adicional = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    nombre = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    apellido = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    mail = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    day_one = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    day_two = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    day_three = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    cant_entradas = table.Column<int>(type: "int", nullable: true),
                    acreditado = table.Column<int>(type: "int", nullable: true),
                    EsNuevo = table.Column<bool>(type: "bit", nullable: false),
                    horaAcreditacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    profesion = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    cargo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    EventoId = table.Column<int>(type: "int", nullable: false),
                    categoria = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    empresa = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    lugar = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    telefono = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    id_code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    red_social = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invitados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_invitados_Eventos_EventoId",
                        column: x => x.EventoId,
                        principalTable: "Eventos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Eventos_OrganizadorId",
                table: "Eventos",
                column: "OrganizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackConfig_EventoId",
                table: "FeedbackConfig",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_EventoId",
                table: "Feedbacks",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_invitados_dni",
                table: "invitados",
                column: "dni");

            migrationBuilder.CreateIndex(
                name: "IX_invitados_EventoId",
                table: "invitados",
                column: "EventoId");

            migrationBuilder.CreateIndex(
                name: "IX_Organizadores_PlanSuscripcion",
                table: "Organizadores",
                column: "PlanSuscripcion");

            migrationBuilder.CreateIndex(
                name: "IX_Organizadores_UsuarioId",
                table: "Organizadores",
                column: "UsuarioId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeedbackConfig");

            migrationBuilder.DropTable(
                name: "Feedbacks");

            migrationBuilder.DropTable(
                name: "invitados");

            migrationBuilder.DropTable(
                name: "Eventos");

            migrationBuilder.DropTable(
                name: "Organizadores");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
