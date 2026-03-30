namespace CdpApi.Services;

public interface IStripeService
{
    Task<string> CreateCheckoutSessionAsync(string eventId, string buyerEmail, string buyerName, decimal amount, string successUrl, string cancelUrl, string? profilesMetadata = null, string? buyerUserId = null);

    /// <summary>
    /// Creates a Stripe Checkout Session for quota payment with card, Multibanco and MB Way support.
    /// Returns the Stripe-hosted checkout URL to redirect the user to.
    /// </summary>
    Task<string> CreateQuotaCheckoutSessionAsync(
        int memberProfileId,
        int userId,
        string customerName,
        string customerEmail,
        decimal amount,
        string description,
        int? periodMonth,
        int periodYear,
        string successUrl,
        string cancelUrl);
}
