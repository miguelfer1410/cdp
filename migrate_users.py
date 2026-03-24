import csv
import requests
import json
from datetime import datetime

# API Configuration
BASE_URL = "http://localhost:5285/api"
CSV_PATH = r"C:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv"

def parse_date(date_str):
    if not date_str or not date_str.strip():
        return None
    try:
        # Expected format: dd/mm/yyyy
        return datetime.strptime(date_str.strip(), "%d/%m/%Y").isoformat()
    except Exception:
        return None

def split_name(full_name):
    parts = full_name.strip().split(' ')
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])

def migrate():
    print(f"Starting migration from {CSV_PATH}...")
    
    with open(CSV_PATH, mode='r', encoding='latin-1') as f:
        reader = csv.reader(f, delimiter=';')
        headers = next(reader)
        
        count = 0
        success_count = 0
        
        for row in reader:
            # Map columns based on identified indices (from map_csv.py)
            email = row[2].strip()
            name = row[4].strip()
            phone = row[5].strip()
            member_since = parse_date(row[1])
            birth_date = parse_date(row[27])
            address = row[31].strip()
            postal_code = row[25].strip()
            nif = row[32].strip()
            
            # Filter criteria: NIF = PT-999999990 and has email
            if nif == "PT-999999990" and email:
                count += 1
                clean_nif = nif.replace("PT-", "")
                first_name, last_name = split_name(name)
                
                print(f"\n[{count}] Migrating: {email} ({name})")
                
                # 1. Create User
                user_data = {
                    "email": email,
                    "firstName": first_name,
                    "lastName": last_name,
                    "phone": phone,
                    "birthDate": birth_date,
                    "nif": clean_nif,
                    "address": address,
                    "postalCode": postal_code,
                    "city": "Póvoa de Varzim",
                    "gender": 0 # Default or mapped from row[3] (Masculino/Feminino)
                }
                
                try:
                    res = requests.post(f"{BASE_URL}/users", json=user_data)
                    if res.status_code == 201:
                        user_id = res.json().get("id")
                        print(f"  - User created successfully (ID: {user_id})")
                        
                        # 2. Create Member Profile
                        member_data = {
                            "membershipStatus": 1, # Active
                            "memberSince": member_since,
                            "membershipNumber": row[6].strip(), # From Sócio: Número
                            "paymentPreference": "Multibanco" # Default
                        }
                        
                        res_member = requests.post(f"{BASE_URL}/users/{user_id}/member-profile", json=member_data)
                        if res_member.status_code == 200:
                            print(f"  - Member profile created successfully")
                            success_count += 1
                        else:
                            print(f"  - Failed to create member profile: {res_member.status_code} {res_member.text}")
                    else:
                        print(f"  - Failed to create user: {res.status_code} {res.text}")
                except Exception as e:
                    print(f"  - Error: {str(e)}")

    print(f"\nMigration finished. Total matches: {count}, Successfully migrated: {success_count}")

if __name__ == "__main__":
    migrate()
