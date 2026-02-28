import pytest
import os
import json
from app.preparation.service import DataPreparationService

def test_preview_csv(temp_csv):
    service = DataPreparationService()
    preview = service.preview_csv(temp_csv, limit=2)
    
    assert len(preview) == 2
    assert preview[0]["instruction"] == "Translate to French"
    assert preview[0]["input"] == "Hello World"
    assert preview[0]["output"] == "Bonjour le monde"

def test_apply_prompt_template():
    service = DataPreparationService()
    
    # Test Llama template
    llama_out = service.apply_prompt_template("Inst", "Inp", "Out", "Llama")
    assert "<|start_header_id|>user<|end_header_id|>" in llama_out
    assert "Inst" in llama_out
    assert "Out" in llama_out
    
    # Test Mistral template
    mistral_out = service.apply_prompt_template("Inst", "Inp", "Out", "Mistral")
    assert "[INST]" in mistral_out
    assert "[/INST]" in mistral_out

def test_convert_csv_to_jsonl(temp_csv, temp_output_jsonl):
    service = DataPreparationService()
    
    # We will test without PII stripping first to test the basic conversion
    result = service.convert_csv_to_jsonl(
        file_path=temp_csv,
        output_path=temp_output_jsonl,
        instruction_col="instruction",
        input_col="input",
        output_col="output",
        strip_pii=False,
        model_family="Llama"
    )
    
    assert result["status"] == "success"
    assert result["rows"] == 4
    
    with open(temp_output_jsonl, "r") as f:
        lines = f.readlines()
        assert len(lines) == 4
        
        # Parse first line to check structure
        record1 = json.loads(lines[0])
        assert "text" in record1
        assert "Translate to French" in record1["text"]
        assert "Bonjour le monde" in record1["text"]
        
        record3 = json.loads(lines[2])
        assert "Empty input test" in record3["text"]
