namespace server.Services
{
    public interface IEmailService
    {
        Task SendContactEmailAsync(string name, string email, string subject, string message);
        Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
        Task SendAccountActivationEmailAsync(string toEmail, string firstName, string activationLink);
    }
}