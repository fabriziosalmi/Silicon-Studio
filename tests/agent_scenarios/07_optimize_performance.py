# Test 7: Optimize Performance (Medium-Hard)
# Prompt: "optimize these functions for better performance"
# Expected: Agent spots O(n²) patterns, repeated work, uses better algorithms

def has_duplicates(lst):
    """Check if list has duplicate elements."""
    for i in range(len(lst)):
        for j in range(i + 1, len(lst)):
            if lst[i] == lst[j]:
                return True
    return False

def fibonacci(n):
    """Return nth fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def count_common(list_a, list_b):
    """Count elements common to both lists."""
    count = 0
    for a in list_a:
        for b in list_b:
            if a == b:
                count += 1
                break
    return count

def most_frequent(items):
    """Find the most frequently occurring item."""
    best = None
    best_count = 0
    for item in items:
        c = 0
        for other in items:
            if other == item:
                c += 1
        if c > best_count:
            best_count = c
            best = item
    return best
