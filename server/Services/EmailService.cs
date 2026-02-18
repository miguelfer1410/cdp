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
                await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.SslOnConnect);
                await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                await smtpClient.SendAsync(emailMessage);
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

        public async Task SendAccountActivationEmailAsync(string toEmail, string firstName, string activationLink)
        {
            try
            {
                _logger.LogInformation($"Attempting to send account activation email to {toEmail}");

                var emailMessage = new MimeMessage();
                emailMessage.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                emailMessage.To.Add(new MailboxAddress(firstName, toEmail));
                emailMessage.Subject = "Ative a sua conta - Clube Desportivo da Póvoa";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f6f8;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 40px 20px;'>
                                <div style='background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);'>
                                    
                                    <!-- Header -->
                                    <div style='background: linear-gradient(135deg, #003380, #00509e); padding: 30px 40px; text-align: center;'>
                                        <h1 style='color: white; margin: 0; font-size: 1.5em;'>Clube Desportivo da Póvoa</h1>
                                    </div>
                                    
                                    <!-- Body -->
                                    <div style='padding: 40px;'>
                                        <h2 style='color: #003380; margin-top: 0;'>Bem-vindo(a), {firstName}!</h2>
                                        
                                        <p style='font-size: 1em; line-height: 1.6;'>
                                            A sua conta no <strong>Clube Desportivo da Póvoa</strong> foi criada com sucesso.
                                        </p>
                                        
                                        <p style='font-size: 1em; line-height: 1.6;'>
                                            Para começar a utilizar o sistema, precisa de definir a sua password clicando no botão abaixo:
                                        </p>
                                        
                                        <div style='text-align: center; margin: 35px 0;'>
                                            <a href='{activationLink}' style='background: linear-gradient(135deg, #003380, #00509e); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1em; display: inline-block;'>
                                                Ativar Conta e Definir Password
                                            </a>
                                        </div>
                                        
                                        <p style='font-size: 0.9em; color: #666;'>
                                            Se o botão não funcionar, copie e cole o seguinte link no seu browser:
                                        </p>
                                        <p style='font-size: 0.85em; word-break: break-all; color: #003380; background: #f0f4ff; padding: 12px; border-radius: 6px;'>
                                            {activationLink}
                                        </p>
                                        
                                        <div style='background: #fff8e1; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-top: 25px;'>
                                            <p style='margin: 0; font-size: 0.9em; color: #92400e;'>
                                                <strong>Atenção:</strong> Este link é válido por 48 horas. Após esse período, terá de pedir um novo link ao administrador do clube.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div style='background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;'>
                                        <p style='font-size: 0.8em; color: #888; margin: 0;'>
                                            Este email foi enviado automaticamente pelo sistema do Clube Desportivo da Póvoa.
                                        </p>
                                        <p style='font-size: 0.8em; color: #888; margin: 5px 0 0;'>
                                            Se não reconhece este registo, pode ignorar este email com segurança.
                                        </p>
                                    </div>
                                </div>
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

                _logger.LogInformation($"Account activation email sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending account activation email: {ex.Message}");
                throw;
            }
        }

        public async Task SendGameCallUpEmailAsync(string toEmail, string athleteName, string eventTitle, DateTime eventDate, string location)
        {
            try
            {
                _logger.LogInformation($"Attempting to send game call-up email to {toEmail}");

                var emailMessage = new MimeMessage();
                emailMessage.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                emailMessage.To.Add(new MailboxAddress(athleteName, toEmail));
                emailMessage.Subject = $"Convocatória - {eventTitle} - Clube Desportivo da Póvoa";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f6f8;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 40px 20px;'>
                                <div style='background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);'>
                                    
                                    <!-- Header -->
                                    <div style='background: linear-gradient(135deg, #003380, #00509e); padding: 30px 40px; text-align: center;'>
                                        <h1 style='color: white; margin: 0; font-size: 1.5em;'>Clube Desportivo da Póvoa</h1>
                                    </div>
                                    
                                    <!-- Body -->
                                    <div style='padding: 40px;'>
                                        <h2 style='color: #003380; margin-top: 0;'>Convocatória</h2>
                                        
                                        <p style='font-size: 1em; line-height: 1.6;'>
                                            Olá <strong>{athleteName}</strong>,
                                        </p>
                                        
                                        <p style='font-size: 1em; line-height: 1.6;'>
                                            Foste convocado(a) para o seguinte jogo:
                                        </p>
                                        
                                        <div style='background: #f0f7ff; border-left: 4px solid #003380; padding: 20px; margin: 25px 0; border-radius: 4px;'>
                                            <h3 style='margin: 0 0 10px 0; color: #003380;'>{eventTitle}</h3>
                                            <p style='margin: 5px 0;'><strong>Data e Hora:</strong> {eventDate.ToString("dd/MM/yyyy HH:mm")}</p>
                                            <p style='margin: 5px 0;'><strong>Local:</strong> {location}</p>
                                        </div>
                                        
                                        <p style='font-size: 1em; line-height: 1.6;'>
                                            Contamos com a tua presença e empenho!
                                        </p>
                                        
                                        <div style='text-align: center; margin: 35px 0;'>
                                            <a href='http://localhost:3000/dashboard/atleta' style='background: linear-gradient(135deg, #003380, #00509e); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1em; display: inline-block;'>
                                                Ver Detalhes no Dashboard
                                            </a>
                                        </div>
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div style='background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;'>
                                        <p style='font-size: 0.8em; color: #888; margin: 0;'>
                                            Este email foi enviado automaticamente pelo sistema do Clube Desportivo da Póvoa.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    "
                };

                emailMessage.Body = bodyBuilder.ToMessageBody();

                using var smtpClient = new SmtpClient();
                try
                {
                    await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.SslOnConnect);
                    await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                    await smtpClient.SendAsync(emailMessage);
                    await smtpClient.DisconnectAsync(true);
                    _logger.LogInformation($"Game call-up email sent successfully to {toEmail}");
                }
                catch (Exception smtpEx)
                {
                    // Log but don't crash if email fails, just rethrow or handle gracefully
                    _logger.LogError($"SMTP Error sending game call-up email: {smtpEx.Message}");
                    // In a production app, we might want to queue this or alert the user.
                    // For now, we logging error is sufficient as per requirements.
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"General Error creating/sending game call-up email: {ex.Message}");
                throw;
            }
        }
    }
}