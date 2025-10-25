import json
from collections import Counter

# Load your JSON
with open("colors.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Count occurrences of each key
counts = Counter(data.keys())

# Prepare new dict
new_data = {}

for key in data:
    if counts[key] > 1:
        # If key appears multiple times, force red
        new_data[key] = "red"
        counts[key] = 0  # reset count to avoid adding again
    elif counts[key] == 1:
        # Keep original value if it appears only once
        new_data[key] = data[key]

# Save cleaned JSON
with open("colors_cleaned.json", "w", encoding="utf-8") as f:
    json.dump(new_data, f, indent=4)

print("Duplicates removed and forced red for repeated keys:")
print(new_data)
