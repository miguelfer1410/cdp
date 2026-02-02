using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using CdpApi.Data;
using CdpApi.DTOs;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UserController> _logger;

    public UserController(ApplicationDbContext context, ILogger<UserController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            // Get user ID from JWT token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var userId = int.Parse(userIdClaim.Value);

            // Get user from database
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Map to response DTO
            var response = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                BirthDate = user.BirthDate,
                Nif = user.Nif,
                Address = user.Address,
                PostalCode = user.PostalCode,
                City = user.City,
                UserType = user.UserType.ToString(),
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while retrieving profile" });
        }
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    [HttpPut("profile")]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        try
        {
            // Get user ID from JWT token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var userId = int.Parse(userIdClaim.Value);

            // Get user from database
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Update user fields
            user.Phone = request.Phone;
            user.Nif = request.Nif;
            user.Address = request.Address;
            user.PostalCode = request.PostalCode;
            user.City = request.City;

            await _context.SaveChangesAsync();

            // Return updated profile
            var response = new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.Phone,
                BirthDate = user.BirthDate,
                Nif = user.Nif,
                Address = user.Address,
                PostalCode = user.PostalCode,
                City = user.City,
                UserType = user.UserType.ToString(),
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while updating profile" });
        }
    }
}
