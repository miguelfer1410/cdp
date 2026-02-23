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
    // All users sharing the same base email (for sibling/child athlete accounts)
    public List<LinkedUserInfo> LinkedUsers { get; set; } = new();
}

public class LinkedUserInfo
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string DashboardType { get; set; } = string.Empty; // "atleta", "treinador", "socio", "user"
    public string? Relationship { get; set; }
}
