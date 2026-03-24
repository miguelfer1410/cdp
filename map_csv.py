import csv

csv_path = r"C:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv"

with open(csv_path, mode='r', encoding='latin-1') as f:
    reader = csv.reader(f, delimiter=';')
    headers = next(reader)
    print("Headers and Indices:")
    for i, h in enumerate(headers):
        print(f"{i}: {h}")

    print("\nSample Data (Row 1):")
    row1 = next(reader)
    for i, v in enumerate(row1):
        if i < len(headers):
            print(f"{i} ({headers[i]}): {v}")
        else:
            print(f"{i} (Unknown): {v}")
