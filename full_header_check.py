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
            print("HEADER:")
            for i, h in enumerate(header):
                print(f"{i}: {h}")
except Exception as e:
    print(f"Error: {e}")
