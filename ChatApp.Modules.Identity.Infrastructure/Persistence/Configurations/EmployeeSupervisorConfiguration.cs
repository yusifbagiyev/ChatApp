using ChatApp.Modules.Identity.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Modules.Identity.Infrastructure.Persistence.Configurations
{
    public class EmployeeSupervisorConfiguration : IEntityTypeConfiguration<EmployeeSupervisor>
    {
        public void Configure(EntityTypeBuilder<EmployeeSupervisor> builder)
        {
            builder.ToTable("employee_supervisors");

            // Composite PK
            builder.HasKey(es => new { es.EmployeeId, es.SupervisorEmployeeId });

            builder.Property(es => es.EmployeeId)
                .HasColumnName("employee_id");

            builder.Property(es => es.SupervisorEmployeeId)
                .HasColumnName("supervisor_employee_id");

            builder.Property(es => es.AssignedAtUtc)
                .HasColumnName("assigned_at_utc")
                .HasColumnType("timestamp with time zone");

            // İşçinin rəhbərləri (cascade: işçi silinəndə bağlantılar da silinir)
            builder.HasOne(es => es.Employee)
                .WithMany(e => e.SupervisorLinks)
                .HasForeignKey(es => es.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Rəhbərin tabeliyindəkilər (restrict: rəhbər silinərkən əvvəlcə bağlantıları sil)
            builder.HasOne(es => es.SupervisorEmployee)
                .WithMany(e => e.SubordinateLinks)
                .HasForeignKey(es => es.SupervisorEmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(es => es.EmployeeId)
                .HasDatabaseName("ix_employee_supervisors_employee_id");

            builder.HasIndex(es => es.SupervisorEmployeeId)
                .HasDatabaseName("ix_employee_supervisors_supervisor_id");
        }
    }
}
