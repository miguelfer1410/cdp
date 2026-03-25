import re
import sys
import argparse
import unicodedata
import pandas as pd
import pyodbc
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

# ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────────

CSV_PATH = "RadGridExport.csv"

# Connection string para SQL Server (working connection from user edit)
DB_CONNECTION = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    r"SERVER=DESKTOP-KU8TIMC\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
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
    """Remove alias do email."""
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
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None


def get_month_range(start_date, end_date):
    """Retorna uma lista de (ano, mes) de start_date até end_date."""
    if start_date > end_date:
        return []
    months = []
    curr_year = start_date.year
    curr_month = start_date.month
    
    while (curr_year, curr_month) <= (end_date.year, end_date.month):
        months.append((curr_year, curr_month))
        curr_month += 1
        if curr_month > 12:
            curr_month = 1
            curr_year += 1
    return months

# ─── LEITURA DO CSV ────────────────────────────────────────────────────────────

def load_csv(path: str) -> pd.DataFrame:
    print(f"[CSV] A ler {path} ...")
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

    cols_map = {
        'Nome': 'nome',
        'E-mail': 'email',
        'NIF': 'nif',
        'Nº Cartão': 'membership_number',
        'Cliente desde': 'cliente_desde',
        'Pago até': 'pago_ate'
    }
    
    print(f"[CSV] Colunas encontradas: {list(df.columns)}")
    existing_cols = {c: cols_map[c] for c in cols_map if c in df.columns}
    print(f"[CSV] Mapeamento aplicado: {existing_cols}")
    df = df.rename(columns=existing_cols)
    
    # Check if we have the necessary columns after rename
    for col in ['nome', 'email', 'membership_number', 'nif', 'cliente_desde', 'pago_ate']:
        if col not in df.columns:
            # Fallback for columns not found
            df[col] = ''
    
    # Limpeza e Normalização
    df["nome_norm"] = df["nome"].fillna('').astype(str).apply(normalize_text)
    df["email_norm"] = df["email"].fillna('').astype(str).apply(extract_base_email)
    df["membership_number"] = df["membership_number"].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()
    df["nif_clean"] = df["nif"].astype(str).apply(lambda x: re.sub(r'[^0-9]', '', x)[-9:] if len(re.sub(r'[^0-9]', '', x)) >= 9 else x)

    print(f"[CSV] {len(df)} registos carregados.")
    return df


# ─── LEITURA DA BASE DE DADOS ──────────────────────────────────────────────────

def load_data():
    print("[BD] A carregar dados (atletas, modalidades, pagamentos existentes)...")
    try:
        conn = pyodbc.connect(DB_CONNECTION)
    except Exception as e:
        print(f"[ERRO] Falha ao conectar: {e}")
        sys.exit(1)

    # 1. Quotas Globais
    cursor = conn.cursor()
    cursor.execute("SELECT [Key], [Value] FROM SystemSettings WHERE [Key] IN ('MemberFee', 'MinorMemberFee')")
    settings = {row.Key: float(row.Value.replace(',', '.')) for row in cursor.fetchall()}
    member_fee = settings.get('MemberFee', 3.0)
    minor_fee = settings.get('MinorMemberFee', 1.5)

    # 2. Modalidades
    sports_df = pd.read_sql("SELECT Id, Name, MonthlyFee, FeeNormalNormal, QuotaIncluded FROM Sports", conn)
    sports = {row.Id: row for row in sports_df.itertuples()}

    # 3. Atletas (com MemberProfile e Sport)
    query = """
        SELECT
            u.Id as user_id, u.FirstName, u.LastName, u.Email, u.Nif, u.BirthDate,
            mp.Id as member_profile_id, mp.MembershipNumber, mp.MemberSince,
            ap.Id as athlete_profile_id,
            s.Id as sport_id, s.Name as sport_name
        FROM AthleteProfiles ap
        JOIN Users u ON ap.UserId = u.Id
        JOIN MemberProfiles mp ON mp.UserId = u.Id
        LEFT JOIN AthleteTeams at ON at.AthleteProfileId = ap.Id
        LEFT JOIN Teams t ON at.TeamId = t.Id
        LEFT JOIN Sports s ON t.SportId = s.Id
    """
    athletes_df = pd.read_sql(query, conn)
    athletes_df["full_name"] = (athletes_df["FirstName"].fillna('') + " " + athletes_df["LastName"].fillna('')).str.strip()
    athletes_df["nome_norm"] = athletes_df["full_name"].apply(normalize_text)
    athletes_df["base_email"] = athletes_df["Email"].apply(extract_base_email)
    athletes_df["nif_clean"] = athletes_df["Nif"].astype(str).apply(lambda x: re.sub(r'[^0-9]', '', x)[-9:] if len(re.sub(r'[^0-9]', '', x)) >= 9 else x)

    # 4. Pagamentos Existentes (para evitar duplicados)
    payments_df = pd.read_sql("SELECT MemberProfileId, PeriodMonth, PeriodYear FROM Payments WHERE Status = 'Completed'", conn)
    existing_payments = set()
    for row in payments_df.itertuples():
        existing_payments.add((row.MemberProfileId, row.PeriodYear, row.PeriodMonth))

    conn.close()
    return athletes_df, sports, member_fee, minor_fee, existing_payments


# ─── PROCESSAMENTO ─────────────────────────────────────────────────────────────

def process_migration(athletes_df, csv_df, sports, member_fee, minor_fee, existing_payments):
    new_payments = []
    
    # Indexar CSV para lookup rápido
    csv_by_num = {row.membership_number: row for row in csv_df.itertuples() if row.membership_number and row.membership_number != 'nan'}
    csv_by_nif = {row.nif_clean: row for row in csv_df.itertuples() if len(row.nif_clean) >= 9}
    csv_by_email = {}
    for row in csv_df.itertuples():
        if row.email_norm:
            csv_by_email.setdefault(row.email_norm, []).append(row)

    print("\n[Match] A gerar pagamentos históricos...")
    
    matched_count = 0
    generated_count = 0
    skipped_count = 0
    
    for _, athlete in athletes_df.iterrows():
        match = None
        # Matching logic
        if athlete.MembershipNumber in csv_by_num:
            match = csv_by_num[athlete.MembershipNumber]
        elif athlete.nif_clean in csv_by_nif:
            match = csv_by_nif[athlete.nif_clean]
        elif athlete.base_email in csv_by_email:
            candidates = csv_by_email[athlete.base_email]
            if len(candidates) == 1:
                match = candidates[0]
            else:
                for c in candidates:
                    if c.nome_norm == athlete.nome_norm:
                        match = c; break
        
        if not match:
            continue
            
        matched_count += 1
        
        # Datas
        since_date = athlete.MemberSince.date() if pd.notnull(athlete.MemberSince) else parse_date(match.cliente_desde)
        pago_ate = parse_date(match.pago_ate)
        
        if not since_date or not pago_ate:
            continue
            
        # Determinar Mensalidade
        sport = sports.get(athlete.sport_id)
        s_fee = 0
        quota_included = True
        if sport:
            s_fee = sport.MonthlyFee if sport.MonthlyFee > 0 else sport.FeeNormalNormal
            quota_included = sport.QuotaIncluded
        
        # Member Fee (Check if minor)
        m_fee = member_fee
        if pd.notnull(athlete.BirthDate):
            bd = athlete.BirthDate.date()
            today = date.today()
            age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
            if age < 18: m_fee = minor_fee
            
        total_monthly = s_fee
        if not quota_included:
            total_monthly += m_fee
            
        if total_monthly <= 0:
            total_monthly = 30.0 # Fallback for athletes found in DB but maybe sport fee not set
            
        # Gerar pagamentos para cada mês
        months = get_month_range(since_date, pago_ate)
        for year, month in months:
            if (athlete.member_profile_id, year, month) not in existing_payments:
                desc = f"Quota Mensal - {month}/{year}"
                if athlete.sport_name:
                    desc += f" ({athlete.sport_name})"
                
                new_payments.append({
                    'MemberProfileId': int(athlete.member_profile_id),
                    'Amount': float(total_monthly),
                    'PeriodMonth': month,
                    'PeriodYear': year,
                    'Description': desc,
                    'Name': athlete.full_name
                })
                generated_count += 1
            else:
                skipped_count += 1

    print(f"[Match] {matched_count} atletas identificados no CSV.")
    print(f"[Match] {generated_count} novos pagamentos gerados.")
    print(f"[Match] {skipped_count} pagamentos ignorados (já existem na BD).")
    return new_payments


def generate_sql(payments, output_path="athlete_payments.sql"):
    lines = [
        "-- Migration of Athlete Payments",
        "BEGIN TRANSACTION;",
        ""
    ]
    for p in payments:
        # SQL Server format for Money and Dates
        lines.append(f"-- Athlete: {p['Name']} | Period: {p['PeriodMonth']}/{p['PeriodYear']}")
        lines.append(
            f"INSERT INTO Payments (MemberProfileId, Amount, PaymentDate, PaymentMethod, Status, Description, PeriodMonth, PeriodYear, CreatedAt) "
            f"VALUES ({p['MemberProfileId']}, {p['Amount']:.2f}, GETDATE(), 'Imported', 'Completed', '{p['Description']}', {p['PeriodMonth']}, {p['PeriodYear']}, GETDATE());"
        )
    
    lines.append("\nCOMMIT TRANSACTION;")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[SQL] Ficheiro gerado: {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    csv_df = load_csv(CSV_PATH)
    athletes_df, sports, member_fee, minor_fee, existing_payments = load_data()
    
    new_payments = process_migration(athletes_df, csv_df, sports, member_fee, minor_fee, existing_payments)
    
    if not new_payments:
        print("[Info] Nada a migrar.")
        return

    generate_sql(new_payments)

    if args.apply:
        confirm = input(f"\nAplicar {len(new_payments)} pagamentos na BD? (s/N): ").strip().lower()
        if confirm == 's':
            print("[BD] A aplicar pagamentos...")
            conn = pyodbc.connect(DB_CONNECTION)
            cursor = conn.cursor()
            for p in new_payments:
                cursor.execute("""
                    INSERT INTO Payments (MemberProfileId, Amount, PaymentDate, PaymentMethod, Status, Description, PeriodMonth, PeriodYear, CreatedAt)
                    VALUES (?, ?, GETDATE(), 'Imported', 'Completed', ?, ?, ?, GETDATE())
                """, p['MemberProfileId'], p['Amount'], p['Description'], p['PeriodMonth'], p['PeriodYear'])
            conn.commit()
            conn.close()
            print("[BD] Concluído.")

if __name__ == "__main__":
    main()
