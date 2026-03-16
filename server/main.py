"""FastAPI server for AI pose estimation and symmetry scoring."""

import logging
import os
from fastapi import FastAPI, HTTPException

logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analysis import analyze_video_from_storage

app = FastAPI(title="CorrectiveRehab Analysis Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class AnalyzeRequest(BaseModel):
    storage_path: str
    category_id: str
    angle: str
    user_id: str
    session_id: str
    video_id: str


class Issue(BaseModel):
    id: str
    label: str
    severity: str
    detail: str
    measurement: float | None = None


class AnalyzeResponse(BaseModel):
    symmetry_score: int
    issues: list[Issue]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Missing Supabase credentials")

    try:
        result = await analyze_video_from_storage(
            supabase_url=supabase_url,
            supabase_key=supabase_key,
            storage_path=req.storage_path,
            category_id=req.category_id,
            angle=req.angle,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
