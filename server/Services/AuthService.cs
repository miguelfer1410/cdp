using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using CdpApi.DTOs;
using server.Services;

namespace CdpApi.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<RegisterResponse?> RegisterAsync(RegisterRequest request);
    Task ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
    Task<List<LinkedUserInfo>> GetLinkedUsersAsync(int userId);
    Task<LoginResponse?> SwitchUserAsync(int currentUserId, int targetUserId);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AuthService(
        ApplicationDbContext context,
        IPasswordService passwordService,
        IConfiguration configuration,
        IEmailService emailService)
    {
        _context = context;
        _passwordService = passwordService;
        _configuration = configuration;
        _emailService = emailService;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // Find the primary user (exact email match)
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.AthleteProfile)
            .Include(u => u.CoachProfile)
            .Include(u => u.MemberProfile)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            return null; 
        }

        if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return null; 
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is inactive");
        }

        user.LastLogin = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var roles = GetUserRoles(user);

        // Use the centralized method to get linked users (handles aliases and explicit links)
        var linkedUsers = await GetLinkedUsersAsync(user.Id);

        var token = GenerateJwtToken(user, roles);
        var expirationHours = _configuration.GetValue<int>("JwtSettings:ExpirationHours", 24);

        return new LoginResponse
        {
            Token = token,
            Id = user.Id,
            Roles = roles,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            ExpiresAt = DateTime.UtcNow.AddHours(expirationHours),
            AcceptedRegulation = user.AcceptedRegulation,
            LinkedUsers = linkedUsers
        };
    }

    public async Task<RegisterResponse?> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (existingUser != null)
        {
            throw new InvalidOperationException("Email already registered");
        }

        var user = new User
        {
            Email = request.Email,
            PasswordHash = _passwordService.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            BirthDate = request.BirthDate,
            Nif = request.Nif,
            Address = request.Address,
            PostalCode = request.PostalCode,
            City = request.City,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assign "User" role by default
        var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
        if (userRole != null)
        {
            var userRoleAssignment = new UserRole
            {
                UserId = user.Id,
                RoleId = userRole.Id,
                AssignedAt = DateTime.UtcNow
            };
            _context.UserRoles.Add(userRoleAssignment);
        }

        // Create MemberProfile (all new registrations are members)
        var memberProfile = new MemberProfile
        {
            UserId = user.Id,
            MembershipNumber = GenerateMembershipNumber(),
            MembershipStatus = MembershipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _context.MemberProfiles.Add(memberProfile);

        await _context.SaveChangesAsync();

        return new RegisterResponse
        {
            Message = "Registration successful",
            UserId = user.Id,
            Email = user.Email
        };
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

        // We do not reveal if the email exists or not for security reasons
        if (user == null)
        {
            return;
        }

        // Generate token
        var token = Guid.NewGuid().ToString();
        
        // Save token to user
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(1); // Token valid for 1 hour
        await _context.SaveChangesAsync();

        // Create reset link
        // Use IConfiguration to get the base URL if possible or hardcode for now based on user context
        // Ideally this should be in appsettings
        var clientUrl = "http://localhost:3001"; // Assuming default React port
        var resetLink = $"{clientUrl}/reset-password?token={token}";

        // Send Email
        await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink);
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token);

        if (user == null || user.PasswordResetTokenExpires < DateTime.UtcNow)
        {
            return false;
        }

        user.PasswordHash = _passwordService.HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpires = null;

        // Also update password for all aliased accounts (e.g. parent+child@gmail.com)
        // so the parent can log in to all accounts with the same new password
        var emailLower = user.Email.ToLower();
        var atIndex = emailLower.LastIndexOf('@');
        if (atIndex > 0)
        {
            var localPart = emailLower.Substring(0, atIndex);
            var domain = emailLower.Substring(atIndex); // includes @

            // If this is a primary email (no '+' alias), update its children
            // If this is already an alias, we might want to update siblings? 
            // For now, let's assume valid flow is parent (primary) resetting password.
            if (!localPart.Contains('+'))
            {
                var aliasedUsers = await _context.Users
                    .Where(u => u.Email.ToLower().StartsWith(localPart + "+") && u.Email.ToLower().EndsWith(domain))
                    .ToListAsync();

                foreach (var aliasUser in aliasedUsers)
                {
                    aliasUser.PasswordHash = user.PasswordHash;
                    // Ideally we should also clear their reset tokens if they had any pending
                    aliasUser.PasswordResetToken = null;
                    aliasUser.PasswordResetTokenExpires = null;
                }
            }
        }
        
        await _context.SaveChangesAsync();
        return true;
    }

    private string GenerateJwtToken(User user, List<string>? roles = null)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key not configured")));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("FirstName", user.FirstName),
            new Claim("LastName", user.LastName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add role claims
        if (roles != null)
        {
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }
        else
        {
            // Fallback to database roles if not provided (for backward compatibility if method used elsewhere)
            foreach (var userRole in user.UserRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
            }
        }

        var expirationHours = _configuration.GetValue<int>("JwtSettings:ExpirationHours", 24);

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expirationHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    // ─── GetLinkedUsersAsync ───────────────────────────────────────────────────
    // Re-runs the same linked-user resolution used at login time so the
    // frontend can refresh the list without requiring a re-login.
    public async Task<List<LinkedUserInfo>> GetLinkedUsersAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.AthleteProfile)
            .Include(u => u.CoachProfile)
            .Include(u => u.MemberProfile)
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return new List<LinkedUserInfo>();

        var linkedUsers = new List<LinkedUserInfo>();

        // 1. Email-alias siblings (e.g. mae@gmail.com ↔ mae+filho@gmail.com)
        var emailLower = user.Email.ToLower();
        var atIndex   = emailLower.LastIndexOf('@');
        if (atIndex > 0)
        {
            var localPart = emailLower.Substring(0, atIndex);
            // strip any existing alias so we always search from the base local part
            var plusIdx = localPart.IndexOf('+');
            var baseLocal = plusIdx >= 0 ? localPart.Substring(0, plusIdx) : localPart;
            var domain    = emailLower.Substring(atIndex);

            var allLinked = await _context.Users
                .Include(u => u.AthleteProfile)
                .Include(u => u.CoachProfile)
                .Include(u => u.MemberProfile)
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Where(u => u.IsActive
                         && u.Email.ToLower().StartsWith(baseLocal)
                         && u.Email.ToLower().EndsWith(domain))
                .ToListAsync();

            linkedUsers = allLinked
                .Where(u =>
                {
                    var el = u.Email.ToLower();
                    var ll = el.Substring(0, el.LastIndexOf('@'));
                    return ll == baseLocal || ll.StartsWith(baseLocal + "+");
                })
                .Select(u => new LinkedUserInfo
                {
                    Id            = u.Id,
                    FirstName     = u.FirstName,
                    LastName      = u.LastName,
                    Email         = u.Email,
                    DashboardType = u.AthleteProfile != null ? "atleta"
                                  : u.CoachProfile   != null ? "treinador"
                                  : (u.MemberProfile != null || u.UserRoles.Any(ur => ur.Role.Name == "Socio")) ? "socio"
                                  : u.UserRoles.Any(ur => ur.Role.Name == "Admin") ? "Admin"
                                  : "user",
                    Roles         = GetUserRoles(u),
                    IsSocio = u.AthleteProfile != null || u.MemberProfile != null
                           || u.UserRoles.Any(ur => ur.Role.Name == "Socio")
                })
                .ToList();
        }

        // 2. Explicit UserFamilyLink records (inherited across all discovered siblings)
        var allFoundIds = linkedUsers.Select(lu => lu.Id).ToList();
        if (!allFoundIds.Contains(userId)) allFoundIds.Add(userId);

        var explicitLinks = await _context.UserFamilyLinks
            .Where(l => allFoundIds.Contains(l.UserId) || allFoundIds.Contains(l.LinkedUserId))
            .Include(l => l.User).ThenInclude(u => u.AthleteProfile)
            .Include(l => l.User).ThenInclude(u => u.CoachProfile)
            .Include(l => l.User).ThenInclude(u => u.MemberProfile)
            .Include(l => l.User).ThenInclude(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(l => l.LinkedUser).ThenInclude(u => u.AthleteProfile)
            .Include(l => l.LinkedUser).ThenInclude(u => u.CoachProfile)
            .Include(l => l.LinkedUser).ThenInclude(u => u.MemberProfile)
            .Include(l => l.LinkedUser).ThenInclude(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .ToListAsync();

        foreach (var link in explicitLinks)
        {
            // Identify the relative (the one who is NOT one of our already-found siblings)
            var other = allFoundIds.Contains(link.UserId) ? link.LinkedUser : link.User;
            
            if (other == null || !other.IsActive) continue;
            if (allFoundIds.Contains(other.Id)) continue; // Already in the sibling list
            if (linkedUsers.Any(lu => lu.Id == other.Id)) continue; // Safety check

            linkedUsers.Add(new LinkedUserInfo
            {
                Id            = other.Id,
                FirstName     = other.FirstName,
                LastName      = other.LastName,
                Email         = other.Email,
                DashboardType = other.AthleteProfile != null ? "atleta"
                              : other.CoachProfile   != null ? "treinador"
                              : (other.MemberProfile != null || other.UserRoles.Any(ur => ur.Role.Name == "Socio")) ? "socio"
                              : other.UserRoles.Any(ur => ur.Role.Name == "Admin") ? "Admin"
                              : "user",
                Roles         = GetUserRoles(other),
                IsSocio      = other.AthleteProfile != null || other.MemberProfile != null
                            || other.UserRoles.Any(ur => ur.Role.Name == "Socio"),
                Relationship = link.Relationship
            });
        }

        return linkedUsers;
    }

    public async Task<LoginResponse?> SwitchUserAsync(int currentUserId, int targetUserId)
    {
        var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (currentUser == null) return null;

        var targetUser = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.AthleteProfile)
            .Include(u => u.CoachProfile)
            .Include(u => u.MemberProfile)
            .FirstOrDefaultAsync(u => u.Id == targetUserId);

        if (targetUser == null) return null;

        // Verify linkage (same base email)
        var currentBase = GetBaseEmail(currentUser.Email);
        var targetBase = GetBaseEmail(targetUser.Email);

        if (currentBase != targetBase)
        {
            // Also check explicit links
            var isExplicitlyLinked = await _context.UserFamilyLinks.AnyAsync(l => 
                (l.UserId == currentUserId && l.LinkedUserId == targetUserId) ||
                (l.UserId == targetUserId && l.LinkedUserId == currentUserId));
            
            if (!isExplicitlyLinked) return null;
        }

        // Determine roles (logic copied from LoginAsync for consistency)
        var roles = GetUserRoles(targetUser);

        var token = GenerateJwtToken(targetUser, roles);
        var linkedUsers = await GetLinkedUsersAsync(targetUser.Id);

        return new LoginResponse
        {
            Token = token,
            Id = targetUser.Id,
            Roles = roles,
            FirstName = targetUser.FirstName,
            LastName = targetUser.LastName,
            Email = targetUser.Email,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            AcceptedRegulation = targetUser.AcceptedRegulation,
            LinkedUsers = linkedUsers
        };
    }

    private List<string> GetUserRoles(User user)
    {
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        
        // Add implicit roles based on profiles
        if (user.AthleteProfile != null && !roles.Contains("Atleta"))
        {
            roles.Add("Atleta");
        }
        
        if (user.CoachProfile != null && !roles.Contains("Treinador"))
        {
            roles.Add("Treinador");
        }

        if (user.MemberProfile != null && !roles.Contains("Socio"))
        {
            roles.Add("Socio");
        }

        // If user has specific roles (Athlete, Coach, Admin, Socio), remove the generic "User" role
        if (roles.Contains("User") && (roles.Contains("Atleta") || roles.Contains("Treinador") || roles.Contains("Admin") || roles.Contains("Socio")))
        {
            roles.Remove("User");
        }

        return roles;
    }

    private string GetBaseEmail(string email)
    {
        var emailLower = email.ToLower();
        var atIndex = emailLower.LastIndexOf('@');
        if (atIndex <= 0) return emailLower;
        var localPart = emailLower.Substring(0, atIndex);
        var plusIdx = localPart.IndexOf('+');
        var baseLocal = plusIdx >= 0 ? localPart.Substring(0, plusIdx) : localPart;
        var domain = emailLower.Substring(atIndex);
        return baseLocal + domain;
    }

    private string GenerateMembershipNumber()
    {
        var memberCount = _context.MemberProfiles.Count();
        return (memberCount + 1).ToString();
    }
}

