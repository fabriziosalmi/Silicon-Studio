# Test 4: Refactor to Class (Medium)
# Prompt: "refactor these functions into a Calculator class"
# Expected: Agent creates a class, preserving all functionality

result_history = []

def add(a, b):
    r = a + b
    result_history.append(r)
    return r

def subtract(a, b):
    r = a - b
    result_history.append(r)
    return r

def multiply(a, b):
    r = a * b
    result_history.append(r)
    return r

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    r = a / b
    result_history.append(r)
    return r

def get_history():
    return list(result_history)

def clear_history():
    result_history.clear()
