"""
DECODER DE HASH BCRYPT — CDP
=============================
Permite verificar se uma password corresponde a um hash BCrypt,
e também gerar hashes a partir de passwords.

Uso:
  python hash_decoder.py                  → modo interativo
  python hash_decoder.py verify           → verificar password vs hash
  python hash_decoder.py generate         → gerar hash de uma password
"""

import bcrypt
import sys
import pyodbc

# ─── CONFIGURAÇÃO BD (opcional — para buscar hash pelo email) ────────────────
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
# ─────────────────────────────────────────────────────────────────────────────


def verify(password: str, hash_str: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hash_str.encode())
    except Exception as e:
        print(f"  ❌ Erro ao verificar: {e}")
        return False


def generate(password: str, rounds: int = 12) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=rounds)).decode()


def get_hash_from_db(email: str):
    try:
        conn = pyodbc.connect(CONNECTION_STRING, timeout=5)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT Id, Email, FirstName, LastName, PasswordHash FROM Users WHERE Email = ?",
            email.strip()
        )
        row = cursor.fetchone()
        conn.close()
        return row
    except Exception as e:
        print(f"  ⚠️  Não foi possível ligar à BD: {e}")
        return None


def separator():
    print("─" * 60)


def menu_verify():
    print("\n── VERIFICAR PASSWORD ─────────────────────────────────────")

    email_or_hash = input(
        "\n  Hash BCrypt  (ou email do utilizador para buscar da BD): "
    ).strip()

    hash_str = None

    # Se parecer um email, ir buscar à BD
    if "@" in email_or_hash and not email_or_hash.startswith("$2"):
        print(f"\n  🔌 A buscar hash da BD para: {email_or_hash}")
        row = get_hash_from_db(email_or_hash)
        if not row:
            print("  ❌ Utilizador não encontrado na BD.\n")
            return
        hash_str = row[4]
        print(f"  ✅ Utilizador: {row[2]} {row[3]} (Id={row[0]})")
        print(f"  🔒 Hash: {hash_str[:40]}...")
    else:
        hash_str = email_or_hash

    if not hash_str.startswith("$2"):
        print("  ❌ Não parece ser um hash BCrypt válido (deve começar com $2a$ ou $2b$).")
        return

    password = input("\n  Password a verificar: ").strip()

    print("\n  A verificar...")
    separator()
    if verify(password, hash_str):
        print(f"  ✅  MATCH — A password '{password}' corresponde ao hash!")
    else:
        print(f"  ❌  SEM MATCH — A password '{password}' NÃO corresponde ao hash.")
    separator()


def menu_generate():
    print("\n── GERAR HASH ─────────────────────────────────────────────")
    password = input("\n  Password: ").strip()
    if not password:
        print("  ❌ Password vazia.")
        return

    rounds_input = input("  Work factor (Enter para usar 12): ").strip()
    rounds = int(rounds_input) if rounds_input.isdigit() else 12

    print(f"\n  A gerar hash (workFactor={rounds})...")
    separator()
    h = generate(password, rounds)
    print(f"  Password : {password}")
    print(f"  Hash     : {h}")
    separator()

    # Verificar imediatamente para confirmar
    ok = verify(password, h)
    print(f"  Verificação: {'✅ OK' if ok else '❌ FALHOU'}\n")


def menu_db_lookup():
    print("\n── BUSCAR UTILIZADOR NA BD ────────────────────────────────")
    email = input("\n  Email do utilizador: ").strip()
    row = get_hash_from_db(email)
    if not row:
        print("  ❌ Utilizador não encontrado.\n")
        return
    separator()
    print(f"  Id        : {row[0]}")
    print(f"  Email     : {row[1]}")
    print(f"  Nome      : {row[2]} {row[3]}")
    print(f"  Hash      : {row[4]}")
    separator()

    testar = input("\n  Queres testar uma password contra este hash? (s/n): ").strip().lower()
    if testar == "s":
        password = input("  Password: ").strip()
        print()
        separator()
        if verify(password, row[4]):
            print(f"  ✅  MATCH — Password correta!")
        else:
            print(f"  ❌  SEM MATCH — Password incorreta.")
        separator()
    print()


def main():
    print("=" * 60)
    print("  DECODER / CHECKER DE HASH BCRYPT — CDP")
    print("=" * 60)

    mode = sys.argv[1] if len(sys.argv) > 1 else None

    if mode == "verify":
        menu_verify()
        return
    if mode == "generate":
        menu_generate()
        return

    # Menu interativo
    while True:
        print("\n  O que queres fazer?")
        print("  [1] Verificar se uma password corresponde a um hash")
        print("  [2] Gerar hash a partir de uma password")
        print("  [3] Buscar utilizador na BD e testar password")
        print("  [0] Sair")
        choice = input("\n  Opção: ").strip()

        if choice == "1":
            menu_verify()
        elif choice == "2":
            menu_generate()
        elif choice == "3":
            menu_db_lookup()
        elif choice == "0":
            print("\n  Até logo!\n")
            break
        else:
            print("  Opção inválida.")


if __name__ == "__main__":
    main()