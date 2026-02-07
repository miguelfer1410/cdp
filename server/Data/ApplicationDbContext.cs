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

    // New tables for flexible roles and profiles
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<MemberProfile> MemberProfiles { get; set; }
    public DbSet<AthleteProfile> AthleteProfiles { get; set; }
    public DbSet<CoachProfile> CoachProfiles { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<AthleteTeam> AthleteTeams { get; set; }

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

        // Seed data: Roles
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "User", Description = "Standard user access", CreatedAt = DateTime.UtcNow },
            new Role { Id = 2, Name = "Admin", Description = "Administrator with full access", CreatedAt = DateTime.UtcNow }
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
    }
}
