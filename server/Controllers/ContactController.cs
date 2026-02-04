using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<ContactController> _logger;

        public ContactController(IEmailService emailService, ILogger<ContactController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> SendContact([FromBody] ContactRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                await _emailService.SendContactEmailAsync(
                    request.Name,
                    request.Email,
                    request.Subject,
                    request.Message
                );

                return Ok(new { message = "Mensagem enviada com sucesso!" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in SendContact: {ex.Message}");
                return StatusCode(500, new { message = "Erro ao enviar mensagem. Tente novamente mais tarde." });
            }
        }
    }
}
