using Microsoft.AspNetCore.Mvc;
using CdpApi.DTOs;
using CdpApi.Services;

namespace CdpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegisterController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<RegisterController> _logger;

    public RegisterController(IAuthService authService, ILogger<RegisterController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Registration endpoint for new Socios (members) only
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var response = await _authService.RegisterAsync(request);

            if (response == null)
            {
                return BadRequest(new { message = "Registration failed" });
            }

            return CreatedAtAction(nameof(Register), new { id = response.UserId }, response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred during registration" });
        }
    }
}
