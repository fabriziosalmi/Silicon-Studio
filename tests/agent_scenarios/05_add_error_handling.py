# Test 5: Add Error Handling (Medium)
# Prompt: "add proper error handling to all functions"
# Expected: Agent adds try/except, input validation, meaningful error messages

import json

def read_config(path):
    with open(path) as f:
        return json.load(f)

def parse_int_list(text):
    return [int(x) for x in text.split(",")]

def fetch_value(data, key_path):
    """key_path like 'a.b.c' navigates nested dicts."""
    parts = key_path.split(".")
    current = data
    for p in parts:
        current = current[p]
    return current

def safe_divide(nums):
    """Divide first element by all subsequent ones."""
    result = nums[0]
    for n in nums[1:]:
        result /= n
    return result
