"""
Script: import_payments_25_26.py
Importa pagamentos históricos da época 2025-26 para a tabela Payments
e actualiza o campo Escalao em AthleteProfiles.

Desportos suportados: Basquetebol, Voleibol, Hóquei, Futsal

Uso:
    pip install pandas openpyxl pyodbc
    python import_payments_25_26.py [--dry-run]
"""

import sys
import pandas as pd
import pyodbc
from datetime import datetime
from typing import Optional

# ─── Configuração ─────────────────────────────────────────────────────────────

CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-KU8TIMC\\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
)

FILES = {
    "Basquetebol": "ANÁLISE BASQUETE 25-26.xlsx",
    "Voleibol":    "ANÁLISE VOLEI 25-26.xlsx",
    "Hóquei":      "ANÁLISE HÓQUEI 25-26.xlsx",
    "Futsal":      "ANÁLISE FUTSAL 25-26.xlsx",
}

DRY_RUN = "--dry-run" in sys.argv

# ─── Mapeamento de meses da época 2025-26 ─────────────────────────────────────

MONTH_MAP = {
    'SET': (9,  2025), 'OUT': (10, 2025), 'NOV': (11, 2025), 'DEZ': (12, 2025),
    'JAN': (1,  2026), 'FEV': (2,  2026), 'MAR': (3,  2026), 'ABR': (4,  2026),
    'MAI': (5,  2026), 'JUN': (6,  2026),
}
MONTH_ORDER = list(MONTH_MAP.keys())
MONTH_INDEX = {v: i for i, (_, v) in enumerate(MONTH_MAP.items())}
PRE_SEASON  = {'JUL', 'AGO'}

# ─── Helpers de parsing ────────────────────────────────────────────────────────

def parse_pago_ate(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, datetime):
        for ms, (mo, yr) in MONTH_MAP.items():
            if mo == val.month and yr == val.year:
                return (mo, yr)
        return None
    s = str(val).strip().upper()
    if s in {'ESC. 1', 'NAN', 'PAGO ATE', 'PAGO ATÉ', ''}:
        return None
    parts = s.split('-')
    if len(parts) == 2 and parts[0] in MONTH_MAP:
        return MONTH_MAP[parts[0]]
    # formato 'dez.-26'
    sl = str(val).strip().lower().replace('.', '')
    pt = {'jan':1,'fev':2,'mar':3,'abr':4,'mai':5,'jun':6,'jul':7,'ago':8,'set':9,'out':10,'nov':11,'dez':12}
    for abbr, mo in pt.items():
        if sl.startswith(abbr) and '-' in sl:
            yr_part = sl.split('-')[-1].strip()
            if len(yr_part) == 2:
                yr = 2000 + int(yr_part)
                for ms, (mmo, yyr) in MONTH_MAP.items():
                    if mmo == mo and yyr == yr:
                        return (mo, yr)
    return None


def get_start_month(insc_str):
    if insc_str is None or (isinstance(insc_str, float) and pd.isna(insc_str)):
        return MONTH_MAP['SET']
    s = str(insc_str).strip().upper()
    if s in MONTH_MAP:
        return MONTH_MAP[s]
    if s in PRE_SEASON:
        return MONTH_MAP['SET']
    return MONTH_MAP['SET']


def months_range(start, end):
    si = MONTH_INDEX.get(start)
    ei = MONTH_INDEX.get(end)
    if si is None or ei is None or ei < si:
        return []
    return [MONTH_MAP[MONTH_ORDER[i]] for i in range(si, ei + 1)]


def detect_escalao(pago_ate_raw, obs_raw):
    pa = str(pago_ate_raw).strip().upper() if not (isinstance(pago_ate_raw, float) and pd.isna(pago_ate_raw)) else ''
    ob = str(obs_raw).strip().upper()      if not (isinstance(obs_raw, float) and pd.isna(obs_raw)) else ''
    if pa == 'ESC. 1' or 'ESCALÃO 1' in ob or 'ESCALAO 1' in ob:
        return 'esc1'
    if 'ESCALÃO 2' in ob or 'ESCALAO 2' in ob:
        return 'esc2'
    return 'normal'


def _int(val):
    try:
        return int(float(str(val)))
    except Exception:
        return None

# ─── DB helpers ────────────────────────────────────────────────────────────────

def get_connection():
    try:
        return pyodbc.connect(CONN_STR)
    except Exception as e:
        print(f"[ERRO] Ligação ao SQL Server falhou: {e}")
        sys.exit(1)


def find_member_profile(cursor, socio_num):
    """Devolve (MemberProfileId, UserId) ou None."""
    mn = str(socio_num).zfill(5)
    cursor.execute("SELECT Id, UserId FROM MemberProfiles WHERE MembershipNumber = ?", mn)
    row = cursor.fetchone()
    return (row[0], row[1]) if row else None


def update_athlete_escalao(cursor, user_id, escalao_label):
    """
    Actualiza AthleteProfile.Escalao para 'Escalão 1' ou 'Escalão 2'.
    Só actualiza se o valor actual for diferente.
    Devolve True se actualizou.
    """
    cursor.execute("SELECT Id, Escalao FROM AthleteProfiles WHERE UserId = ?", user_id)
    row = cursor.fetchone()
    if not row:
        return False
    ap_id, current = row[0], (row[1] or '').strip()
    if current == escalao_label:
        return False  # já correcto
    if not DRY_RUN:
        cursor.execute("UPDATE AthleteProfiles SET Escalao = ? WHERE Id = ?", escalao_label, ap_id)
    return True


def payment_exists(cursor, mp_id, month, year):
    cursor.execute(
        "SELECT 1 FROM Payments WHERE MemberProfileId=? AND PeriodMonth=? AND PeriodYear=?",
        mp_id, month, year
    )
    return cursor.fetchone() is not None


def insert_payment(cursor, mp_id, amount, month, year, sport_name):
    if payment_exists(cursor, mp_id, month, year):
        return False
    if not DRY_RUN:
        cursor.execute(
            """INSERT INTO Payments
               (MemberProfileId, Amount, PaymentDate, PaymentMethod, Status,
                Description, PeriodMonth, PeriodYear, CreatedAt)
               VALUES (?, ?, ?, 'Manual', 'Completed', ?, ?, ?, GETUTCDATE())""",
            mp_id, amount,
            datetime(year, month, 1),
            f"Quota Mensal - {month}/{year} ({sport_name})",
            month, year
        )
    return True


def get_sport_fees(cursor, sport_name):
    cursor.execute(
        "SELECT FeeNormalNormal, FeeEscalao1Normal, FeeEscalao2Normal FROM Sports WHERE Name = ?",
        sport_name
    )
    row = cursor.fetchone()
    if not row:
        cursor.execute(
            "SELECT FeeNormalNormal, FeeEscalao1Normal, FeeEscalao2Normal FROM Sports WHERE Name LIKE ?",
            f"%{sport_name.split()[0]}%"
        )
        row = cursor.fetchone()
    if row:
        return {'normal': float(row[0]), 'esc1': float(row[1]), 'esc2': float(row[2])}
    print(f"  [AVISO] Desporto '{sport_name}' não encontrado. Fees=0.")
    return {'normal': 0.0, 'esc1': 0.0, 'esc2': 0.0}

# ─── Parsers de Excel ──────────────────────────────────────────────────────────

def _make(nome, socio, pago, obs, insc):
    return {'nome': str(nome).strip(), 'socio': socio,
            'pago_ate_raw': pago, 'obs': obs, 'insc': insc}


def parse_basquete(df):
    """col1=Nome, col2=Sócio, col3=PagoAte, col7=Obs, col8=INSC"""
    out = []
    for _, row in df.iterrows():
        socio = _int(row.iloc[2])
        if socio is None or str(row.iloc[2]).strip() in ('', 'Sócio: Número', 'nan'):
            continue
        out.append(_make(row.iloc[1], socio, row.iloc[3], row.iloc[7], row.iloc[8]))
    return out


def parse_volei_folha1(df):
    """col2=Nome, col3=Sócio, col4=PagoAte, col8=Obs, col9=INSC"""
    out = []
    for _, row in df.iterrows():
        socio = _int(row.iloc[3])
        if socio is None or str(row.iloc[3]).strip() in ('', 'Sócio: Número', 'nan'):
            continue
        out.append(_make(row.iloc[2], socio, row.iloc[4], row.iloc[8], row.iloc[9]))
    return out


def parse_volei_masters(df):
    """col2=Nome, col3=Sócio, col5=MENS(pago até mensal), col9=Obs"""
    out = []
    for _, row in df.iterrows():
        socio = _int(row.iloc[3])
        if socio is None or str(row.iloc[3]).strip() in ('', 'Sócio: Número', 'nan'):
            continue
        obs = row.iloc[9]
        if not pd.isna(obs) and 'NÃO PAGOU' in str(obs).upper():
            continue
        out.append(_make(row.iloc[2], socio, row.iloc[5], obs, None))
    return out


def parse_hoquei_futsal(df):
    """col2=Nome, col3=Sócio, col4=PagoAte, col8=Obs, col9=INSC"""
    out = []
    for _, row in df.iterrows():
        socio = _int(row.iloc[3])
        if socio is None or str(row.iloc[3]).strip() in ('', 'Sócio: Número', 'nan'):
            continue
        out.append(_make(row.iloc[2], socio, row.iloc[4], row.iloc[8], row.iloc[9]))
    return out


def deduplicate(athletes):
    seen, out = set(), []
    for a in athletes:
        if a['socio'] not in seen:
            seen.add(a['socio'])
            out.append(a)
    return out

# ─── Processamento ─────────────────────────────────────────────────────────────

def process_athletes(conn, athletes, sport_name, label):
    cursor = conn.cursor()
    fees   = get_sport_fees(cursor, sport_name)

    ins_total = skip_total = nf_total = esc_updated = 0

    print(f"\n{'─'*60}")
    print(f"  {label}  |  {len(athletes)} atletas")
    print(f"  Fees → Normal:{fees['normal']}€  Esc1:{fees['esc1']}€  Esc2:{fees['esc2']}€")
    print(f"{'─'*60}")

    for ath in athletes:
        result = find_member_profile(cursor, ath['socio'])
        if result is None:
            print(f"  [NÃO ENCONTRADO] {ath['nome']} (#{ath['socio']})")
            nf_total += 1
            continue

        mp_id, user_id = result
        esc    = detect_escalao(ath['pago_ate_raw'], ath['obs'])
        amount = fees[esc]

        # Actualiza Escalão no AthleteProfile
        if esc in ('esc1', 'esc2'):
            label_esc = 'Escalão 1' if esc == 'esc1' else 'Escalão 2'
            if update_athlete_escalao(cursor, user_id, label_esc):
                esc_updated += 1
                print(f"  [ESC] {ath['nome']:40} #{ath['socio']} → {label_esc}")

        # Determina intervalo de meses
        if esc == 'esc1':
            start  = get_start_month(ath['insc'])
            end_my = (3, 2026)  # até ao mês actual
        else:
            end_my = parse_pago_ate(ath['pago_ate_raw'])
            if end_my is None:
                skip_total += 1
                continue
            start = get_start_month(ath['insc'])

        months = months_range(start, end_my)
        if not months:
            skip_total += 1
            continue

        inserted = sum(insert_payment(cursor, mp_id, amount, m, y, sport_name)
                       for (m, y) in months)
        if inserted > 0:
            print(f"  ✓ {ath['nome']:40} #{ath['socio']}  {esc:6}  {amount:.2f}€  x{inserted}m")
            ins_total += inserted
        else:
            skip_total += 1

    if not DRY_RUN:
        conn.commit()
    cursor.close()

    print(f"\n  Pagamentos inseridos: {ins_total} | Saltados: {skip_total} | "
          f"Não encontrados: {nf_total} | Escalões actualizados: {esc_updated}")
    return ins_total, nf_total, esc_updated

# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print(" IMPORTAÇÃO DE PAGAMENTOS + ESCALÕES 2025-26")
    if DRY_RUN:
        print(" *** DRY-RUN: Nenhuma alteração será efectuada ***")
    print("=" * 60)

    conn = get_connection()
    print("[OK] Ligado ao SQL Server\n")

    cur = conn.cursor()
    cur.execute("SELECT Id, Name, FeeNormalNormal, FeeEscalao1Normal, FeeEscalao2Normal FROM Sports ORDER BY Name")
    print("Desportos na DB:")
    for r in cur.fetchall():
        print(f"  [{r[0]}] {r[1]:25} Normal={r[2]}€  Esc1={r[3]}€  Esc2={r[4]}€")
    cur.close()

    grand_ins = grand_nf = grand_esc = 0

    # BASQUETEBOL
    print("\n\n### BASQUETEBOL ###")
    xl = pd.read_excel(FILES["Basquetebol"], sheet_name=None, header=None)
    for sheet, df in xl.items():
        ins, nf, esc = process_athletes(conn, deduplicate(parse_basquete(df)), "Basquetebol", f"Basquete/{sheet}")
        grand_ins += ins; grand_nf += nf; grand_esc += esc

    # VOLEIBOL
    print("\n\n### VOLEIBOL ###")
    xl = pd.read_excel(FILES["Voleibol"], sheet_name=None, header=None)
    for sheet, df in xl.items():
        parser = parse_volei_masters if sheet == 'MASTERS' else parse_volei_folha1
        ins, nf, esc = process_athletes(conn, deduplicate(parser(df)), "Voleibol", f"Volei/{sheet}")
        grand_ins += ins; grand_nf += nf; grand_esc += esc

    # HÓQUEI
    print("\n\n### HÓQUEI ###")
    xl = pd.read_excel(FILES["Hóquei"], sheet_name=None, header=None)
    for sheet, df in xl.items():
        ins, nf, esc = process_athletes(conn, deduplicate(parse_hoquei_futsal(df)), "Hóquei", f"Hóquei/{sheet}")
        grand_ins += ins; grand_nf += nf; grand_esc += esc

    # FUTSAL
    print("\n\n### FUTSAL ###")
    xl = pd.read_excel(FILES["Futsal"], sheet_name=None, header=None)
    for sheet, df in xl.items():
        ins, nf, esc = process_athletes(conn, deduplicate(parse_hoquei_futsal(df)), "Futsal", f"Futsal/{sheet}")
        grand_ins += ins; grand_nf += nf; grand_esc += esc

    conn.close()
    print("\n" + "=" * 60)
    print(f" TOTAL: {grand_ins} pagamentos inseridos")
    print(f"        {grand_esc} escalões actualizados em AthleteProfiles")
    print(f"        {grand_nf} sócios não encontrados na DB")
    if DRY_RUN:
        print(" (DRY-RUN: Nada foi alterado)")
    print("=" * 60)


if __name__ == "__main__":
    main()