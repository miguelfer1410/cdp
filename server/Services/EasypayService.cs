using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace CdpApi.Services
{
    public interface IEasypayService
    {
        Task<MbReferenceResult> GenerateMbReferenceAsync(decimal value, string key, string customerName, string customerEmail, string customerPhone);
        Task<PaymentStatusResult> GetPaymentStatusAsync(string id);
    }

    public class MbReferenceResult
    {
        public string Id { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Success { get; set; } = "true";
        public string Message { get; set; } = string.Empty;
    }

    public class EasypayService : IEasypayService
    {
        private readonly ILogger<EasypayService> _logger;
        private readonly HttpClient _httpClient;
        
        // Credentials from provided export
        private const string BaseUrl = "https://api.test.easypay.pt/2.0/single";
        private const string AccountId = "2b0f63e2-9fb5-4e52-aca0-b4bf0339bbe6";
        private const string ApiKey = "eae4aa59-8e5b-4ec2-887d-b02768481a92";

        public EasypayService(ILogger<EasypayService> logger, HttpClient httpClient)
        {
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<MbReferenceResult> GenerateMbReferenceAsync(decimal value, string key, string customerName, string customerEmail, string customerPhone)
        {
            _logger.LogInformation($"Generating MB reference for amount: {value} EUR, Key: {key}");

            var requestBody = new
            {
                type = "sale", // 'single' endpoint usually implies type, but following structure best effort
                capture = new
                {
                    descriptive = "Quota Mensal CDP",
                    transaction_key = key
                },
                method = "mb",
                value = value,
                key = key,
                customer = new
                {
                    name = customerName,
                    email = customerEmail,
                    phone = customerPhone ?? "910000000", // Fallback if missing
                    phone_indicative = "+351",
                    key = customerEmail
                }
            };

            var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, BaseUrl);
            request.Headers.Add("AccountId", AccountId);
            request.Headers.Add("ApiKey", ApiKey);
            request.Content = content;

            var response = await _httpClient.SendAsync(request);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Easypay API failed: {response.StatusCode} - {responseString}");
                throw new Exception("Falha na comunicação com Easypay.");
            }

            using var doc = System.Text.Json.JsonDocument.Parse(responseString);
            var root = doc.RootElement;
            
            // Extract method details
            if (root.TryGetProperty("method", out var methodElement))
            {
                string id = root.TryGetProperty("id", out var idElement) ? idElement.GetString() ?? "" : "";

                return new MbReferenceResult
                {
                    Id = id,
                    Entity = methodElement.GetProperty("entity").GetString() ?? "",
                    Reference = methodElement.GetProperty("reference").GetString() ?? "",
                    Value = value,
                    Success = "true",
                    Message = "Referência gerada com sucesso."
                };
            }

            throw new Exception("Resposta inválida da Easypay via API.");
        }

        public async Task<PaymentStatusResult> GetPaymentStatusAsync(string id)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{BaseUrl}/{id}");
            request.Headers.Add("AccountId", AccountId);
            request.Headers.Add("ApiKey", ApiKey);

            var response = await _httpClient.SendAsync(request);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Easypay API check failed: {response.StatusCode} - {responseString}");
                throw new Exception("Falha ao verificar estado do pagamento.");
            }

            using var doc = System.Text.Json.JsonDocument.Parse(responseString);
            var root = doc.RootElement;
            
            // Extract method details to find status
            string status = "unknown";
            
            if (root.TryGetProperty("method", out var methodElement))
            {
                status = methodElement.GetProperty("status").GetString() ?? "unknown";
            }
            
            return new PaymentStatusResult
            {
                Id = id,
                Status = status,
                RawResponse = responseString
            };
        }
    }

    public class PaymentStatusResult
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // e.g., "pending", "completed"
        public string RawResponse { get; set; } = string.Empty;
    }
}

