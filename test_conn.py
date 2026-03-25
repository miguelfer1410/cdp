import pyodbc

conn_strings = [
    # From socio_update.py
    "DRIVER={ODBC Driver 17 for SQL Server};Server=localhost,14330;Database=cdp;UID=sa;PWD=c8lpFUm1gEhgJb;TrustServerCertificate=yes;",
    # From appsettings.json DefaultConnection
    "DRIVER={SQL Server};Server=DESKTOP-KU8TIMC\\MSSQLSERVERS;Database=cdp;Trusted_Connection=True;Encrypt=False",
    # Try ODBC Driver 17 with appsettings server
    "DRIVER={ODBC Driver 17 for SQL Server};Server=DESKTOP-KU8TIMC\\MSSQLSERVERS;Database=cdp;Trusted_Connection=True;Encrypt=False",
    # Localhost default port
    "DRIVER={SQL Server};Server=localhost;Database=cdp;Trusted_Connection=True;Encrypt=False"
]

for i, conn_str in enumerate(conn_strings):
    print(f"Testing Connection {i}...")
    try:
        conn = pyodbc.connect(conn_str, timeout=5)
        print(f"SUCCESS with Connection {i}!")
        conn.close()
        print(f"Winning string: {conn_str}")
        break
    except Exception as e:
        print(f"FAILED Connection {i}: {e}")
