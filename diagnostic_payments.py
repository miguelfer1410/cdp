
import pyodbc

CONN_STR = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-KU8TIMC\\MSSQLSERVERS;"
    "DATABASE=cdp;"
    "Trusted_Connection=yes;"
)

def diagnostic():
    try:
        conn = pyodbc.connect(CONN_STR)
        cursor = conn.cursor()
        
        print("--- Diagnostic: Payment Table & Preferences ---")
        cursor.execute("""
            SELECT TOP 10 mp.MembershipNumber, u.FirstName, p.Status, p.PeriodMonth, p.PeriodYear, p.Amount, mp.PaymentPreference 
            FROM Payments p 
            JOIN MemberProfiles mp ON p.MemberProfileId = mp.Id 
            JOIN Users u ON mp.UserId = u.Id 
            WHERE p.PeriodMonth = 3 AND p.PeriodYear = 2026
        """)
        rows = cursor.fetchall()
        for row in rows:
            status = row[2]
            pref = row[6] or "Monthly"
            print(f"Member: {row[0]} | Name: {row[1]} | Pref: {pref} | Status: '{status}' | Period: {row[3]}/{row[4]} | Amount: {row[5]}")
            
        print("\n--- Diagnostic: Backend Status Derivation Simulation ---")
        target_month = 3
        target_year = 2026
        
        for row in rows[:5]:
            mn = row[0]
            name = row[1]
            pref = row[6] or "Monthly"
            is_annual = (pref == "Annual")
            
            cursor.execute("SELECT Id FROM MemberProfiles WHERE MembershipNumber = ?", mn)
            mp_id = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT Status, PeriodMonth, CreatedAt 
                FROM Payments 
                WHERE MemberProfileId = ? AND PeriodYear = ? AND (PeriodMonth = ? OR PeriodMonth IS NULL)
            """, mp_id, target_year, target_month)
            
            payments = cursor.fetchall()
            payments.sort(key=lambda x: x[2], reverse=True)
            
            if is_annual:
                payment = next((p for p in payments if p[1] is None), None)
            else:
                payment = next((p for p in payments if p[1] == target_month), None)
            
            status_val = payment[0] if payment else None
            derived = "Regularizada" if status_val == "Completed" else "Pendente" if status_val == "Pending" else "Unpaid"
            
            print(f"User: {name} ({mn}) | Pref: {pref} | FoundPayments: {len(payments)} | Match: {'YES' if payment else 'NO'} | Derived: {derived}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    diagnostic()
