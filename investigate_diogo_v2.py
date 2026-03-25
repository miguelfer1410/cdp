import pyodbc

conn_str = r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-KU8TIMC\MSSQLSERVERS;DATABASE=cdp;Trusted_Connection=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    query = """
        SELECT 
            u.FirstName, u.LastName, ap.Escalao, s.Name as SportName, 
            s.MonthlyFee, s.FeeNormalNormal, s.FeeEscalao1Normal, s.FeeEscalao2Normal, s.QuotaIncluded
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
        print(f"Escalao (text): {row.Escalao}")
        print(f"Sport: {row.SportName}")
        print(f"Fees:")
        print(f" - MonthlyFee (Legacy): {row.MonthlyFee}")
        print(f" - FeeNormalNormal: {row.FeeNormalNormal}")
        print(f" - FeeEscalao1Normal: {row.FeeEscalao1Normal}")
        print(f" - FeeEscalao2Normal: {row.FeeEscalao2Normal}")
        print(f"QuotaIncluded: {row.QuotaIncluded}")
    else:
        print("Athlete not found.")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
