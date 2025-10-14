using System;
using System.Collections.Generic;
using choosing.Domain;
using Microsoft.EntityFrameworkCore;

namespace choosing.Context;

public partial class DbHotelContext : DbContext
{
    public DbHotelContext()
    {
    }

    public DbHotelContext(DbContextOptions<DbHotelContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Guest> Guests { get; set; }

    public DbSet<User> Users { get; set; }
    public DbSet<EventModel> Events { get; set; }
    public DbSet<FeedbackModel> Feedbacks { get; set; }
    public DbSet<FeedbackConfigModel> FeedbackConfig { get; set; }
    public DbSet<Compra> Compras { get; set; }


    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnectionLocalMac");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Guest>(entity =>
        {
            entity.HasKey(e => e.Id);  // Nueva clave primaria

            entity.HasIndex(e => e.Dni);  // Índice único en DNI

            entity.ToTable("invitados");

            entity.Property(e => e.Dni)
                .ValueGeneratedNever()
                .HasColumnName("dni");
            entity.Property(e => e.Acreditado).HasColumnName("acreditado");
            entity.Property(e => e.Apellido)
                .HasMaxLength(255)
                .HasColumnName("apellido");
            entity.Property(e => e.InfoAdicional)
                .HasMaxLength(255)
                .HasColumnName("info_adicional");
            entity.Property(e => e.Mail)
                .HasMaxLength(255)
                .HasColumnName("mail");
            entity.Property(e => e.Nombre)
                .HasMaxLength(255)
                .HasColumnName("nombre");
            entity.HasOne<EventModel>()
                        .WithMany()
                        .HasForeignKey(d => d.EventoId);
            entity.Property(e => e.Categoria)
                        .HasMaxLength(100)
                        .HasColumnName("categoria");
            entity.Property(e => e.Empresa)
                        .HasMaxLength(255)
                        .HasColumnName("empresa");
            entity.Property(e => e.Lugar)
                        .HasMaxLength(255)
                        .HasColumnName("lugar");
            entity.Property(e => e.Telefono).HasMaxLength(50).HasColumnName("telefono");
            entity.Property(e => e.IdCode)
            .HasMaxLength(100)
            .HasColumnName("id_code");
            entity.Property(e => e.RedSocial)
            .HasMaxLength(255)
            .HasColumnName("red_social");
            entity.Property(e => e.Cargo)
                .HasMaxLength(255)
                .HasColumnName("cargo");

            entity.Property(e => e.Profesion)
                .HasMaxLength(255) 
                .HasColumnName("profesion");

            entity.Property(e => e.HoraAcreditacion)
                .HasColumnName("horaAcreditacion");

            entity.Property(e => e.EsNuevo)
                .HasColumnName("EsNuevo");  
        });

        modelBuilder.Entity<EventModel>(entity =>
        {
            entity.ToTable("Eventos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Descripcion).HasMaxLength(500);
            entity.Property(e => e.Ubicacion).HasMaxLength(255);
            entity.Property(e => e.ConfiguracionJson);
            entity.Property(e => e.CodigoAcceso)
        .HasMaxLength(100)
        .HasDefaultValue("");

            entity.Property(e => e.CodigoAdmin)
                .HasMaxLength(100);

            entity.Property(e => e.CodigoStats)
                .HasMaxLength(100);

            entity.Property(e => e.PermitirAccesoPostEvento)
                .HasDefaultValue(false);
        });

        modelBuilder.Entity<FeedbackModel>(entity =>
        {
            entity.ToTable("Feedbacks");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventoId).IsRequired();
            entity.Property(e => e.Rating).IsRequired();
            entity.HasOne<EventModel>()
                .WithMany()
                .HasForeignKey(f => f.EventoId);
        });

        modelBuilder.Entity<FeedbackConfigModel>(entity =>
        {
            entity.ToTable("FeedbackConfig");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventoId).IsRequired();
            entity.Property(e => e.FechaCreacion).IsRequired();
            entity.Property(e => e.FechaActualizacion).IsRequired();
            entity.HasOne<EventModel>()
                .WithMany()
                .HasForeignKey(f => f.EventoId);
        });

        // Configuración de Compra
        modelBuilder.Entity<Compra>(entity =>
        {
            entity.ToTable("Compras");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UsuarioId).IsRequired();
            entity.Property(e => e.EventoId).IsRequired();
            entity.Property(e => e.FechaCompra).IsRequired().HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.CantidadEntradas).IsRequired();
            entity.Property(e => e.MontoTotal).IsRequired().HasColumnType("decimal(10,2)");
            entity.Property(e => e.Estado).IsRequired().HasMaxLength(50).HasDefaultValue("pendiente");
            entity.Property(e => e.MetodoPago).HasMaxLength(100);
            entity.Property(e => e.TransaccionId).HasMaxLength(200);

            // Relación con User
            entity.HasOne(c => c.Usuario)
                .WithMany(u => u.Compras)
                .HasForeignKey(c => c.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación con Evento
            entity.HasOne(c => c.Evento)
                .WithMany()
                .HasForeignKey(c => c.EventoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación inversa con Invitados
            entity.HasMany(c => c.Invitados)
                .WithOne(g => g.Compra)
                .HasForeignKey(g => g.CompraId)
                .OnDelete(DeleteBehavior.SetNull);

            // Índices
            entity.HasIndex(e => e.UsuarioId);
            entity.HasIndex(e => e.EventoId);
            entity.HasIndex(e => e.Estado);
            entity.HasIndex(e => e.FechaCompra);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
