import os
import json

# Folder to scan
folder_path = r"C:\xampp\htdocs\english\data"

# List only JSON files
files = [f for f in os.listdir(folder_path) if f.endswith(".json") and os.path.isfile(os.path.join(folder_path, f))]

if not files:
    print("No JSON files found in the folder.")
    exit()

# Display files with numbers
print("JSON files in folder:")
for idx, file in enumerate(files, start=1):
    print(f"{idx}. {file}")

# Ask user to select a file
while True:
    try:
        choice = int(input("Enter the number of the JSON file to process: "))
        if 1 <= choice <= len(files):
            selected_file = files[choice - 1]
            break
        else:
            print("Invalid number, try again.")
    except ValueError:
        print("Please enter a valid number.")

# Load JSON
file_path = os.path.join(folder_path, selected_file)
with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Remove duplicate words (keep one entry per word) while keeping same lemma
cleaned_data = {}
for word, lemma in data.items():
    if word not in cleaned_data:
        cleaned_data[word] = lemma

# Save cleaned JSON
output_file = os.path.join(folder_path, f"cleaned_{selected_file}")
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(cleaned_data, f, ensure_ascii=False, indent=4)

print(f"Done! Cleaned JSON saved as: {output_file}")
