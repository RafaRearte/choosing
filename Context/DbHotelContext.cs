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


    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnectionLocalVps");

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
            entity.Property(e => e.CantEntradas).HasColumnName("cant_entradas");
            entity.Property(e => e.DayOne)
                .HasMaxLength(255)
                .HasColumnName("day_one");
            entity.Property(e => e.DayTwo)
                .HasMaxLength(255)
                .HasColumnName("day_two");
            entity.Property(e => e.DayThree)
                .HasMaxLength(255)
                .HasColumnName("day_three");
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

            entity.Property(e => e.CantEntradas)
                .HasColumnName("cant_entradas");
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

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
