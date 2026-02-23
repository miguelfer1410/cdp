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
        private const string MINOR_MEMBER_FEE_KEY = "MinorMemberFee";

        public FeeController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/fees
        [HttpGet]
        public async Task<ActionResult> GetFees()
        {
            // Get Global Fees
            var memberFeeSetting = await _context.SystemSettings.FindAsync(MEMBER_FEE_KEY);
            decimal memberFee = 0;
            if (memberFeeSetting != null && decimal.TryParse(memberFeeSetting.Value, out var parsedFee))
            {
                memberFee = parsedFee;
            }

            var minorFeeSetting = await _context.SystemSettings.FindAsync(MINOR_MEMBER_FEE_KEY);
            decimal minorMemberFee = 0;
            if (minorFeeSetting != null && decimal.TryParse(minorFeeSetting.Value, out var parsedMinor))
            {
                minorMemberFee = parsedMinor;
            }

            // Get Sport Fees
            var sports = await _context.Sports
                .Select(s => new { s.Id, s.Name, s.MonthlyFee })
                .ToListAsync();

            return Ok(new { memberFee, minorMemberFee, sports });
        }

        // POST: api/fees/global
        [HttpPost("global")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateGlobalFee([FromBody] UpdateFeeRequest request)
        {
            // Update Standard Fee
            var setting = await _context.SystemSettings.FindAsync(MEMBER_FEE_KEY);
            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key = MEMBER_FEE_KEY,
                    Value = request.Amount.ToString("F2"),
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

            // Update Minor Fee
            var minorSetting = await _context.SystemSettings.FindAsync(MINOR_MEMBER_FEE_KEY);
            if (minorSetting == null)
            {
                minorSetting = new SystemSetting
                {
                    Key = MINOR_MEMBER_FEE_KEY,
                    Value = request.MinorAmount.ToString("F2"),
                    Description = "Quota mensal de sócio (Menor)",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SystemSettings.Add(minorSetting);
            }
            else
            {
                minorSetting.Value = request.MinorAmount.ToString("F2");
                minorSetting.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Quotas de sócio atualizadas." });
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
        public decimal MinorAmount { get; set; }
    }
}
