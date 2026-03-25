import pyodbc

conn_strings = [
    # Remote server from appsettings.json Example2Connection
    "DRIVER={ODBC Driver 17 for SQL Server};Server=51.178.43.232,14330;Database=cdp;UID=sa;PWD=c8lpFUm1gEhgJb;TrustServerCertificate=yes;",
    # Another try with SQL Server driver
    "DRIVER={SQL Server};Server=51.178.43.232,14330;Database=cdp;UID=sa;PWD=c8lpFUm1gEhgJb;",
]

for i, conn_str in enumerate(conn_strings):
    print(f"Testing Connection {i}...")
    try:
        conn = pyodbc.connect(conn_str, timeout=10)
        print(f"SUCCESS with Connection {i}!")
        cursor = conn.cursor()
        cursor.execute("SELECT TOP 1 Email FROM Users")
        print(f"Verified connection, first user email: {cursor.fetchone()[0]}")
        conn.close()
        print(f"Winning string: {conn_str}")
        break
    except Exception as e:
        print(f"FAILED Connection {i}: {e}")
