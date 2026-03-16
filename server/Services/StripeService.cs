using Stripe;
using Stripe.Checkout;
using Microsoft.Extensions.Options;

namespace CdpApi.Services;

public class StripeSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
}

public class StripeService : IStripeService
{
    private readonly StripeSettings _settings;
    private readonly ILogger<StripeService> _logger;

    public StripeService(IOptions<StripeSettings> settings, ILogger<StripeService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        StripeConfiguration.ApiKey = _settings.SecretKey;
    }

    public async Task<string> CreateCheckoutSessionAsync(int eventId, string buyerEmail, string buyerName, decimal amount, string successUrl, string cancelUrl)
    {
        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(amount * 100), // Stripe uses cents
                        Currency = "eur",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Bilhete para Jogo (ID: {eventId})",
                            Description = $"Comprador: {buyerName}",
                        },
                    },
                    Quantity = 1,
                },
            },
            Mode = "payment",
            SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = cancelUrl,
            CustomerEmail = buyerEmail,
            Metadata = new Dictionary<string, string>
            {
                { "EventId", eventId.ToString() },
                { "BuyerName", buyerName }
            }
        };

        var service = new SessionService();
        Session session = await service.CreateAsync(options);

        return session.Id;
    }
}
