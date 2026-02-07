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
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
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

        var token = GenerateJwtToken(user);
        var expirationHours = _configuration.GetValue<int>("JwtSettings:ExpirationHours", 24);

        return new LoginResponse
        {
            Token = token,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            ExpiresAt = DateTime.UtcNow.AddHours(expirationHours)
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
        var clientUrl = "http://localhost:3000"; // Assuming default React port
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
        
        await _context.SaveChangesAsync();
        return true;
    }

    private string GenerateJwtToken(User user)
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

        // Add role claims from UserRoles
        foreach (var userRole in user.UserRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
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
    private string GenerateMembershipNumber()
    {
        // Generate membership number based on current count + 1
        // Format: CDP-XXXXXX (e.g., CDP-000001, CDP-000002)
        var memberCount = _context.MemberProfiles.Count();
        var memberNumber = (memberCount + 1).ToString("D6");
        return $"CDP-{memberNumber}";
    }
}

