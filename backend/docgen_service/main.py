from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import uvicorn


app = FastAPI(
    title="LegalFlow Document Generation Service",
    description="弁護士向け案件管理システムの文書生成サービス",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """ヘルスチェックエンドポイント"""
    return {"status": "OK", "service": "document-generation"}


@app.get("/")
async def root() -> Dict[str, str]:
    """ルートエンドポイント"""
    return {"message": "LegalFlow Document Generation Service"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
