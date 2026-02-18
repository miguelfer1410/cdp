import requests
import json
import re

API_URL = "http://localhost:5285/api"
IRMAOS_FILE = "irmaos.txt"

def parse_irmaos_file():
    siblings_groups = []
    current_email = None
    current_athletes = []

    with open(IRMAOS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            
            if line.startswith("Email:"):
                # specific email from file
                if current_email:
                    siblings_groups.append({"email": current_email, "athletes": current_athletes})
                current_email = line.split("Email:")[1].strip()
                current_athletes = []
            elif line.startswith("-"):
                # - Name (Sheet: Sport)
                # match: - (Name) (Sheet: (Sport))
                match = re.match(r"- (.*) \(Sheet: (.*)\)", line)
                if match:
                    name = match.group(1).strip()
                    sheet = match.group(2).strip()
                    current_athletes.append({"name": name, "sheet": sheet})
    
    if current_email:
        siblings_groups.append({"email": current_email, "athletes": current_athletes})
    
    return siblings_groups

def get_user_by_email(email):
    # Using search functionality
    try:
        response = requests.get(f"{API_URL}/users", params={"search": email})
        if response.status_code == 200:
            users = response.json()
            # Find exact match
            for user in users:
                if user['email'].lower() == email.lower():
                    return user
            return None
    except Exception as e:
        print(f"Error fetching user {email}: {e}")
        return None

def create_user_and_profile(athlete, original_email, count):
    # Construct alias email
    # alias: original_local + firstname + count @ domain
    parts = original_email.split('@')
    if len(parts) != 2:
        print(f"Invalid email: {original_email}")
        return
        
    local_part = parts[0]
    domain = parts[1]
    
    # Simple alias strategy: local + count
    # e.g. parent+2@gmail.com
    # or parent+firstname@gmail.com to be more readable
    first_name = athlete['name'].split(' ')[0].lower()
    # sanitise first name
    first_name = re.sub(r'[^a-z0-9]', '', first_name)
    
    alias_email = f"{local_part}+{first_name}{count}@{domain}"
    
    print(f"Creating user for {athlete['name']} with email {alias_email}...")
    
    # 1. Create User
    name_parts = athlete['name'].split(' ')
    first_name_real = name_parts[0]
    last_name_real = " ".join(name_parts[1:]) if len(name_parts) > 1 else "."
    
    user_payload = {
        "email": alias_email,
        "firstName": first_name_real,
        "lastName": last_name_real,
        "phone": "", # Optional
        "birthDate": "2010-01-01T00:00:00Z", # Placeholder
        "nif": "",
        "address": "",
        "postalCode": "",
        "city": "",
        "isActive": True
    }
    
    try:
        # Note: Auth is disabled on server for this endpoint
        resp = requests.post(f"{API_URL}/users", json=user_payload)
        if resp.status_code not in [200, 201]:
            print(f"Failed to create user: {resp.status_code} - {resp.text}")
            return
            
        user_data = resp.json()
        user_id = user_data['id']
        print(f"User created with ID {user_id}")
        
        # 2. Create Athlete Profile
        # We don't have team ID, so we'll just create the profile
        profile_payload = {
            "height": 0,
            "weight": 0,
            # "teamId": null # user needs to assign later
        }
        
        resp_prof = requests.post(f"{API_URL}/users/{user_id}/athlete-profile", json=profile_payload)
        if resp_prof.status_code in [200, 201]:
            print(f"Athlete profile created for {athlete['name']}")
        else:
            print(f"Failed to create athlete profile: {resp_prof.status_code} - {resp_prof.text}")
            
    except Exception as e:
        print(f"Exception creating user: {e}")

def main():
    groups = parse_irmaos_file()
    print(f"Found {len(groups)} sibling groups.")
    
    for group in groups:
        email = group['email']
        athletes = group['athletes']
        
        print(f"\nProcessing {email} with {len(athletes)} athletes...")
        
        # Check if parent email exists
        existing_user = get_user_by_email(email)
        
        # existing_names = []
        if existing_user:
            print(f"  Parent/Primary email exists: {existing_user['fullName']} (ID: {existing_user['id']})")
            # existing_names.append(existing_user['fullName'])
            # We assume the existing user corresponds to ONE of the athletes. 
            # We will try to match by name, or if not match, we just create the others.
            # But simple heuristic: justcreate aliases for ALL, 
            # and if the name matches the existing user, SKIP it.
            
            existing_full_name = existing_user['fullName'].lower()
            
            count = 2 # Start alias count from 2
            
            for athlete in athletes:
                athlete_name = athlete['name'].lower()
                
                # Check for name match (fuzzy or exact)
                # If the existing user's name is contained in athlete name or vice versa
                if athlete_name in existing_full_name or existing_full_name in athlete_name:
                    print(f"  Skipping {athlete['name']} - matches existing user.")
                    continue
                
                # Create missing sibling
                create_user_and_profile(athlete, email, count)
                count += 1
                
        else:
            print(f"  Parent email {email} NOT found. Creating ALL athletes as new users...")
            # This case shouldn't happen based on user description, but handle it.
            # Create first one as "Original" email? or all as aliases?
            # User said "1 deles ficou registado". So previous block is expected.
            # But if NONE, maybe just create all with aliases? Or first one normal?
            # Let's create first one normal, others aliases.
            
            count = 1
            for i, athlete in enumerate(athletes):
                if i == 0:
                    # Create as normal user
                    print(f"Creating PRIMARY user {athlete['name']} with email {email}")
                    # ... (copy paste logic or refactor, but for speed just assume this case is rare)
                    # For now just print warning
                    print("  WARNING: Primary email not found. Please check manually.")
                else:
                    create_user_and_profile(athlete, email, i+1)

if __name__ == "__main__":
    main()
