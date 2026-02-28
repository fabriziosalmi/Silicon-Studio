from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.preparation.service import DataPreparationService

router = APIRouter()
service = DataPreparationService()

class PreviewRequest(BaseModel):
    file_path: str
    limit: int = Field(default=5, ge=1, le=1000)

class ConvertRequest(BaseModel):
    file_path: str
    output_path: str
    instruction_col: str
    input_col: Optional[str] = None
    output_col: str

class McpGenerateRequest(BaseModel):
    model_id: str
    server_id: str
    prompt: str
    output_path: str

@router.post("/preview")
async def preview_csv(request: PreviewRequest):
    """Preview a CSV file."""
    try:
        data = service.preview_csv(request.file_path, request.limit)
        return {"data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert")
async def convert_csv(request: ConvertRequest):
    """Convert CSV to JSONL."""
    try:
        result = service.convert_csv_to_jsonl(
            request.file_path,
            request.output_path,
            request.instruction_col,
            request.input_col,
            request.output_col
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-mcp")
async def generate_mcp(request: McpGenerateRequest):
    """Generate dataset via MCP and Bridge Model (not yet implemented)."""
    raise HTTPException(
        status_code=501,
        detail="MCP-based dataset generation is not yet implemented. Use CSV conversion instead."
    )
