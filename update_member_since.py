import re
import sys
import argparse
import unicodedata
import pandas as pd
import pyodbc
from datetime import datetime

# ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────────

CSV_PATH = "RadGridExport.csv"

# Connection string para SQL Server (Remote)
DB_CONNECTION = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=51.178.43.232,14330;"
    "DATABASE=cdp;"
    "UID=sa;"
    "PWD=c8lpFUm1gEhgJb;"
    "TrustServerCertificate=yes;"
)

# ─── UTILITÁRIOS ───────────────────────────────────────────────────────────────

def normalize_text(text: str) -> str:
    """Remove acentos, converte para maiúsculas e remove espaços extra."""
    if not isinstance(text, str):
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_str = nfkd.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_str.upper().split())


def extract_base_email(email: str) -> str:
    """
    Remove alias do email.
    Exemplo: mae+joao@gmail.com -> mae@gmail.com
    """
    if not isinstance(email, str) or "@" not in email:
        return ""
    email = email.strip().lower()
    local, domain = email.rsplit("@", 1)
    base_local = local.split("+")[0]
    return f"{base_local}@{domain}"


def parse_date(date_str: str):
    """Tenta converter a data do CSV para objeto datetime."""
    if not isinstance(date_str, str) or not date_str.strip():
        return None
    
    # Formatos comuns: DD/MM/YYYY ou YYYY-MM-DD
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None

# ─── LEITURA DO CSV ────────────────────────────────────────────────────────────

def load_csv(path: str) -> pd.DataFrame:
    print(f"[CSV] A ler {path} ...")
    # Finding the header line dynamically as seen in inspection
    header_found = False
    with open(path, 'r', encoding='latin-1') as f:
        for i, line in enumerate(f):
            if 'Cliente desde' in line and line.count(';') > 5:
                header_line = i
                header_found = True
                break
    
    if not header_found:
        print("[ERRO] Não foi possível encontrar o cabeçalho no CSV.")
        sys.exit(1)

    df = pd.read_csv(path, sep=';', encoding='latin-1', skiprows=header_line)

    # Identificar colunas pelos nomes vistos na inspeção
    # 1: Nome, 2: E-mail, 32: NIF, 33: Nº Cartão, 22: Cliente desde
    # Nota: os nomes reais podem variar ligeiramente, vamos tentar dar match
    
    cols_map = {
        'Nome': 'nome',
        'E-mail': 'email',
        'NIF': 'nif',
        'Nº Cartão': 'membership_number',
        'Cliente desde': 'cliente_desde'
    }
    
    existing_cols = {c: cols_map[c] for c in cols_map if c in df.columns}
    df = df.rename(columns=existing_cols)
    
    # Mantemos apenas o que interessa
    relevant_cols = list(existing_cols.values())
    df = df[relevant_cols].copy()

    # Limpeza e Normalização
    if 'nome' in df.columns:
        df["nome_norm"] = df["nome"].apply(normalize_text)
    if 'email' in df.columns:
        df["email"] = df["email"].astype(str).str.strip().str.lower()
        df["email"] = df["email"].replace({"nan": "", "None": ""})
        df["email_norm"] = df["email"].apply(extract_base_email)
    if 'membership_number' in df.columns:
        # Garantir que é string e remover .0 se veio de float
        df["membership_number"] = df["membership_number"].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()
    if 'nif' in df.columns:
        df["nif"] = df["nif"].astype(str).str.strip()
        # Se for PT999999999 ou PT-999999999, tentar limpar
        df["nif"] = df["nif"].apply(lambda x: re.sub(r'[^0-9]', '', x)[-9:] if len(re.sub(r'[^0-9]', '', x)) >= 9 else x)

    print(f"[CSV] {len(df)} registos carregados.")
    return df


# ─── LEITURA DA BASE DE DADOS ──────────────────────────────────────────────────

def load_database() -> pd.DataFrame:
    print("[BD] A conectar à base de dados ...")
    try:
        conn = pyodbc.connect(DB_CONNECTION)
    except Exception as e:
        print(f"[ERRO] Falha ao conectar: {e}")
        sys.exit(1)

    query = """
        SELECT
            u.Id          AS user_id,
            u.FirstName   AS first_name,
            u.LastName    AS last_name,
            u.Email       AS email,
            u.Nif         AS nif,
            mp.Id         AS member_profile_id,
            mp.MembershipNumber AS membership_number,
            mp.MemberSince     AS current_member_since
        FROM Users u
        INNER JOIN MemberProfiles mp ON mp.UserId = u.Id
    """
    df = pd.read_sql(query, conn)
    conn.close()

    df["full_name"]   = (df["first_name"].fillna('') + " " + df["last_name"].fillna('')).str.strip()
    df["nome_norm"]   = df["full_name"].apply(normalize_text)
    df["base_email"]  = df["email"].apply(extract_base_email)
    
    # Limpeza NIF
    df["nif_clean"] = df["nif"].astype(str).apply(lambda x: re.sub(r'[^0-9]', '', x)[-9:] if len(re.sub(r'[^0-9]', '', x)) >= 9 else x)

    print(f"[BD] {len(df)} membros carregados.")
    return df


# ─── MATCHING E ATUALIZAÇÃO ────────────────────────────────────────────────────

def process_updates(db_df: pd.DataFrame, csv_df: pd.DataFrame):
    updates = []
    
    # Indexar CSV por múltiplos campos para lookup rápido
    csv_by_num = {row.membership_number: row for row in csv_df.itertuples() if row.membership_number and row.membership_number != 'nan'}
    csv_by_nif = {row.nif: row for row in csv_df.itertuples() if row.nif and row.nif != 'nan'}
    csv_by_email = {}
    for row in csv_df.itertuples():
        if hasattr(row, 'email_norm') and row.email_norm:
            csv_by_email.setdefault(row.email_norm, []).append(row)

    print("\n[Match] A processar correspondências...")
    
    unmatched_count = 0
    matched_count = 0
    
    for _, db_row in db_df.iterrows():
        match = None
        match_reason = ""
        
        # 1. Match por Numero de Sócio
        if db_row.membership_number in csv_by_num:
            match = csv_by_num[db_row.membership_number]
            match_reason = "Membership Number"
        
        # 2. Match por NIF
        if not match and db_row.nif_clean in csv_by_nif:
            match = csv_by_nif[db_row.nif_clean]
            match_reason = "NIF"
            
        # 3. Match por Email (considerando aliases)
        if not match and db_row.base_email in csv_by_email:
            candidates = csv_by_email[db_row.base_email]
            # Se houver mais que um, tentar desempatar pelo nome
            if len(candidates) == 1:
                match = candidates[0]
                match_reason = "Base Email (Unique)"
            else:
                for c in candidates:
                    if c.nome_norm == db_row.nome_norm:
                        match = c
                        match_reason = "Base Email + Name"
                        break
        
        if match:
            new_date = parse_date(match.cliente_desde)
            if new_date:
                updates.append({
                    'member_profile_id': db_row.member_profile_id,
                    'full_name': db_row.full_name,
                    'old_date': db_row.current_member_since,
                    'new_date': new_date,
                    'match_reason': match_reason
                })
                matched_count += 1
        else:
            unmatched_count += 1

    print(f"[Match] {matched_count} matches encontrados. {unmatched_count} membros sem correspondência.")
    return updates


def generate_sql(updates, output_path="update_member_since.sql"):
    lines = [
        "-- SQL Update for MemberSince",
        "BEGIN TRANSACTION;",
        ""
    ]
    
    for u in updates:
        date_str = u['new_date'].strftime('%Y-%m-%d')
        lines.append(f"-- Member: {u['full_name']} | Match by: {u['match_reason']}")
        lines.append(f"UPDATE MemberProfiles SET MemberSince = '{date_str}' WHERE Id = {u['member_profile_id']};")
    
    lines.append("\nCOMMIT TRANSACTION;")
    # lines.append("-- ROLLBACK TRANSACTION;")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[SQL] Ficheiro gerado: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Atualiza MemberSince na BD CDP a partir de RadGridExport.csv")
    parser.add_argument("--csv", default=CSV_PATH, help=f"Caminho para o CSV (default: {CSV_PATH})")
    parser.add_argument("--apply", action="store_true", help="Aplica diretamente na BD")
    args = parser.parse_args()

    csv_df = load_csv(args.csv)
    db_df = load_database()
    
    updates = process_updates(db_df, csv_df)
    
    if not updates:
        print("[Info] Nenhuma atualização para processar.")
        return

    generate_sql(updates)

    if args.apply:
        confirm = input(f"\nAplicar {len(updates)} atualizações na BD? (s/N): ").strip().lower()
        if confirm == 's':
            print("[BD] A aplicar atualizações...")
            conn = pyodbc.connect(DB_CONNECTION)
            cursor = conn.cursor()
            for u in updates:
                date_str = u['new_date'].strftime('%Y-%m-%d')
                cursor.execute("UPDATE MemberProfiles SET MemberSince = ? WHERE Id = ?", date_str, u['member_profile_id'])
            conn.commit()
            conn.close()
            print("[BD] Concluído.")
        else:
            print("Cancelado.")

if __name__ == "__main__":
    main()
