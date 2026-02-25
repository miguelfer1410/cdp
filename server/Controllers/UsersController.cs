using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using CdpApi.DTOs;
using server.Services;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public UsersController(ApplicationDbContext context, IEmailService emailService, IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
    }

    // GET: api/users - List all users with optional filters
    [HttpGet]
    // [Authorize]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetUsers(
        [FromQuery] string? profileType = null,
        [FromQuery] int? roleId = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int? teamId = null,
        [FromQuery] int? sportId = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _context.Users
            .Include(u => u.AthleteProfile)
                .ThenInclude(ap => ap.AthleteTeams)
                    .ThenInclude(at => at.Team)
                        .ThenInclude(t => t.Sport)
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
                "member" => query.Where(u => u.MemberProfile != null && u.AthleteProfile == null),
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

        // Filter by sport
        if (sportId.HasValue)
        {
            query = query.Where(u =>
                (u.AthleteProfile != null && u.AthleteProfile.AthleteTeams.Any(at => at.Team.SportId == sportId.Value && at.LeftAt == null)) ||
                (u.CoachProfile != null && u.CoachProfile.SportId == sportId.Value)
            );
        }

        // Search by name or email (token-based flexible search)
        if (!string.IsNullOrEmpty(search))
        {
            var searchTokens = search.ToLower().Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            foreach (var token in searchTokens)
            {
                query = query.Where(u =>
                    u.FirstName.ToLower().Contains(token) ||
                    u.LastName.ToLower().Contains(token) ||
                    u.Email.ToLower().Contains(token) ||
                    (u.AthleteProfile != null && (
                        (u.AthleteProfile.FirstName != null && u.AthleteProfile.FirstName.ToLower().Contains(token)) ||
                        (u.AthleteProfile.LastName != null && u.AthleteProfile.LastName.ToLower().Contains(token))
                    )));
            }
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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
            AthleteProfileId = u.AthleteProfile?.Id,
            Sport = u.AthleteProfile != null
                ? u.AthleteProfile.AthleteTeams.FirstOrDefault(at => at.LeftAt == null)?.Team.Sport.Name
                : (u.CoachProfile != null ? u.CoachProfile.Sport?.Name : null)
        }).ToList();

        var result = new PaginatedResponse<UserResponse>
        {
            Items = response,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };

        return Ok(result);
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
                        .ThenInclude(t => t.Sport)
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
                Id = user.AthleteProfile.Id,
                FirstName = user.AthleteProfile.FirstName,
                LastName = user.AthleteProfile.LastName,
                Height = user.AthleteProfile.Height,
                Weight = user.AthleteProfile.Weight,
                MedicalCertificateExpiry = user.AthleteProfile.MedicalCertificateExpiry,
                Escalao = user.AthleteProfile.Escalao,
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
            LastLogin = user.LastLogin,
            Sport = user.AthleteProfile != null
                ? user.AthleteProfile.AthleteTeams.FirstOrDefault(at => at.LeftAt == null)?.Team.Sport.Name
                : (user.CoachProfile != null ? user.CoachProfile.Sport?.Name : null)
        };

        return Ok(response);
    }

    // POST: api/users - Create new user (sends activation email)
    [HttpPost]
    // [Authorize]
    public async Task<ActionResult<UserResponse>> CreateUser([FromBody] UserCreateRequest request)
    {
        // If email already exists, generate an alias (e.g. mae+joao@gmail.com)
        // so siblings/children can share the same parent email for login
        var emailToUse = await GenerateUniqueEmailAsync(request.Email, $"{request.FirstName} {request.LastName}");

        // Generate activation token
        var activationToken = Guid.NewGuid().ToString();

        var user = new User
        {
            Email = emailToUse,
            // Random password hash - user will set real password via activation link
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            BirthDate = request.BirthDate,
            Nif = request.Nif,
            Address = request.Address,
            PostalCode = request.PostalCode,
            City = request.City,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            // Use PasswordResetToken fields for activation
            PasswordResetToken = activationToken,
            PasswordResetTokenExpires = DateTime.UtcNow.AddHours(48) // 48h for activation
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        /*

        try
        {
            // Only send activation email if the email used is the same as the requested one (no alias)
            // If an alias was used (e.g. parent+child@gmail.com), it means the parent already has an account
            // and we don't want to spam them with activation emails for every child
            if (emailToUse.Equals(request.Email, StringComparison.OrdinalIgnoreCase))
            {
                var clientUrl = _configuration["ClientUrl"] ?? "http://localhost:3000";
                var activationLink = $"{clientUrl}/ativar-conta?token={activationToken}";
                await _emailService.SendAccountActivationEmailAsync(request.Email, user.FirstName, activationLink);
            }
            else
            {
                Console.WriteLine($"Info: Activation email skipped for alias {emailToUse} (original: {request.Email})");
            }
        }
        
        catch (Exception ex)
        {
            // Log error but don't fail user creation
            Console.WriteLine($"Warning: Failed to send activation email to {user.Email}: {ex.Message}");
        }
        */

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
            LastLogin = user.LastLogin,
            Sport = user.AthleteProfile != null
                ? user.AthleteProfile.AthleteTeams.FirstOrDefault(at => at.LeftAt == null)?.Team.Sport.Name
                : (user.CoachProfile != null ? user.CoachProfile.Sport?.Name : null)
        };

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, response);
    }

    // POST: api/users/{id}/resend-activation - Resend activation email
    [HttpPost("{id}/resend-activation")]
    [Authorize]
    public async Task<IActionResult> ResendActivation(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });

        // Check if user already has logged in (already activated)
        if (user.LastLogin != null)
            return BadRequest(new { message = "Utilizador já ativou a conta" });

        // Generate new token
        var activationToken = Guid.NewGuid().ToString();
        user.PasswordResetToken = activationToken;
        user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(48);
        await _context.SaveChangesAsync();

        return NoContent();

        /*
        try
        {
            var clientUrl = _configuration["ClientUrl"] ?? "http://localhost:3000";
            var activationLink = $"{clientUrl}/ativar-conta?token={activationToken}";
            await _emailService.SendAccountActivationEmailAsync(user.Email, user.FirstName, activationLink);
            return Ok(new { message = $"Email de ativação reenviado para {user.Email}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Erro ao enviar email: {ex.Message}" });
        }
        */

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

        // Check if email is being changed to one that already exists
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

    // DELETE: api/users/{id} - Soft delete (deactivate)
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users
            .Include(u => u.AthleteProfile)
                .ThenInclude(ap => ap.AthleteTeams)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new { message = "Utilizador não encontrado" });
        }

        // If user is an athlete, remove from current team
        if (user.AthleteProfile != null)
        {
            var activeTeam = user.AthleteProfile.AthleteTeams.FirstOrDefault(at => at.LeftAt == null);
            if (activeTeam != null)
            {
                activeTeam.LeftAt = DateTime.UtcNow;
            }
        }

        user.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ========== ATHLETE PROFILE MANAGEMENT ==========

    // POST: api/users/{id}/athlete-profile — create a new athlete profile for this user
    [HttpPost("{id}/athlete-profile")]
    // [Authorize]
    public async Task<IActionResult> CreateAthleteProfile(int id, [FromBody] AthleteProfileRequest request)
    {
        var user = await _context.Users.Include(u => u.AthleteProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });

        if (user.AthleteProfile != null)
            return BadRequest(new { message = "Utilizador já tem perfil de atleta" });

        var athleteProfile = new AthleteProfile
        {
            UserId = id,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Height = request.Height,
            Weight = request.Weight,
            MedicalCertificateExpiry = request.MedicalCertificateExpiry,
            CreatedAt = DateTime.UtcNow
        };

        _context.AthleteProfiles.Add(athleteProfile);
        await _context.SaveChangesAsync();

        // If teamId provided, create AthleteTeam
        if (request.TeamId.HasValue)
        {
            var athleteTeam = new AthleteTeam
            {
                AthleteProfileId = athleteProfile.Id,
                TeamId = request.TeamId.Value,
                JoinedAt = DateTime.UtcNow
            };
            _context.AthleteTeams.Add(athleteTeam);
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Perfil de atleta criado com sucesso", id = athleteProfile.Id });
    }

    // PUT: api/users/{id}/athlete-profile
    [HttpPut("{id}/athlete-profile")]
    [Authorize]
    public async Task<IActionResult> UpdateAthleteProfile(int id, [FromBody] AthleteProfileRequest request)
    {
        var athleteProfile = await _context.AthleteProfiles
            .Include(a => a.AthleteTeams)
            .FirstOrDefaultAsync(a => a.UserId == id);
        
        if (athleteProfile == null)
            return NotFound(new { message = "Perfil de atleta não encontrado" });

        athleteProfile.FirstName = request.FirstName;
        athleteProfile.LastName = request.LastName;
        athleteProfile.Height = request.Height;
        athleteProfile.Weight = request.Weight;
        athleteProfile.MedicalCertificateExpiry = request.MedicalCertificateExpiry;

        // Handle team changes
        if (request.TeamId.HasValue)
        {
            var currentTeam = athleteProfile.AthleteTeams.FirstOrDefault(at => at.LeftAt == null);
            if (currentTeam != null && currentTeam.TeamId != request.TeamId.Value)
            {
                // Leave current team
                currentTeam.LeftAt = DateTime.UtcNow;
                // Join new team
                var newTeam = new AthleteTeam
                {
                    AthleteProfileId = athleteProfile.Id,
                    TeamId = request.TeamId.Value,
                    JoinedAt = DateTime.UtcNow
                };
                _context.AthleteTeams.Add(newTeam);
            }
            else if (currentTeam == null)
            {
                var newTeam = new AthleteTeam
                {
                    AthleteProfileId = athleteProfile.Id,
                    TeamId = request.TeamId.Value,
                    JoinedAt = DateTime.UtcNow
                };
                _context.AthleteTeams.Add(newTeam);
            }
        }
        else
        {
            // Remove from current team if any
            var currentTeam = athleteProfile.AthleteTeams.FirstOrDefault(at => at.LeftAt == null);
            if (currentTeam != null)
            {
                currentTeam.LeftAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/users/{id}/athlete-profile
    [HttpDelete("{id}/athlete-profile")]
    [Authorize]
    public async Task<IActionResult> DeleteAthleteProfile(int id)
    {
        var athleteProfile = await _context.AthleteProfiles
            .FirstOrDefaultAsync(a => a.UserId == id);
        
        if (athleteProfile == null)
            return NotFound(new { message = "Perfil de atleta não encontrado" });

        _context.AthleteProfiles.Remove(athleteProfile);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ========== MEMBER PROFILE MANAGEMENT ==========

    // POST: api/users/{id}/member-profile
    [HttpPost("{id}/member-profile")]
    public async Task<IActionResult> CreateMemberProfile(int id, [FromBody] MemberProfileRequest request)
    {
        var user = await _context.Users.Include(u => u.MemberProfile).FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return NotFound(new { message = "Utilizador não encontrado" });
        
        if (user.MemberProfile != null)
            return BadRequest(new { message = "Utilizador já tem perfil de sócio" });

        // Generate membership number
        var lastNumber = await _context.MemberProfiles.OrderByDescending(m => m.Id).Select(m => m.MembershipNumber).FirstOrDefaultAsync();
        var nextNumber = 1;
        if (!string.IsNullOrEmpty(lastNumber) && int.TryParse(lastNumber.Replace("CDP-", ""), out var num))
        {
            nextNumber = num + 1;
        }

        var memberProfile = new MemberProfile
        {
            UserId = id,
            MembershipNumber = $"CDP-{nextNumber:D5}",
            MembershipStatus = request.MembershipStatus,
            MemberSince = request.MemberSince ?? DateTime.UtcNow,
            PaymentPreference = request.PaymentPreference,
            CreatedAt = DateTime.UtcNow
        };

        _context.MemberProfiles.Add(memberProfile);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Perfil de sócio criado com sucesso", membershipNumber = memberProfile.MembershipNumber });
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
        user.MemberProfile.MemberSince = request.MemberSince;
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

    // ========== COACH PROFILE MANAGEMENT ==========

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

        var coachProfile = new CoachProfile
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

        _context.CoachProfiles.Add(coachProfile);
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
    // POST: api/users/fix-athlete-members - Temporary fix for missing member profiles
    [HttpPost("fix-athlete-members")]
    // [Authorize] // Temporarily disabled for execution
    public async Task<IActionResult> FixAthleteMembers()
    {
        // 1. Get all users with AthleteProfile but NO MemberProfile
        var usersToFix = await _context.Users
            .Include(u => u.AthleteProfile)
            .Include(u => u.MemberProfile)
            .Where(u => u.AthleteProfile != null && u.MemberProfile == null)
            .ToListAsync();

        if (!usersToFix.Any())
        {
            return Ok(new { message = "Nenhum atleta encontrado sem perfil de sócio." });
        }

        // 2. Get the last membership number to increment from
        var lastMember = await _context.MemberProfiles
            .OrderByDescending(m => m.Id)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastMember != null && !string.IsNullOrEmpty(lastMember.MembershipNumber))
        {
            // Assuming format CDP-00001
            if (lastMember.MembershipNumber.StartsWith("CDP-") && 
                int.TryParse(lastMember.MembershipNumber.Substring(4), out int lastNum))
            {
                nextNumber = lastNum + 1;
            }
        }

        int count = 0;
        foreach (var user in usersToFix)
        {
            var membershipNumber = $"CDP-{nextNumber:D5}";
            
            var memberProfile = new MemberProfile
            {
                UserId = user.Id,
                MembershipNumber = membershipNumber,
                MembershipStatus = MembershipStatus.Active, // Assuming active since they are athletes
                MemberSince = DateTime.UtcNow,
                PaymentPreference = "Monthly",
                CreatedAt = DateTime.UtcNow
            };

            _context.MemberProfiles.Add(memberProfile);
            
            nextNumber++;
            count++;
        }

        await _context.SaveChangesAsync();

        return Ok(new { 
            message = "Correção concluída com sucesso.", 
            fixedCount = count,
            firstNewNumber = $"CDP-{(nextNumber - count):D5}",
            lastNewNumber = $"CDP-{(nextNumber - 1):D5}"
        });
    }

    // POST: api/users/import-siblings - Bulk import for siblings with aliased emails
    [HttpPost("import-siblings")]
    // [Authorize] // Temporarily disabled for script execution
    public async Task<IActionResult> ImportSiblings([FromBody] List<ImportSiblingDto> siblings)
    {
        if (siblings == null || !siblings.Any())
            return BadRequest(new { message = "Empty list" });

        var results = new List<object>();
        
        // Get last membership number
        var lastMember = await _context.MemberProfiles
            .OrderByDescending(m => m.Id)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastMember != null && !string.IsNullOrEmpty(lastMember.MembershipNumber))
        {
            if (lastMember.MembershipNumber.StartsWith("CDP-") && 
                int.TryParse(lastMember.MembershipNumber.Substring(4), out int lastNum))
            {
                nextNumber = lastNum + 1;
            }
        }

        foreach (var sibling in siblings)
        {
            try 
            {
                // --- CORREÇÃO: gerar email com alias para irmãos ---
                string emailToUse = await GenerateUniqueEmailAsync(sibling.Email, sibling.Name);
                // ---------------------------------------------------

                // Create User
                var user = new User
                {
                    Email = emailToUse,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Mudeme123!"),
                    FirstName = sibling.Name.Split(' ').FirstOrDefault() ?? "Unknown",
                    LastName = sibling.Name.Split(' ').LastOrDefault() ?? "Unknown",
                    Phone = sibling.Phone,
                    BirthDate = sibling.BirthDate,
                    Nif = sibling.Nif,
                    Address = sibling.Address,
                    PostalCode = sibling.PostalCode,
                    City = sibling.City,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    PasswordResetToken = Guid.NewGuid().ToString(),
                    PasswordResetTokenExpires = DateTime.UtcNow.AddHours(48)
                };

                // Fix names
                var names = sibling.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (names.Length > 1)
                {
                    user.FirstName = names[0];
                    user.LastName = string.Join(" ", names.Skip(1));
                }

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create Athlete Profile
                var athleteProfile = new AthleteProfile
                {
                    UserId = user.Id,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AthleteProfiles.Add(athleteProfile);

                // Create Member Profile
                var memberProfile = new MemberProfile
                {
                    UserId = user.Id,
                    MembershipNumber = $"CDP-{nextNumber:D5}",
                    MembershipStatus = MembershipStatus.Active,
                    MemberSince = DateTime.UtcNow,
                    PaymentPreference = "Monthly",
                    CreatedAt = DateTime.UtcNow
                };
                _context.MemberProfiles.Add(memberProfile);
                
                nextNumber++;

                // Indicar se foi usado alias
                bool usedAlias = emailToUse != sibling.Email;
                results.Add(new { 
                    name = sibling.Name, 
                    email = emailToUse, 
                    originalEmail = sibling.Email,
                    usedAlias = usedAlias,
                    status = usedAlias ? $"Success (alias: {emailToUse})" : "Success",
                    id = user.Id 
                });
            }
            catch (Exception ex)
            {
                results.Add(new { name = sibling.Name, email = sibling.Email, status = $"Error: {ex.Message}" });
            }
        }

        await _context.SaveChangesAsync();

        return Ok(results);
    }

    // POST: api/users/import-excel-athletes - Bulk import for Excel athletes with Team assignment
    [HttpPost("import-excel-athletes")]
    // [Authorize] // Temporarily disabled for script execution
    public async Task<IActionResult> ImportExcelAthletes([FromBody] List<ImportExcelAthleteDto> athletes)
    {
        if (athletes == null || !athletes.Any())
            return BadRequest(new { message = "Empty list" });

        var results = new List<object>();
        
        // Get last membership number
        var lastMember = await _context.MemberProfiles
            .OrderByDescending(m => m.Id)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (lastMember != null && !string.IsNullOrEmpty(lastMember.MembershipNumber))
        {
            if (lastMember.MembershipNumber.StartsWith("CDP-") && 
                int.TryParse(lastMember.MembershipNumber.Substring(4), out int lastNum))
            {
                nextNumber = lastNum + 1;
            }
        }

        foreach (var athlete in athletes)
        {
            try 
            {
                // Generate unique email (handle siblings)
                string emailToUse = await GenerateUniqueEmailAsync(athlete.Email, athlete.Name);

                // Create User
                var user = new User
                {
                    Email = emailToUse,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Mudeme123!"),
                    FirstName = athlete.Name.Split(' ').FirstOrDefault() ?? "Unknown",
                    LastName = athlete.Name.Split(' ').LastOrDefault() ?? "Unknown",
                    Phone = athlete.Phone,
                    BirthDate = athlete.BirthDate,
                    Nif = athlete.Nif,
                    Address = athlete.Address,
                    PostalCode = athlete.PostalCode,
                    City = athlete.City,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    PasswordResetToken = Guid.NewGuid().ToString(),
                    PasswordResetTokenExpires = DateTime.UtcNow.AddHours(48)
                };

                // Fix names
                var names = athlete.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (names.Length > 1)
                {
                    user.FirstName = names[0];
                    user.LastName = string.Join(" ", names.Skip(1));
                }

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create Athlete Profile
                var athleteProfile = new AthleteProfile
                {
                    UserId = user.Id,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AthleteProfiles.Add(athleteProfile);
                await _context.SaveChangesAsync(); // Save to get Id

                // Assign Team if provided
                if (athlete.TeamId.HasValue)
                {
                    var athleteTeam = new AthleteTeam
                    {
                        AthleteProfileId = athleteProfile.Id,
                        TeamId = athlete.TeamId.Value,
                        JoinedAt = DateTime.UtcNow
                    };
                    _context.AthleteTeams.Add(athleteTeam);
                }

                // Create Member Profile
                var memberProfile = new MemberProfile
                {
                    UserId = user.Id,
                    MembershipNumber = $"CDP-{nextNumber:D5}",
                    MembershipStatus = MembershipStatus.Active,
                    MemberSince = DateTime.UtcNow,
                    PaymentPreference = "Monthly",
                    CreatedAt = DateTime.UtcNow
                };
                _context.MemberProfiles.Add(memberProfile);
                
                nextNumber++;

                // Indicate if alias was used
                bool usedAlias = emailToUse != athlete.Email;
                results.Add(new { 
                    name = athlete.Name, 
                    email = emailToUse, 
                    originalEmail = athlete.Email,
                    teamId = athlete.TeamId,
                    usedAlias = usedAlias,
                    status = usedAlias ? $"Success (alias: {emailToUse})" : "Success",
                    id = user.Id 
                });
            }
            catch (Exception ex)
            {
                results.Add(new { name = athlete.Name, email = athlete.Email, status = $"Error: {ex.Message}" });
            }
        }

        await _context.SaveChangesAsync();

        return Ok(results);
    }

    // Método auxiliar: gera um email único por alias se o original já existir
    private async Task<string> GenerateUniqueEmailAsync(string originalEmail, string fullName)
    {
        // Se o email ainda não existe, usar o original
        if (!await _context.Users.AnyAsync(u => u.Email == originalEmail))
            return originalEmail;

        // Separar local e domínio: "mae@gmail.com" → local="mae", domain="gmail.com"
        var atIndex = originalEmail.LastIndexOf('@');
        if (atIndex < 0) return originalEmail; // fallback se email inválido

        var local = originalEmail.Substring(0, atIndex);
        var domain = originalEmail.Substring(atIndex + 1);

        // Criar alias com o primeiro nome do atleta: "mae+joao@gmail.com"
        var firstName = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "atleta";
        // Limpar caracteres especiais do nome para usar no alias
        var safeName = System.Text.RegularExpressions.Regex.Replace(
            firstName.ToLower()
                     .Replace("à","a").Replace("á","a").Replace("â","a").Replace("ã","a")
                     .Replace("è","e").Replace("é","e").Replace("ê","e")
                     .Replace("ì","i").Replace("í","i")
                     .Replace("ò","o").Replace("ó","o").Replace("ô","o").Replace("õ","o")
                     .Replace("ù","u").Replace("ú","u").Replace("ü","u")
                     .Replace("ç","c"),
            @"[^a-z0-9]", "");

        var aliasEmail = $"{local}+{safeName}@{domain}";

        // Se ainda existir, adicionar número
        if (await _context.Users.AnyAsync(u => u.Email == aliasEmail))
        {
            int counter = 2;
            while (await _context.Users.AnyAsync(u => u.Email == $"{local}+{safeName}{counter}@{domain}"))
                counter++;
            aliasEmail = $"{local}+{safeName}{counter}@{domain}";
        }

        return aliasEmail;
    }


    // ─── Family Links ─────────────────────────────────────────────────────────────

    private string? GetReciprocalRelationship(string? relationship)
    {
        if (string.IsNullOrEmpty(relationship)) return null;
        return relationship switch
        {
            "Pai" => "Filho(a)",
            "Mãe" => "Filho(a)",
            "Filho(a)" => "Pai/Mãe",
            "Irmão/Irmã" => "Irmão/Irmã",
            "Cônjuge" => "Cônjuge",
            _ => relationship
        };
    }

    /// <summary>Get all linked members (aliases and explicit links) for a user (admin only).</summary>
    [HttpGet("{id}/all-linked-members")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<FamilyLinkResponse>>> GetAllLinkedMembers(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var resultList = new List<FamilyLinkResponse>();

        // 1. Explicit Family Links
        var explicitLinks = await _context.UserFamilyLinks
            .Where(l => l.UserId == id || l.LinkedUserId == id)
            .Include(l => l.User)
            .Include(l => l.LinkedUser)
            .ToListAsync();

        foreach (var l in explicitLinks)
        {
            var other = l.UserId == id ? l.LinkedUser : l.User;
            var relationship = l.UserId == id ? l.Relationship : GetReciprocalRelationship(l.Relationship);
            
            resultList.Add(new FamilyLinkResponse
            {
                LinkId = l.Id,
                UserId = other.Id,
                FullName = $"{other.FirstName} {other.LastName}".Trim(),
                Email = other.Email,
                Relationship = relationship,
                CreatedAt = l.CreatedAt,
                IsExplicit = true
            });
        }

        // 2. Email Alias Links
        var emailLower = user.Email.ToLower();
        var atIndex = emailLower.LastIndexOf('@');
        if (atIndex > 0)
        {
            var localPart = emailLower.Substring(0, atIndex);
            var domain = emailLower.Substring(atIndex);

            var plusIndex = localPart.IndexOf('+');
            var baseLocal = plusIndex > -1 ? localPart.Substring(0, plusIndex) : localPart;

            var aliasedUsers = await _context.Users
                .Where(u => u.Id != id && u.IsActive && 
                       u.Email.ToLower().StartsWith(baseLocal) && 
                       u.Email.ToLower().EndsWith(domain))
                .ToListAsync();

            foreach (var au in aliasedUsers)
            {
                var auLower = au.Email.ToLower();
                var auAtIndex = auLower.LastIndexOf('@');
                if (auAtIndex <= 0) continue;
                
                var auLocal = auLower.Substring(0, auAtIndex);
                if (auLocal == baseLocal || auLocal.StartsWith(baseLocal + "+"))
                {
                    if (resultList.Any(r => r.UserId == au.Id)) continue;

                    resultList.Add(new FamilyLinkResponse
                    {
                        LinkId = 0,
                        UserId = au.Id,
                        FullName = $"{au.FirstName} {au.LastName}".Trim(),
                        Email = au.Email,
                        Relationship = "Outro",
                        CreatedAt = au.CreatedAt,
                        IsExplicit = false
                    });
                }
            }
        }

        return Ok(resultList);
    }

    /// <summary>Get all explicit family links for a given user (admin only).</summary>
    [HttpGet("{id}/family-links")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<FamilyLinkResponse>>> GetFamilyLinks(int id)
    {
        var links = await _context.UserFamilyLinks
            .Where(l => l.UserId == id || l.LinkedUserId == id)
            .Include(l => l.User)
            .Include(l => l.LinkedUser)
            .ToListAsync();

        var result = links.Select(l =>
        {
            var other = l.UserId == id ? l.LinkedUser : l.User;
            return new FamilyLinkResponse
            {
                LinkId = l.Id,
                UserId = other.Id,
                FullName = $"{other.FirstName} {other.LastName}".Trim(),
                Email = other.Email,
                Relationship = l.Relationship,
                CreatedAt = l.CreatedAt
            };
        });

        return Ok(result);
    }

    /// <summary>Create a bidirectional family link between two users (admin only).</summary>
    [HttpPost("{id}/family-links")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddFamilyLink(int id, [FromBody] FamilyLinkDto dto)
    {
        if (id == dto.LinkedUserId)
            return BadRequest(new { message = "Não pode associar um utilizador a si próprio." });

        var userExists = await _context.Users.AnyAsync(u => u.Id == id);
        var linkedExists = await _context.Users.AnyAsync(u => u.Id == dto.LinkedUserId);
        if (!userExists || !linkedExists)
            return NotFound(new { message = "Utilizador não encontrado." });

        // Check if link already exists (either direction)
        var exists = await _context.UserFamilyLinks.AnyAsync(l =>
            (l.UserId == id && l.LinkedUserId == dto.LinkedUserId) ||
            (l.UserId == dto.LinkedUserId && l.LinkedUserId == id));

        if (exists)
            return Conflict(new { message = "Estes utilizadores já estão associados." });

        // Create one row (AuthService queries both directions)
        var link = new UserFamilyLink
        {
            UserId = id,
            LinkedUserId = dto.LinkedUserId,
            Relationship = dto.Relationship,
            CreatedAt = DateTime.UtcNow
        };

        _context.UserFamilyLinks.Add(link);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Associação familiar criada.", linkId = link.Id });
    }

    /// <summary>Update the relationship of an existing family link (admin only).</summary>
    [HttpPut("{id}/family-links/{linkId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateFamilyLink(int id, int linkId, [FromBody] FamilyLinkDto dto)
    {
        var link = await _context.UserFamilyLinks
            .FirstOrDefaultAsync(l => l.Id == linkId && (l.UserId == id || l.LinkedUserId == id));

        if (link == null)
            return NotFound(new { message = "Associação não encontrada." });

        if (link.UserId == id)
        {
            link.Relationship = dto.Relationship;
        }
        else
        {
            // If the user being edited is the LinkedUserId, we must store the incoming relationship's reciprocal
            // because Relationship is UserId -> LinkedUserId
            link.Relationship = GetReciprocalRelationship(dto.Relationship);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Parentesco atualizado." });
    }

    /// <summary>Remove a family link by link ID (admin only).</summary>
    [HttpDelete("{id}/family-links/{linkId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveFamilyLink(int id, int linkId)
    {
        var link = await _context.UserFamilyLinks
            .FirstOrDefaultAsync(l => l.Id == linkId && (l.UserId == id || l.LinkedUserId == id));

        if (link == null)
            return NotFound(new { message = "Associação não encontrada." });

        _context.UserFamilyLinks.Remove(link);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Associação removida." });
    }

} // end UsersController

// ─── Family Link DTOs ────────────────────────────────────────────────────────

public class FamilyLinkDto
{
    public int LinkedUserId { get; set; }
    public string? Relationship { get; set; }
}

public class FamilyLinkResponse
{
    public int LinkId { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Relationship { get; set; }
    public bool IsExplicit { get; set; }
    public DateTime CreatedAt { get; set; }
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
    public string? Sport { get; set; }
}

public class UserDetailResponse : UserResponse
{
    public AthleteProfileInfo? AthleteProfile { get; set; }
    public MemberProfileInfo? MemberProfile { get; set; }
    public CoachProfileInfo? CoachProfile { get; set; }
}

public class AthleteProfileInfo
{
    public int Id { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int? Height { get; set; }
    public int? Weight { get; set; }
    public DateTime? MedicalCertificateExpiry { get; set; }
    public string? Escalao { get; set; }
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
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
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

public class ImportSiblingDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? Nif { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Gender { get; set; }
    public string? CC { get; set; }
}


// ─────────────────────────────────────────────────────────────────────────────

public class ImportExcelAthleteDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string? Nif { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Gender { get; set; }
    public string? CC { get; set; }
    public int? TeamId { get; set; }
}