import pyodbc

conn_str = r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-KU8TIMC\MSSQLSERVERS;DATABASE=cdp;Trusted_Connection=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print(f"{'Sport':<20} | {'MonthlyFee':<10} | {'FeeNormal':<10} | {'QuotaInc':<10}")
    print("-" * 60)
    
    cursor.execute("SELECT Name, MonthlyFee, FeeNormalNormal, QuotaIncluded FROM Sports")
    for row in cursor.fetchall():
        print(f"{row.Name:<20} | {row.MonthlyFee:<10} | {row.FeeNormalNormal:<10} | {row.QuotaIncluded:<10}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
