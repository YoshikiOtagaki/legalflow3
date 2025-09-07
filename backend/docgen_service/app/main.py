"""
Document Generation Service Main Application
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from .api import router
from .utils.exceptions import (
    DocumentGenerationError,
    PDFExtractionError,
    DataMappingError,
    TemplateError,
    GeminiAPIError,
)

# 環境変数を読み込み
load_dotenv()

# FastAPIアプリケーションを作成
app = FastAPI(
    title="LegalFlow Document Generation Service",
    description="Document generation service for LegalFlow application",
    version="1.0.0",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターを追加
app.include_router(router, prefix="/api/v1")


# エラーハンドラー
@app.exception_handler(DocumentGenerationError)
async def document_generation_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Document Generation Error", "message": str(exc)},
    )


@app.exception_handler(PDFExtractionError)
async def pdf_extraction_error_handler(request, exc):
    return JSONResponse(
        status_code=500, content={"error": "PDF Extraction Error", "message": str(exc)}
    )


@app.exception_handler(DataMappingError)
async def data_mapping_error_handler(request, exc):
    return JSONResponse(
        status_code=500, content={"error": "Data Mapping Error", "message": str(exc)}
    )


@app.exception_handler(TemplateError)
async def template_error_handler(request, exc):
    return JSONResponse(
        status_code=500, content={"error": "Template Error", "message": str(exc)}
    )


@app.exception_handler(GeminiAPIError)
async def gemini_api_error_handler(request, exc):
    return JSONResponse(
        status_code=500, content={"error": "Gemini API Error", "message": str(exc)}
    )


# ルートエンドポイント
@app.get("/")
async def root():
    return {"message": "LegalFlow Document Generation Service", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8001)), reload=True
    )
