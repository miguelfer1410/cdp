using Microsoft.EntityFrameworkCore;
using CdpApi.Models;

namespace CdpApi.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Existing tables
    public DbSet<User> Users { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<HeroBanner> HeroBanners { get; set; }
    public DbSet<NewsArticle> NewsArticles { get; set; }
    public DbSet<Sport> Sports { get; set; }
    public DbSet<InstitutionalPartner> InstitutionalPartners { get; set; }
    public DbSet<NewsImage> NewsImages { get; set; }

    // New tables for flexible roles and profiles
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<MemberProfile> MemberProfiles { get; set; }
    public DbSet<AthleteProfile> AthleteProfiles { get; set; }
    public DbSet<CoachProfile> CoachProfiles { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<AthleteTeam> AthleteTeams { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<TrainingSchedule> TrainingSchedules { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<GameCallUp> GameCallUps { get; set; }
    public DbSet<SystemSetting> SystemSettings { get; set; }
    public DbSet<FamilyAssociationRequest> FamilyAssociationRequests { get; set; }
    public DbSet<UserFamilyLink> UserFamilyLinks { get; set; }
    public DbSet<EscalaoRequest> EscalaoRequests { get; set; }
    public DbSet<Escalao> Escalaos { get; set; }
    public DbSet<EscalaoSport> EscalaoSports { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // Role configuration
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
        });

        // UserRole configuration (many-to-many)
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.RoleId }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MemberProfile configuration (1:0..1 with User)
        modelBuilder.Entity<MemberProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.MembershipNumber).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(u => u.MemberProfile)
                .HasForeignKey<MemberProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AthleteProfile configuration (1:0..1 with User)
        modelBuilder.Entity<AthleteProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(u => u.AthleteProfile)
                .HasForeignKey<AthleteProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CoachProfile configuration (1:0..1 with User)
        modelBuilder.Entity<CoachProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(u => u.CoachProfile)
                .HasForeignKey<CoachProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sport)
                .WithMany()
                .HasForeignKey(e => e.SportId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Team)
                .WithMany(t => t.Coaches)
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Team configuration
        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Sport)
                .WithMany()
                .HasForeignKey(e => e.SportId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AthleteTeam configuration (many-to-many with extra properties)
        modelBuilder.Entity<AthleteTeam>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.AthleteProfileId, e.TeamId }).IsUnique();

            entity.HasOne(e => e.AthleteProfile)
                .WithMany(a => a.AthleteTeams)
                .HasForeignKey(e => e.AthleteProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Team)
                .WithMany(t => t.AthleteTeams)
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Event configuration
        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Sport)
                .WithMany()
                .HasForeignKey(e => e.SportId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Team)
                .WithMany()
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Creator)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // TrainingSchedule configuration
        modelBuilder.Entity<TrainingSchedule>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Team)
                .WithMany()
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Creator)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // Attendance configuration
        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.EventId, e.AthleteId }).IsUnique();

            entity.HasOne(e => e.Event)
                .WithMany(ev => ev.Attendances)
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Athlete)
                .WithMany(a => a.Attendances)
                .HasForeignKey(e => e.AthleteId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // GameCallUp Configuration
        modelBuilder.Entity<GameCallUp>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.EventId, e.AthleteId }).IsUnique();

            entity.HasOne(e => e.Event)
                .WithMany() // Assuming Event does not have a navigation property back to GameCallUp
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Athlete)
                .WithMany() // Assuming AthleteProfile does not have a navigation property back to GameCallUp
                .HasForeignKey(e => e.AthleteId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // Payment configuration (now references MemberProfile)
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            
            entity.HasOne(e => e.MemberProfile)
                .WithMany(m => m.Payments)
                .HasForeignKey(e => e.MemberProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // NewsImage configuration (many NewsImages to one NewsArticle)
        modelBuilder.Entity<NewsImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Order).HasDefaultValue(0);

            entity.HasOne(e => e.NewsArticle)
                .WithMany(n => n.GalleryImages)
                .HasForeignKey(e => e.NewsArticleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // NewsArticle configuration
        modelBuilder.Entity<NewsArticle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            
            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // FamilyAssociationRequest configuration
        modelBuilder.Entity<FamilyAssociationRequest>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Requester)
                .WithMany()
                .HasForeignKey(e => e.RequesterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.RequestedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.Status).HasDefaultValue(FamilyAssociationRequestStatus.Pending);
        });

        // UserFamilyLink configuration
        modelBuilder.Entity<UserFamilyLink>(entity =>
        {
            entity.HasKey(e => e.Id);

            // Prevent duplicate links
            entity.HasIndex(e => new { e.UserId, e.LinkedUserId }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.LinkedUser)
                .WithMany()
                .HasForeignKey(e => e.LinkedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // Seed data: Roles
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "User", Description = "Acesso padrão de utilizador", CreatedAt = DateTime.UtcNow },
            new Role { Id = 2, Name = "Admin", Description = "Administrador com acesso total", CreatedAt = DateTime.UtcNow }
        );

        // Seed data: Admin User
        var adminUserId = 1;
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = adminUserId,
                Email = "admin@cdp.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                FirstName = "Admin",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            }
        );

        // Seed data: Admin UserRole
        modelBuilder.Entity<UserRole>().HasData(
            new UserRole
            {
                Id = 1,
                UserId = adminUserId,
                RoleId = 2, // Admin role
                AssignedAt = DateTime.UtcNow
            }
        );

        modelBuilder.Entity<EscalaoRequest>(entity =>
        {
            entity.HasOne(e => e.AthleteProfile)
                  .WithMany()
                  .HasForeignKey(e => e.AthleteProfileId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Escalao configuration
        modelBuilder.Entity<Escalao>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // EscalaoSport configuration
        modelBuilder.Entity<EscalaoSport>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.EscalaoId, e.SportId }).IsUnique();

            entity.HasOne(e => e.Escalao)
                .WithMany(e => e.EscalaoSports)
                .HasForeignKey(e => e.EscalaoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sport)
                .WithMany()
                .HasForeignKey(e => e.SportId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed: escalões comuns no futebol e outras modalidades em Portugal
        modelBuilder.Entity<Escalao>().HasData(
            new Escalao { Id = 1,  Name = "Sub-7",     MinAge = 0,  MaxAge = 7,  IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 2,  Name = "Sub-9",     MinAge = 8,  MaxAge = 9,  IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 3,  Name = "Sub-11",    MinAge = 10, MaxAge = 11, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 4,  Name = "Sub-13",    MinAge = 12, MaxAge = 13, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 5,  Name = "Sub-15",    MinAge = 14, MaxAge = 15, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 6,  Name = "Sub-17",    MinAge = 16, MaxAge = 17, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 7,  Name = "Sub-19",    MinAge = 18, MaxAge = 19, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 8,  Name = "Sénior",    MinAge = 20, MaxAge = 99, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 9,  Name = "Bambis",    MinAge = 0,  MaxAge = 6,  IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 10, Name = "Benjamins", MinAge = 10, MaxAge = 11, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 11, Name = "Cadetes",   MinAge = 14, MaxAge = 15, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 12, Name = "Escolares", MinAge = 8,  MaxAge = 9,  IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 13, Name = "Infantis",  MinAge = 12, MaxAge = 13, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 14, Name = "Infantis A",MinAge = 13, MaxAge = 13, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 15, Name = "Infantis B",MinAge = 12, MaxAge = 12, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 16, Name = "Iniciados", MinAge = 14, MaxAge = 15, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 17, Name = "Iniciados A",MinAge = 15, MaxAge = 15, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 18, Name = "Juniores",  MinAge = 18, MaxAge = 19, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 19, Name = "Juniores A",MinAge = 19, MaxAge = 19, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 20, Name = "Juvenis",   MinAge = 16, MaxAge = 17, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 21, Name = "Mini 10",   MinAge = 9,  MaxAge = 10, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 22, Name = "Mini 12",   MinAge = 11, MaxAge = 12, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 23, Name = "Mini 8",    MinAge = 7,  MaxAge = 8,  IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 24, Name = "Minis A",   MinAge = 8,  MaxAge = 10, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 25, Name = "Petizes",   MinAge = 0,  MaxAge = 7,  IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 26, Name = "Seniores A",MinAge = 20, MaxAge = 99, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 27, Name = "Seniores B",MinAge = 18, MaxAge = 99, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 28, Name = "Sub 13",    MinAge = 12, MaxAge = 13, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 29, Name = "Sub 14 A",  MinAge = 14, MaxAge = 14, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 30, Name = "Sub 14 B",  MinAge = 13, MaxAge = 14, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 31, Name = "Sub 16",    MinAge = 15, MaxAge = 16, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 32, Name = "Sub 16 A",  MinAge = 16, MaxAge = 16, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 33, Name = "Sub 16 B",  MinAge = 15, MaxAge = 16, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 34, Name = "Sub 18 A",  MinAge = 17, MaxAge = 18, IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Escalao { Id = 35, Name = "Traquinas", MinAge = 8,  MaxAge = 9,  IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}
