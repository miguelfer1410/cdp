"""
Script: populate_card_numbers.py
Objetivo: Popular a coluna CardNumber em MemberProfiles usando o Excel dos sócios.

O Excel dos sócios tem:
  - 'Sócio: Número' → já usado para gerar o MembershipNumber (CDP-XXXXX)
  - 'Nº Cartão'     → novo campo a guardar

Liga os registos por MembershipNumber (CDP-XXXXX do Nº Sócio)
e atualiza o CardNumber com o Nº Cartão correspondente.

Uso:
  pip install pandas xlrd pyodbc
  python populate_card_numbers.py                           # dry-run
  python populate_card_numbers.py --apply                   # aplica na BD
  python populate_card_numbers.py --socios OUTRO.xls --apply
"""

import argparse
import sys
from collections import defaultdict

import pandas as pd

# ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────────

SOCIOS_EXCEL_PATH = "LISTA DE SOCIOS TOTAL.xls"

DB_CONNECTION = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-KU8TIMC\\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
)

BATCH_SIZE = 500

# ─── LEITURA DO EXCEL ─────────────────────────────────────────────────────────

def load_socios(path: str) -> pd.DataFrame:
    print(f"[Excel] A carregar {path} ...")
    df = pd.read_excel(path, engine="xlrd")

    df = df[["Nome", "Sócio: Número", "Nº Cartão"]].copy()
    df.columns = ["nome", "socio_num", "card_num"]

    df["socio_num"] = pd.to_numeric(df["socio_num"], errors="coerce")
    df["card_num"]  = pd.to_numeric(df["card_num"],  errors="coerce")

    # Remover linhas sem número de sócio ou sem cartão
    df = df.dropna(subset=["socio_num", "card_num"])
    df["socio_num"] = df["socio_num"].astype(int)
    df["card_num"]  = df["card_num"].astype(int)

    # O Excel pode ter múltiplas linhas por sócio (uma por quota/período)
    # Mantemos apenas a primeira ocorrência por Nº Sócio
    df = df.drop_duplicates(subset=["socio_num"])

    df["membership_number"] = df["socio_num"].apply(lambda x: f"CDP-{x:05d}")

    print(f"[Excel] {len(df)} sócios únicos com Nº Cartão carregados.")
    return df


# ─── VERIFICAR CARTÕES DUPLICADOS NO EXCEL ────────────────────────────────────

def check_card_duplicates(df: pd.DataFrame):
    """
    Cartões reutilizados — um mesmo Nº Cartão atribuído a sócios diferentes.
    Estes serão marcados como ambíguos e não atualizados automaticamente.
    """
    card_counts = df.groupby("card_num")["socio_num"].count()
    dup_cards   = card_counts[card_counts > 1].index.tolist()

    if not dup_cards:
        return df, []

    ambiguous = df[df["card_num"].isin(dup_cards)].copy()
    clean     = df[~df["card_num"].isin(dup_cards)].copy()

    print(f"[Aviso] {len(dup_cards)} Nº Cartão atribuídos a múltiplos sócios — serão ignorados.")
    return clean, ambiguous.to_dict("records")


# ─── LEITURA DA BD ─────────────────────────────────────────────────────────────

def load_db_profiles(conn) -> pd.DataFrame:
    df = pd.read_sql(
        "SELECT Id, MembershipNumber, CardNumber FROM MemberProfiles", conn
    )
    return df


# ─── CONSTRUIR UPDATES ────────────────────────────────────────────────────────

def build_updates(excel_df: pd.DataFrame, db_df: pd.DataFrame):
    # Índice BD por MembershipNumber
    db_index = db_df.set_index("MembershipNumber")

    to_update          = []  # (member_profile_id, new_card_num)
    skipped_no_profile = []  # Nº Sócio do Excel não existe na BD
    skipped_already_set= []  # CardNumber já está preenchido com valor diferente

    for _, row in excel_df.iterrows():
        mn = row["membership_number"]

        if mn not in db_index.index:
            skipped_no_profile.append({
                "membership_number": mn,
                "nome": row["nome"],
                "card_num": row["card_num"],
            })
            continue

        db_row   = db_index.loc[mn]
        profile_id = int(db_row["Id"])
        existing_card = db_row["CardNumber"]

        new_card = int(row["card_num"])

        # Se já tem um CardNumber diferente, alertar mas não sobrescrever
        if pd.notna(existing_card) and int(existing_card) != new_card:
            skipped_already_set.append({
                "membership_number": mn,
                "nome": row["nome"],
                "profile_id": profile_id,
                "existing_card": int(existing_card),
                "new_card": new_card,
            })
            continue

        # Se já está igual, não precisa de update
        if pd.notna(existing_card) and int(existing_card) == new_card:
            continue

        to_update.append({
            "member_profile_id": profile_id,
            "card_num": new_card,
            "membership_number": mn,
            "nome": row["nome"],
        })

    return to_update, skipped_no_profile, skipped_already_set


# ─── APLICAR NA BD ────────────────────────────────────────────────────────────

def apply_updates(to_update: list):
    try:
        import pyodbc
    except ImportError:
        print("[ERRO] pyodbc não instalado: pip install pyodbc")
        sys.exit(1)

    print(f"[BD] A conectar ...")
    conn   = pyodbc.connect(DB_CONNECTION)
    cursor = conn.cursor()

    ok = errors = 0
    total = len(to_update)

    for i in range(0, total, BATCH_SIZE):
        batch = to_update[i:i + BATCH_SIZE]
        for rec in batch:
            try:
                cursor.execute(
                    "UPDATE MemberProfiles SET CardNumber = ? WHERE Id = ?",
                    rec["card_num"], rec["member_profile_id"]
                )
                ok += 1
            except Exception as e:
                print(f"  [ERRO] Id={rec['member_profile_id']} {rec['nome']}: {e}")
                errors += 1

        conn.commit()
        pct = min(100, int((i + len(batch)) / total * 100))
        print(f"  ... {i + len(batch)}/{total} ({pct}%)")

    conn.close()
    print(f"\n[BD] ✅ {ok} atualizados | ❌ {errors} erros")


# ─── RELATÓRIO ────────────────────────────────────────────────────────────────

def print_report(to_update, skipped_no_profile, skipped_already_set, ambiguous, dry_run):
    print("\n" + "="*60)
    print("RELATÓRIO — POPULAR CardNumber")
    print("="*60)
    print(f"  ✅ A atualizar             : {len(to_update)}")
    print(f"  ⏭️  Já corretos (skip)      : calculado automaticamente")
    print(f"  ⚠️  CardNumber conflituoso  : {len(skipped_already_set)}")
    print(f"  ⚠️  Cartões ambíguos (dup.) : {len(ambiguous)}")
    print(f"  ❌ Sem perfil na BD        : {len(skipped_no_profile)}")

    if skipped_already_set:
        print(f"\n  ─── CardNumber já definido com valor diferente (primeiros 10) ───")
        for s in skipped_already_set[:10]:
            print(f"    [{s['membership_number']}] {s['nome']}")
            print(f"      BD: {s['existing_card']} | Excel: {s['new_card']}")

    if ambiguous:
        print(f"\n  ─── Cartões atribuídos a múltiplos sócios (ambíguos) ───")
        for a in ambiguous[:10]:
            print(f"    Cartão {a['card_num']} → Sócio {a['socio_num']} ({a['nome']})")

    if skipped_no_profile:
        print(f"\n  ─── Sem perfil na BD (primeiros 10) ───")
        for s in skipped_no_profile[:10]:
            print(f"    [{s['membership_number']}] {s['nome']} | Cartão: {s['card_num']}")

    if dry_run:
        print("\n[Info] Modo dry-run — usa --apply para atualizar a BD.")
    print()


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Popula CardNumber em MemberProfiles")
    parser.add_argument("--apply",  action="store_true",
                        help="Aplica os updates na BD (sem esta flag é dry-run)")
    parser.add_argument("--socios", default=SOCIOS_EXCEL_PATH,
                        help=f"Excel dos sócios (default: {SOCIOS_EXCEL_PATH})")
    args = parser.parse_args()

    # 1. Excel
    excel_df = load_socios(args.socios)
    excel_df, ambiguous = check_card_duplicates(excel_df)

    # 2. BD
    try:
        import pyodbc
        conn       = pyodbc.connect(DB_CONNECTION)
        db_df      = load_db_profiles(conn)
        conn.close()
        print(f"[BD] {len(db_df)} perfis carregados.")
    except Exception as e:
        print(f"[ERRO] Falha ao ligar à BD: {e}")
        sys.exit(1)

    # 3. Construir updates
    to_update, skipped_no_profile, skipped_already_set = build_updates(excel_df, db_df)

    # 4. Relatório
    print_report(to_update, skipped_no_profile, skipped_already_set, ambiguous,
                 dry_run=not args.apply)

    # 5. Aplicar
    if args.apply:
        if not to_update:
            print("[Info] Nada a atualizar.")
            return
        confirm = input(f"Atualizar CardNumber em {len(to_update)} perfis? (s/N): ").strip().lower()
        if confirm == "s":
            apply_updates(to_update)
        else:
            print("Cancelado.")


if __name__ == "__main__":
    main()