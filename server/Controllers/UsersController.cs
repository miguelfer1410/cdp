using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/users - List all users with optional filters
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetUsers(
        [FromQuery] string? profileType = null,
        [FromQuery] int? roleId = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int? teamId = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Users
            .Include(u => u.AthleteProfile)
                .ThenInclude(ap => ap.AthleteTeams)
                    .ThenInclude(at => at.Team)
            .Include(u => u.MemberProfile)
            .Include(u => u.CoachProfile)
                .ThenInclude(c => c.Sport)
            .Include(u => u.CoachProfile)
                .ThenInclude(c => c.Team)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        // Filter by profile type
        if (!string.IsNullOrEmpty(profileType))
        {
            query = profileType.ToLower() switch
            {
                "athlete" => query.Where(u => u.AthleteProfile != null),
                "member" => query.Where(u => u.MemberProfile != null),
                "coach" => query.Where(u => u.CoachProfile != null),
                _ => query
            };
        }

        // Filter by role
        if (roleId.HasValue)
        {
            query = query.Where(u => u.UserRoles.Any(ur => ur.RoleId == roleId.Value));
        }

        // Filter by active status
        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        // Filter by team
        if (teamId.HasValue)
        {
            query = query.Where(u => 
                (u.AthleteProfile != null && u.AthleteProfile.AthleteTeams.Any(at => at.TeamId == teamId.Value && at.LeftAt == null)) ||
                (u.CoachProfile != null && u.CoachProfile.TeamId == teamId.Value)
            );
        }

        // Search by name or email
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(searchLower) ||
                u.LastName.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower));
        }

        var users = await query
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync();

        var response = users.Select(u => new UserResponse
        {
            Id = u.Id,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            FullName = $"{u.FirstName} {u.LastName}",
            Phone = u.Phone,
            BirthDate = u.BirthDate,
            Nif = u.Nif,
            Address = u.Address,
            PostalCode = u.PostalCode,
            City = u.City,
            HasAthleteProfile = u.AthleteProfile != null,
            HasMemberProfile = u.MemberProfile != null && u.MemberProfile.MembershipStatus == MembershipStatus.Active,
            HasCoachProfile = u.CoachProfile != null,
            CurrentTeam = u.AthleteProfile != null 
                ? u.AthleteProfile.AthleteTeams.FirstOrDefault(at => at.LeftAt == null)?.Team.Name 
                : (u.CoachProfile != null ? u.CoachProfile.Team?.Name : null),
            Roles = u.UserRoles.Select(ur => new RoleInfo
            {
                Id = ur.Role.Id,
                Name = ur.Role.Name
            }).ToList(),
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            LastLogin = u.LastLogin,
            AthleteProfileId = u.AthleteProfile != null ? u.AthleteProfile.Id : null
        }).ToList();

        return Ok(response);
    }

    // GET: api/users/{id} - Get user by ID with full details
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<UserDetailResponse>> GetUser(int id)
    {
        var user = await _context.Users
            .Include(u => u.AthleteProfile)
                .ThenInclude(a => a.AthleteTeams)
                    .ThenInclude(at => at.Team)
            .Include(u => u.MemberProfile)
            .Include(u => u.CoachProfile)
                .ThenInclude(c => c.Sport)
            .Include(u => u.CoachProfile)
                .ThenInclude(c => c.Team)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { message = "Utilizador não encontrado" });
        }

        var response = new UserDetailResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = $"{user.FirstName} {user.LastName}",
            Phone = user.Phone,
            BirthDate = user.BirthDate,
            Nif = user.Nif,
            Address = user.Address,
            PostalCode = user.PostalCode,
            City = user.City,
            HasAthleteProfile = user.AthleteProfile != null,
            HasMemberProfile = user.MemberProfile != null && user.MemberProfile.MembershipStatus == MembershipStatus.Active,
            HasCoachProfile = user.CoachProfile != null,
            AthleteProfile = user.AthleteProfile != null ? new AthleteProfileInfo
            {
                Height = user.AthleteProfile.Height,
                Weight = user.AthleteProfile.Weight,
                MedicalCertificateExpiry = user.AthleteProfile.MedicalCertificateExpiry,
                Teams = user.AthleteProfile.AthleteTeams.Select(at => new TeamInfo
                {
                    Id = at.Team.Id,
                    Name = at.Team.Name,
                    JerseyNumber = at.JerseyNumber,
                    Position = at.Position,
                    IsCaptain = at.IsCaptain
                }).ToList()
            } : null,
            MemberProfile = user.MemberProfile != null ? new MemberProfileInfo
            {
                MembershipNumber = user.MemberProfile.MembershipNumber,
                MembershipStatus = user.MemberProfile.MembershipStatus,
                MemberSince = user.MemberProfile.MemberSince,
                PaymentPreference = user.MemberProfile.PaymentPreference
            } : null,
            CoachProfile = user.CoachProfile != null ? new CoachProfileInfo
            {
                SportId = user.CoachProfile.SportId,
                SportName = user.CoachProfile.Sport.Name,
                TeamId = user.CoachProfile.TeamId,
                TeamName = user.CoachProfile.Team?.Name,
                LicenseNumber = user.CoachProfile.LicenseNumber,
                LicenseLevel = user.CoachProfile.LicenseLevel,
                LicenseExpiry = user.CoachProfile.LicenseExpiry,
                Specialization = user.CoachProfile.Specialization
            } : null,
            Roles = user.UserRoles.Select(ur => new RoleInfo
            {
                Id = ur.Role.Id,
                Name = ur.Role.Name
            }).ToList(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLogin = user.LastLogin
        };

        return Ok(response);
    }

    // POST: api/users - Create new user
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<UserResponse>> CreateUser([FromBody] UserCreateRequest request)
    {
        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new { message = "Email já está em uso" });
        }

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password ?? "TempPassword123!"), // Temporary password
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            BirthDate = request.BirthDate,
            Nif = request.Nif,
            Address = request.Address,
            PostalCode = request.PostalCode,
            City = request.City,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var response = new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = $"{user.FirstName} {user.LastName}",
            Phone = user.Phone,
            BirthDate = user.BirthDate,
            Nif = user.Nif,
            Address = user.Address,
            PostalCode = user.PostalCode,
            City = user.City,
            HasAthleteProfile = false,
            HasMemberProfile = false,
            HasCoachProfile = false,
            Roles = new List<RoleInfo>(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLogin = user.LastLogin
        };

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, response);
    }

    // PUT: api/users/{id} - Update user
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateRequest request)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "Utilizador não encontrado" });
        }

        // Check if email is being changed and if it's already in use
        if (user.Email != request.Email && await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
        {
            return BadRequest(new { message = "Email já está em uso" });
        }

        user.Email = request.Email;
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Phone = request.Phone;
        user.BirthDate = request.BirthDate;
        user.Nif = request.Nif;
        user.Address = request.Address;
        user.PostalCode = request.PostalCode;
        user.City = request.City;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/users/{id} - Soft delete user
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound(new { message = "Utilizador não encontrado" });
        }

        user.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ========== PROFILE MANAGEMENT ==========

    // POST: api/users/{id}/athlete-profile
    [HttpPost("{id}/athlete-profile")]
    [Authorize]
    public async Task<IActionResult> CreateAthleteProfile(int id, [FromBody] AthleteProfileRequest request)
    {
        var user = await _context.Users.Include(u => u.AthleteProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.AthleteProfile != null)
            return BadRequest(new { message = "Utilizador já tem perfil de atleta" });

        var profile = new AthleteProfile
        {
            UserId = id,
            Height = request.Height,
            Weight = request.Weight,
            MedicalCertificateExpiry = request.MedicalCertificateExpiry,
            CreatedAt = DateTime.UtcNow
        };

        if (request.TeamId.HasValue)
        {
            if (await _context.Teams.AnyAsync(t => t.Id == request.TeamId.Value))
            {
                profile.AthleteTeams.Add(new AthleteTeam
                {
                    TeamId = request.TeamId.Value,
                    JoinedAt = DateTime.UtcNow
                });
            }
            else
            {
                return BadRequest(new { message = "Equipa inválida" });
            }
        }

        _context.AthleteProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Perfil de atleta criado com sucesso" });
    }

    // PUT: api/users/{id}/athlete-profile
    [HttpPut("{id}/athlete-profile")]
    [Authorize]
    public async Task<IActionResult> UpdateAthleteProfile(int id, [FromBody] AthleteProfileRequest request)
    {
        var user = await _context.Users
            .Include(u => u.AthleteProfile)
            .ThenInclude(ap => ap.AthleteTeams)
            .FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.AthleteProfile == null)
            return NotFound(new { message = "Utilizador não tem perfil de atleta" });

        // Update basic info
        user.AthleteProfile.Height = request.Height;
        user.AthleteProfile.Weight = request.Weight;
        user.AthleteProfile.MedicalCertificateExpiry = request.MedicalCertificateExpiry;

        // Manage Team Association
        // 1. Get current active team
        var currentTeam = user.AthleteProfile.AthleteTeams.FirstOrDefault(at => at.LeftAt == null);

        // 2. If a new team provided
        if (request.TeamId.HasValue)
        {
            // If strictly different from current team
            if (currentTeam == null || currentTeam.TeamId != request.TeamId.Value)
            {
                // Verify new team exists
                if (!await _context.Teams.AnyAsync(t => t.Id == request.TeamId.Value))
                    return BadRequest(new { message = "Equipa inválida" });

                // Deactivate current team if exists
                if (currentTeam != null)
                {
                    currentTeam.LeftAt = DateTime.UtcNow;
                }

                // Add new team
                user.AthleteProfile.AthleteTeams.Add(new AthleteTeam
                {
                    TeamId = request.TeamId.Value,
                    JoinedAt = DateTime.UtcNow
                });
            }
        }
        else
        {
            // If null passed and there is an active team, we might want to remove it
            // For now, let's assume null means "no change" to team unless we add specific logic
            // Or if we want null to mean "remove from team", we would do:
            /*
            if (currentTeam != null)
            {
                currentTeam.LeftAt = DateTime.UtcNow;
            }
            */
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/users/{id}/athlete-profile
    [HttpDelete("{id}/athlete-profile")]
    [Authorize]
    public async Task<IActionResult> DeleteAthleteProfile(int id)
    {
        var user = await _context.Users.Include(u => u.AthleteProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.AthleteProfile == null)
            return NotFound(new { message = "Utilizador não tem perfil de atleta" });

        _context.AthleteProfiles.Remove(user.AthleteProfile);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/users/{id}/member-profile
    [HttpPost("{id}/member-profile")]
    [Authorize]
    public async Task<IActionResult> CreateMemberProfile(int id, [FromBody] MemberProfileRequest request)
    {
        var user = await _context.Users.Include(u => u.MemberProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.MemberProfile != null)
            return BadRequest(new { message = "Utilizador já tem perfil de sócio" });

        // Generate unique membership number
        var count = await _context.MemberProfiles.CountAsync();
        var membershipNumber = $"CDP{DateTime.UtcNow.Year}{(count + 1):D5}";

        var profile = new MemberProfile
        {
            UserId = id,
            MembershipNumber = membershipNumber,
            MembershipStatus = request.MembershipStatus,
            MemberSince = request.MemberSince ?? DateTime.UtcNow,
            PaymentPreference = request.PaymentPreference,
            CreatedAt = DateTime.UtcNow
        };

        _context.MemberProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Perfil de sócio criado com sucesso", membershipNumber });
    }

    // PUT: api/users/{id}/member-profile
    [HttpPut("{id}/member-profile")]
    [Authorize]
    public async Task<IActionResult> UpdateMemberProfile(int id, [FromBody] MemberProfileRequest request)
    {
        var user = await _context.Users.Include(u => u.MemberProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.MemberProfile == null)
            return NotFound(new { message = "Utilizador não tem perfil de sócio" });

        user.MemberProfile.MembershipStatus = request.MembershipStatus;
        user.MemberProfile.MemberSince = request.MemberSince ?? user.MemberProfile.MemberSince;
        user.MemberProfile.PaymentPreference = request.PaymentPreference;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/users/{id}/member-profile
    [HttpDelete("{id}/member-profile")]
    [Authorize]
    public async Task<IActionResult> DeleteMemberProfile(int id)
    {
        var user = await _context.Users.Include(u => u.MemberProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.MemberProfile == null)
            return NotFound(new { message = "Utilizador não tem perfil de sócio" });

        _context.MemberProfiles.Remove(user.MemberProfile);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/users/{id}/coach-profile
    [HttpPost("{id}/coach-profile")]
    [Authorize]
    public async Task<IActionResult> CreateCoachProfile(int id, [FromBody] CoachProfileRequest request)
    {
        var user = await _context.Users.Include(u => u.CoachProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.CoachProfile != null)
            return BadRequest(new { message = "Utilizador já tem perfil de treinador" });

        // Validate SportId
        if (!await _context.Sports.AnyAsync(s => s.Id == request.SportId))
            return BadRequest(new { message = "Modalidade inválida" });

        // Validate TeamId if provided
        if (request.TeamId.HasValue && !await _context.Teams.AnyAsync(t => t.Id == request.TeamId.Value))
            return BadRequest(new { message = "Equipa inválida" });

        var profile = new CoachProfile
        {
            UserId = id,
            SportId = request.SportId,
            TeamId = request.TeamId,
            LicenseNumber = request.LicenseNumber,
            LicenseLevel = request.LicenseLevel,
            LicenseExpiry = request.LicenseExpiry,
            Specialization = request.Specialization,
            CreatedAt = DateTime.UtcNow
        };

        _context.CoachProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Perfil de treinador criado com sucesso" });
    }

    // PUT: api/users/{id}/coach-profile
    [HttpPut("{id}/coach-profile")]
    [Authorize]
    public async Task<IActionResult> UpdateCoachProfile(int id, [FromBody] CoachProfileRequest request)
    {
        var user = await _context.Users.Include(u => u.CoachProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.CoachProfile == null)
            return NotFound(new { message = "Utilizador não tem perfil de treinador" });

        // Validate SportId
        if (!await _context.Sports.AnyAsync(s => s.Id == request.SportId))
            return BadRequest(new { message = "Modalidade inválida" });

        // Validate TeamId if provided
        if (request.TeamId.HasValue && !await _context.Teams.AnyAsync(t => t.Id == request.TeamId.Value))
            return BadRequest(new {message = "Equipa inválida" });

        user.CoachProfile.SportId = request.SportId;
        user.CoachProfile.TeamId = request.TeamId;
        user.CoachProfile.LicenseNumber = request.LicenseNumber;
        user.CoachProfile.LicenseLevel = request.LicenseLevel;
        user.CoachProfile.LicenseExpiry = request.LicenseExpiry;
        user.CoachProfile.Specialization = request.Specialization;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/users/{id}/coach-profile
    [HttpDelete("{id}/coach-profile")]
    [Authorize]
    public async Task<IActionResult> DeleteCoachProfile(int id)
    {
        var user = await _context.Users.Include(u => u.CoachProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.CoachProfile == null)
            return NotFound(new { message = "Utilizador não tem perfil de treinador" });

        _context.CoachProfiles.Remove(user.CoachProfile);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ========== ROLE MANAGEMENT ==========

    // GET: api/users/{id}/roles
    [HttpGet("{id}/roles")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RoleInfo>>> GetUserRoles(int id)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });

        var roles = user.UserRoles.Select(ur => new RoleInfo
        {
            Id = ur.Role.Id,
            Name = ur.Role.Name
        }).ToList();

        return Ok(roles);
    }

    // POST: api/users/{id}/roles
    [HttpPost("{id}/roles")]
    [Authorize]
    public async Task<IActionResult> AssignRole(int id, [FromBody] AssignRoleRequest request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });

        // Check if role exists
        if (!await _context.Roles.AnyAsync(r => r.Id == request.RoleId))
            return BadRequest(new { message = "Role inválida" });

        // Check if user already has this role
        if (user.UserRoles.Any(ur => ur.RoleId == request.RoleId))
            return BadRequest(new { message = "Utilizador já tem esta role" });

        var userRole = new UserRole
        {
            UserId = id,
            RoleId = request.RoleId,
            AssignedAt = DateTime.UtcNow
        };

        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Role atribuída com sucesso" });
    }

    // DELETE: api/users/{id}/roles/{roleId}
    [HttpDelete("{id}/roles/{roleId}")]
    [Authorize]
    public async Task<IActionResult> RemoveRole(int id, int roleId)
    {
        var userRole = await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == id && ur.RoleId == roleId);

        if (userRole == null)
            return NotFound(new { message = "Utilizador não tem esta role" });

        _context.UserRoles.Remove(userRole);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs
public class UserResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Nif { get; set; }
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? City { get; set; }
    public bool HasAthleteProfile { get; set; }
    public bool HasMemberProfile { get; set; }
    public bool HasCoachProfile { get; set; }
    public string? CurrentTeam { get; set; }
    public List<RoleInfo> Roles { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLogin { get; set; }
    public int? AthleteProfileId { get; set; }
}

public class UserDetailResponse : UserResponse
{
    public AthleteProfileInfo? AthleteProfile { get; set; }
    public MemberProfileInfo? MemberProfile { get; set; }
    public CoachProfileInfo? CoachProfile { get; set; }
}

public class AthleteProfileInfo
{
    public int? Height { get; set; }
    public int? Weight { get; set; }
    public DateTime? MedicalCertificateExpiry { get; set; }
    public List<TeamInfo> Teams { get; set; } = new();
}

public class MemberProfileInfo
{
    public string MembershipNumber { get; set; } = string.Empty;
    public MembershipStatus MembershipStatus { get; set; }
    public DateTime? MemberSince { get; set; }
    public string? PaymentPreference { get; set; }
}

public class CoachProfileInfo
{
    public int SportId { get; set; }
    public string SportName { get; set; } = string.Empty;
    public int? TeamId { get; set; }
    public string? TeamName { get; set; }
    public string? LicenseNumber { get; set; }
    public string? LicenseLevel { get; set; }
    public DateTime? LicenseExpiry { get; set; }
    public string? Specialization { get; set; }
}

public class RoleInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class TeamInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? JerseyNumber { get; set; }
    public string? Position { get; set; }
    public bool IsCaptain { get; set; }
}

public class UserCreateRequest
{
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Nif { get; set; }
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? City { get; set; }
}

public class UserUpdateRequest
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Nif { get; set; }
    public string? Address { get; set; }
    public string? PostalCode { get; set; }
    public string? City { get; set; }
}

public class AthleteProfileRequest
{
    public int? Height { get; set; }
    public int? Weight { get; set; }
    public DateTime? MedicalCertificateExpiry { get; set; }
    public int? TeamId { get; set; }
}

public class MemberProfileRequest
{
    public MembershipStatus MembershipStatus { get; set; } = MembershipStatus.Pending;
    public DateTime? MemberSince { get; set; }
    public string? PaymentPreference { get; set; }
}

public class CoachProfileRequest
{
    public int SportId { get; set; }
    public int? TeamId { get; set; }
    public string? LicenseNumber { get; set; }
    public string? LicenseLevel { get; set; }
    public DateTime? LicenseExpiry { get; set; }
    public string? Specialization { get; set; }
}

public class AssignRoleRequest
{
    public int RoleId { get; set; }
}

