import csv

csv_path = r"C:\Users\migue\Documents\GitHub\cdp\RadGridExport.csv"
try:
    with open(csv_path, mode='r', encoding='utf-8') as f:
        content = f.read(1000)
    print("Content (UTF-8) first 1000 chars:")
    print(content)
except Exception as e:
    print(f"UTF-8 read failed: {e}")

try:
    with open(csv_path, mode='r', encoding='latin-1') as f:
        reader = csv.reader(f, delimiter=';')
        headers = next(reader)
        print("\nHeaders (Latin-1):")
        for i, h in enumerate(headers):
            print(f"{i}: {h}")
        
        print("\nFirst 3 data rows:")
        for _ in range(3):
            try:
                row = next(reader)
                print(row)
            except StopIteration:
                break
except Exception as e:
    print(f"Latin-1 read failed: {e}")
