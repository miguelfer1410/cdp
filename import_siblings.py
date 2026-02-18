
import pandas as pd
import requests
import json
import math
from datetime import datetime

def import_siblings():
    try:
        # Load the Excel file
        file_path = 'Base de dados atletas - EmJogo.xlsx'
        df = pd.read_excel(file_path)
        
        # Normalize headers
        df.columns = df.columns.str.strip().str.lower()
        
        # Identify columns
        email_col = next((col for col in df.columns if 'email' in col), None)
        name_col = next((col for col in df.columns if 'nome' in col), None)
        dob_col = next((col for col in df.columns if 'nascimento' in col), None)
        nif_col = next((col for col in df.columns if 'nif' in col), None)
        phone_col = next((col for col in df.columns if 'telemóvel' in col or 'telemovel' in col), None)
        address_col = next((col for col in df.columns if 'morada' in col), None)
        city_col = next((col for col in df.columns if 'localidade' in col), None)
        zip_col = next((col for col in df.columns if 'código postal' in col or 'codigo postal' in col), None)
        cc_col = next((col for col in df.columns if 'cc' in col or 'cartão de cidadão' in col), None)
        
        if not email_col:
            print("Email column not found")
            return

        # Find duplicates
        duplicates = df[df.duplicated(subset=[email_col], keep=False)]
        grouped = duplicates.groupby(email_col)
        
        siblings_to_import = []
        
        for email, group in grouped:
            if len(group) > 1:
                # We skip the first one assuming it's already imported
                # But we need to be careful: which one was imported?
                # The previous import likely took the first occurrence.
                # So we take records from index 1 onwards.
                
                # Sort by original index to ensure we skip the correct one (the first one)
                group = group.sort_index()
                
                # Check if the first one is actually in the DB? 
                # For now, let's assume the first one was imported.
                
                siblings_group = group.iloc[1:]
                
                for _, row in siblings_group.iterrows():
                    name = row[name_col] if name_col else "Unknown"
                    
                    # Generate alias
                    first_name = name.split()[0].lower()
                    # Sanitize first name
                    first_name = ''.join(e for e in first_name if e.isalnum())
                    
                    email_parts = email.split('@')
                    aliased_email = f"{email_parts[0]}+{first_name}@{email_parts[1]}"
                    
                    # Handle Date of Birth
                    dob = row[dob_col]
                    birth_date_str = None
                    if isinstance(dob, datetime):
                        birth_date_str = dob.isoformat()
                    elif isinstance(dob, str):
                        try:
                            # Try common formats
                            birth_date_str = pd.to_datetime(dob, dayfirst=True).isoformat()
                        except:
                            pass
                            
                    # Prepare DTO
                    sibling_dto = {
                        "name": name,
                        "email": aliased_email,
                        "birthDate": birth_date_str,
                        "nif": str(row[nif_col]) if nif_col and pd.notna(row[nif_col]) else None,
                        "phone": str(row[phone_col]) if phone_col and pd.notna(row[phone_col]) else None,
                        "address": str(row[address_col]) if address_col and pd.notna(row[address_col]) else None,
                        "city": str(row[city_col]) if city_col and pd.notna(row[city_col]) else None,
                        "postalCode": str(row[zip_col]) if zip_col and pd.notna(row[zip_col]) else None,
                        "cc": str(row[cc_col]) if cc_col and pd.notna(row[cc_col]) else None
                    }
                    
                    siblings_to_import.append(sibling_dto)

        print(f"Found {len(siblings_to_import)} siblings to import.")
        print(json.dumps(siblings_to_import, indent=2))
        
        if not siblings_to_import:
            return

        # Send to API
        url = "http://localhost:5285/api/users/import-siblings"
        response = requests.post(url, json=siblings_to_import)
        
        if response.status_code == 200:
            print("Import successful!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Import failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import_siblings()
