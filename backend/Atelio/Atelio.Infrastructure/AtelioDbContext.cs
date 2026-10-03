using Atelio.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.RegularExpressions;

namespace Atelio.Infrastructure;

/// <summary>
/// Base d'UNE marque blanche. La chaîne de connexion dépend de la marque blanche
/// de la requête (voir TenantContext) : même modèle, base différente.
/// Le schéma est géré par le script SQL (backend/database/tenant_schema.sql), pas par des migrations.
/// </summary>
public class AtelioDbContext : DbContext
{
    public AtelioDbContext(DbContextOptions<AtelioDbContext> options)
        : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Garage> Garages => Set<Garage>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeAbsence> EmployeeAbsences => Set<EmployeeAbsence>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<GarageService> GarageServices => Set<GarageService>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AppointmentService> AppointmentServices => Set<AppointmentService>();
    public DbSet<Intervention> Interventions => Set<Intervention>();
    public DbSet<InterventionService> InterventionServices => Set<InterventionService>();
    public DbSet<SparePart> SpareParts => Set<SparePart>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Enums stockés en texte snake_case (contraintes CHECK du schéma).
        configurationBuilder.Properties<Domain.Enums.AppointmentStatus>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.AppointmentStatus>>();
        configurationBuilder.Properties<Domain.Enums.InterventionStatus>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.InterventionStatus>>();
        configurationBuilder.Properties<Domain.Enums.InvoiceStatus>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.InvoiceStatus>>();
        configurationBuilder.Properties<Domain.Enums.PaymentMethod>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.PaymentMethod>>();
        configurationBuilder.Properties<Domain.Enums.PaymentStatus>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.PaymentStatus>>();
        configurationBuilder.Properties<Domain.Enums.EmployeeRole>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.EmployeeRole>>();
        configurationBuilder.Properties<Domain.Enums.AbsenceReason>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.AbsenceReason>>();
        configurationBuilder.Properties<Domain.Enums.VehicleFuel>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.VehicleFuel>>();
        configurationBuilder.Properties<Domain.Enums.VehicleCategory>().HaveConversion<SnakeCaseEnumConverter<Domain.Enums.VehicleCategory>>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Colonnes remplies par la base (DEFAULT now() / triggers).
        modelBuilder.Entity<Customer>().Property(x => x.UpdatedAt).ValueGeneratedOnAddOrUpdate();
        modelBuilder.Entity<Vehicle>().Property(x => x.UpdatedAt).ValueGeneratedOnAddOrUpdate();
        modelBuilder.Entity<Appointment>().Property(x => x.UpdatedAt).ValueGeneratedOnAddOrUpdate();

        modelBuilder.Entity<GarageService>().HasKey(x => new { x.GarageId, x.ServiceId });
        modelBuilder.Entity<AppointmentService>().HasKey(x => new { x.AppointmentId, x.ServiceId });
        modelBuilder.Entity<InterventionService>().HasKey(x => new { x.InterventionId, x.ServiceId });

        modelBuilder.Entity<Appointment>()
            .HasMany(x => x.Services)
            .WithOne()
            .HasForeignKey(x => x.AppointmentId);

        modelBuilder.Entity<Intervention>()
            .HasMany(x => x.Services)
            .WithOne()
            .HasForeignKey(x => x.InterventionId);

        modelBuilder.Entity<Intervention>()
            .HasMany(x => x.SpareParts)
            .WithOne()
            .HasForeignKey(x => x.InterventionId);
    }
}

/// <summary>Enum <=> texte snake_case : NoShow <=> "no_show".</summary>
public class SnakeCaseEnumConverter<TEnum> : ValueConverter<TEnum, string>
    where TEnum : struct, Enum
{
    public SnakeCaseEnumConverter()
        : base(
            value => ToSnakeCase(value.ToString()),
            text => Enum.Parse<TEnum>(text.Replace("_", ""), true))
    {
    }

    public static string ToSnakeCase(string name) =>
        Regex.Replace(name, "(?<!^)([A-Z])", "_$1").ToLowerInvariant();
}
