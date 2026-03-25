import pyodbc

conn_str = r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-KU8TIMC\MSSQLSERVERS;DATABASE=cdp;Trusted_Connection=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print("--- System Fees ---")
    cursor.execute("SELECT [Key], [Value] FROM SystemSettings WHERE [Key] IN ('MemberFee', 'MinorMemberFee')")
    for row in cursor.fetchall():
        print(f"{row.Key}: {row.Value}")
        
    print("\n--- Sport Fees ---")
    cursor.execute("SELECT Id, Name, MonthlyFee, QuotaIncluded FROM Sports")
    for row in cursor.fetchall():
        print(f"ID: {row.Id}, Name: {row.Name}, Fee: {row.MonthlyFee}, QuotaIncluded: {row.QuotaIncluded}")

    print("\n--- Athletes & Sports ---")
    cursor.execute("""
        SELECT TOP 10 u.FirstName + ' ' + u.LastName as Name, s.Name as SportName, mp.MembershipNumber
        FROM AthleteProfiles ap
        JOIN Users u ON ap.UserId = u.Id
        JOIN MemberProfiles mp ON mp.UserId = u.Id
        LEFT JOIN AthleteTeams at ON at.AthleteProfileId = ap.Id
        LEFT JOIN Teams t ON at.TeamId = t.Id
        LEFT JOIN Sports s ON t.SportId = s.Id
    """)
    for row in cursor.fetchall():
        print(f"Athlete: {row.Name}, Sport: {row.SportName}, MemberNum: {row.MembershipNumber}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
