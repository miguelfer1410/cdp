import csv

file_path = r'c:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv'

try:
    with open(file_path, 'r', encoding='latin-1') as f:
        # Find header
        header = None
        for line in f:
            if line.count(';') > 5:
                header = line.strip().split(';')
                break
        
        if header:
            reader = csv.reader(f, delimiter=';')
            found = False
            for i, row in enumerate(reader):
                # Flexible name search
                name_on_row = row[1] if len(row) > 1 else ""
                if 'Diogo' in name_on_row and 'Nogueira' in name_on_row:
                    print(f"Row {i} found:")
                    for idx, val in enumerate(row):
                        if idx < len(header):
                            print(f"{idx} ({header[idx]}): {val}")
                        else:
                            print(f"{idx} (UNKNOWN): {val}")
                    found = True
                    break
            if not found:
                print("Athlete not found in CSV.")
except Exception as e:
    print(f"Error: {e}")
