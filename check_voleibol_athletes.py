import pyodbc

conn_str = r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=DESKTOP-KU8TIMC\MSSQLSERVERS;DATABASE=cdp;Trusted_Connection=yes;"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    query = """
        SELECT TOP 10
            u.FirstName + ' ' + u.LastName as Name, 
            ap.Escalao,
            p.Amount,
            p.Description
        FROM AthleteProfiles ap
        JOIN Users u ON ap.UserId = u.Id
        LEFT JOIN AthleteTeams at ON at.AthleteProfileId = ap.Id
        LEFT JOIN Teams t ON at.TeamId = t.Id
        LEFT JOIN Sports s ON t.SportId = s.Id
        JOIN MemberProfiles mp ON mp.UserId = u.Id
        JOIN Payments p ON p.MemberProfileId = mp.Id
        WHERE s.Name = 'Voleibol' AND p.PaymentMethod = 'Imported'
        ORDER BY p.CreatedAt DESC
    """
    cursor.execute(query)
    for row in cursor.fetchall():
        print(f"Name: {row.Name}, Escalao: {row.Escalao}, Amount: {row.Amount}, Desc: {row.Description}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
