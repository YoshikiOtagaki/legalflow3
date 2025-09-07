"""
Document Generation Service API Endpoints
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status
from fastapi.responses import FileResponse, JSONResponse
import httpx
import os
from dotenv import load_dotenv

from .models import (
    DocumentGenerationRequest,
    DocumentGenerationResponse,
    PDFExtractionRequest,
    PDFExtractionResponse,
    DataMappingRequest,
    DataMappingResponse,
    TemplateInfo,
    HealthCheckResponse,
    ErrorResponse,
    ProcessingStatus,
    DocumentType,
    DocumentFormat,
)
from .services.document_generator import DocumentGenerator
from .services.pdf_extractor import PDFExtractor
from .services.data_mapper import DataMapper
from .services.template_manager import TemplateManager
from .utils.auth import verify_token
from .utils.exceptions import (
    DocumentGenerationError,
    PDFExtractionError,
    DataMappingError,
)

# 環境変数を読み込み
load_dotenv()

# APIルーターを作成
router = APIRouter()

# サービスインスタンス
document_generator = DocumentGenerator()
pdf_extractor = PDFExtractor()
data_mapper = DataMapper()
template_manager = TemplateManager()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """ヘルスチェックエンドポイント"""
    try:
        # 各サービスのヘルスチェック
        services = {
            "document_generator": "healthy",
            "pdf_extractor": "healthy",
            "data_mapper": "healthy",
            "template_manager": "healthy",
        }

        return HealthCheckResponse(
            status="healthy",
            timestamp=datetime.utcnow().isoformat(),
            version="1.0.0",
            services=services,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}",
        )


@router.post("/documents/generate", response_model=DocumentGenerationResponse)
async def generate_document(
    request: DocumentGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(verify_token),
):
    """ドキュメント生成エンドポイント"""
    try:
        request_id = str(uuid.uuid4())

        # バックグラウンドでドキュメント生成を実行
        background_tasks.add_task(
            _process_document_generation, request_id, request, current_user["user_id"]
        )

        return DocumentGenerationResponse(
            request_id=request_id,
            status=ProcessingStatus.PENDING,
            created_at=datetime.utcnow().isoformat(),
            metadata={"user_id": current_user["user_id"]},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate document generation: {str(e)}",
        )


@router.get(
    "/documents/generate/{request_id}", response_model=DocumentGenerationResponse
)
async def get_document_generation_status(
    request_id: str, current_user: dict = Depends(verify_token)
):
    """ドキュメント生成ステータス取得エンドポイント"""
    try:
        # 実際の実装では、データベースやキャッシュからステータスを取得
        # ここでは簡易的な実装
        return DocumentGenerationResponse(
            request_id=request_id,
            status=ProcessingStatus.COMPLETED,
            document_url=f"/documents/download/{request_id}",
            created_at=datetime.utcnow().isoformat(),
            completed_at=datetime.utcnow().isoformat(),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document generation status: {str(e)}",
        )


@router.get("/documents/download/{request_id}")
async def download_document(
    request_id: str, current_user: dict = Depends(verify_token)
):
    """ドキュメントダウンロードエンドポイント"""
    try:
        # 実際の実装では、生成されたドキュメントファイルを返す
        # ここでは簡易的な実装
        file_path = f"/tmp/generated_documents/{request_id}.docx"

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
            )

        return FileResponse(
            path=file_path,
            filename=f"document_{request_id}.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download document: {str(e)}",
        )


@router.post("/pdf/extract", response_model=PDFExtractionResponse)
async def extract_pdf_text(
    request: PDFExtractionRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(verify_token),
):
    """PDFテキスト抽出エンドポイント"""
    try:
        request_id = str(uuid.uuid4())

        # バックグラウンドでPDF抽出を実行
        background_tasks.add_task(
            _process_pdf_extraction, request_id, request, current_user["user_id"]
        )

        return PDFExtractionResponse(
            request_id=request_id,
            status=ProcessingStatus.PENDING,
            created_at=datetime.utcnow().isoformat(),
            metadata={"user_id": current_user["user_id"]},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate PDF extraction: {str(e)}",
        )


@router.get("/pdf/extract/{request_id}", response_model=PDFExtractionResponse)
async def get_pdf_extraction_status(
    request_id: str, current_user: dict = Depends(verify_token)
):
    """PDF抽出ステータス取得エンドポイント"""
    try:
        # 実際の実装では、データベースやキャッシュからステータスを取得
        return PDFExtractionResponse(
            request_id=request_id,
            status=ProcessingStatus.COMPLETED,
            extracted_text="Sample extracted text",
            created_at=datetime.utcnow().isoformat(),
            completed_at=datetime.utcnow().isoformat(),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get PDF extraction status: {str(e)}",
        )


@router.post("/data/map", response_model=DataMappingResponse)
async def map_data(
    request: DataMappingRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(verify_token),
):
    """データマッピングエンドポイント"""
    try:
        request_id = str(uuid.uuid4())

        # バックグラウンドでデータマッピングを実行
        background_tasks.add_task(
            _process_data_mapping, request_id, request, current_user["user_id"]
        )

        return DataMappingResponse(
            request_id=request_id,
            status=ProcessingStatus.PENDING,
            created_at=datetime.utcnow().isoformat(),
            metadata={"user_id": current_user["user_id"]},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate data mapping: {str(e)}",
        )


@router.get("/data/map/{request_id}", response_model=DataMappingResponse)
async def get_data_mapping_status(
    request_id: str, current_user: dict = Depends(verify_token)
):
    """データマッピングステータス取得エンドポイント"""
    try:
        # 実際の実装では、データベースやキャッシュからステータスを取得
        return DataMappingResponse(
            request_id=request_id,
            status=ProcessingStatus.COMPLETED,
            mapped_data={"placeholder1": "value1", "placeholder2": "value2"},
            created_at=datetime.utcnow().isoformat(),
            completed_at=datetime.utcnow().isoformat(),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get data mapping status: {str(e)}",
        )


@router.get("/templates", response_model=List[TemplateInfo])
async def get_templates(
    document_type: Optional[DocumentType] = None,
    current_user: dict = Depends(verify_token),
):
    """テンプレート一覧取得エンドポイント"""
    try:
        templates = await template_manager.get_templates(document_type)
        return templates

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get templates: {str(e)}",
        )


@router.get("/templates/{template_id}", response_model=TemplateInfo)
async def get_template(template_id: str, current_user: dict = Depends(verify_token)):
    """テンプレート詳細取得エンドポイント"""
    try:
        template = await template_manager.get_template(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
            )
        return template

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get template: {str(e)}",
        )


# バックグラウンドタスク関数
async def _process_document_generation(
    request_id: str, request: DocumentGenerationRequest, user_id: str
):
    """ドキュメント生成のバックグラウンド処理"""
    try:
        # 実際のドキュメント生成処理
        result = await document_generator.generate_document(request)

        # 結果をデータベースやキャッシュに保存
        # ここでは簡易的な実装

    except Exception as e:
        # エラーをログに記録
        print(f"Document generation failed for request {request_id}: {str(e)}")


async def _process_pdf_extraction(
    request_id: str, request: PDFExtractionRequest, user_id: str
):
    """PDF抽出のバックグラウンド処理"""
    try:
        # 実際のPDF抽出処理
        result = await pdf_extractor.extract_text(request)

        # 結果をデータベースやキャッシュに保存
        # ここでは簡易的な実装

    except Exception as e:
        # エラーをログに記録
        print(f"PDF extraction failed for request {request_id}: {str(e)}")


async def _process_data_mapping(
    request_id: str, request: DataMappingRequest, user_id: str
):
    """データマッピングのバックグラウンド処理"""
    try:
        # 実際のデータマッピング処理
        result = await data_mapper.map_data(request)

        # 結果をデータベースやキャッシュに保存
        # ここでは簡易的な実装

    except Exception as e:
        # エラーをログに記録
        print(f"Data mapping failed for request {request_id}: {str(e)}")
