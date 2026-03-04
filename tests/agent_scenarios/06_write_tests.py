# Test 6: Write Unit Tests (Medium)
# Prompt: "write pytest tests for all functions in this file"
# Expected: Agent uses edit_file to create a new test file, or patches this one

def slugify(text):
    """Convert text to URL-friendly slug."""
    import re
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')

def truncate(text, max_len=100, suffix="..."):
    """Truncate text to max_len, adding suffix if truncated."""
    if len(text) <= max_len:
        return text
    return text[:max_len - len(suffix)] + suffix

def word_count(text):
    """Count words in text, ignoring extra whitespace."""
    return len(text.split())

def extract_emails(text):
    """Extract all email addresses from text."""
    import re
    return re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
