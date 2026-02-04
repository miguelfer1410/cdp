using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using server.Models;

namespace server.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendContactEmailAsync(string name, string email, string subject, string message)
        {
            try
            {
                _logger.LogInformation($"Attempting to send email from {email}");

                var emailMessage = new MimeMessage();
                emailMessage.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                emailMessage.To.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                emailMessage.ReplyTo.Add(new MailboxAddress(name, email));
                emailMessage.Subject = $"Contacto do Website: {subject}";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2>Nova Mensagem de Contacto</h2>
                            <p><strong>Nome:</strong> {name}</p>
                            <p><strong>Email:</strong> {email}</p>
                            <p><strong>Assunto:</strong> {subject}</p>
                            <hr>
                            <h3>Mensagem:</h3>
                            <p>{message.Replace("\n", "<br>")}</p>
                        </body>
                        </html>
                    "
                };

                emailMessage.Body = bodyBuilder.ToMessageBody();

                using var smtpClient = new SmtpClient();
                
                // Connect using SSL on port 465 (implicit SSL)
                await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.SslOnConnect);
                
                // Authenticate
                await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                
                // Send email
                await smtpClient.SendAsync(emailMessage);
                
                // Disconnect
                await smtpClient.DisconnectAsync(true);

                _logger.LogInformation($"Email sent successfully from {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending email: {ex.Message}");
                throw;
            }
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
        {
            try
            {
                _logger.LogInformation($"Attempting to send password reset email to {toEmail}");

                var emailMessage = new MimeMessage();
                emailMessage.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                emailMessage.To.Add(new MailboxAddress("", toEmail));
                emailMessage.Subject = "Recuperar Password - Clube Desportivo da Póvoa";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; color: #333;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                                <div style='text-align: center; margin-bottom: 20px;'>
                                    <h2 style='color: #003380;'>Recuperação de Password</h2>
                                </div>
                                <p>Olá,</p>
                                <p>Recebemos um pedido para redefinir a password da sua conta.</p>
                                <p>Para criar uma nova password, clique no botão abaixo:</p>
                                <div style='text-align: center; margin: 30px 0;'>
                                    <a href='{resetLink}' style='background-color: #003380; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Redefinir Password</a>
                                </div>
                                <p style='font-size: 0.9em;'>Se o botão não funcionar, copie e cole o seguinte link no seu browser:</p>
                                <p style='font-size: 0.9em; word-break: break-all; color: #666;'>{resetLink}</p>
                                <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                                <p style='font-size: 0.8em; color: #888;'>Se não pediu esta alteração, pode ignorar este email com segurança.</p>
                            </div>
                        </body>
                        </html>
                    "
                };

                emailMessage.Body = bodyBuilder.ToMessageBody();

                using var smtpClient = new SmtpClient();
                await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.SslOnConnect);
                await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                await smtpClient.SendAsync(emailMessage);
                await smtpClient.DisconnectAsync(true);

                _logger.LogInformation($"Password reset email sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending password reset email: {ex.Message}");
                throw;
            }
        }
    }
}
