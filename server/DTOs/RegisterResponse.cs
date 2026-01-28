namespace CdpApi.DTOs;

public class RegisterResponse
{
    public string Message { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
}
