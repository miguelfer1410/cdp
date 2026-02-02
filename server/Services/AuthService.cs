using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;
using CdpApi.DTOs;

namespace CdpApi.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<RegisterResponse?> RegisterAsync(RegisterRequest request);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IConfiguration _configuration;

    public AuthService(
        ApplicationDbContext context,
        IPasswordService passwordService,
        IConfiguration configuration)
    {
        _context = context;
        _passwordService = passwordService;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // Find user by email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            return null; // Invalid credentials
        }

        // Verify password
        if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return null; // Invalid credentials
        }

        // Check if account is active
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is inactive");
        }

        // Update last login
        user.LastLogin = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Generate JWT token
        var token = GenerateJwtToken(user);
        var expirationHours = _configuration.GetValue<int>("JwtSettings:ExpirationHours", 24);

        return new LoginResponse
        {
            Token = token,
            UserType = user.UserType.ToString(),
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            ExpiresAt = DateTime.UtcNow.AddHours(expirationHours)
        };
    }

    public async Task<RegisterResponse?> RegisterAsync(RegisterRequest request)
    {
        // Check if email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (existingUser != null)
        {
            throw new InvalidOperationException("Email already registered");
        }

        // Create new user (always as Socio)
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
            UserType = UserType.Socio, // Registration is only for members
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new RegisterResponse
        {
            Message = "Registration successful",
            UserId = user.Id,
            Email = user.Email
        };
    }

    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key not configured")));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.UserType.ToString()),
            new Claim("FirstName", user.FirstName),
            new Claim("LastName", user.LastName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

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
}
