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
        private const string MEMBER_FEE_KEY       = "MemberFee";
        private const string MINOR_MEMBER_FEE_KEY = "MinorMemberFee";

        public FeeController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ── GET: api/fees ────────────────────────────────────────────────────
        [HttpGet]
        public async Task<ActionResult> GetFees()
        {
            var memberFeeSetting = await _context.SystemSettings.FindAsync(MEMBER_FEE_KEY);
            decimal memberFee = 0;
            if (memberFeeSetting != null && decimal.TryParse(memberFeeSetting.Value, out var pf)) memberFee = pf;

            var minorFeeSetting = await _context.SystemSettings.FindAsync(MINOR_MEMBER_FEE_KEY);
            decimal minorMemberFee = 0;
            if (minorFeeSetting != null && decimal.TryParse(minorFeeSetting.Value, out var pm)) minorMemberFee = pm;

            var sports = await _context.Sports
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.MonthlyFee,
                    s.FeeNormalNormal,
                    s.FeeEscalao1Normal,
                    s.FeeEscalao2Normal,
                    s.FeeDiscount,
                    s.InscriptionFeeNormal,
                    s.QuotaIncluded
                })
                .ToListAsync();

            return Ok(new { memberFee, minorMemberFee, sports });
        }

        // ── POST: api/fees/global ────────────────────────────────────────────
        [HttpPost("global")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateGlobalFee([FromBody] UpdateFeeRequest request)
        {
            var setting = await _context.SystemSettings.FindAsync(MEMBER_FEE_KEY);
            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key         = MEMBER_FEE_KEY,
                    Value       = request.Amount.ToString("F2"),
                    Description = "Quota mensal de sócio",
                    UpdatedAt   = DateTime.UtcNow
                };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Value     = request.Amount.ToString("F2");
                setting.UpdatedAt = DateTime.UtcNow;
            }

            var minorSetting = await _context.SystemSettings.FindAsync(MINOR_MEMBER_FEE_KEY);
            if (minorSetting == null)
            {
                minorSetting = new SystemSetting
                {
                    Key         = MINOR_MEMBER_FEE_KEY,
                    Value       = request.MinorAmount.ToString("F2"),
                    Description = "Quota mensal de sócio (Menor)",
                    UpdatedAt   = DateTime.UtcNow
                };
                _context.SystemSettings.Add(minorSetting);
            }
            else
            {
                minorSetting.Value     = request.MinorAmount.ToString("F2");
                minorSetting.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Quotas de sócio atualizadas." });
        }

        // ── POST: api/fees/sport/{id} ────────────────────────────────────────
        [HttpPost("sport/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdateSportFee(int id, [FromBody] UpdateSportFeeRequest request)
        {
            var sport = await _context.Sports.FindAsync(id);
            if (sport == null) return NotFound("Modalidade não encontrada.");

            sport.FeeNormalNormal    = request.FeeNormalNormal;
            sport.FeeEscalao1Normal  = request.FeeEscalao1Normal;
            sport.FeeEscalao2Normal  = request.FeeEscalao2Normal;
            sport.FeeDiscount        = request.FeeDiscount;
            sport.InscriptionFeeNormal = request.InscriptionFeeNormal;
            sport.QuotaIncluded      = request.QuotaIncluded;

            // Keep legacy field in sync
            sport.MonthlyFee = request.FeeEscalao2Normal > 0 ? request.FeeEscalao2Normal
                             : request.FeeNormalNormal   > 0 ? request.FeeNormalNormal
                             : 0;

            sport.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Preços de {sport.Name} atualizados." });
        }
    }

    // ── Request DTOs ─────────────────────────────────────────────────────────

    public class UpdateFeeRequest
    {
        public decimal Amount      { get; set; }
        public decimal MinorAmount { get; set; }
    }

    public class UpdateSportFeeRequest
    {
        public decimal FeeNormalNormal   { get; set; }
        public decimal FeeEscalao1Normal { get; set; }
        public decimal FeeEscalao2Normal { get; set; }
        public decimal FeeDiscount       { get; set; }
        public decimal InscriptionFeeNormal { get; set; }
        public bool    QuotaIncluded     { get; set; } = true;
    }
}