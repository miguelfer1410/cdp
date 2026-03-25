import re
import sys
import argparse
import unicodedata
import pandas as pd
import pyodbc
from datetime import datetime, date
from collections import defaultdict

# ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────────

CSV_PATH = "RadGridExport.csv"

# Connection string para SQL Server
DB_CONNECTION = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    r"SERVER=DESKTOP-KU8TIMC\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
)

# ─── UTILITÁRIOS ───────────────────────────────────────────────────────────────

def normalize_text(text: str) -> str:
    if not isinstance(text, str): return ""
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_str = nfkd.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_str.upper().split())

def extract_base_email(email: str) -> str:
    if not isinstance(email, str) or "@" not in email: return ""
    email = email.strip().lower()
    local, domain = email.rsplit("@", 1)
    base_local = local.split("+")[0]
    return f"{base_local}@{domain}"

def parse_date(date_str: str):
    if not isinstance(date_str, str) or not date_str.strip(): return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try: return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError: continue
    return None

def get_month_range(start_date, end_date):
    if start_date > end_date: return []
    months = []
    curr_year, curr_month = start_date.year, start_date.month
    while (curr_year, curr_month) <= (end_date.year, end_date.month):
        months.append((curr_year, curr_month))
        curr_month += 1
        if curr_month > 12: curr_month = 1; curr_year += 1
    return months

# ─── LEITURA E PROCESSAMENTO DO CSV ────────────────────────────────────────────

def load_csv(path: str) -> pd.DataFrame:
    print(f"[CSV] A ler {path} ...")
    header_found = False
    with open(path, 'r', encoding='latin-1') as f:
        for i, line in enumerate(f):
            if 'Cliente desde' in line and line.count(';') > 5:
                header_line = i; header_found = True; break
    
    if not header_found:
        print("[ERRO] Cabeçalho não encontrado."); sys.exit(1)

    df = pd.read_csv(path, sep=';', encoding='latin-1', skiprows=header_line)
    cols_map = {
        'Nome': 'nome', 'E-mail': 'email', 'NIF': 'nif', 'Nº Cartão': 'membership_number',
        'Cliente desde': 'cliente_desde', 'Pago até': 'pago_ate', 
        'Nome Pais': 'pai_nome', 'Contacto Pais': 'pai_contacto'
    }
    df = df.rename(columns={c: cols_map[c] for c in cols_map if c in df.columns})
    for col in ['nome', 'email', 'membership_number', 'nif', 'cliente_desde', 'pago_ate', 'pai_nome', 'pai_contacto']:
        if col not in df.columns: df[col] = ''
    
    # Normalização
    df["nome_norm"] = df["nome"].fillna('').astype(str).apply(normalize_text)
    df["email_norm"] = df["email"].fillna('').astype(str).apply(extract_base_email)
    df["membership_number"] = df["membership_number"].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()
    df["nif_clean"] = df["nif"].astype(str).apply(lambda x: re.sub(r'[^0-9]', '', str(x))[-9:] if len(re.sub(r'[^0-9]', '', str(x))) >= 9 else str(x))
    
    # Deteção de Irmãos (Grouping by parent info)
    df["pai_contacto_clean"] = df["pai_contacto"].astype(str).apply(lambda x: re.sub(r'\D', '', x) if len(re.sub(r'\D', '', x)) >= 9 else "")
    df["pai_nome_norm"] = df["pai_nome"].fillna('').apply(normalize_text)
    
    family_groups = defaultdict(list)
    for idx, row in df.iterrows():
        key = None
        if row.pai_contacto_clean: key = row.pai_contacto_clean
        elif len(row.pai_nome_norm) > 10: key = row.pai_nome_norm
        if key: family_groups[key].append(idx)
    
    # Map each row to its family size
    row_to_family_size = {idx: 1 for idx in df.index}
    for members in family_groups.values():
        size = len(members)
        for idx in members: row_to_family_size[idx] = max(row_to_family_size[idx], size)
    
    df["family_size"] = df.index.map(row_to_family_size)
    print(f"[CSV] {len(df)} registos carregados. Famílias detetadas: {len(family_groups)}")
    return df

# ─── LEITURA DA BASE DE DADOS ──────────────────────────────────────────────────

def load_data():
    print("[BD] A carregar dados...")
    conn = pyodbc.connect(DB_CONNECTION)
    
    # 1. Configurações
    cursor = conn.cursor()
    cursor.execute("SELECT [Key], [Value] FROM SystemSettings WHERE [Key] IN ('MemberFee', 'MinorMemberFee')")
    settings = {row.Key: float(row.Value.replace(',', '.')) for row in cursor.fetchall()}
    
    # 2. Modalidades
    sports_df = pd.read_sql("SELECT * FROM Sports", conn)
    sports = {row.Id: row for row in sports_df.itertuples()}

    # 3. Todos os Membros (com ou sem AthleteProfile)
    query = """
        SELECT
            u.Id as user_id, u.FirstName, u.LastName, u.Email, u.Nif, u.BirthDate,
            mp.Id as member_profile_id, mp.MembershipNumber, mp.MemberSince,
            ap.Id as athlete_profile_id, ap.Escalao,
            MAX(s.Id) as sport_id, MAX(s.Name) as sport_name
        FROM Users u
        JOIN MemberProfiles mp ON mp.UserId = u.Id
        LEFT JOIN AthleteProfiles ap ON ap.UserId = u.Id
        LEFT JOIN AthleteTeams at ON at.AthleteProfileId = ap.Id
        LEFT JOIN Teams t ON at.TeamId = t.Id
        LEFT JOIN Sports s ON t.SportId = s.Id
        GROUP BY u.Id, u.FirstName, u.LastName, u.Email, u.Nif, u.BirthDate, mp.Id, mp.MembershipNumber, mp.MemberSince, ap.Id, ap.Escalao
    """
    members_df = pd.read_sql(query, conn)
    members_df["full_name"] = (members_df["FirstName"].fillna('') + " " + members_df["LastName"].fillna('')).str.strip()
    members_df["nome_norm"] = members_df["full_name"].apply(normalize_text)
    members_df["base_email"] = members_df["Email"].apply(extract_base_email)
    members_df["nif_clean"] = members_df["Nif"].astype(str).apply(lambda x: re.sub(r'[^0-9]', '', str(x))[-9:] if len(re.sub(r'[^0-9]', '', str(x))) >= 9 else str(x))

    # 4. Pagamentos Existentes (excluir os importados hoje se já foram limpos)
    payments_df = pd.read_sql("SELECT MemberProfileId, PeriodMonth, PeriodYear FROM Payments WHERE Status = 'Completed'", conn)
    existing_payments = set((row.MemberProfileId, row.PeriodYear, row.PeriodMonth) for row in payments_df.itertuples())

    conn.close()
    return members_df, sports, settings, existing_payments

# ─── LÓGICA DE VALOR (MENSALIDADE) ─────────────────────────────────────────────

def calculate_monthly_fee(member, match, sports, settings):
    # Caso 1: Atleta
    if pd.notnull(member.athlete_profile_id) and pd.notnull(member.sport_id):
        sport = sports.get(member.sport_id)
        if not sport: return 30.0 # Emergency fallback
        
        # Determinar Escalão Numérico
        esc_val = 0
        if pd.notnull(member.Escalao):
            matches = re.findall(r'\d+', str(member.Escalao))
            if matches: esc_val = int(matches[0])
        
        fam_size = getattr(match, 'family_size', 1)
        
        # Priority Logic: Escalao Specific -> Normal -> Legacy Fallback
        fee = 0
        if esc_val == 1:
            if fam_size == 2 and sport.FeeEscalao1Brother > 0: fee = sport.FeeEscalao1Brother
            elif fam_size >= 3 and sport.FeeEscalao1MultipleBrothers > 0: fee = sport.FeeEscalao1MultipleBrothers
            else: fee = sport.FeeEscalao1Normal
        elif esc_val == 2:
            if fam_size == 2 and sport.FeeEscalao2Brother > 0: fee = sport.FeeEscalao2Brother
            elif fam_size >= 3 and sport.FeeEscalao2MultipleBrothers > 0: fee = sport.FeeEscalao2MultipleBrothers
            else: fee = sport.FeeEscalao2Normal
        
        # Se ainda zero (ou não era esc 1/2), tenta Normal
        if fee <= 0:
            if fam_size == 2 and sport.FeeNormalBrother > 0: fee = sport.FeeNormalBrother
            elif fam_size >= 3 and sport.FeeNormalMultipleBrothers > 0: fee = sport.FeeNormalMultipleBrothers
            else: fee = sport.FeeNormalNormal
            
        # Último recurso: MonthlyFee (Legacy)
        if fee <= 0: fee = sport.MonthlyFee
        
        # Se ainda zero, fallback padrão
        if fee <= 0: fee = 30.0
        
        # Adicionar quota de sócio se não estiver incluída
        if not sport.QuotaIncluded:
            m_fee = settings.get('MemberFee', 3.0)
            if pd.notnull(member.BirthDate) and (date.today().year - member.BirthDate.year < 18):
                m_fee = settings.get('MinorMemberFee', 1.5)
            fee += m_fee
        return fee

    # Caso 2: Sócio Não-Atleta
    m_fee = settings.get('MemberFee', 3.0)
    if pd.notnull(member.BirthDate) and (date.today().year - member.BirthDate.year < 18):
        m_fee = settings.get('MinorMemberFee', 1.5)
    return m_fee

# ─── PROCESSAMENTO ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    csv_df = load_csv(CSV_PATH)
    members_df, sports, settings, existing_payments = load_data()
    print(f"[Debug] Members in DB: {len(members_df)}")
    
    # Indexar CSV
    csv_by_num = {row.membership_number: row for row in csv_df.itertuples() if row.membership_number and row.membership_number != 'nan'}
    csv_by_nif = {row.nif_clean: row for row in csv_df.itertuples() if len(row.nif_clean) >= 9}
    csv_by_email = defaultdict(list)
    for row in csv_df.itertuples():
        if row.email_norm: csv_by_email[row.email_norm].append(row)

    print("\n[Unified] A gerar pagamentos históricos...")
    new_payments = []
    stats = {'matched': 0, 'generated': 0, 'skipped': 0}

    for _, member in members_df.iterrows():
        match = None
        if member.MembershipNumber in csv_by_num: match = csv_by_num[member.MembershipNumber]
        elif member.nif_clean in csv_by_nif: match = csv_by_nif[member.nif_clean]
        elif member.base_email in csv_by_email:
            cands = csv_by_email[member.base_email]
            if len(cands) == 1: match = cands[0]
            else:
                for c in cands:
                    if c.nome_norm == member.nome_norm: match = c; break
        
        if not match: continue
        stats['matched'] += 1
        
        since_date = member.MemberSince.date() if pd.notnull(member.MemberSince) else parse_date(match.cliente_desde)
        pago_ate = parse_date(match.pago_ate)
        if not since_date or not pago_ate: continue
        
        fee = calculate_monthly_fee(member, match, sports, settings)
        
        months = get_month_range(since_date, pago_ate)
        for year, month in months:
            if (member.member_profile_id, year, month) not in existing_payments:
                desc = f"Quota Mensal - {month}/{year}"
                if pd.notnull(member.sport_name): desc += f" ({member.sport_name})"
                
                new_payments.append({
                    'mp_id': int(member.member_profile_id), 'amt': float(fee),
                    'm': month, 'y': year, 'desc': desc, 'name': member.full_name
                })
                stats['generated'] += 1
            else: stats['skipped'] += 1

    print(f"[Match] {stats['matched']} membros identificados.")
    print(f"[Match] {stats['generated']} pagamentos gerados.")
    print(f"[Match] {stats['skipped']} pagamentos saltados (já existem).")

    if not new_payments: return

    # Gerar SQL com batching de 1000
    with open("unified_payments.sql", "w", encoding="utf-8") as f:
        f.write("-- Unified Migration\n\n")
        batch_size = 500
        for i in range(0, len(new_payments), batch_size):
            batch = new_payments[i : i + batch_size]
            f.write(f"-- Batch {i//batch_size + 1}\nBEGIN TRANSACTION;\n")
            for p in batch:
                f.write(f"-- Member: {p['name']} | Period: {p['m']}/{p['y']}\n")
                f.write(f"INSERT INTO Payments (MemberProfileId, Amount, PaymentDate, PaymentMethod, Status, Description, PeriodMonth, PeriodYear, CreatedAt) ")
                f.write(f"VALUES ({p['mp_id']}, {p['amt']:.2f}, GETDATE(), 'Imported', 'Completed', '{p['desc']}', {p['m']}, {p['y']}, GETDATE());\n")
            f.write("COMMIT TRANSACTION;\n\n")
    print(f"[SQL] unified_payments.sql gerado ({len(new_payments)} registos em {((len(new_payments)-1)//batch_size)+1} batches).")
    print("[SQL] unified_payments.sql gerado.")

    if args.apply:
        print("[BD] A aplicar...")
        conn = pyodbc.connect(DB_CONNECTION)
        cursor = conn.cursor()
        for p in new_payments:
            cursor.execute("""
                INSERT INTO Payments (MemberProfileId, Amount, PaymentDate, PaymentMethod, Status, Description, PeriodMonth, PeriodYear, CreatedAt)
                VALUES (?, ?, GETDATE(), 'Imported', 'Completed', ?, ?, ?, GETDATE())
            """, p['mp_id'], p['amt'], p['desc'], p['m'], p['y'])
        conn.commit(); conn.close()
        print("[BD] Concluído.")

if __name__ == "__main__":
    main()
