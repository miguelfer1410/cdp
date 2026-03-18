using MailKit.Net.Smtp;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using MimeKit;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using server.Models;

namespace server.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;
        private readonly IWebHostEnvironment _env;

        public EmailService(
            IOptions<EmailSettings> emailSettings,
            ILogger<EmailService> logger,
            IWebHostEnvironment env)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
            _env = env;
            QuestPDF.Settings.License = LicenseType.Community;
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
                await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, MailKit.Security.SecureSocketOptions.SslOnConnect);
                await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                await smtpClient.SendAsync(emailMessage);
                await smtpClient.DisconnectAsync(true);

                _logger.LogInformation("Contact email sent successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending contact email: {ex.Message}");
                throw;
            }
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
        {
            try
            {
                var emailMessage = new MimeMessage();
                emailMessage.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                emailMessage.To.Add(new MailboxAddress(toEmail, toEmail));
                emailMessage.Subject = "Recuperação de Password - Clube Desportivo da Póvoa";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f6f8;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 40px 20px;'>
                                <div style='background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);'>
                                    <div style='background: linear-gradient(135deg, #003380, #00509e); padding: 30px 40px; text-align: center;'>
                                        <h1 style='color: white; margin: 0; font-size: 1.5em;'>Clube Desportivo da Póvoa</h1>
                                    </div>
                                    <div style='padding: 40px;'>
                                        <h2 style='color: #003380;'>Recuperação de Password</h2>
                                        <p>Recebemos um pedido para recuperar a sua password. Clique no botão abaixo para definir uma nova password:</p>
                                        <div style='text-align: center; margin: 30px 0;'>
                                            <a href='{resetLink}' style='background: #003380; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;'>Redefinir Password</a>
                                        </div>
                                        <p style='font-size: 0.85em; color: #666;'>Este link é válido por 24 horas. Se não solicitou esta recuperação, ignore este email.</p>
                                    </div>
                                    <div style='background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;'>
                                        <p style='font-size: 0.8em; color: #888; margin: 0;'>Este email foi enviado automaticamente pelo sistema do Clube Desportivo da Póvoa.</p>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    "
                };

                emailMessage.Body = bodyBuilder.ToMessageBody();

                using var smtpClient = new SmtpClient();
                await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, MailKit.Security.SecureSocketOptions.SslOnConnect);
                await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                await smtpClient.SendAsync(emailMessage);
                await smtpClient.DisconnectAsync(true);
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
                                    <div style='background: linear-gradient(135deg, #003380, #00509e); padding: 30px 40px; text-align: center;'>
                                        <h1 style='color: white; margin: 0; font-size: 1.5em;'>Clube Desportivo da Póvoa</h1>
                                    </div>
                                    <div style='padding: 40px;'>
                                        <h2 style='color: #003380;'>Bem-vindo, {firstName}!</h2>
                                        <p>A sua conta foi criada com sucesso. Para começar a utilizar a plataforma, por favor ative a sua conta clicando no botão abaixo:</p>
                                        <div style='text-align: center; margin: 30px 0;'>
                                            <a href='{activationLink}' style='background: #003380; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;'>Ativar Conta</a>
                                        </div>
                                        <p style='font-size: 0.85em; color: #666;'>Este link é válido por 48 horas.</p>
                                    </div>
                                    <div style='background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;'>
                                        <p style='font-size: 0.8em; color: #888; margin: 0;'>Este email foi enviado automaticamente pelo sistema do Clube Desportivo da Póvoa.</p>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    "
                };

                emailMessage.Body = bodyBuilder.ToMessageBody();

                using var smtpClient = new SmtpClient();
                await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, MailKit.Security.SecureSocketOptions.SslOnConnect);
                await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                await smtpClient.SendAsync(emailMessage);
                await smtpClient.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending activation email: {ex.Message}");
                throw;
            }
        }

        public async Task SendGameCallUpEmailAsync(string toEmail, string athleteName, string eventTitle, DateTime eventDate, string location)
        {
            try
            {
                _logger.LogInformation($"Attempting to send game call-up email to {toEmail} for event '{eventTitle}'");

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
                                    <div style='background: linear-gradient(135deg, #003380, #00509e); padding: 30px 40px; text-align: center;'>
                                        <h1 style='color: white; margin: 0; font-size: 1.5em;'>Clube Desportivo da Póvoa</h1>
                                        <p style='color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 0.95em;'>Convocatória Oficial</p>
                                    </div>
                                    <div style='padding: 40px;'>
                                        <h2 style='color: #003380; margin-top: 0;'>Foste Convocado!</h2>
                                        <p style='font-size: 1em; line-height: 1.6;'>Olá <strong>{athleteName}</strong>,</p>
                                        <p style='font-size: 1em; line-height: 1.6;'>Tens uma convocatória para o seguinte evento:</p>
                                        <div style='background: #f0f7ff; border-left: 4px solid #003380; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;'>
                                            <h3 style='margin: 0 0 10px 0; color: #003380;'>{eventTitle}</h3>
                                            <p style='margin: 5px 0;'><strong>📅 Data:</strong> {eventDate:dd/MM/yyyy}</p>
                                            <p style='margin: 5px 0;'><strong>🕐 Hora:</strong> {eventDate:HH:mm}</p>
                                            <p style='margin: 5px 0;'><strong>📍 Local:</strong> {location}</p>
                                        </div>
                                        <p style='font-size: 1em; line-height: 1.6;'>Por favor confirma a tua presença através da plataforma CDP.</p>
                                        <p style='font-size: 1em; line-height: 1.6;'>Bom trabalho! 💪</p>
                                    </div>
                                    <div style='background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;'>
                                        <p style='font-size: 0.8em; color: #888; margin: 0;'>Este email foi enviado automaticamente pelo sistema do Clube Desportivo da Póvoa.</p>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    "
                };

                emailMessage.Body = bodyBuilder.ToMessageBody();

                using var smtpClient = new SmtpClient();
                await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, MailKit.Security.SecureSocketOptions.SslOnConnect);
                await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                await smtpClient.SendAsync(emailMessage);
                await smtpClient.DisconnectAsync(true);

                _logger.LogInformation($"Game call-up email sent to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"General Error creating/sending game call-up email: {ex.Message}");
                throw;
            }
        }

        // ── Gera o PDF do bilhete com QuestPDF ────────────────────────────────
        private byte[] GenerateTicketPdf(string buyerName, string eventTitle, DateTime eventDate, string location, byte[] qrCode, string ticketCode, decimal price)
        {
            // Paleta de cores
            var blueTop     = Color.FromHex("#003380");
            var blueMid     = Color.FromHex("#00509e");
            var blueLight   = Color.FromHex("#e8f0fe");
            var textDark    = Color.FromHex("#1a1a2e");
            var textMuted   = Color.FromHex("#6b7280");
            var white       = Colors.White;
            var borderColor = Color.FromHex("#dbeafe");
            var greenOk     = Color.FromHex("#059669");

            // Logo do clube (opcional)
            var logoPath = Path.Combine(_env.WebRootPath, "CDP_logo.png");
            byte[]? logo = File.Exists(logoPath) ? File.ReadAllBytes(logoPath) : null;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(0);
                    page.Background(Colors.White);

                    page.Content().Column(col =>
                    {
                        // ── HEADER ─────────────────────────────────────────────
                        col.Item().Background(blueTop).Padding(30).Row(row =>
                        {
                            if (logo != null)
                            {
                                row.ConstantItem(60).Image(logo).FitArea();
                                row.ConstantItem(16);
                            }

                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("CLUBE DESPORTIVO DA PÓVOA")
                                    .FontSize(18).Bold().FontColor(white).LetterSpacing(0.5f);
                                c.Item().Text("Fundado em 1943  •  Póvoa de Varzim")
                                    .FontSize(10).FontColor(Color.FromHex("#93c5fd"));
                            });

                            row.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().AlignRight().Text("BILHETE OFICIAL")
                                    .FontSize(11).Bold().FontColor(Color.FromHex("#93c5fd")).LetterSpacing(2f);
                                c.Item().AlignRight().Text(eventDate.ToString("yyyy"))
                                    .FontSize(24).Bold().FontColor(white);
                            });
                        });

                        // ── FAIXA AZUL CLARO ───────────────────────────────────
                        col.Item().Background(blueMid).PaddingHorizontal(30).PaddingVertical(10).Row(row =>
                        {
                            row.RelativeItem().Text(eventTitle.ToUpper())
                                .FontSize(13).Bold().FontColor(white).LetterSpacing(0.5f);
                        });

                        // ── CORPO PRINCIPAL ────────────────────────────────────
                        col.Item().Padding(30).Row(row =>
                        {
                            // Coluna esquerda — detalhes do evento
                            row.RelativeItem(3).Column(details =>
                            {
                                // Caixa de informações do evento
                                details.Item().Border(1).BorderColor(borderColor).Padding(20).Column(info =>
                                {
                                    info.Item().Text("DETALHES DO EVENTO")
                                        .FontSize(9).Bold().FontColor(textMuted).LetterSpacing(1.5f);
                                    info.Item().Height(12);

                                    // Jogo
                                    info.Item().Row(r =>
                                    {
                                        r.ConstantItem(5).Background(blueTop);
                                        r.ConstantItem(12);
                                        r.RelativeItem().Column(c =>
                                        {
                                            c.Item().Text("JOGO").FontSize(8).FontColor(textMuted).Bold();
                                            c.Item().Text(eventTitle).FontSize(14).Bold().FontColor(textDark);
                                        });
                                    });

                                    info.Item().Height(14);

                                    // Data
                                    info.Item().Row(r =>
                                    {
                                        r.ConstantItem(5).Background(blueMid);
                                        r.ConstantItem(12);
                                        r.RelativeItem().Column(c =>
                                        {
                                            c.Item().Text("DATA & HORA").FontSize(8).FontColor(textMuted).Bold();
                                            c.Item().Text(eventDate.ToString("dddd, d 'de' MMMM 'de' yyyy", new System.Globalization.CultureInfo("pt-PT")))
                                                .FontSize(12).FontColor(textDark);
                                            c.Item().Text($"às {eventDate:HH:mm}h")
                                                .FontSize(11).FontColor(blueMid);
                                        });
                                    });

                                    info.Item().Height(14);

                                    // Local
                                    info.Item().Row(r =>
                                    {
                                        r.ConstantItem(5).Background(Color.FromHex("#10b981"));
                                        r.ConstantItem(12);
                                        r.RelativeItem().Column(c =>
                                        {
                                            c.Item().Text("LOCAL").FontSize(8).FontColor(textMuted).Bold();
                                            c.Item().Text(location).FontSize(12).FontColor(textDark);
                                        });
                                    });

                                    info.Item().Height(14);

                                    // Preço
                                    info.Item().Row(r =>
                                    {
                                        r.ConstantItem(5).Background(Color.FromHex("#f59e0b"));
                                        r.ConstantItem(12);
                                        r.RelativeItem().Column(c =>
                                        {
                                            c.Item().Text("VALOR PAGO").FontSize(8).FontColor(textMuted).Bold();
                                            c.Item().Text($"{price:F2} €").FontSize(14).Bold().FontColor(textDark);
                                        });
                                    });
                                });

                                details.Item().Height(20);

                                // Caixa do titular
                                details.Item().Background(blueLight).Padding(16).Column(holder =>
                                {
                                    holder.Item().Text("TITULAR DO BILHETE")
                                        .FontSize(9).Bold().FontColor(blueMid).LetterSpacing(1.5f);
                                    holder.Item().Height(6);
                                    holder.Item().Text(buyerName)
                                        .FontSize(16).Bold().FontColor(blueTop);
                                });

                                details.Item().Height(20);

                                // Nota de instruções
                                details.Item().Background(Color.FromHex("#fef9c3")).Border(1).BorderColor(Color.FromHex("#fde68a")).Padding(12).Column(note =>
                                {
                                    note.Item().Text("ℹ️  Como usar o seu bilhete")
                                        .FontSize(9).Bold().FontColor(Color.FromHex("#92400e"));
                                    note.Item().Height(4);
                                    note.Item().Text("Apresente o QR Code (impresso ou no telemóvel) à entrada do recinto. O bilhete é pessoal e intransmissível.")
                                        .FontSize(9).FontColor(Color.FromHex("#78350f")).LineHeight(1.4f);
                                });
                            });

                            row.ConstantItem(24);

                            // Coluna direita — QR Code
                            row.RelativeItem(2).Column(qrCol =>
                            {
                                qrCol.Item().Border(1).BorderColor(borderColor).Padding(20).AlignCenter().Column(qrBox =>
                                {
                                    qrBox.Item().AlignCenter().Text("CÓDIGO DE ACESSO")
                                        .FontSize(9).Bold().FontColor(textMuted).LetterSpacing(1.5f);
                                    qrBox.Item().Height(14);

                                    // QR Code
                                    qrBox.Item().AlignCenter().Width(160).Height(160).Image(qrCode).FitArea();

                                    qrBox.Item().Height(14);

                                    // Código textual
                                    qrBox.Item().AlignCenter().Background(Color.FromHex("#f1f5f9")).Padding(8).Text(ticketCode)
                                        .FontSize(7.5f).FontColor(textDark).FontFamily(Fonts.CourierNew).LetterSpacing(1f);

                                    qrBox.Item().Height(10);
                                    qrBox.Item().AlignCenter().Text("Válido para uma entrada")
                                        .FontSize(8).FontColor(textMuted).Italic();
                                });

                                qrCol.Item().Height(16);

                                // Indicador de bilhete válido
                                qrCol.Item().Background(greenOk).Padding(12).AlignCenter().Column(valid =>
                                {
                                    valid.Item().AlignCenter().Text("✓  BILHETE VÁLIDO")
                                        .FontSize(11).Bold().FontColor(white).LetterSpacing(1f);
                                });
                            });
                        });

                        // ── LINHA DE CORTE ─────────────────────────────────────
                        col.Item().PaddingHorizontal(30).Row(row =>
                        {
                            row.RelativeItem().Height(1).Background(borderColor);
                        });

                        // ── RODAPÉ ─────────────────────────────────────────────
                        col.Item().PaddingHorizontal(30).PaddingVertical(20).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"Bilhete Nº: {ticketCode[..8]}...")
                                    .FontSize(8).FontColor(textMuted).FontFamily(Fonts.CourierNew);
                                c.Item().Text($"Emitido em: {DateTime.Now:dd/MM/yyyy HH:mm}")
                                    .FontSize(8).FontColor(textMuted);
                            });
                            row.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().AlignRight().Text("cdpovoa.pt")
                                    .FontSize(8).FontColor(blueMid).Bold();
                                c.Item().AlignRight().Text("Clube Desportivo da Póvoa © " + DateTime.Now.Year)
                                    .FontSize(8).FontColor(textMuted);
                            });
                        });
                    });
                });
            });

            return document.GeneratePdf();
        }

        // ── Envio do email com bilhete em anexo PDF ───────────────────────────
        public async Task SendTicketEmailAsync(
            string toEmail,
            string buyerName,
            string eventTitle,
            DateTime eventDate,
            string location,
            byte[] qrCode,
            string ticketCode,
            decimal price)
        {
            try
            {
                _logger.LogInformation($"Attempting to send ticket email to {toEmail}");

                // Gerar PDF do bilhete
                var ticketPdf = GenerateTicketPdf(buyerName, eventTitle, eventDate, location, qrCode, ticketCode, price);
                var safeEventTitle = string.Concat(eventTitle.Split(Path.GetInvalidFileNameChars()));

                var emailMessage = new MimeMessage();
                emailMessage.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
                emailMessage.To.Add(new MailboxAddress(buyerName, toEmail));
                emailMessage.Subject = $"O seu Bilhete — {eventTitle} | Clube Desportivo da Póvoa";

                var bodyBuilder = new BodyBuilder();

                // Anexar o PDF do bilhete
                bodyBuilder.Attachments.Add($"Bilhete_CDP_{safeEventTitle}.pdf", ticketPdf, new MimeKit.ContentType("application", "pdf"));

                // Corpo do email em HTML
                bodyBuilder.HtmlBody = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f6f8;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 40px 20px;'>
                            <div style='background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);'>

                                <!-- Header -->
                                <div style='background: linear-gradient(135deg, #003380, #00509e); padding: 30px 40px; text-align: center;'>
                                    <h1 style='color: white; margin: 0 0 4px 0; font-size: 1.6em; letter-spacing: 0.5px;'>Clube Desportivo da Póvoa</h1>
                                    <p style='color: rgba(255,255,255,0.75); margin: 0; font-size: 0.9em;'>Bilheteira Online</p>
                                </div>

                                <!-- Body -->
                                <div style='padding: 40px;'>

                                    <h2 style='color: #003380; margin-top: 0; font-size: 1.3em;'>✅ Compra Confirmada!</h2>

                                    <p style='font-size: 1em; line-height: 1.7;'>
                                        Olá <strong>{buyerName}</strong>,
                                    </p>

                                    <p style='font-size: 1em; line-height: 1.7;'>
                                        O seu pagamento foi processado com sucesso e o bilhete para o jogo está garantido!
                                        Encontra o bilhete em PDF no anexo deste email — pode imprimi-lo ou apresentá-lo diretamente no telemóvel à entrada do recinto.
                                    </p>

                                    <!-- Caixa do jogo -->
                                    <div style='background: #f0f7ff; border: 1px solid #bfdbfe; border-left: 4px solid #003380; padding: 20px 24px; margin: 28px 0; border-radius: 0 8px 8px 0;'>
                                        <p style='margin: 0 0 6px 0; font-size: 0.8em; font-weight: bold; color: #6b7280; letter-spacing: 1px; text-transform: uppercase;'>Detalhes do Jogo</p>
                                        <h3 style='margin: 0 0 12px 0; color: #003380; font-size: 1.15em;'>{eventTitle}</h3>
                                        <p style='margin: 4px 0; font-size: 0.95em;'>📅 <strong>Data:</strong> {eventDate:dddd, d 'de' MMMM 'de' yyyy}</p>
                                        <p style='margin: 4px 0; font-size: 0.95em;'>🕐 <strong>Hora:</strong> {eventDate:HH:mm}h</p>
                                        <p style='margin: 4px 0; font-size: 0.95em;'>📍 <strong>Local:</strong> {location}</p>
                                        <p style='margin: 4px 0; font-size: 0.95em;'>💶 <strong>Valor pago:</strong> {price:F2} €</p>
                                    </div>

                                    <!-- Caixa do anexo -->
                                    <div style='background: #ecfdf5; border: 1px solid #6ee7b7; padding: 16px 20px; border-radius: 8px; margin-bottom: 28px; display: flex; align-items: center; gap: 12px;'>
                                        <span style='font-size: 1.8em;'>📎</span>
                                        <div>
                                            <p style='margin: 0; font-weight: bold; color: #065f46; font-size: 0.95em;'>Bilhete_CDP_{safeEventTitle}.pdf</p>
                                            <p style='margin: 4px 0 0 0; font-size: 0.85em; color: #047857;'>O seu bilhete está em anexo. Guarde-o ou imprima-o.</p>
                                        </div>
                                    </div>

                                    <p style='font-size: 1em; line-height: 1.7; color: #555;'>
                                        Abrimos portas <strong>1 hora antes</strong> do início do jogo. Venha cedo e aproveite o melhor ambiente do desporto da Póvoa!
                                    </p>

                                    <p style='font-size: 1em; line-height: 1.7;'>
                                        Obrigado pelo seu apoio. <strong>Força CDP! 💙</strong>
                                    </p>

                                </div>

                                <!-- Footer -->
                                <div style='background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;'>
                                    <p style='font-size: 0.8em; color: #888; margin: 0 0 4px 0;'>
                                        Clube Desportivo da Póvoa — Fundado em 1943
                                    </p>
                                    <p style='font-size: 0.8em; color: #888; margin: 0;'>
                                        Este email foi enviado automaticamente. Em caso de dúvida contacte-nos através do site.
                                    </p>
                                </div>

                            </div>
                        </div>
                    </body>
                    </html>
                ";

                emailMessage.Body = bodyBuilder.ToMessageBody();

                using var smtpClient = new SmtpClient();
                await smtpClient.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, MailKit.Security.SecureSocketOptions.SslOnConnect);
                await smtpClient.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
                await smtpClient.SendAsync(emailMessage);
                await smtpClient.DisconnectAsync(true);

                _logger.LogInformation($"Ticket email with PDF attachment sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending ticket email: {ex.Message}");
                throw;
            }
        }
    }
}