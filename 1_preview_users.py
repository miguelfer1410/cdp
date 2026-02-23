"""
SCRIPT 1 - PREVIEW DE SÓCIOS A MIGRAR
======================================
Lista todos os utilizadores que serão transferidos para a base de dados,
aplicando as mesmas regras do script de migração, SEM fazer alterações na BD.

Regras:
  - Excluir NIF = PT-999999990
  - Ignorar se o par (email + nome completo) já existe na BD
  - Se o email existe mas o nome é diferente, incluir
"""

import pandas as pd
import pyodbc
from datetime import datetime

# ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
EXCEL_PATH = "RadGridExport.xls"

# Alterar conforme o servidor onde correr o script:
# Opção A - Windows Auth (máquina do servidor):
CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-KU8TIMC\\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
)
# Opção B - SQL Auth (descomentar e preencher):
# CONNECTION_STRING = (
#     "DRIVER={ODBC Driver 17 for SQL Server};"
#     "SERVER=WIN-965ONJOTRVC\\IASCHEDULE;"
#     "DATABASE=cdp;"
#     "UID=sa;"
#     "PWD=c8lpFUm1gEhgJb;"
#     "TrustServerCertificate=yes;"
# )
# ─────────────────────────────────────────────────────────────────────────────


def parse_name(nome):
    """Divide o nome completo em primeiro nome e apelido(s)."""
    parts = str(nome).strip().split()
    if len(parts) == 0:
        return "Sem Nome", "Sem Apelido"
    first = parts[0].capitalize()
    last = " ".join(p.capitalize() for p in parts[1:]) if len(parts) > 1 else "."
    return first, last


def clean_nif(nif_raw):
    """Remove prefixo 'PT-' e devolve só os dígitos (máx 9 chars)."""
    if pd.isna(nif_raw):
        return None
    nif = str(nif_raw).strip().upper()
    if nif.startswith("PT-"):
        nif = nif[3:]
    return nif[:9] if nif else None


def clean_phone(phone_raw):
    """Remove (351) e limita a 20 caracteres."""
    if pd.isna(phone_raw):
        return None
    phone = str(phone_raw).strip()
    if phone.startswith("(351)"):
        phone = "+" + "351" + phone[5:]
    return phone[:20]


def membership_status(estado):
    """Mapeia o estado para int: 0=Pending, 1=Active, 2=Suspended, 3=Cancelled."""
    mapa = {
        "Activo": 1,
        "Utente": 0,
        "Desistente": 3,
        "Pré-Inscrição": 0,
    }
    return mapa.get(str(estado).strip(), 0)


def membership_number(socio_num):
    """Formata o número de sócio no padrão CDP-XXXXXX."""
    try:
        return f"CDP-{int(socio_num):06d}"
    except Exception:
        return f"CDP-{str(socio_num)}"


def load_excel(path):
    df = pd.read_excel(path, dtype=str)
    # Filtrar NIF inválidos
    df = df[df["NIF"].fillna("PT-999999990") != "PT-999999990"].copy()
    df = df.drop_duplicates(subset=["Sócio: Número"])
    return df


def get_existing_users(cursor):
    cursor.execute("SELECT Email, FirstName, LastName FROM Users")
    rows = cursor.fetchall()
    # dicionário: email -> set de nomes completos
    existing = {}
    for row in rows:
        email = str(row[0]).strip().lower()
        full_name = f"{str(row[1]).strip()} {str(row[2]).strip()}".lower()
        existing.setdefault(email, set()).add(full_name)
    return existing


def classify_users(df, existing):
    to_insert = []
    skipped = []

    for _, row in df.iterrows():
        email_raw = row.get("Endereço de e-mail", "")
        nome = row.get("Nome", "")
        nif_raw = row.get("NIF", "")

        email = str(email_raw).strip().lower() if pd.notna(email_raw) and str(email_raw).strip() else None
        first, last = parse_name(nome)
        full_name = f"{first} {last}".lower()

        record = {
            "Nome":              nome,
            "Email":             email or "(sem email)",
            "NIF":               clean_nif(nif_raw),
            "Telefone":          clean_phone(row.get("NºTelefone/Telemóvel")),
            "Morada":            str(row.get("Morada", "") or "").strip() or None,
            "CódigoPostal":      str(row.get("Código Postal", "") or "").strip()[:10] or None,
            "DataNascimento":    row.get("Data de Nascimento"),
            "SócioNº":           row.get("Sócio: Número"),
            "MembershipNumber":  membership_number(row.get("Sócio: Número")),
            "MemberSince":       row.get("Cliente desde"),
            "EstadoActual":      row.get("Estado Actual"),
            "MembershipStatus":  membership_status(row.get("Estado Actual")),
            "FirstName":         first,
            "LastName":          last,
        }

        # Ignorar sócios sem email
        if email is None:
            record["Email"] = "(sem email)"
            record["Razão"] = "⏭️  IGNORADO (sem email)"
            skipped.append(record)
            continue

        if email in existing:
            if full_name in existing[email]:
                record["Razão"] = "⏭️  IGNORADO (email + nome já existem)"
                skipped.append(record)
            else:
                record["Razão"] = "✅ NOVO (email existe mas nome diferente)"
                to_insert.append(record)
        else:
            record["Razão"] = "✅ NOVO"
            to_insert.append(record)

    return to_insert, skipped


def main():
    print("=" * 70)
    print("PREVIEW DE MIGRAÇÃO DE SÓCIOS")
    print(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 70)

    print("\n📂 A carregar Excel...")
    df = load_excel(EXCEL_PATH)
    print(f"   {len(df)} registos com NIF válido encontrados")

    print("\n🔌 A ligar à base de dados...")
    try:
        conn = pyodbc.connect(CONNECTION_STRING, timeout=10)
        cursor = conn.cursor()
        existing = get_existing_users(cursor)
        conn.close()
        print(f"   {len(existing)} emails já existentes na BD")
    except Exception as e:
        print(f"   ⚠️  Não foi possível ligar à BD: {e}")
        print("   A continuar sem verificação de duplicados...\n")
        existing = {}

    print("\n🔍 A classificar registos...")
    to_insert, skipped = classify_users(df, existing)

    print(f"\n{'=' * 70}")
    print(f"  RESUMO")
    print(f"{'=' * 70}")
    print(f"  Total com NIF válido:  {len(df)}")
    print(f"  A MIGRAR:              {len(to_insert)}")
    print(f"  IGNORADOS (duplicados):{len(skipped)}")
    print(f"{'=' * 70}\n")

    # ── UTILIZADORES QUE VÃO SER MIGRADOS ──
    print(f"\n{'─' * 70}")
    print("  ✅ UTILIZADORES A MIGRAR")
    print(f"{'─' * 70}")
    print(f"{'#':<5} {'Nome':<35} {'Email':<35} {'NIF':<12} {'Nº Sócio':<10} {'Razão'}")
    print(f"{'─' * 120}")
    for i, u in enumerate(to_insert, 1):
        print(f"{i:<5} {u['Nome'][:34]:<35} {u['Email'][:34]:<35} "
              f"{str(u['NIF'] or ''):<12} {str(u['SócioNº']):<10} {u['Razão']}")

    # ── UTILIZADORES IGNORADOS ──
    if skipped:
        print(f"\n\n{'─' * 70}")
        print("  ⏭️  UTILIZADORES IGNORADOS (duplicados)")
        print(f"{'─' * 70}")
        print(f"{'#':<5} {'Nome':<35} {'Email':<35} {'NIF':<12} {'Razão'}")
        print(f"{'─' * 100}")
        for i, u in enumerate(skipped, 1):
            print(f"{i:<5} {u['Nome'][:34]:<35} {u['Email'][:34]:<35} "
                  f"{str(u['NIF'] or ''):<12} {u['Razão']}")

    print(f"\n\n✅ Preview concluído. Para executar a migração, corre: python 2_migrate_users.py\n")


if __name__ == "__main__":
    main()