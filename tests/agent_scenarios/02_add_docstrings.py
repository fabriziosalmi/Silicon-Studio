# Test 2: Add Docstrings (Easy)
# Prompt: "add docstrings to all functions"
# Expected: Agent uses patch_file to add docstrings without changing logic

def celsius_to_fahrenheit(c):
    return c * 9 / 5 + 32

def fahrenheit_to_celsius(f):
    return (f - 32) * 5 / 9

def is_freezing(temp_c):
    return temp_c <= 0

def format_temp(value, unit="C"):
    return f"{value:.1f}°{unit}"
