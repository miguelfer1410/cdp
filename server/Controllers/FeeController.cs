using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CdpApi.Data;
using CdpApi.Models;

namespace CdpApi.Controllers
{
    [ApiController]
    [Route("api/fees")]
    public class FeeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private const string MEMBER_FEE_KEY = "MemberFee";

        public FeeController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/fees
        [HttpGet]
        public async Task<ActionResult> GetFees()
        {
            // Get Global Member Fee
            var memberFeeSetting = await _context.SystemSettings.FindAsync(MEMBER_FEE_KEY);
            decimal memberFee = 0;
            if (memberFeeSetting != null && decimal.TryParse(memberFeeSetting.Value, out var parsedFee))
            {
                memberFee = parsedFee;
            }

            // Get Sport Fees
            var sports = await _context.Sports
                .Select(s => new { s.Id, s.Name, s.MonthlyFee })
                .ToListAsync();

            return Ok(new { memberFee, sports });
        }

        // POST: api/fees/global
        [HttpPost("global")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateGlobalFee([FromBody] UpdateFeeRequest request)
        {
            var setting = await _context.SystemSettings.FindAsync(MEMBER_FEE_KEY);
            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key = MEMBER_FEE_KEY,
                    Value = request.Amount.ToString("F2"), // Store as string to avoid locale issues, though culture invariant is safer
                    Description = "Quota mensal de sócio",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Value = request.Amount.ToString("F2");
                setting.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Quota de sócio atualizada." });
        }

        // POST: api/fees/sport/{id}
        [HttpPost("sport/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateSportFee(int id, [FromBody] UpdateFeeRequest request)
        {
            var sport = await _context.Sports.FindAsync(id);
            if (sport == null) return NotFound("Modalidade não encontrada.");

            sport.MonthlyFee = request.Amount;
            sport.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Quota de {sport.Name} atualizada." });
        }
    }

    public class UpdateFeeRequest
    {
        public decimal Amount { get; set; }
    }
}
