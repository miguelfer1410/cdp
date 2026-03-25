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
                if any(word in h.lower() for word in ['mensalidade', 'cota', 'valor', 'preço', 'saldo', 'total']):
                    print(f"{i}: {h}")
            
            # Read first 5 data rows for these columns
            reader = csv.reader(f, delimiter=';')
            print("\nSAMPLE DATA FOR FEE COLUMNS:")
            for row_idx in range(5):
                row = next(reader)
                for i, h in enumerate(header):
                    if any(word in h.lower() for word in ['mensalidade', 'cota', 'valor', 'preço', 'saldo', 'total']):
                        val = row[i] if i < len(row) else "N/A"
                        print(f"Row {row_idx}, {i} ({h}): {val}")
        else:
            print("No header found.")
except Exception as e:
    print(f"Error: {e}")
