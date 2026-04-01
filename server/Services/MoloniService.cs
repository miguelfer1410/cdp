using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using CdpApi.Models;
using CdpApi.Data;

namespace CdpApi.Services
{
    public class MoloniService : IMoloniService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<MoloniService> _logger;
        private readonly MoloniSettings _settings;
        private readonly ApplicationDbContext _context;
        
        private string? _accessToken;
        private string? _refreshToken;
        private DateTime? _tokenExpiration;

        private const string BaseUrl = "https://api.moloni.pt/v1";
        private const string TokenSettingKey = "MoloniTokens";

        public MoloniService(HttpClient httpClient, ILogger<MoloniService> logger, IOptions<MoloniSettings> settings, ApplicationDbContext context)
        {
            _httpClient = httpClient;
            _logger = logger;
            _settings = settings.Value;
            _context = context;
        }

        private async Task LoadTokensAsync()
        {
            if (_accessToken != null) return;

            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == TokenSettingKey);
            if (setting != null)
            {
                try
                {
                    var tokens = JsonSerializer.Deserialize<MoloniTokenData>(setting.Value);
                    if (tokens != null)
                    {
                        _accessToken = tokens.AccessToken;
                        _refreshToken = tokens.RefreshToken;
                        _tokenExpiration = tokens.ExpiresAt;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error deserializing Moloni tokens from database.");
                }
            }
        }

        private async Task SaveTokensAsync(string accessToken, string refreshToken, int expiresInSeconds)
        {
            _accessToken = accessToken;
            _refreshToken = refreshToken;
            _tokenExpiration = DateTime.UtcNow.AddSeconds(expiresInSeconds - 60); // Buffer of 1 minute

            var tokenData = new MoloniTokenData
            {
                AccessToken = _accessToken,
                RefreshToken = _refreshToken,
                ExpiresAt = _tokenExpiration.Value
            };

            var json = JsonSerializer.Serialize(tokenData);
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == TokenSettingKey);
            
            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key = TokenSettingKey,
                    Description = "Moloni API OAuth Tokens",
                    Value = json,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.SystemSettings.Add(setting);
            }
            else
            {
                setting.Value = json;
                setting.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        private async Task AuthenticateAsync()
        {
            await LoadTokensAsync();

            // 1. Check if existing access token is still valid
            if (_accessToken != null && _tokenExpiration.HasValue && DateTime.UtcNow < _tokenExpiration.Value)
            {
                return;
            }

            var developerId = _settings.DeveloperId;
            var clientSecret = _settings.ClientSecret;

            if (string.IsNullOrEmpty(developerId) || string.IsNullOrEmpty(clientSecret))
            {
                _logger.LogWarning("Moloni credentials (DeveloperId/ClientSecret) not configured.");
                return;
            }

            // 2. Try to refresh token if we have a refresh token
            if (!string.IsNullOrEmpty(_refreshToken))
            {
                _logger.LogInformation("Attempting to refresh Moloni token...");
                var refreshUrl = $"{BaseUrl}/grant/?grant_type=refresh_token&client_id={developerId}&client_secret={clientSecret}&refresh_token={_refreshToken}";
                var refreshResponse = await _httpClient.PostAsync(refreshUrl, null);

                if (refreshResponse.IsSuccessStatusCode)
                {
                    var json = await refreshResponse.Content.ReadFromJsonAsync<JsonElement>();
                    await SaveTokensAsync(
                        json.GetProperty("access_token").GetString()!,
                        json.GetProperty("refresh_token").GetString()!,
                        json.GetProperty("expires_in").GetInt32()
                    );
                    return;
                }
                
                _logger.LogWarning("Moloni refresh token expired or invalid. Falling back to password login.");
            }

            // 3. Fallback to password login
            var username = _settings.Username;
            var password = _settings.Password;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                _logger.LogError("Moloni Username/Password not configured for fallback authentication.");
                return;
            }

            _logger.LogInformation("Performing full Moloni authentication with credentials...");
            var loginUrl = $"{BaseUrl}/grant/?grant_type=password&client_id={developerId}&client_secret={clientSecret}&username={Uri.EscapeDataString(username)}&password={Uri.EscapeDataString(password)}";
            var loginResponse = await _httpClient.PostAsync(loginUrl, null);

            if (!loginResponse.IsSuccessStatusCode)
            {
                var errorString = await loginResponse.Content.ReadAsStringAsync();
                _logger.LogError($"Moloni Authentication failed: {loginResponse.StatusCode} - {errorString}");
                throw new Exception("Falha crítica na autenticação com o Moloni.");
            }

            var loginJson = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
            await SaveTokensAsync(
                loginJson.GetProperty("access_token").GetString()!,
                loginJson.GetProperty("refresh_token").GetString()!,
                loginJson.GetProperty("expires_in").GetInt32()
            );
        }

        private string SanitizeEmail(string email)
        {
            if (string.IsNullOrEmpty(email) || !email.Contains('+')) return email;
            
            var parts = email.Split('@');
            if (parts.Length != 2) return email;

            var principalPart = parts[0].Split('+')[0];
            return $"{principalPart}@{parts[1]}";
        }

        private async Task<int?> GetOrCreateCustomerAsync(User user, string companyId)
        {
            // Try to find customer by VAT
            var vat = string.IsNullOrEmpty(user.Nif) ? "999999990" : user.Nif;
            var sanitizedEmail = SanitizeEmail(user.Email);
            
            var customerNumber = user.MemberProfile?.MembershipNumber?.TrimStart('0');
            if (string.IsNullOrEmpty(customerNumber))
            {
                customerNumber = user.Id.ToString();
            }

            var getByVatBody = new Dictionary<string, string>
            {
                { "company_id", companyId },
                { "vat", vat }
            };
            var getByVatContent = new FormUrlEncodedContent(getByVatBody);
            var requestUri = $"{BaseUrl}/customers/getByVat/?access_token={_accessToken}";
            var response = await _httpClient.PostAsync(requestUri, getByVatContent);

            if (response.IsSuccessStatusCode)
            {
                var customers = await response.Content.ReadFromJsonAsync<JsonElement>();
                if (customers.ValueKind == JsonValueKind.Array && customers.GetArrayLength() > 0)
                {
                    var customerId = customers[0].GetProperty("customer_id").GetInt32();
                    return customerId;
                }
            }

            // Create customer
            var insertUri = $"{BaseUrl}/customers/insert/?access_token={_accessToken}";
            var insertBody = new Dictionary<string, string>
            {
                { "company_id", companyId },
                { "vat", vat },
                { "number", customerNumber },
                { "name", $"{user.FirstName} {user.LastName}" },
                { "language_id", "1" },
                { "address", user.Address ?? "Desconhecida" },
                { "zip_code", user.PostalCode ?? "4490-000" },
                { "city", user.City ?? "Póvoa de Varzim" },
                { "country_id", "1" }, // Portugal
                { "email", sanitizedEmail },
                { "maturity_date_id", "0" },
                { "payment_method_id", "0" },
                { "salesman_id", "0" },
                { "payment_day", "0" },
                { "discount", "0" },
                { "credit_limit", "0" },
                { "delivery_method_id", "0" }
            };

            var content = new FormUrlEncodedContent(insertBody);
            var insertResponse = await _httpClient.PostAsync(insertUri, content);

            if (insertResponse.IsSuccessStatusCode)
            {
                var insertResponseJson = await insertResponse.Content.ReadFromJsonAsync<JsonElement>();
                
                var result = insertResponseJson.ValueKind == JsonValueKind.Array && insertResponseJson.GetArrayLength() > 0 
                    ? insertResponseJson[0] 
                    : insertResponseJson;

                if (result.ValueKind == JsonValueKind.Object && result.TryGetProperty("valid", out var validElement) && validElement.GetInt32() == 1)
                {
                    return result.GetProperty("customer_id").GetInt32();
                }
            }

            var errStr = await insertResponse.Content.ReadAsStringAsync();
            
            // Fallback: If VAT or Number already exists (error code 8 or 4 in Moloni v1)
            if (errStr.Contains("\"8 vat\"") || errStr.Contains("\"4 vat\"") || errStr.Contains("\"4 number\"") || errStr.Contains("8 vat") || errStr.Contains("4 vat") || errStr.Contains("4 number"))
            {
                _logger.LogInformation($"Customer with VAT {vat} or Number {customerNumber} already exists. Attempting to recover ID...");
                
                var searchBody = new Dictionary<string, string>
                {
                    { "company_id", companyId },
                    { "search", vat }
                };
                var searchContent = new FormUrlEncodedContent(searchBody);
                var searchUri = $"{BaseUrl}/customers/getAll/?access_token={_accessToken}";
                var searchResponse = await _httpClient.PostAsync(searchUri, searchContent);
                
                if (searchResponse.IsSuccessStatusCode)
                {
                    var searchResult = await searchResponse.Content.ReadFromJsonAsync<JsonElement>();
                    if (searchResult.ValueKind == JsonValueKind.Array && searchResult.GetArrayLength() > 0)
                    {
                        return searchResult[0].GetProperty("customer_id").GetInt32();
                    }
                }
            }

            _logger.LogError($"Moloni failed to create customer: {insertResponse.StatusCode} - {errStr}");
            throw new Exception("Falha ao criar/obter cliente no Moloni.");
        }

        public async Task CreateInvoiceReceiptAsync(Payment payment, User user)
        {
            try
            {
                await AuthenticateAsync();

                if (string.IsNullOrEmpty(_accessToken))
                {
                    _logger.LogWarning("Skipping invoice creation because Moloni is not authenticated.");
                    return;
                }

                var companyId = _settings.CompanyId;
                if (string.IsNullOrEmpty(companyId))
                {
                    _logger.LogWarning("Moloni CompanyId is not configured.");
                    return;
                }

                var customerId = await GetOrCreateCustomerAsync(user, companyId);
                if (customerId == null)
                {
                    return;
                }

                var createDocUri = $"{BaseUrl}/invoiceReceipts/insert/?access_token={_accessToken}";
                
                var documentDate = DateTime.UtcNow.ToString("yyyy-MM-dd");
                string description = string.IsNullOrEmpty(payment.Description) ? "Quota Mensal" : payment.Description;

                var productId = _settings.ProductId ?? "1"; 
                var taxId = _settings.TaxId ?? "1"; 

                var documentSetId = _settings.DocumentSetId ?? string.Empty;

                var insertBody = new List<KeyValuePair<string, string>>
                {
                    new KeyValuePair<string, string>("company_id", companyId),
                    new KeyValuePair<string, string>("date", documentDate),
                    new KeyValuePair<string, string>("expiration_date", documentDate),
                    new KeyValuePair<string, string>("document_set_id", documentSetId), 
                    new KeyValuePair<string, string>("customer_id", customerId.Value.ToString()),
                    new KeyValuePair<string, string>("status", "0"), // Changed to 0 (Draft) to bypass AT validation
                };

                insertBody.Add(new KeyValuePair<string, string>("products[0][product_id]", productId));
                insertBody.Add(new KeyValuePair<string, string>("products[0][name]", description));
                insertBody.Add(new KeyValuePair<string, string>("products[0][qty]", "1"));
                insertBody.Add(new KeyValuePair<string, string>("products[0][price]", payment.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)));
                insertBody.Add(new KeyValuePair<string, string>("products[0][exemption_reason]", "M07")); // M07 = Isenção Artigo 9.º do CIVA (Desporto/Clubes) 
                insertBody.Add(new KeyValuePair<string, string>("products[0][taxes][0][tax_id]", taxId));

                insertBody.Add(new KeyValuePair<string, string>("payments[0][payment_method_id]", "0"));
                insertBody.Add(new KeyValuePair<string, string>("payments[0][date]", documentDate));
                insertBody.Add(new KeyValuePair<string, string>("payments[0][value]", payment.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)));

                var content = new FormUrlEncodedContent(insertBody);
                var response = await _httpClient.PostAsync(createDocUri, content);
                var responseString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Moloni failed to create invoice receipt: {response.StatusCode} - {responseString}");
                }
                else
                {
                    _logger.LogInformation($"Moloni Invoice Receipt attempt: {responseString}");
                    
                    try 
                    {
                        var json = JsonSerializer.Deserialize<JsonElement>(responseString);
                        
                        // Check if it's an array (which means error list in Moloni v1)
                        if (json.ValueKind == JsonValueKind.Array && json.GetArrayLength() > 0)
                        {
                            _logger.LogWarning($"Moloni returned validation errors: {responseString}. Document NOT created.");
                        }
                        else if (json.ValueKind == JsonValueKind.Object && json.TryGetProperty("valid", out var v) && v.GetInt32() == 0)
                        {
                            _logger.LogWarning($"Moloni returned 200 OK but 'valid' is 0. Document NOT created.");
                        }
                        else 
                        {
                             _logger.LogInformation($"Moloni Invoice Receipt process finished successfully for Payment ID {payment.Id}");
                        }
                    } catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error parsing Moloni invoice response.");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error integrating with Moloni API");
            }
        }

        private class MoloniTokenData
        {
            public string AccessToken { get; set; } = string.Empty;
            public string RefreshToken { get; set; } = string.Empty;
            public DateTime ExpiresAt { get; set; }
        }
    }
}
