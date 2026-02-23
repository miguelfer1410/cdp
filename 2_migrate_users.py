"""
SCRIPT 2 - MIGRAÇÃO DE SÓCIOS VIA API (POST /api/users)
=========================================================
Transfere os sócios do Excel chamando o endpoint POST /api/users
do UsersController da tua API.

Regras aplicadas:
  - Excluir NIF = PT-999999990
  - Excluir sócios sem email
  - Ignorar se o par (email + nome completo) já existe na BD
  - Se o email existe mas o nome é diferente, inserir normalmente

Endpoint utilizado:
  POST /api/users   →   UserCreateRequest DTO
  {
    email, password, firstName, lastName,
    phone, birthDate, nif, address, postalCode, city
  }

Após inserção, o script chama ainda:
  POST /api/users/{id}/member-profile  →  cria o perfil de sócio
    com o estado correto do Excel (Active/Pending/Cancelled)

Password temporária: CDP@SocioXXXXXX  (ex: CDP@Socio007879)
Os utilizadores devem usar "Esqueci a password" no 1º login.
"""

import requests
import pandas as pd
import pyodbc
from datetime import datetime

# ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
EXCEL_PATH = "RadGridExport.xls"

API_BASE_URL = "http://localhost:5285"   # URL da tua API

# Ligação à BD só para verificação de duplicados (email + nome)
# Opção A - Windows Auth (mesma máquina do servidor):
CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-KU8TIMC\\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
)
# Opção B - SQL Auth (descomentar se necessário):
# CONNECTION_STRING = (
#     "DRIVER={ODBC Driver 17 for SQL Server};"
#     "SERVER=WIN-965ONJOTRVC\\IASCHEDULE;"
#     "DATABASE=cdp;"
#     "UID=sa;"
#     "PWD=c8lpFUm1gEhgJb;"
#     "TrustServerCertificate=yes;"
# )

DRY_RUN = False   # True = simula sem chamar a API
# ─────────────────────────────────────────────────────────────────────────────


def parse_name(nome):
    parts = str(nome).strip().split()
    if not parts:
        return "Sem Nome", "Sem Apelido"
    first = parts[0].capitalize()
    last = " ".join(p.capitalize() for p in parts[1:]) if len(parts) > 1 else "."
    return first, last


def clean_nif(nif_raw):
    if pd.isna(nif_raw):
        return None
    nif = str(nif_raw).strip().upper()
    if nif.startswith("PT-"):
        nif = nif[3:]
    return nif[:9] if nif else None


def clean_phone(phone_raw):
    if pd.isna(phone_raw):
        return None
    phone = str(phone_raw).strip()
    if phone.startswith("(351)"):
        phone = "+351" + phone[5:]
    return phone[:20]


def clean_optional(val, max_len=255):
    if pd.isna(val):
        return None
    s = str(val).strip()
    return s[:max_len] if s else None


def parse_date(val):
    if pd.isna(val):
        return None
    try:
        return pd.to_datetime(val).strftime("%Y-%m-%dT%H:%M:%S")
    except Exception:
        return None


def membership_status_int(estado):
    """0=Pending, 1=Active, 2=Suspended, 3=Cancelled"""
    mapa = {"Activo": 1, "Utente": 0, "Desistente": 3, "Pré-Inscrição": 0}
    return mapa.get(str(estado).strip(), 0)


def temp_password(socio_num):
    """CDP@SocioXXXXXX — cumpre: maiúscula, minúscula, número e special char."""
    return f"CDP@Socio{str(socio_num).zfill(6)}"


def load_excel(path):
    df = pd.read_excel(path, dtype=str)
    df = df[df["NIF"].fillna("PT-999999990") != "PT-999999990"].copy()
    df = df[df["Endereço de e-mail"].notna()].copy()
    df = df[df["Endereço de e-mail"].str.strip() != ""].copy()
    df = df.drop_duplicates(subset=["Sócio: Número"])
    return df


def get_existing_users(cursor):
    cursor.execute("SELECT Email, FirstName, LastName FROM Users")
    existing = {}
    for row in cursor.fetchall():
        email = str(row[0]).strip().lower()
        full = f"{str(row[1]).strip()} {str(row[2]).strip()}".lower()
        existing.setdefault(email, set()).add(full)
    return existing


def api_create_user(payload):
    """POST /api/users — devolve (ok: bool, user_id: int|None, msg: str)."""
    try:
        resp = requests.post(
            f"{API_BASE_URL}/api/users",
            json=payload,
            timeout=15
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            return True, data.get("id"), "ok"
        else:
            try:
                msg = resp.json().get("message", resp.text[:150])
            except Exception:
                msg = resp.text[:150]
            return False, None, f"HTTP {resp.status_code} — {msg}"
    except requests.exceptions.ConnectionError:
        return False, None, "Não foi possível ligar à API. Verifica se está a correr."
    except Exception as e:
        return False, None, str(e)


def api_create_member_profile(user_id, status_int, member_since):
    """POST /api/users/{id}/member-profile — cria o perfil de sócio."""
    try:
        payload = {
            "membershipStatus": status_int,
            "memberSince": member_since,
            "paymentPreference": "Monthly"
        }
        resp = requests.post(
            f"{API_BASE_URL}/api/users/{user_id}/member-profile",
            json=payload,
            timeout=15
        )
        if resp.status_code in (200, 201):
            return True, ""
        else:
            try:
                msg = resp.json().get("message", resp.text[:150])
            except Exception:
                msg = resp.text[:150]
            return False, f"HTTP {resp.status_code} — {msg}"
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 70)
    print("MIGRAÇÃO DE SÓCIOS VIA POST /api/users — CDP")
    print(f"Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"API: {API_BASE_URL}")
    print(f"Modo: {'🔸 DRY RUN (sem chamadas à API)' if DRY_RUN else '🔴 PRODUÇÃO'}")
    print("=" * 70)

    print("\n📂 A carregar Excel...")
    df = load_excel(EXCEL_PATH)
    print(f"   {len(df)} registos válidos (NIF válido + com email)")

    print("\n🔌 A ligar à BD para verificar duplicados...")
    try:
        conn = pyodbc.connect(CONNECTION_STRING, timeout=10)
        cursor = conn.cursor()
        existing = get_existing_users(cursor)
        conn.close()
        print(f"   {len(existing)} emails já existentes na BD")
    except Exception as e:
        print(f"   ⚠️  Falha na ligação à BD: {e}")
        print("   A continuar sem verificação de duplicados.")
        existing = {}

    stats = {"inseridos": 0, "ignorados": 0, "erros": 0}
    log_rows = []

    print(f"\n{'─' * 70}")
    print("  A processar registos...")
    print(f"{'─' * 70}\n")

    for _, row in df.iterrows():
        nome      = row.get("Nome", "")
        email_raw = row.get("Endereço de e-mail", "")
        nif_raw   = row.get("NIF", "")
        socio_num = row.get("Sócio: Número", "0")
        estado    = row.get("Estado Actual", "")

        email     = str(email_raw).strip().lower()
        first, last = parse_name(nome)
        full_name = f"{first} {last}".lower()
        pwd       = temp_password(socio_num)
        mem_status = membership_status_int(estado)
        mem_since  = parse_date(row.get("Cliente desde"))

        # ── VERIFICAÇÃO DE DUPLICADOS ──
        if email in existing and full_name in existing[email]:
            stats["ignorados"] += 1
            log_rows.append({
                "Nº Sócio": socio_num, "Nome": nome, "Email": email,
                "NIF": clean_nif(nif_raw), "Estado": "IGNORADO",
                "Razão": "email + nome já existem na BD", "PasswordTemp": ""
            })
            print(f"  ⏭️  IGNORADO  {nome[:50]}")
            continue

        # ── PAYLOAD UserCreateRequest ──
        user_payload = {
            "email":     str(email_raw).strip(),
            "password":  pwd,
            "firstName": first,
            "lastName":  last,
            "phone":     clean_phone(row.get("NºTelefone/Telemóvel")),
            "birthDate": parse_date(row.get("Data de Nascimento")),
            "nif":       clean_nif(nif_raw),
            "address":   clean_optional(row.get("Morada"), 255),
            "postalCode":clean_optional(row.get("Código Postal"), 10),
            "city":      None,
        }

        if DRY_RUN:
            stats["inseridos"] += 1
            log_rows.append({
                "Nº Sócio": socio_num, "Nome": nome, "Email": email,
                "NIF": user_payload["nif"], "Estado": "DRY-RUN",
                "Razão": "simulado", "PasswordTemp": pwd
            })
            print(f"  🔸 DRY-RUN   {nome[:50]}")
            continue

        # ── STEP 1: Criar utilizador ──
        ok, user_id, msg = api_create_user(user_payload)

        if not ok:
            stats["erros"] += 1
            log_rows.append({
                "Nº Sócio": socio_num, "Nome": nome, "Email": email,
                "NIF": user_payload["nif"], "Estado": "ERRO",
                "Razão": f"CreateUser: {msg}", "PasswordTemp": pwd
            })
            print(f"  ❌ ERRO user  {nome[:45]:<47} → {msg}")
            continue

        # ── STEP 2: Criar perfil de sócio ──
        mp_ok, mp_msg = api_create_member_profile(user_id, mem_status, mem_since)

        if mp_ok:
            stats["inseridos"] += 1
            log_rows.append({
                "Nº Sócio": socio_num, "Nome": nome, "Email": email,
                "NIF": user_payload["nif"], "UserId": user_id,
                "Estado": "INSERIDO", "Razão": "ok", "PasswordTemp": pwd
            })
            print(f"  ✅ INSERIDO  [{stats['inseridos']:>4}] {nome[:40]:<42} → userId={user_id}")
        else:
            # Utilizador criado mas sem perfil de sócio — regista o aviso
            stats["inseridos"] += 1
            log_rows.append({
                "Nº Sócio": socio_num, "Nome": nome, "Email": email,
                "NIF": user_payload["nif"], "UserId": user_id,
                "Estado": "INSERIDO (sem perfil sócio)",
                "Razão": f"MemberProfile falhou: {mp_msg}", "PasswordTemp": pwd
            })
            print(f"  ⚠️  INSERIDO  [{stats['inseridos']:>4}] {nome[:35]:<37} userId={user_id} | ⚠️ MemberProfile: {mp_msg}")

    # ── RELATÓRIO FINAL ──
    print(f"\n{'=' * 70}")
    print("  RESULTADO DA MIGRAÇÃO")
    print(f"{'=' * 70}")
    print(f"  ✅ Inseridos:   {stats['inseridos']}")
    print(f"  ⏭️  Ignorados:  {stats['ignorados']}")
    print(f"  ❌ Erros:      {stats['erros']}")
    print(f"{'=' * 70}")

    log_path = f"migracao_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    pd.DataFrame(log_rows).to_csv(log_path, index=False, encoding="utf-8-sig")
    print(f"\n  📄 Log guardado em: {log_path}")
    print(f"\n  ⚠️  IMPORTANTE: Os utilizadores devem usar 'Esqueci a password'")
    print(f"     no 1º login, ou a password temporária: CDP@SocioXXXXXX\n")


if __name__ == "__main__":
    main()