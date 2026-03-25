import pyodbc

conn_str = r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-KU8TIMC\MSSQLSERVERS;DATABASE=cdp;Trusted_Connection=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print("--- Sample Athlete Payments ---")
    cursor.execute("""
        SELECT TOP 10 u.FirstName + ' ' + u.LastName as Name, p.Amount, p.Description, p.PeriodMonth, p.PeriodYear
        FROM Payments p
        JOIN MemberProfiles mp ON p.MemberProfileId = mp.Id
        JOIN Users u ON mp.UserId = u.Id
        JOIN AthleteProfiles ap ON ap.UserId = u.Id
        WHERE p.Status = 'Completed'
    """)
    
    for row in cursor.fetchall():
        print(f"Athlete: {row.Name}, Amount: {row.Amount}, Desc: {row.Description}, Period: {row.PeriodMonth}/{row.PeriodYear}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
