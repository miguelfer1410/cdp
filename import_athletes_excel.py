import pandas as pd

# Nome do ficheiro
file_path = "Base de dados atletas - EmJogo.xlsx"

# Ler todos os sheets
all_sheets = pd.read_excel(file_path, sheet_name=None)

# Lista para guardar todos os dados
all_data = []

# Percorrer todos os sheets
for sheet_name, df in all_sheets.items():
    df["Sheet"] = sheet_name  # guardar de que sheet veio
    all_data.append(df)

# Juntar tudo num único DataFrame
full_df = pd.concat(all_data, ignore_index=True)

# Garantir que não há emails vazios
full_df = full_df.dropna(subset=["Email"])

# Agrupar por Email
grouped = full_df.groupby("Email")

print("\n=== Possíveis Irmãos (mesmo email) ===\n")

for email, group in grouped:
    if len(group) > 1:
        print(f"\nEmail: {email}")
        print("Atletas:")
        for _, row in group.iterrows():
            nome = row.get("Atleta", "Nome não encontrado")
            sheet = row.get("Sheet", "Sheet desconhecida")
            print(f" - {nome} (Sheet: {sheet})")