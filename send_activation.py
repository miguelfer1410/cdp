import pyodbc
import uuid
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import email.utils
import sys

# Configurações do Email (de acordo com appsettings.json)
SMTP_SERVER = "mail.cdpovoa.pt"
SMTP_PORT = 465
SENDER_EMAIL = "website@cdpovoa.pt"
SENDER_NAME = "Clube Desportivo Da Póvoa"
USERNAME = "website@cdpovoa.pt"
PASSWORD = "CDPovoa#1943*"

# Configuração da Base de Dados (de acordo com DefaultConnection)
# Se der erro de driver, pode alterar "ODBC Driver 17 for SQL Server" 
# para o seu driver local (ex: "SQL Server" ou "ODBC Driver 18 for SQL Server")
DB_SERVER = r"DESKTOP-KU8TIMC\MSSQLSERVERS"
DB_NAME = "cdp"
CONNECTION_STRING = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={DB_SERVER};DATABASE={DB_NAME};Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;"

def get_user_and_update_token(email_address):
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        cursor = conn.cursor()
        
        # Procurar o utilizador pelo email (case-insensitive tipicamente no SQL Server)
        cursor.execute("SELECT Id, FirstName FROM Users WHERE Email = ?", (email_address,))
        user = cursor.fetchone()
        
        if not user:
            print(f"Erro: Utilizador com email '{email_address}' não encontrado na base de dados.")
            return None
        
        user_id, first_name = user[0], user[1]
        
        # Gerar token único e validade de 48 horas
        token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=48)
        
        # Atualizar PasswordResetToken na tabela Users
        cursor.execute("""
            UPDATE Users 
            SET PasswordResetToken = ?, PasswordResetTokenExpires = ? 
            WHERE Id = ?
        """, (token, expires_at, user_id))
        
        conn.commit()
        conn.close()
        
        print(f"-> Token gerado na base de dados com sucesso para {first_name}.")
        return first_name, token
        
    except pyodbc.Error as e:
        print(f"Erro de conexão à base de dados. Verifique o DB_SERVER ou os Drivers instalados.\nDetalhe: {e}")
        return None

def send_activation_email(to_email, first_name, token):
    # Link manual para o IP especificado
    activation_link = f"http://51.178.43.232:3001/ativar-conta?token={token}"
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Ative a sua conta - Clube Desportivo da Póvoa"
    msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg['To'] = to_email
    msg['Date'] = email.utils.formatdate(localtime=True)
    msg['Message-ID'] = email.utils.make_msgid(domain='cdpovoa.pt')

    html_content = f"""
    <html>
    <body style='font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f6f8;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 40px 20px;'>
            <div style='background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);'>
                <div style='background: linear-gradient(135deg, #003380, #00509e); padding: 30px 40px; text-align: center;'>
                    <h1 style='color: white; margin: 0; font-size: 1.5em;'>Clube Desportivo da Póvoa</h1>
                </div>
                <div style='padding: 40px;'>
                    <h2 style='color: #003380;'>Bem-vindo, {first_name}!</h2>
                    <p>A sua conta foi criada com sucesso. Para começar a utilizar a plataforma, por favor ative a sua conta clicando no botão abaixo:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{activation_link}' style='background: #003380; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;'>Ativar Conta</a>
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
    """

    part = MIMEText(html_content, 'html')
    msg.attach(part)

    try:
        print(f"-> A conectar ao servidor SMTP ({SMTP_SERVER}:{SMTP_PORT})...")
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(USERNAME, PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"✅ Sucesso: Email de ativação enviado para {to_email}")
    except Exception as e:
        print(f"❌ Erro ao enviar email SMTP: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python send_activation.py <email_do_socio>")
        sys.exit(1)
        
    target_email = sys.argv[1].strip()
    
    print(f"A iniciar o processo de reenvio de ativação para {target_email}...")
    user_data = get_user_and_update_token(target_email)
    
    if user_data:
        first_name, token = user_data
        send_activation_email(target_email, first_name, token)
