import json
from pathlib import Path
import shutil
import sys

# === File paths ===
data_path = Path("data.txt")
irregular_path = Path("../irregularWords.json")
colors_path = Path("../wordColors.json")
ignore_path = Path("ignoreWords.txt")

# === Capture all printed lines for repeating at the bottom ===
all_outputs = []

def capture_print(msg):
    print(msg)
    all_outputs.append(msg)

# === Load JSON safely and validate structure ===
def load_json_and_validate(path: Path, expected_value_type=str):
    if not path.exists():
        capture_print(f"❌ {path.name} not found! Please create the file.")
        sys.exit(1)
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        capture_print(f"❌ {path.name} is invalid JSON: {e}")
        sys.exit(1)
    
    if not isinstance(data, dict):
        capture_print(f"❌ {path.name} is not a JSON object/dict.")
        sys.exit(1)
    
    for k, v in data.items():
        if not isinstance(k, str):
            capture_print(f"❌ Invalid key in {path.name}: {k} (not a string)")
            sys.exit(1)
        if not isinstance(v, expected_value_type):
            capture_print(f"❌ Invalid value for key '{k}' in {path.name}: {v} (expected {expected_value_type.__name__})")
            sys.exit(1)
    
    return data

# === Backup file safely ===
def backup_file(path: Path):
    if path.exists():
        backup_path = path.with_suffix(".bak")
        shutil.copy2(path, backup_path)
        capture_print(f"💾 Backup created: {backup_path.name}")

# === Safe atomic write ===
def safe_write_json(path: Path, data: dict):
    temp_path = path.with_suffix(".tmp")
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        temp_path.replace(path)
    except Exception as e:
        capture_print(f"❌ Failed to write {path.name}: {e}")
        sys.exit(1)

# === Update JSON safely ===
def update_json_file(path: Path, new_data: dict):
    existing = load_json_and_validate(path)
    existing.update(new_data)
    backup_file(path)
    safe_write_json(path, existing)

# === Load ignoreWords.txt ===
def load_ignore_words(path: Path):
    if not path.exists():
        capture_print(f"⚠️ {path.name} not found, continuing without ignore list.")
        return set()
    with open(path, "r", encoding="utf-8") as f:
        words = [line.strip() for line in f if line.strip()]
    capture_print(f"📜 Loaded {len(words)} ignored words from {path.name}.")
    return set(words)

# === Start processing alert ===
capture_print("\n⚠️⚠️⚠️ START PROCESSING ⚠️⚠️⚠️\n")

# === Load and validate JSON files ===
irregular_data = load_json_and_validate(irregular_path, expected_value_type=str)
color_data = load_json_and_validate(colors_path, expected_value_type=str)
ignore_words = load_ignore_words(ignore_path)

# === Load data.txt ===
items = [line.strip() for line in open(data_path, encoding="utf-8") if line.strip()] if data_path.exists() else []

# === Prepare outputs ===
red_words = {}
numbers_to_add = {}
missing_words = []

for item in items:
    if item in ignore_words:
        continue  # Skip ignored words completely
    if item.isdigit():
        numbers_to_add[item] = "xxxx"
    else:
        lemma = irregular_data.get(item)
        if lemma:
            if lemma not in color_data:
                red_words[lemma] = "red"
        else:
            missing_words.append(item)

# === Update irregularWords.json with numbers safely ===
if numbers_to_add:
    update_json_file(irregular_path, numbers_to_add)
    capture_print(f"✅ Overwritten {len(numbers_to_add)} numbers in irregularWords.json as 'xxxx'.")

# === Update wordColors.json with red words safely ===
if red_words:
    update_json_file(colors_path, red_words)
    capture_print(f"✅ Assigned red color to {len(red_words)} lemmas in wordColors.json.")

# === Debug output for red words and numbers ===
if red_words:
    capture_print("\n🔴 Red Words JSON:")
    capture_print(json.dumps(red_words, ensure_ascii=False, indent=2))
if numbers_to_add:
    capture_print("\n🔢 Numbers added to irregularWords.json:")
    capture_print(json.dumps(numbers_to_add, ensure_ascii=False, indent=2))

# === Print missing words in chunks of 20 ===
if missing_words:
    capture_print("\n⚠️⚠️⚠️ MISSING WORDS NOT IN irregularWords.json ⚠️⚠️⚠️")
    chunk_size = 20
    for i in range(0, len(missing_words), chunk_size):
        chunk = missing_words[i:i+chunk_size]
        chunk_number = i // chunk_size + 1
        capture_print(f"\nChunk {chunk_number}:")
        capture_print(", ".join(chunk))
    capture_print("\n⚠️⚠️⚠️ END OF MISSING WORDS ⚠️⚠️⚠️")

# === Repeat all outputs at the very bottom ===
capture_print("\n⚠️⚠️⚠️ REPEATING ALL OUTPUTS AT THE VERY BOTTOM ⚠️⚠️⚠️")
for line in all_outputs:
    print(line)
capture_print("\n⚠️⚠️⚠️ END OF REPEATED OUTPUTS ⚠️⚠️⚠️")
