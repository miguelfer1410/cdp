import csv

file_path = r'c:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv'

try:
    with open(file_path, 'r', encoding='latin-1') as f:
        header = None
        for line in f:
            if line.count(';') > 5:
                header = line.strip().split(';')
                break
        
        if header:
            print("HEADER FOUND:")
            for i, h in enumerate(header):
                if 'Pago' in h or 'até' in h or 'Socio' in h:
                    print(f"{i}: {h}")
            
            # Read first data row to see values for these columns
            reader = csv.reader(f, delimiter=';')
            first_row = next(reader)
            print("\nSAMPLE DATA ROW FOR RELEVANT COLUMNS:")
            for i, h in enumerate(header):
                if 'Pago' in h or 'até' in h or 'Socio' in h:
                    val = first_row[i] if i < len(first_row) else "N/A"
                    print(f"{i} ({h}): {val}")
        else:
            print("No header found.")
except Exception as e:
    print(f"Error: {e}")
