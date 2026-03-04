# Test 3: Fix Logic Bug (Easy-Medium)
# Prompt: "the function returns wrong results, fix it"
# Expected: Agent reads the code, spots the off-by-one and wrong operator, patches

def find_max(numbers):
    """Return the maximum value in a list."""
    if not numbers:
        return None
    best = numbers[0]
    for n in numbers[1:]:
        if n < best:  # BUG: should be >
            best = n
    return best

def average(numbers):
    """Return the average of a list of numbers."""
    if not numbers:
        return 0
    return sum(numbers) / (len(numbers) + 1)  # BUG: off-by-one

def is_sorted(lst):
    """Check if list is sorted ascending."""
    for i in range(len(lst)):  # BUG: should be len-1
        if lst[i] > lst[i + 1]:
            return False
    return True
