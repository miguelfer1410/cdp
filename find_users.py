import csv

csv_path = r"C:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv"

with open(csv_path, mode='r', encoding='latin-1') as f:
    reader = csv.reader(f, delimiter=';')
    headers = next(reader)
    
    # Try to find relevant columns
    email_idx = -1
    nif_idx = -1
    first_name_idx = -1
    last_name_idx = -1
    nome_idx = -1
    
    for i, h in enumerate(headers):
        h_lower = h.lower()
        if "email" in h_lower: email_idx = i
        if "nif" in h_lower: nif_idx = i
        if "nome" == h_lower: nome_idx = i
        if "primeiro nome" in h_lower: first_name_idx = i
        if "último nome" in h_lower or "ultimo nome" in h_lower: last_name_idx = i

    print(f"Found indices: Email={email_idx}, NIF={nif_idx}, Nome={nome_idx}, FirstName={first_name_idx}, LastName={last_name_idx}")
    print("Full Headers:", headers)

    count = 0
    print("\nMatching Users (NIF=PT-999999990 and has email):")
    for row in reader:
        nif = row[nif_idx] if nif_idx != -1 else ""
        email = row[email_idx] if email_idx != -1 else ""
        
        if nif == "PT-999999990" and email.strip():
            print(f"Match: Email={email}, NIF={nif}, Row={row}")
            count += 1
            if count >= 5: break
    
    print(f"\nTotal matches found (capped at 5 in this preview): {count}")
