using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace choosing.Migrations
{
    /// <inheritdoc />
    public partial class CompletarConfiguracionUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Eventos_Organizadores_OrganizadorId",
                table: "Eventos");

            migrationBuilder.DropForeignKey(
                name: "FK_invitados_Compras_CompraId",
                table: "invitados");

            migrationBuilder.DropForeignKey(
                name: "FK_invitados_Eventos_EventoId",
                table: "invitados");

            migrationBuilder.DropForeignKey(
                name: "FK_invitados_Usuarios_CompradoPorUsuarioId",
                table: "invitados");

            migrationBuilder.DropTable(
                name: "Organizadores");

            migrationBuilder.DropPrimaryKey(
                name: "PK_invitados",
                table: "invitados");

            migrationBuilder.DropIndex(
                name: "IX_invitados_dni",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "acreditado",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "cant_entradas",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "day_one",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "day_three",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "day_two",
                table: "invitados");

            migrationBuilder.DropColumn(
                name: "mail",
                table: "invitados");

            migrationBuilder.RenameTable(
                name: "invitados",
                newName: "Invitados");

            migrationBuilder.RenameColumn(
                name: "telefono",
                table: "Invitados",
                newName: "Telefono");

            migrationBuilder.RenameColumn(
                name: "profesion",
                table: "Invitados",
                newName: "Profesion");

            migrationBuilder.RenameColumn(
                name: "nombre",
                table: "Invitados",
                newName: "Nombre");

            migrationBuilder.RenameColumn(
                name: "lugar",
                table: "Invitados",
                newName: "Lugar");

            migrationBuilder.RenameColumn(
                name: "empresa",
                table: "Invitados",
                newName: "Empresa");

            migrationBuilder.RenameColumn(
                name: "dni",
                table: "Invitados",
                newName: "Dni");

            migrationBuilder.RenameColumn(
                name: "categoria",
                table: "Invitados",
                newName: "Categoria");

            migrationBuilder.RenameColumn(
                name: "cargo",
                table: "Invitados",
                newName: "Cargo");

            migrationBuilder.RenameColumn(
                name: "apellido",
                table: "Invitados",
                newName: "Apellido");

            migrationBuilder.RenameColumn(
                name: "red_social",
                table: "Invitados",
                newName: "RedSocial");

            migrationBuilder.RenameColumn(
                name: "info_adicional",
                table: "Invitados",
                newName: "InfoAdicional");

            migrationBuilder.RenameColumn(
                name: "id_code",
                table: "Invitados",
                newName: "IdCode");

            migrationBuilder.RenameColumn(
                name: "horaAcreditacion",
                table: "Invitados",
                newName: "FechaAcreditacion");

            migrationBuilder.RenameIndex(
                name: "IX_invitados_EventoId",
                table: "Invitados",
                newName: "IX_Invitados_EventoId");

            migrationBuilder.RenameIndex(
                name: "IX_invitados_CompraId",
                table: "Invitados",
                newName: "IX_Invitados_CompraId");

            migrationBuilder.RenameIndex(
                name: "IX_invitados_CompradoPorUsuarioId",
                table: "Invitados",
                newName: "IX_Invitados_CompradoPorUsuarioId");

            migrationBuilder.AlterColumn<string>(
                name: "TipoUsuario",
                table: "Usuarios",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "comprador",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaRegistro",
                table: "Usuarios",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<bool>(
                name: "Activo",
                table: "Usuarios",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AddColumn<string>(
                name: "CuitCuil",
                table: "Usuarios",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EventosPermitidos",
                table: "Usuarios",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaInicioPlan",
                table: "Usuarios",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreEmpresa",
                table: "Usuarios",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NumeroDocumento",
                table: "Usuarios",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Pais",
                table: "Usuarios",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                defaultValue: "Argentina");

            migrationBuilder.AddColumn<string>(
                name: "PlanSuscripcion",
                table: "Usuarios",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RazonSocial",
                table: "Usuarios",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RecibirNotificaciones",
                table: "Usuarios",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "RecibirPromociones",
                table: "Usuarios",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "TelefonoAlternativo",
                table: "Usuarios",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoDocumento",
                table: "Usuarios",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Nombre",
                table: "Invitados",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Dni",
                table: "Invitados",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Apellido",
                table: "Invitados",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "Invitados",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "EsNuevo",
                table: "Invitados",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AlterColumn<bool>(
                name: "Confirmado",
                table: "Invitados",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Invitados",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "EstaAcreditado",
                table: "Invitados",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Invitados",
                table: "Invitados",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_TipoUsuario",
                table: "Usuarios",
                column: "TipoUsuario");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Username",
                table: "Usuarios",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invitados_Email",
                table: "Invitados",
                column: "Email");

            migrationBuilder.AddForeignKey(
                name: "FK_Eventos_Usuarios_OrganizadorId",
                table: "Eventos",
                column: "OrganizadorId",
                principalTable: "Usuarios",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Invitados_Compras_CompraId",
                table: "Invitados",
                column: "CompraId",
                principalTable: "Compras",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Invitados_Eventos_EventoId",
                table: "Invitados",
                column: "EventoId",
                principalTable: "Eventos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Invitados_Usuarios_CompradoPorUsuarioId",
                table: "Invitados",
                column: "CompradoPorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Eventos_Usuarios_OrganizadorId",
                table: "Eventos");

            migrationBuilder.DropForeignKey(
                name: "FK_Invitados_Compras_CompraId",
                table: "Invitados");

            migrationBuilder.DropForeignKey(
                name: "FK_Invitados_Eventos_EventoId",
                table: "Invitados");

            migrationBuilder.DropForeignKey(
                name: "FK_Invitados_Usuarios_CompradoPorUsuarioId",
                table: "Invitados");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_TipoUsuario",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_Username",
                table: "Usuarios");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Invitados",
                table: "Invitados");

            migrationBuilder.DropIndex(
                name: "IX_Invitados_Email",
                table: "Invitados");

            migrationBuilder.DropColumn(
                name: "CuitCuil",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "EventosPermitidos",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "FechaInicioPlan",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "NombreEmpresa",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "NumeroDocumento",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Pais",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "PlanSuscripcion",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "RazonSocial",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "RecibirNotificaciones",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "RecibirPromociones",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TelefonoAlternativo",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TipoDocumento",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Invitados");

            migrationBuilder.DropColumn(
                name: "EstaAcreditado",
                table: "Invitados");

            migrationBuilder.RenameTable(
                name: "Invitados",
                newName: "invitados");

            migrationBuilder.RenameColumn(
                name: "Telefono",
                table: "invitados",
                newName: "telefono");

            migrationBuilder.RenameColumn(
                name: "Profesion",
                table: "invitados",
                newName: "profesion");

            migrationBuilder.RenameColumn(
                name: "Nombre",
                table: "invitados",
                newName: "nombre");

            migrationBuilder.RenameColumn(
                name: "Lugar",
                table: "invitados",
                newName: "lugar");

            migrationBuilder.RenameColumn(
                name: "Empresa",
                table: "invitados",
                newName: "empresa");

            migrationBuilder.RenameColumn(
                name: "Dni",
                table: "invitados",
                newName: "dni");

            migrationBuilder.RenameColumn(
                name: "Categoria",
                table: "invitados",
                newName: "categoria");

            migrationBuilder.RenameColumn(
                name: "Cargo",
                table: "invitados",
                newName: "cargo");

            migrationBuilder.RenameColumn(
                name: "Apellido",
                table: "invitados",
                newName: "apellido");

            migrationBuilder.RenameColumn(
                name: "RedSocial",
                table: "invitados",
                newName: "red_social");

            migrationBuilder.RenameColumn(
                name: "InfoAdicional",
                table: "invitados",
                newName: "info_adicional");

            migrationBuilder.RenameColumn(
                name: "IdCode",
                table: "invitados",
                newName: "id_code");

            migrationBuilder.RenameColumn(
                name: "FechaAcreditacion",
                table: "invitados",
                newName: "horaAcreditacion");

            migrationBuilder.RenameIndex(
                name: "IX_Invitados_EventoId",
                table: "invitados",
                newName: "IX_invitados_EventoId");

            migrationBuilder.RenameIndex(
                name: "IX_Invitados_CompraId",
                table: "invitados",
                newName: "IX_invitados_CompraId");

            migrationBuilder.RenameIndex(
                name: "IX_Invitados_CompradoPorUsuarioId",
                table: "invitados",
                newName: "IX_invitados_CompradoPorUsuarioId");

            migrationBuilder.AlterColumn<string>(
                name: "TipoUsuario",
                table: "Usuarios",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "comprador");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaRegistro",
                table: "Usuarios",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETDATE()");

            migrationBuilder.AlterColumn<bool>(
                name: "Activo",
                table: "Usuarios",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "nombre",
                table: "invitados",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "invitados",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETDATE()");

            migrationBuilder.AlterColumn<bool>(
                name: "EsNuevo",
                table: "invitados",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<int>(
                name: "dni",
                table: "invitados",
                type: "int",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "Confirmado",
                table: "invitados",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "apellido",
                table: "invitados",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<int>(
                name: "acreditado",
                table: "invitados",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "cant_entradas",
                table: "invitados",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "day_one",
                table: "invitados",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "day_three",
                table: "invitados",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "day_two",
                table: "invitados",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "mail",
                table: "invitados",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_invitados",
                table: "invitados",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Organizadores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    Ciudad = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CodigoPostal = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    CuitCuil = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Direccion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EventosPermitidos = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    FechaFinPlan = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaInicioPlan = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NombreEmpresa = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PlanSuscripcion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "free"),
                    Provincia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
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

            migrationBuilder.CreateIndex(
                name: "IX_invitados_dni",
                table: "invitados",
                column: "dni");

            migrationBuilder.CreateIndex(
                name: "IX_Organizadores_PlanSuscripcion",
                table: "Organizadores",
                column: "PlanSuscripcion");

            migrationBuilder.CreateIndex(
                name: "IX_Organizadores_UsuarioId",
                table: "Organizadores",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Eventos_Organizadores_OrganizadorId",
                table: "Eventos",
                column: "OrganizadorId",
                principalTable: "Organizadores",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_invitados_Compras_CompraId",
                table: "invitados",
                column: "CompraId",
                principalTable: "Compras",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_invitados_Eventos_EventoId",
                table: "invitados",
                column: "EventoId",
                principalTable: "Eventos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_invitados_Usuarios_CompradoPorUsuarioId",
                table: "invitados",
                column: "CompradoPorUsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }
    }
}
