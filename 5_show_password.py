"""
SCRIPT 5 - LISTAR PASSWORDS DOS UTILIZADORES MIGRADOS
=======================================================
Mostra a password temporária de cada utilizador inserido pela migração.
A password é sempre: CDP@Socio + nº sócio com 6 dígitos
  ex: sócio 7879 → CDP@Socio007879

O script lê o CSV de log da migração (gerado pelo script 2).
Se não encontrar o CSV, reconstrói a lista diretamente do Excel
cruzando com os utilizadores existentes na BD.
"""

import pandas as pd
import pyodbc
import glob
import os
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

# Caminho para o CSV do log (None = auto-detetar o mais recente)
MIGRATION_LOG_CSV = None
# ─────────────────────────────────────────────────────────────────────────────


def temp_password(socio_num):
    return f"CDP@Socio{str(socio_num).zfill(6)}"


def find_latest_csv():
    csvs = glob.glob("migracao_log_*.csv")
    if csvs:
        return max(csvs, key=os.path.getmtime)
    return None


def load_from_csv(path):
    df = pd.read_csv(path, dtype=str)
    # Filtrar só os inseridos
    df = df[df["Estado"].str.upper().str.contains("INSERIDO", na=False)]
    results = []
    for _, row in df.iterrows():
        socio_num = str(row.get("Nº Sócio", "")).strip()
        nome      = str(row.get("Nome", "")).strip()
        email     = str(row.get("Email", "")).strip()
        nif       = str(row.get("NIF", "")).strip()
        if socio_num:
            results.append({
                "Nº Sócio": socio_num,
                "Nome":     nome,
                "Email":    email,
                "NIF":      nif,
                "Password": temp_password(socio_num)
            })
    return results


def load_from_excel_and_db():
    """Reconstrói a lista cruzando o Excel com os utilizadores na BD."""
    print("   A reconstruir lista a partir do Excel + BD...")

    # Carregar Excel com os mesmos filtros do script de migração
    df = pd.read_excel(EXCEL_PATH, dtype=str)
    df = df[df["NIF"].fillna("PT-999999990") != "PT-999999990"].copy()
    df = df[df["Endereço de e-mail"].notna()].copy()
    df = df[df["Endereço de e-mail"].str.strip() != ""].copy()
    df = df[~df["Endereço de e-mail"].str.upper().str.contains("NAOTEM", na=False)].copy()
    df = df[~df["Endereço de e-mail"].str.lower().str.startswith("nao@", na=False)].copy()
    df = df.drop_duplicates(subset=["Sócio: Número"])

    # Buscar emails existentes na BD criados hoje
    conn = pyodbc.connect(CONNECTION_STRING, timeout=10)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT LOWER(Email)
        FROM Users
        WHERE CAST(CreatedAt AS DATE) = CAST(GETUTCDATE() AS DATE)
    """)
    emails_na_bd = {row[0] for row in cursor.fetchall()}
    conn.close()

    results = []
    for _, row in df.iterrows():
        email_raw = str(row.get("Endereço de e-mail", "")).strip()
        email     = email_raw.lower()
        if email not in emails_na_bd:
            continue
        socio_num = str(row.get("Sócio: Número", "")).strip()
        nome      = str(row.get("Nome", "")).strip()
        nif_raw   = str(row.get("NIF", "")).strip().upper()
        nif       = nif_raw[3:] if nif_raw.startswith("PT-") else nif_raw
        results.append({
            "Nº Sócio": socio_num,
            "Nome":     nome,
            "Email":    email_raw,
            "NIF":      nif[:9],
            "Password": temp_password(socio_num)
        })
    return results


def main():
    print("=" * 70)
    print("PASSWORDS DOS UTILIZADORES MIGRADOS — CDP")
    print(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 70)

    # Tentar carregar do CSV de log
    csv_path = MIGRATION_LOG_CSV or find_latest_csv()
    if csv_path and os.path.exists(csv_path):
        print(f"\n📄 A carregar do CSV: {csv_path}")
        results = load_from_csv(csv_path)
    else:
        print("\n⚠️  CSV de log não encontrado. A reconstruir do Excel + BD...")
        results = load_from_excel_and_db()

    if not results:
        print("\n  Nenhum utilizador migrado encontrado.\n")
        return

    print(f"\n  Total: {len(results)} utilizadores\n")
    print(f"  {'#':<5} {'Nº Sócio':<10} {'Nome':<40} {'Email':<40} {'NIF':<12} {'Password'}")
    print(f"  {'─' * 120}")
    for i, u in enumerate(results, 1):
        print(f"  {i:<5} {u['Nº Sócio']:<10} {u['Nome'][:39]:<40} "
              f"{u['Email'][:39]:<40} {str(u['NIF'])[:11]:<12} {u['Password']}")

    # Guardar em CSV
    out_path = f"passwords_migrados_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    pd.DataFrame(results).to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"\n  📄 Ficheiro guardado em: {out_path}")
    print(f"\n  ⚠️  ATENÇÃO: Guarda este ficheiro em local seguro e apaga-o depois de usar.\n")


if __name__ == "__main__":
    main()