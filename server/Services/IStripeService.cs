namespace CdpApi.Services;

public interface IStripeService
{
    Task<string> CreateCheckoutSessionAsync(int eventId, string buyerEmail, string buyerName, decimal amount, string successUrl, string cancelUrl);
    // Task<bool> VerifyWebhookSignatureAsync(string json, string stripeSignature); // We'll handle this in the controller or a specialized method
}

// Note: This is an interface placeholder. We will implement it in StripeService.cs
