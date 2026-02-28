import pytest
import tempfile
import os

@pytest.fixture
def temp_csv():
    # Create a temporary CSV file for testing
    fd, path = tempfile.mkstemp(suffix=".csv")
    with os.fdopen(fd, 'w') as f:
        f.write("instruction,input,output\n")
        f.write("Translate to French,Hello World,Bonjour le monde\n")
        f.write("Summarize this,My name is John Doe and I live in New York,John Doe is an NY resident\n")
        f.write("Empty input test,,Output without input\n")
        f.write("Missing data,,\n")
    
    yield path
    
    # Cleanup
    if os.path.exists(path):
        os.remove(path)

@pytest.fixture
def temp_output_jsonl():
    fd, path = tempfile.mkstemp(suffix=".jsonl")
    os.close(fd)
    
    yield path
    
    # Cleanup
    if os.path.exists(path):
        os.remove(path)
