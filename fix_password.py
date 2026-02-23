"""
SCRIPT 7 - CORRIGIR PASSWORDS DOS UTILIZADORES MIGRADOS
=========================================================
O endpoint POST /api/users ignora o campo password e gera uma hash aleatória.
Este script corrige isso, atualizando diretamente o PasswordHash na BD
com o hash correto de CDP@SocioXXXXXX para cada utilizador migrado.

Cruza o Excel com os utilizadores criados hoje na BD para identificar
quais os sócios migrados e qual o número de sócio de cada um.

Após correr este script, o login com CDP@SocioXXXXXX fica funcional.
"""

import pandas as pd
import pyodbc
import bcrypt
from datetime import datetime

# ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
EXCEL_PATH = "RadGridExport.xls"

# Opção A - Windows Auth:
CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-KU8TIMC\\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
)
# Opção B - SQL Auth (descomentar):
# CONNECTION_STRING = (
#     "DRIVER={ODBC Driver 17 for SQL Server};"
#     "SERVER=WIN-965ONJOTRVC\\IASCHEDULE;"
#     "DATABASE=cdp;"
#     "UID=sa;"
#     "PWD=c8lpFUm1gEhgJb;"
#     "TrustServerCertificate=yes;"
# )

DRY_RUN = False   # False = executa a atualização real
# ─────────────────────────────────────────────────────────────────────────────


def temp_password(socio_num):
    return f"CDP@Socio{str(socio_num).zfill(6)}"


def hash_password(password: str) -> str:
    # workFactor 12 igual ao PasswordService.cs da API
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def load_excel_email_to_socio(path):
    """Devolve dicionário email.lower() -> nº sócio, filtrado com as mesmas regras da migração."""
    df = pd.read_excel(path, dtype=str)
    df = df[df["NIF"].fillna("PT-999999990") != "PT-999999990"].copy()
    df = df[df["Endereço de e-mail"].notna()].copy()
    df = df[df["Endereço de e-mail"].str.strip() != ""].copy()
    df = df[~df["Endereço de e-mail"].str.upper().str.contains("NAOTEM", na=False)].copy()
    df = df[~df["Endereço de e-mail"].str.lower().str.startswith("nao@", na=False)].copy()
    df = df.drop_duplicates(subset=["Sócio: Número"])

    mapping = {}
    for _, row in df.iterrows():
        email = str(row["Endereço de e-mail"]).strip().lower()
        socio = str(row["Sócio: Número"]).strip()
        mapping[email] = socio
    return mapping


def get_migrated_users(cursor):
    """Busca utilizadores criados hoje que ainda têm o token de ativação (password não foi definida)."""
    cursor.execute("""
        SELECT Id, Email, FirstName, LastName
        FROM Users
        WHERE CAST(CreatedAt AS DATE) = CAST(GETUTCDATE() AS DATE)
          AND PasswordResetToken IS NOT NULL
        ORDER BY Id
    """)
    return cursor.fetchall()


def main():
    print("=" * 70)
    print("CORRIGIR PASSWORDS DOS UTILIZADORES MIGRADOS — CDP")
    print(f"Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Modo: {'🔸 DRY RUN (sem alterações)' if DRY_RUN else '🔴 PRODUÇÃO'}")
    print("=" * 70)

    print("\n📂 A carregar mapeamento Email → Nº Sócio do Excel...")
    email_to_socio = load_excel_email_to_socio(EXCEL_PATH)
    print(f"   {len(email_to_socio)} emails mapeados")

    print("\n🔌 A ligar à BD...")
    conn = pyodbc.connect(CONNECTION_STRING, timeout=10)
    conn.autocommit = False
    cursor = conn.cursor()

    users = get_migrated_users(cursor)
    print(f"   {len(users)} utilizadores migrados hoje (com token de ativação pendente)")

    if not users:
        print("\n  ℹ️  Nenhum utilizador encontrado para corrigir.")
        print("     (O script procura utilizadores criados hoje com token de ativação)\n")
        conn.close()
        return

    print(f"\n{'─' * 70}")
    print("  A atualizar passwords...")
    print(f"{'─' * 70}\n")

    stats = {"ok": 0, "sem_socio": 0, "erro": 0}
    log_rows = []

    for row in users:
        user_id   = row[0]
        email     = str(row[1]).strip().lower()
        nome      = f"{row[2]} {row[3]}"

        socio_num = email_to_socio.get(email)

        if not socio_num:
            stats["sem_socio"] += 1
            log_rows.append({"UserId": user_id, "Nome": nome, "Email": email,
                              "Estado": "SEM_SOCIO", "Razão": "email não encontrado no Excel"})
            print(f"  ⚠️  SEM SÓCIO  {nome[:45]:<47} ({email})")
            continue

        pwd      = temp_password(socio_num)
        pwd_hash = hash_password(pwd)

        if DRY_RUN:
            stats["ok"] += 1
            log_rows.append({"UserId": user_id, "Nome": nome, "Email": email,
                              "Nº Sócio": socio_num, "Password": pwd, "Estado": "DRY-RUN"})
            print(f"  🔸 DRY-RUN  {nome[:40]:<42} sócio={socio_num}  pass={pwd}")
            continue

        try:
            cursor.execute("""
                UPDATE Users
                SET PasswordHash = ?,
                    PasswordResetToken = NULL,
                    PasswordResetTokenExpires = NULL
                WHERE Id = ?
            """, pwd_hash, user_id)

            stats["ok"] += 1
            log_rows.append({"UserId": user_id, "Nome": nome, "Email": email,
                              "Nº Sócio": socio_num, "Password": pwd, "Estado": "OK"})
            print(f"  ✅ [{stats['ok']:>4}]  {nome[:40]:<42} sócio={socio_num}  pass={pwd}")

        except Exception as e:
            stats["erro"] += 1
            log_rows.append({"UserId": user_id, "Nome": nome, "Email": email,
                              "Estado": "ERRO", "Razão": str(e)})
            print(f"  ❌ ERRO  {nome}: {e}")

    if not DRY_RUN:
        if stats["erro"] == 0:
            conn.commit()
            print("\n  ✅ COMMIT efectuado")
        else:
            conn.rollback()
            print(f"\n  ⚠️  ROLLBACK — {stats['erro']} erros encontrados")

    conn.close()

    print(f"\n{'=' * 70}")
    print("  RESULTADO")
    print(f"{'=' * 70}")
    print(f"  ✅ Atualizados:         {stats['ok']}")
    print(f"  ⚠️  Sem nº sócio:      {stats['sem_socio']}")
    print(f"  ❌ Erros:              {stats['erro']}")
    print(f"{'=' * 70}")

    log_path = f"fix_passwords_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    pd.DataFrame(log_rows).to_csv(log_path, index=False, encoding="utf-8-sig")
    print(f"\n  📄 Log guardado em: {log_path}")
    print(f"\n  ✅ Os utilizadores já podem fazer login com CDP@SocioXXXXXX\n")


if __name__ == "__main__":
    main()