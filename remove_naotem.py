"""
SCRIPT 3 - REMOVER UTILIZADORES NAOTEM DA BASE DE DADOS
=========================================================
Remove todos os utilizadores cujo email contém "NAOTEM"
(ex: NAOTEM@NAOTEM.COM, NAOTEM+sara@NAOTEM.COM, etc.)

Tabelas afetadas (por CASCADE):
  - Users              → registo eliminado
  - MemberProfiles     → eliminado em CASCADE
  - UserRoles          → eliminado em CASCADE
  - AthleteProfiles    → eliminado em CASCADE
  - CoachProfiles      → eliminado em CASCADE

Faz um DRY RUN por defeito — muda DRY_RUN = False para executar.
"""

import pyodbc
from datetime import datetime

# ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
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

DRY_RUN = False   # ⚠️ Muda para False para executar a eliminação real
# ─────────────────────────────────────────────────────────────────────────────


def main():
    print("=" * 70)
    print("REMOÇÃO DE UTILIZADORES NAOTEM — CDP")
    print(f"Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Modo: {'🔸 DRY RUN (sem alterações)' if DRY_RUN else '🔴 PRODUÇÃO — A ELIMINAR!'}")
    print("=" * 70)

    conn = pyodbc.connect(CONNECTION_STRING, timeout=10)
    conn.autocommit = False
    cursor = conn.cursor()

    # ── Listar todos os utilizadores a remover ──
    cursor.execute("""
        SELECT u.Id, u.Email, u.FirstName, u.LastName,
               CASE WHEN mp.Id IS NOT NULL THEN 1 ELSE 0 END AS HasMemberProfile
        FROM Users u
        LEFT JOIN MemberProfiles mp ON mp.UserId = u.Id
        WHERE u.Email LIKE '%NAOTEM%'
        ORDER BY u.Id
    """)
    rows = cursor.fetchall()

    if not rows:
        print("\n  ✅ Nenhum utilizador NAOTEM encontrado na base de dados.\n")
        conn.close()
        return

    print(f"\n  Encontrados {len(rows)} utilizadores a remover:\n")
    print(f"  {'Id':<8} {'Email':<40} {'Nome':<35} {'Tem Perfil Sócio'}")
    print(f"  {'─' * 95}")
    for row in rows:
        tem_perfil = "✅ Sim" if row[4] else "❌ Não"
        print(f"  {str(row[0]):<8} {str(row[1]):<40} {f'{row[2]} {row[3]}':<35} {tem_perfil}")

    if DRY_RUN:
        print(f"\n  🔸 DRY RUN — nenhum registo foi eliminado.")
        print(f"     Para eliminar, muda DRY_RUN = False no topo do script.\n")
        conn.close()
        return

    # ── Confirmar antes de eliminar ──
    print(f"\n  ⚠️  Prestes a eliminar {len(rows)} utilizadores PERMANENTEMENTE.")
    confirm = input("  Confirmas? (escreve 'SIM' para continuar): ").strip()
    if confirm != "SIM":
        print("  ❌ Operação cancelada.\n")
        conn.close()
        return

    # ── Eliminar ──
    ids = [str(row[0]) for row in rows]
    placeholders = ",".join(["?" for _ in ids])

    cursor.execute(f"DELETE FROM Users WHERE Id IN ({placeholders})", ids)
    deleted = cursor.rowcount
    conn.commit()
    conn.close()

    print(f"\n  ✅ {deleted} utilizadores eliminados com sucesso.")
    print(f"  (MemberProfiles, UserRoles e outros perfis foram removidos em CASCADE)\n")


if __name__ == "__main__":
    main()