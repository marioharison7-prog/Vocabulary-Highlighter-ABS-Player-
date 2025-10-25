import json
from pathlib import Path
import re
import sys  # for exiting

irregular_path = Path("../irregularWords.json")

# === Pre-check JSON validity and exit if invalid ===
if irregular_path.exists():
    try:
        data = json.loads(irregular_path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("JSON root is not an object/dict")
    except Exception as e:
        print(f"❌ Invalid JSON detected in irregularWords.json: {e}")
        print("❌ Fix the file before running the script.")
        sys.exit(1)  # stop execution immediately
else:
    print("ℹ️ irregularWords.json does not exist. A new one will be created.")

# === Load existing data safely ===
try:
    irregular_data = json.loads(irregular_path.read_text(encoding="utf-8")) if irregular_path.exists() else {}
    if not isinstance(irregular_data, dict):
        raise ValueError("Not a JSON object")
except Exception:
    print("⚠️ Warning: irregularWords.json invalid. Starting with empty.")
    irregular_data = {}

# === Input ===
print("Paste entries (Ctrl+Z or Ctrl+D to finish):")
user_input = []
while True:
    try:
        line = input()
    except EOFError:
        break
    user_input.append(line)
text = "\n".join(user_input)

# === Sanitize text ===
# remove stray brackets, braces, commas, semicolons, quotes
clean_text = re.sub(r'[\[\]\{\},;\'"]', '', text)

# === Pattern: key:value, key = value, or key value ===
pattern = re.compile(r'\b([A-Za-z0-9_\-]+)\b\s*(?:[:= ]+)\s*\b([A-Za-z0-9_\-]+)\b')
added = 0
invalid_lines = []

for line in clean_text.splitlines():
    match = pattern.search(line)
    if match:
        key, val = match.groups()
        if key not in irregular_data:
            irregular_data[key] = val
            added += 1
        else:
            print(f"ℹ️ Skipped existing key: {key}")
    elif line.strip():
        invalid_lines.append(line.strip())

# === Save safely ===
if added:
    backup = irregular_path.with_suffix(".bak")
    if irregular_path.exists():
        irregular_path.replace(backup)
        print(f"\n💾 Backup created: {backup.name}")
    irregular_path.write_text(json.dumps(irregular_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ Added {added} new entries to irregularWords.json")
else:
    print("⚠️ No valid entries to add.")

# === Report ignored lines ===
if invalid_lines:
    print("\n⚠️ Ignored malformed lines:")
    for line in invalid_lines:
        print("  -", line)
