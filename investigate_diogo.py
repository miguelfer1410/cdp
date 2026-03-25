import pyodbc

conn_str = r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-KU8TIMC\MSSQLSERVERS;DATABASE=cdp;Trusted_Connection=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    query = """
        SELECT 
            u.FirstName, u.LastName, s.Name as SportName, 
            s.MonthlyFee, s.FeeNormalNormal, s.QuotaIncluded
        FROM AthleteProfiles ap
        JOIN Users u ON ap.UserId = u.Id
        LEFT JOIN AthleteTeams at ON at.AthleteProfileId = ap.Id
        LEFT JOIN Teams t ON at.TeamId = t.Id
        LEFT JOIN Sports s ON t.SportId = s.Id
        WHERE u.FirstName LIKE 'Diogo%' AND u.LastName LIKE '%Nogueira%'
    """
    cursor.execute(query)
    row = cursor.fetchone()
    if row:
        print(f"Athlete: {row.FirstName} {row.LastName}")
        print(f"Sport: {row.SportName}")
        print(f"Sport.MonthlyFee (Legacy): {row.MonthlyFee}")
        print(f"Sport.FeeNormalNormal: {row.FeeNormalNormal}")
        print(f"Sport.QuotaIncluded: {row.QuotaIncluded}")
    else:
        print("Athlete not found.")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
