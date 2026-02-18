
import pandas as pd
import json

def analyze_excel():
    try:
        # Load the Excel file
        file_path = 'Base de dados atletas - EmJogo.xlsx'
        df = pd.read_excel(file_path)
        
        # Normalize headers (strip whitespace, lowercase)
        df.columns = df.columns.str.strip().str.lower()
        
        # Look for email column
        email_col = next((col for col in df.columns if 'email' in col), None)
        name_col = next((col for col in df.columns if 'nome' in col), None)
        
        if not email_col:
            print(json.dumps({"error": "Email column not found", "columns": df.columns.tolist()}))
            return

        # Find duplicates
        # Keep=False marks all duplicates as True
        duplicates = df[df.duplicated(subset=[email_col], keep=False)]
        
        # Group by email to see the clusters
        grouped = duplicates.groupby(email_col)
        
        result = []
        for email, group in grouped:
            if len(group) > 1:
                siblings = []
                for _, row in group.iterrows():
                    siblings.append({
                        "name": row[name_col] if name_col else "Unknown",
                        "email": email,
                        "row_index": _ 
                    })
                result.append({
                    "email": email,
                    "siblings": siblings
                })
                
        print(json.dumps({
            "total_records": len(df),
            "total_duplicates_groups": len(result),
            "duplicate_details": result[:5] # Show first 5 groups for brevity
        }, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    analyze_excel()
