"""
Script: update_membership_numbers.py
Objetivo: Fazer match entre os sócios do Excel (lista oficial CDP) e os utilizadores
          na base de dados, e gerar SQL de atualização dos MembershipNumber.

Estratégia de matching:
  1. Normaliza os emails: remove o alias (+parte) do email da BD para obter o email base
  2. Faz match por (email_base + nome) — matching principal
  3. Faz match só por nome (fuzzy) como fallback — requer confirmação manual

Uso:
  1. Instalar dependências: pip install pandas xlrd thefuzz pyodbc
  2. Correr: python update_membership_numbers.py
  3. Verificar o ficheiro `membership_updates.sql` gerado antes de executar na BD
  4. (Opcional) Usar a flag --apply para aplicar diretamente na BD
"""

import re
import sys
import argparse
import unicodedata
import pandas as pd
from thefuzz import fuzz

# ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────────

EXCEL_PATH = "LISTA DE SOCIOS TOTAL.xls"

# Connection string para SQL Server (Windows Auth)
# Ajusta o SERVER se necessário
DB_CONNECTION = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "Server=localhost,14330;"
    "Database=cdp;"
    "UID=sa;"
    "PWD=c8lpFUm1gEhgJb;"
    "TrustServerCertificate=yes;"
)

# Limiares de similaridade de nomes (0-100)
NAME_MATCH_HIGH   = 85   # Match seguro (email + nome)
NAME_MATCH_FUZZY  = 75   # Match só por nome (vai para revisão manual)

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


def format_membership_number(socio_num) -> str:
    """Converte número do Excel para formato decimal."""
    try:
        num = int(float(str(socio_num)))
        return str(num)
    except (ValueError, TypeError):
        return str(socio_num)


def name_similarity(name_a: str, name_b: str) -> int:
    """Similaridade entre dois nomes normalizados (0-100)."""
    a = normalize_text(name_a)
    b = normalize_text(name_b)
    if not a or not b:
        return 0
    return fuzz.token_sort_ratio(a, b)


# ─── LEITURA DO EXCEL ──────────────────────────────────────────────────────────

def load_excel(path: str) -> pd.DataFrame:
    print(f"[Excel] A ler {path} ...")
    df = pd.read_excel(path, engine="xlrd")

    # Colunas relevantes
    df = df[["Nome", "Endereço de e-mail", "Sócio: Número"]].copy()
    df.columns = ["nome", "email", "numero_socio"]

    # Limpeza
    df["nome"]  = df["nome"].astype(str).str.strip()
    df["email"] = df["email"].astype(str).str.strip().str.lower()
    df["email"] = df["email"].replace({"nan": "", "naotem@naotem.com": ""})
    df["numero_socio"] = pd.to_numeric(df["numero_socio"], errors="coerce")
    df = df.dropna(subset=["numero_socio"])
    df["numero_socio"] = df["numero_socio"].astype(int)

    # Remove duplicados (mesmo número de sócio — Excel pode ter múltiplas linhas por sócio/quota)
    df = df.drop_duplicates(subset=["numero_socio"])

    # Índices auxiliares
    df["nome_norm"]  = df["nome"].apply(normalize_text)
    df["email_norm"] = df["email"]

    print(f"[Excel] {len(df)} registos únicos carregados.")
    return df


# ─── LEITURA DA BASE DE DADOS ──────────────────────────────────────────────────

def load_database() -> pd.DataFrame:
    try:
        import pyodbc
    except ImportError:
        print("[ERRO] pyodbc não instalado. Corre: pip install pyodbc")
        sys.exit(1)

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
            mp.Id         AS member_profile_id,
            mp.MembershipNumber AS current_number
        FROM Users u
        INNER JOIN MemberProfiles mp ON mp.UserId = u.Id
        ORDER BY u.Id
    """
    df = pd.read_sql(query, conn)
    conn.close()

    df["full_name"]   = (df["first_name"] + " " + df["last_name"]).str.strip()
    df["nome_norm"]   = df["full_name"].apply(normalize_text)
    df["base_email"]  = df["email"].apply(extract_base_email)

    print(f"[BD] {len(df)} membros carregados.")
    return df


# ─── ENGINE DE MATCHING ────────────────────────────────────────────────────────

def match_records(db_df: pd.DataFrame, excel_df: pd.DataFrame):
    """
    Para cada registo da BD, tenta encontrar o número de sócio correto no Excel.
    Retorna três listas: matched, ambiguous, unmatched
    """
    matched    = []  # [(member_profile_id, user_id, full_name, email, old_num, new_num, score)]
    ambiguous  = []  # Casos com múltiplos candidatos ou score baixo
    unmatched  = []  # Sem match

    # Criar índice por email para lookup rápido
    excel_by_email = {}
    for _, row in excel_df.iterrows():
        if row["email_norm"]:
            excel_by_email.setdefault(row["email_norm"], []).append(row)

    for _, db_row in db_df.iterrows():
        base_email   = db_row["base_email"]
        nome_norm_db = db_row["nome_norm"]
        
        # --- Estratégia 1: Match por email base ---
        candidates = excel_by_email.get(base_email, [])

        if candidates:
            # Score de nome para cada candidato com o mesmo email
            scored = [
                (row, name_similarity(nome_norm_db, row["nome_norm"]))
                for row in candidates
            ]
            scored.sort(key=lambda x: -x[1])
            best_row, best_score = scored[0]

            if best_score >= NAME_MATCH_HIGH:
                matched.append({
                    "member_profile_id": db_row["member_profile_id"],
                    "user_id":           db_row["user_id"],
                    "full_name":         db_row["full_name"],
                    "email":             db_row["email"],
                    "base_email":        base_email,
                    "old_number":        db_row["current_number"],
                    "new_number":        format_membership_number(best_row["numero_socio"]),
                    "excel_name":        best_row["nome"],
                    "score":             best_score,
                    "match_type":        "email+nome",
                })
                continue

            # Email bate mas nome não é confiante — vai para ambíguos
            ambiguous.append({
                "member_profile_id": db_row["member_profile_id"],
                "user_id":           db_row["user_id"],
                "full_name":         db_row["full_name"],
                "email":             db_row["email"],
                "base_email":        base_email,
                "old_number":        db_row["current_number"],
                "candidate_number":  format_membership_number(best_row["numero_socio"]),
                "excel_name":        best_row["nome"],
                "score":             best_score,
                "reason":            f"Email ok, nome score baixo ({best_score})",
            })
            continue

        # --- Estratégia 2: Match só por nome (fuzzy) ---
        best_score = 0
        best_excel_row = None
        for _, excel_row in excel_df.iterrows():
            score = name_similarity(nome_norm_db, excel_row["nome_norm"])
            if score > best_score:
                best_score = score
                best_excel_row = excel_row

        if best_score >= NAME_MATCH_FUZZY and best_excel_row is not None:
            ambiguous.append({
                "member_profile_id": db_row["member_profile_id"],
                "user_id":           db_row["user_id"],
                "full_name":         db_row["full_name"],
                "email":             db_row["email"],
                "base_email":        base_email,
                "old_number":        db_row["current_number"],
                "candidate_number":  format_membership_number(best_excel_row["numero_socio"]),
                "excel_name":        best_excel_row["nome"],
                "score":             best_score,
                "reason":            "Sem email, match só por nome",
            })
        else:
            unmatched.append({
                "member_profile_id": db_row["member_profile_id"],
                "user_id":           db_row["user_id"],
                "full_name":         db_row["full_name"],
                "email":             db_row["email"],
                "old_number":        db_row["current_number"],
                "best_score":        best_score,
            })

    return matched, ambiguous, unmatched


# ─── GERAÇÃO DE SQL ────────────────────────────────────────────────────────────

def detect_collisions(matched: list, ambiguous: list):
    """
    Move para ambíguos quaisquer casos onde dois registos da BD
    estão a ser mapeados para o mesmo número do Excel.
    """
    from collections import defaultdict
    by_new_number = defaultdict(list)
    for m in matched:
        by_new_number[m["new_number"]].append(m)

    clean_matched = []
    for new_num, group in by_new_number.items():
        if len(group) == 1:
            clean_matched.append(group[0])
        else:
            # Colisão — move todos para ambíguos
            for m in group:
                ambiguous.append({
                    "member_profile_id": m["member_profile_id"],
                    "user_id":           m["user_id"],
                    "full_name":         m["full_name"],
                    "email":             m["email"],
                    "base_email":        m["base_email"],
                    "old_number":        m["old_number"],
                    "candidate_number":  m["new_number"],
                    "excel_name":        m["excel_name"],
                    "score":             m["score"],
                    "reason":            f"COLISÃO: {len(group)} registos BD mapeados para {new_num}",
                })
    return clean_matched, ambiguous


def generate_sql(matched: list, ambiguous: list) -> str:
    lines = []
    lines.append("-- =============================================================")
    lines.append("-- Atualização de MembershipNumber — gerado automaticamente")
    lines.append("-- VERIFICA este ficheiro antes de executar!")
    lines.append("-- =============================================================")
    lines.append("")
    lines.append("BEGIN TRANSACTION;")
    lines.append("")

    if matched:
        lines.append(f"-- {len(matched)} atualizações com match confirmado (email + nome)")
        lines.append("-- ─────────────────────────────────────────────────────────────")
        for m in matched:
            lines.append(
                f"-- {m['full_name']} | DB: {m['email']} | Score: {m['score']} | Excel: {m['excel_name']}"
            )
            lines.append(
                f"UPDATE MemberProfiles SET MembershipNumber = '{m['new_number']}' "
                f"WHERE Id = {m['member_profile_id']};  -- era: {m['old_number']}"
            )
        lines.append("")

    if ambiguous:
        lines.append(f"-- {len(ambiguous)} casos AMBÍGUOS — COMENTADOS, requerem revisão manual")
        lines.append("-- ─────────────────────────────────────────────────────────────")
        for a in ambiguous:
            lines.append(f"-- ATENÇÃO: {a['reason']}")
            lines.append(f"-- BD: '{a['full_name']}' ({a['email']})")
            lines.append(f"-- Excel: '{a['excel_name']}' | Score: {a['score']} | Nº proposto: {a['candidate_number']}")
            lines.append(
                f"-- UPDATE MemberProfiles SET MembershipNumber = '{a['candidate_number']}' "
                f"WHERE Id = {a['member_profile_id']};  -- era: {a['old_number']}"
            )
            lines.append("")

    lines.append("-- Se tudo parecer correto:")
    lines.append("COMMIT TRANSACTION;")
    lines.append("")
    lines.append("-- Se algo estiver errado:")
    lines.append("-- ROLLBACK TRANSACTION;")

    return "\n".join(lines)


# ─── APLICAÇÃO DIRETA NA BD ───────────────────────────────────────────────────

def apply_updates(matched: list):
    import pyodbc
    print(f"[BD] A aplicar {len(matched)} atualizações ...")
    conn = pyodbc.connect(DB_CONNECTION)
    cursor = conn.cursor()

    # Usar tabela temporária para verificar duplicados — evita limite de 2100 parâmetros
    # do SQL Server ao usar grandes listas com IN (?, ?, ...)
    cursor.execute("""
        CREATE TABLE #NewNumbers (
            MembershipNumber NVARCHAR(20),
            MemberProfileId  INT
        )
    """)
    # Inserir em lotes de 500 para segurança
    BATCH = 500
    rows = [(m["new_number"], m["member_profile_id"]) for m in matched]
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i+BATCH]
        cursor.executemany("INSERT INTO #NewNumbers VALUES (?, ?)", batch)

    # Números que já existem noutros registos (não nos que vamos atualizar)
    cursor.execute("""
        SELECT mp.MembershipNumber
        FROM MemberProfiles mp
        INNER JOIN #NewNumbers nn ON mp.MembershipNumber = nn.MembershipNumber
        WHERE mp.Id <> nn.MemberProfileId
    """)
    already_taken = {row[0] for row in cursor.fetchall()}

    cursor.execute("DROP TABLE #NewNumbers")

    if already_taken:
        print(f"  [AVISO] {len(already_taken)} números já ocupados noutros registos (serão ignorados):")
        for n in sorted(already_taken):
            print(f"    - {n}")

    ok = skipped = 0
    for m in matched:
        if m["new_number"] in already_taken:
            print(f"  [SKIP] {m['full_name']} -> {m['new_number']} (já existe noutro registo)")
            skipped += 1
            continue
        try:
            cursor.execute(
                "UPDATE MemberProfiles SET MembershipNumber = ? WHERE Id = ?",
                m["new_number"], m["member_profile_id"]
            )
            ok += 1
        except Exception as e:
            print(f"  [ERRO] Id={m['member_profile_id']} {m['full_name']}: {e}")
            skipped += 1

    conn.commit()
    conn.close()
    print(f"[BD] {ok}/{len(matched)} atualizados | {skipped} ignorados.")



# ─── RELATÓRIO ────────────────────────────────────────────────────────────────

def print_report(matched, ambiguous, unmatched):
    print("\n" + "="*60)
    print("RELATÓRIO DE MATCHING")
    print("="*60)
    print(f"  ✅ Match confirmado : {len(matched)}")
    print(f"  ⚠️  Ambíguos         : {len(ambiguous)}")
    print(f"  ❌ Sem match         : {len(unmatched)}")
    print()

    if ambiguous:
        print("─── AMBÍGUOS (requerem revisão manual) ───")
        for a in ambiguous:
            print(f"  • [{a['member_profile_id']}] '{a['full_name']}' ({a['email']})")
            print(f"    → Excel: '{a['excel_name']}' | Nº: {a['candidate_number']} | Score: {a['score']}")
            print(f"    Motivo: {a['reason']}")
        print()

    if unmatched:
        print("─── SEM MATCH ───")
        for u in unmatched:
            print(f"  • [{u['member_profile_id']}] '{u['full_name']}' ({u['email']}) | Melhor score: {u['best_score']}")
        print()


# ─── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Atualiza MembershipNumbers na BD CDP")
    parser.add_argument(
        "--apply", action="store_true",
        help="Aplica as atualizações confirmadas diretamente na BD (sem --apply, só gera SQL)"
    )
    parser.add_argument(
        "--excel", default=EXCEL_PATH,
        help=f"Caminho para o ficheiro Excel (default: {EXCEL_PATH})"
    )
    args = parser.parse_args()

    # 1. Carregar dados
    excel_df = load_excel(args.excel)
    db_df    = load_database()

    # 2. Fazer matching
    print("\n[Match] A fazer matching ...")
    matched, ambiguous, unmatched = match_records(db_df, excel_df)

    # 3. Detetar colisões (dois registos BD → mesmo número Excel)
    before = len(matched)
    matched, ambiguous = detect_collisions(matched, ambiguous)
    collisions = before - len(matched)
    if collisions:
        print(f"[Match] ⚠️  {collisions} colisões detetadas e movidas para revisão manual.")

    # 4. Relatório
    print_report(matched, ambiguous, unmatched)

    # 4. Gerar SQL
    sql = generate_sql(matched, ambiguous)
    sql_path = "membership_updates.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"[SQL] Ficheiro gerado: {sql_path}")

    # 5. Aplicar na BD (opcional)
    if args.apply:
        if not matched:
            print("[Info] Nenhum match confirmado para aplicar.")
        else:
            confirm = input(f"\nAplicar {len(matched)} atualizações na BD? (s/N): ").strip().lower()
            if confirm == "s":
                apply_updates(matched)
            else:
                print("Cancelado.")
    else:
        print("\n[Info] Usa --apply para aplicar diretamente na BD.")
        print("[Info] Ou corre o ficheiro SQL gerado manualmente no SQL Server Management Studio.")


if __name__ == "__main__":
    main()