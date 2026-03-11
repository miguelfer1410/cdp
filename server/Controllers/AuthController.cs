using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CdpApi.DTOs;
using CdpApi.Services;
using System.Security.Claims;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Login endpoint for all user types (Atleta, Treinador, Socio, Admin)
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var response = await _authService.LoginAsync(request);

            if (response == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "An error occurred during login" });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            await _authService.ForgotPasswordAsync(request.Email);
            // We always return Ok to prevent email enumeration
            return Ok(new { message = "Se o email existir, receberá instruções para recuperar a password." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in forgot password");
            return StatusCode(500, new { message = "Ocorreu um erro ao processar o pedido." });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var result = await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
            if (!result)
            {
                return BadRequest(new { message = "Link inválido ou expirado." });
            }
            return Ok(new { message = "Password alterada com sucesso." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in reset password");
            return StatusCode(500, new { message = "Ocorreu um erro ao alterar a password." });
        }
    }

    /// <summary>
    /// Returns the list of linked users for the currently authenticated user.
    /// Called on dashboard mount so the frontend stays up-to-date without re-login.
    /// </summary>
    [HttpGet("linked-users")]
    [Authorize]
    public async Task<IActionResult> GetLinkedUsers()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            return Unauthorized(new { message = "Token inválido." });

        try
        {
            var linkedUsers = await _authService.GetLinkedUsersAsync(userId);
            return Ok(linkedUsers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching linked users for userId {UserId}", userId);
            return StatusCode(500, new { message = "Erro ao obter utilizadores associados." });
        }
    }
}
