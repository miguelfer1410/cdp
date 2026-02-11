namespace CdpApi.DTOs;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int Id { get; set; }
    public List<string> Roles { get; set; } = new();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
