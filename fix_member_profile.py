"""
SCRIPT 4 - CRIAR MEMBER PROFILES EM FALTA
==========================================
Para os utilizadores que foram inseridos pela migração mas ficaram sem
MemberProfile (erro HTTP 401), este script:

  1. Faz login como Admin para obter o JWT token
  2. Consulta a BD para encontrar utilizadores SEM MemberProfile
     que tenham sido criados hoje (durante a migração)
  3. Cruza com o log CSV da migração para obter o estado correto
  4. Chama POST /api/users/{id}/member-profile com o token

Se não tiveres o CSV do log, o script usa Pending (0) como estado por defeito
e podes corrigir manualmente depois.
"""

import requests
import pyodbc
import pandas as pd
import os
import glob
from datetime import datetime, date

# ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
API_BASE_URL = "http://localhost:5285"

ADMIN_EMAIL    = "admin@cdp.com"   # ← email do admin
ADMIN_PASSWORD = "Admin123!"      # ← password do admin

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

# Caminho para o CSV gerado pelo script de migração (deixa None para auto-detetar)
MIGRATION_LOG_CSV = None   # ex: "migracao_log_20260223_143000.csv"
# ─────────────────────────────────────────────────────────────────────────────


def get_admin_token():
    """Faz login como Admin e devolve o JWT token."""
    resp = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=10
    )
    if resp.status_code != 200:
        raise Exception(f"Login falhou: HTTP {resp.status_code} — {resp.text[:150]}")
    token = resp.json().get("token")
    if not token:
        raise Exception("Token não encontrado na resposta de login.")
    return token


def get_users_without_member_profile(cursor):
    """Devolve utilizadores criados hoje que não têm MemberProfile."""
    cursor.execute("""
        SELECT u.Id, u.Email, u.FirstName, u.LastName, u.CreatedAt
        FROM Users u
        LEFT JOIN MemberProfiles mp ON mp.UserId = u.Id
        WHERE mp.Id IS NULL
          AND CAST(u.CreatedAt AS DATE) = CAST(GETUTCDATE() AS DATE)
        ORDER BY u.Id
    """)
    return cursor.fetchall()


def load_migration_log():
    """Tenta carregar o CSV de log mais recente para obter o estado de cada email."""
    path = MIGRATION_LOG_CSV
    if not path:
        # Auto-detetar o CSV mais recente na pasta atual
        csvs = glob.glob("migracao_log_*.csv")
        if csvs:
            path = max(csvs, key=os.path.getmtime)
            print(f"   CSV detetado automaticamente: {path}")
    if path and os.path.exists(path):
        df = pd.read_csv(path, dtype=str)
        # dicionário: email.lower() -> membership_status_int
        status_map = {}
        for _, row in df.iterrows():
            email = str(row.get("Email", "")).strip().lower()
            estado = str(row.get("EstadoActual", row.get("Estado", ""))).strip()
            mapa = {"Activo": 1, "Utente": 0, "Desistente": 3, "Pré-Inscrição": 0}
            status_map[email] = mapa.get(estado, 0)
        return status_map
    return {}


def create_member_profile(user_id, status_int, token):
    """POST /api/users/{id}/member-profile com JWT token."""
    resp = requests.post(
        f"{API_BASE_URL}/api/users/{user_id}/member-profile",
        json={
            "membershipStatus": status_int,
            "memberSince": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S"),
            "paymentPreference": "Monthly"
        },
        headers={"Authorization": f"Bearer {token}"},
        timeout=15
    )
    if resp.status_code in (200, 201):
        return True, ""
    try:
        msg = resp.json().get("message", resp.text[:150])
    except Exception:
        msg = resp.text[:150]
    return False, f"HTTP {resp.status_code} — {msg}"


def main():
    print("=" * 70)
    print("CRIAR MEMBER PROFILES EM FALTA — CDP")
    print(f"Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"API: {API_BASE_URL}")
    print("=" * 70)

    # ── Step 1: Login ──
    print("\n🔑 A fazer login como Admin...")
    try:
        token = get_admin_token()
        print("   ✅ Token obtido com sucesso")
    except Exception as e:
        print(f"   ❌ {e}\n")
        return

    # ── Step 2: Carregar log CSV ──
    print("\n📄 A procurar log CSV da migração...")
    status_map = load_migration_log()
    if status_map:
        print(f"   ✅ {len(status_map)} entradas carregadas do CSV")
    else:
        print("   ⚠️  CSV não encontrado — todos os perfis ficarão com estado Pending (0)")

    # ── Step 3: Buscar utilizadores sem MemberProfile ──
    print("\n🔌 A ligar à BD...")
    conn = pyodbc.connect(CONNECTION_STRING, timeout=10)
    cursor = conn.cursor()
    users = get_users_without_member_profile(cursor)
    conn.close()
    print(f"   {len(users)} utilizadores sem MemberProfile criados hoje")

    if not users:
        print("\n  ✅ Nenhum utilizador a corrigir. Tudo em ordem!\n")
        return

    print(f"\n{'─' * 70}")
    print("  A criar perfis de sócio...")
    print(f"{'─' * 70}\n")

    stats = {"ok": 0, "erro": 0}
    log_rows = []

    for row in users:
        user_id   = row[0]
        email     = str(row[1]).strip().lower()
        nome      = f"{row[2]} {row[3]}"
        status_int = status_map.get(email, 0)  # Pending se não encontrado no CSV

        ok, msg = create_member_profile(user_id, status_int, token)

        if ok:
            stats["ok"] += 1
            log_rows.append({"UserId": user_id, "Nome": nome, "Email": email,
                              "Estado": "OK", "MembershipStatus": status_int})
            print(f"  ✅ [{stats['ok']:>4}] {nome[:45]:<47} (status={status_int})")
        else:
            stats["erro"] += 1
            log_rows.append({"UserId": user_id, "Nome": nome, "Email": email,
                              "Estado": "ERRO", "Razão": msg})
            print(f"  ❌ ERRO  {nome[:45]:<47} → {msg}")

    # ── Relatório ──
    print(f"\n{'=' * 70}")
    print("  RESULTADO")
    print(f"{'=' * 70}")
    print(f"  ✅ Criados:  {stats['ok']}")
    print(f"  ❌ Erros:   {stats['erro']}")
    print(f"{'=' * 70}")

    log_path = f"fix_memberprofiles_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    pd.DataFrame(log_rows).to_csv(log_path, index=False, encoding="utf-8-sig")
    print(f"\n  📄 Log guardado em: {log_path}\n")


if __name__ == "__main__":
    main()