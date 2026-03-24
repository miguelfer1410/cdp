import csv

with open(r"C:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv", mode='r', encoding='latin-1') as f:
    reader = csv.reader(f, delimiter=';')
    headers = next(reader)
    print("Headers:")
    for i, h in enumerate(headers):
        print(f"{i}: {h}")
    
    print("\nSample Data (Row 1):")
    row1 = next(reader)
    for i, v in enumerate(row1):
        print(f"{i}: {v}")
