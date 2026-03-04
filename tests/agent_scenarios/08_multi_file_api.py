# Test 8: Multi-Tool — Read, Run, Patch (Hard)
# Prompt: "this API handler has bugs. read the file, run the tests below, then fix all failures"
# Expected: Agent reads the file, runs the test, reads the error, patches the code
# This tests the agent's ability to use multiple tools in sequence

from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    name: str
    email: str
    age: int

_users: dict[str, User] = {}

def create_user(name: str, email: str, age: int) -> User:
    """Create a user. Email must be unique. Age must be 0-150."""
    # BUG: no validation at all
    user = User(name=name, email=email, age=age)
    _users[email] = user
    return user

def get_user(email: str) -> Optional[User]:
    """Look up user by email."""
    return _users[email]  # BUG: should use .get() to avoid KeyError

def delete_user(email: str) -> bool:
    """Delete user, return True if existed."""
    del _users[email]  # BUG: KeyError if not found
    return True

def list_users(min_age: int = 0) -> list[User]:
    """List users with age >= min_age."""
    return [u for u in _users if u.age >= min_age]  # BUG: iterating keys not values


# --- inline tests (run with: python 08_multi_file_api.py) ---
if __name__ == "__main__":
    _users.clear()

    # Test create
    u = create_user("Alice", "alice@test.com", 30)
    assert u.name == "Alice"

    # Test get existing
    found = get_user("alice@test.com")
    assert found is not None and found.name == "Alice"

    # Test get missing — should return None, not raise
    missing = get_user("nobody@test.com")
    assert missing is None, f"Expected None, got {missing}"

    # Test delete missing — should return False, not raise
    ok = delete_user("nobody@test.com")
    assert ok is False

    # Test list with filter
    create_user("Bob", "bob@test.com", 17)
    adults = list_users(min_age=18)
    assert len(adults) == 1 and adults[0].name == "Alice"

    # Test age validation
    try:
        create_user("Bad", "bad@test.com", -5)
        assert False, "Should have raised ValueError for negative age"
    except ValueError:
        pass

    print("All tests passed!")
