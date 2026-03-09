"""
Script: import_payments.py
Objetivo: Importar pagamentos históricos (Excel "Pago até") para a BD CDP.

Fluxo:
  1. Carrega o Excel de pagamentos (Nº Cartão + Pago até)
  2. Liga cada pagamento ao MemberProfile via CardNumber (já populado na BD)
  3. Insere os registos na tabela Payments (Status=Completed, PaymentMethod=Histórico)

PRÉ-REQUISITO: Correr primeiro populate_card_numbers.py --apply

Uso:
  pip install pandas openpyxl pyodbc
  python import_payments.py                   # dry-run
  python import_payments.py --apply           # aplica na BD
"""

import argparse
import sys
from datetime import datetime, date
import pandas as pd

PAYMENTS_EXCEL_PATH = "CDP PAGAMENTO QUOTAS À DATA.xls"

DB_CONNECTION = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-KU8TIMC\\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
)

AMOUNT_BY_TYPE = {
    "Quota Sócio Efectivo": 3.00,
    "Quota Sócio Menor":    1.50,
    "Quota Variavel":       0.00,
    "Quota Anual":         36.00,
    "Quota Semestral":     18.00,
    "Quota Trimestral":     9.00,
}

LIFETIME_THRESHOLD = date(2100, 1, 1)
BATCH_SIZE = 500


def load_payments_excel(path):
    print(f"[Excel] A carregar {path} ...")
    df = pd.read_excel(path)
    df.columns = df.columns.str.strip()
    df = df[["Nº Cartão", "Nome", "Taxa - Descrição", "Pago até"]].copy()
    df.columns = ["card_num", "nome", "taxa", "pago_ate"]
    df["card_num"] = pd.to_numeric(df["card_num"], errors="coerce")
    df = df.dropna(subset=["card_num"])
    df["card_num"] = df["card_num"].astype(int)
    df["taxa"] = df["taxa"].astype(str).str.strip()
    df["pago_ate"] = pd.to_datetime(df["pago_ate"], errors="coerce")
    df = df.dropna(subset=["pago_ate"])
    print(f"[Excel] {len(df)} registos carregados.")
    return df


def load_card_to_profile(conn):
    df = pd.read_sql("SELECT Id, CardNumber FROM MemberProfiles WHERE CardNumber IS NOT NULL", conn)
    if df.empty:
        return {}
    df["CardNumber"] = df["CardNumber"].astype(int)
    return dict(zip(df["CardNumber"], df["Id"]))


def load_existing_payments(conn):
    df = pd.read_sql(
        "SELECT MemberProfileId, PeriodYear, PeriodMonth FROM Payments WHERE Status = 'Completed'",
        conn
    )
    existing = set()
    for _, row in df.iterrows():
        existing.add((
            int(row["MemberProfileId"]),
            int(row["PeriodYear"])  if pd.notna(row["PeriodYear"])  else 0,
            int(row["PeriodMonth"]) if pd.notna(row["PeriodMonth"]) else 0,
        ))
    return existing


def build_records(excel_df, card_map, existing):
    to_insert = []
    skipped_no_profile = []
    skipped_duplicate = []

    for _, row in excel_df.iterrows():
        card_num   = int(row["card_num"])
        profile_id = card_map.get(card_num)

        if not profile_id:
            skipped_no_profile.append({"card_num": card_num, "nome": row["nome"]})
            continue

        pago_ate    = row["pago_ate"].date()
        taxa        = row["taxa"]
        is_lifetime = pago_ate >= LIFETIME_THRESHOLD
        period_year  = 2099 if is_lifetime else pago_ate.year
        period_month = 12   if is_lifetime else pago_ate.month

        dedup_key = (profile_id, period_year, period_month)
        if dedup_key in existing:
            skipped_duplicate.append({"card_num": card_num, "nome": row["nome"], "periodo": f"{period_month}/{period_year}"})
            continue

        description = (
            f"{taxa} (Vitalício)" if is_lifetime
            else f"{taxa} — pago até {pago_ate.strftime('%m/%Y')}"
        )

        to_insert.append({
            "member_profile_id": profile_id,
            "amount":            AMOUNT_BY_TYPE.get(taxa, 0.00),
            "payment_date":      datetime(min(period_year, 9999), period_month, 1),
            "payment_method":    "Histórico",
            "status":            "Completed",
            "description":       description,
            "period_month":      period_month,
            "period_year":       period_year,
            "taxa":              taxa,
            "is_lifetime":       is_lifetime,
        })
        existing.add(dedup_key)

    return to_insert, skipped_no_profile, skipped_duplicate


def apply_inserts(to_insert):
    import pyodbc
    print(f"[BD] A conectar ...")
    conn   = pyodbc.connect(DB_CONNECTION)
    cursor = conn.cursor()

    sql = """
        INSERT INTO Payments
            (MemberProfileId, Amount, PaymentDate, PaymentMethod, Status,
             Description, PeriodMonth, PeriodYear, CreatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETUTCDATE())
    """

    ok = errors = 0
    total = len(to_insert)

    for i in range(0, total, BATCH_SIZE):
        batch = to_insert[i:i + BATCH_SIZE]
        for rec in batch:
            try:
                cursor.execute(sql, (
                    rec["member_profile_id"], rec["amount"], rec["payment_date"],
                    rec["payment_method"], rec["status"], rec["description"],
                    rec["period_month"], rec["period_year"],
                ))
                ok += 1
            except Exception as e:
                print(f"  [ERRO] MemberProfileId={rec['member_profile_id']}: {e}")
                errors += 1
        conn.commit()
        pct = min(100, int((i + len(batch)) / total * 100))
        print(f"  ... {i + len(batch)}/{total} ({pct}%)")

    conn.close()
    print(f"\n[BD] ✅ {ok} inseridos | ❌ {errors} erros")


def print_report(to_insert, skipped_no_profile, skipped_duplicate, dry_run):
    lifetime   = sum(1 for r in to_insert if r["is_lifetime"])
    historical = sum(1 for r in to_insert if not r["is_lifetime"] and r["period_year"] < 2024)
    recent     = sum(1 for r in to_insert if not r["is_lifetime"] and r["period_year"] >= 2024)
    by_taxa    = {}
    for r in to_insert:
        by_taxa[r["taxa"]] = by_taxa.get(r["taxa"], 0) + 1

    print("\n" + "="*60)
    print("RELATÓRIO — IMPORTAR PAGAMENTOS")
    print("="*60)
    print(f"  ✅ A inserir              : {len(to_insert)}")
    print(f"     └─ Históricos (<2024)  : {historical}")
    print(f"     └─ Recentes  (≥2024)   : {recent}")
    print(f"     └─ Vitalícios          : {lifetime}")
    print(f"  ⏭️  Duplicados (skip)     : {len(skipped_duplicate)}")
    print(f"  ❌ Sem perfil (CardNumber): {len(skipped_no_profile)}")
    print()
    print("  Por tipo de quota:")
    for taxa, count in sorted(by_taxa.items(), key=lambda x: -x[1]):
        print(f"    {taxa:<30} {count:>5}")
    if skipped_no_profile:
        print(f"\n  ─── CardNumber não encontrado na BD (primeiros 10) ───")
        for s in skipped_no_profile[:10]:
            print(f"    Cartão {s['card_num']} | {s['nome']}")
        if len(skipped_no_profile) > 10:
            print(f"    ... e mais {len(skipped_no_profile) - 10}")
    if dry_run:
        print("\n[Info] Modo dry-run — usa --apply para inserir na BD.")
    print()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply",  action="store_true")
    parser.add_argument("--excel",  default=PAYMENTS_EXCEL_PATH)
    args = parser.parse_args()

    excel_df = load_payments_excel(args.excel)

    try:
        import pyodbc
        conn     = pyodbc.connect(DB_CONNECTION)
        card_map = load_card_to_profile(conn)
        existing = load_existing_payments(conn)
        conn.close()
        print(f"[BD] {len(card_map)} perfis com CardNumber | {len(existing)} pagamentos já existentes")
        if not card_map:
            print("[ERRO] Nenhum CardNumber encontrado na BD.")
            print("       Corre primeiro: python populate_card_numbers.py --apply")
            sys.exit(1)
    except Exception as e:
        print(f"[ERRO] Falha ao ligar à BD: {e}")
        sys.exit(1)

    to_insert, skipped_no_profile, skipped_duplicate = build_records(excel_df, card_map, existing)
    print_report(to_insert, skipped_no_profile, skipped_duplicate, dry_run=not args.apply)

    if args.apply:
        if not to_insert:
            print("[Info] Nada a inserir.")
            return
        confirm = input(f"Inserir {len(to_insert)} pagamentos na BD? (s/N): ").strip().lower()
        if confirm == "s":
            apply_inserts(to_insert)
        else:
            print("Cancelado.")


if __name__ == "__main__":
    main()