import csv
from collections import Counter

file_path = r'c:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv'

try:
    with open(file_path, 'r', encoding='latin-1') as f:
        header = None
        for line in f:
            if line.count(';') > 5:
                header = line.strip().split(';')
                break
        
        if header:
            seg_idx = -1
            preco_idx = -1
            for i, h in enumerate(header):
                if 'Segmento' in h: seg_idx = i
                if 'Preço Unit.' in h: preco_idx = i
            
            if seg_idx != -1:
                reader = csv.reader(f, delimiter=';')
                segments = Counter()
                sample_fees = {} # Segment -> List of fees
                
                for row in reader:
                    seg = row[seg_idx] if seg_idx < len(row) else "N/A"
                    preco = row[preco_idx] if preco_idx < len(row) else "0"
                    segments[seg] += 1
                    if seg not in sample_fees:
                        sample_fees[seg] = set()
                    sample_fees[seg].add(preco)
                
                print("SEGMENTS FOUND:")
                for seg, count in segments.items():
                    print(f" - {seg}: {count} records, Fees found: {sorted(list(sample_fees[seg]))[:5]}")
            else:
                print("Segmento column not found.")
        else:
            print("No header found.")
except Exception as e:
    print(f"Error: {e}")
