import json

# === CONFIG ===
input_file = "data.json"     # your input JSON file
output_file = "cleaned.json" # output file (you can overwrite input if you want)

# === READ JSON ===
with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# === REMOVE ALL ENTRIES WITH VALUE "red" ===
filtered_data = {k: v for k, v in data.items() if v != "red"}

# === SAVE CLEANED DATA ===
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(filtered_data, f, indent=4, ensure_ascii=False)

print(f"✅ Removed all entries with value 'red'. Saved to '{output_file}'.")
