"""
Document Generation Service Models
"""

from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field
from enum import Enum


class DocumentType(str, Enum):
    """ドキュメントタイプの定義"""

    CONTRACT = "contract"
    AGREEMENT = "agreement"
    PETITION = "petition"
    MOTION = "motion"
    BRIEF = "brief"
    MEMORANDUM = "memorandum"
    LETTER = "letter"
    REPORT = "report"
    OTHER = "other"


class DocumentFormat(str, Enum):
    """ドキュメントフォーマットの定義"""

    DOCX = "docx"
    PDF = "pdf"
    TXT = "txt"
    HTML = "html"


class ProcessingStatus(str, Enum):
    """処理ステータスの定義"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DocumentGenerationRequest(BaseModel):
    """ドキュメント生成リクエスト"""

    template_id: str = Field(..., description="テンプレートID")
    document_type: DocumentType = Field(..., description="ドキュメントタイプ")
    output_format: DocumentFormat = Field(
        default=DocumentFormat.DOCX, description="出力フォーマット"
    )
    data: Dict[str, Any] = Field(..., description="ドキュメントデータ")
    case_id: Optional[str] = Field(None, description="ケースID")
    user_id: str = Field(..., description="ユーザーID")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="メタデータ"
    )
    options: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="生成オプション"
    )


class DocumentGenerationResponse(BaseModel):
    """ドキュメント生成レスポンス"""

    request_id: str = Field(..., description="リクエストID")
    status: ProcessingStatus = Field(..., description="処理ステータス")
    document_url: Optional[str] = Field(None, description="生成されたドキュメントのURL")
    error_message: Optional[str] = Field(None, description="エラーメッセージ")
    created_at: str = Field(..., description="作成日時")
    completed_at: Optional[str] = Field(None, description="完了日時")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="メタデータ"
    )


class PDFExtractionRequest(BaseModel):
    """PDF抽出リクエスト"""

    file_url: str = Field(..., description="PDFファイルのURL")
    file_path: Optional[str] = Field(None, description="PDFファイルのパス")
    extraction_type: str = Field(
        default="text", description="抽出タイプ (text, ocr, both)"
    )
    language: str = Field(default="jpn", description="OCR言語")
    options: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="抽出オプション"
    )


class PDFExtractionResponse(BaseModel):
    """PDF抽出レスポンス"""

    request_id: str = Field(..., description="リクエストID")
    status: ProcessingStatus = Field(..., description="処理ステータス")
    extracted_text: Optional[str] = Field(None, description="抽出されたテキスト")
    ocr_text: Optional[str] = Field(None, description="OCRで抽出されたテキスト")
    confidence_scores: Optional[Dict[str, float]] = Field(
        None, description="信頼度スコア"
    )
    error_message: Optional[str] = Field(None, description="エラーメッセージ")
    created_at: str = Field(..., description="作成日時")
    completed_at: Optional[str] = Field(None, description="完了日時")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="メタデータ"
    )


class DataMappingRequest(BaseModel):
    """データマッピングリクエスト"""

    source_data: Dict[str, Any] = Field(..., description="ソースデータ")
    template_placeholders: List[str] = Field(
        ..., description="テンプレートプレースホルダー"
    )
    mapping_rules: Optional[Dict[str, str]] = Field(
        default_factory=dict, description="マッピングルール"
    )
    case_id: Optional[str] = Field(None, description="ケースID")
    user_id: str = Field(..., description="ユーザーID")
    options: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="マッピングオプション"
    )


class DataMappingResponse(BaseModel):
    """データマッピングレスポンス"""

    request_id: str = Field(..., description="リクエストID")
    status: ProcessingStatus = Field(..., description="処理ステータス")
    mapped_data: Optional[Dict[str, Any]] = Field(
        None, description="マッピングされたデータ"
    )
    unmapped_placeholders: Optional[List[str]] = Field(
        None, description="マッピングされなかったプレースホルダー"
    )
    mapping_confidence: Optional[float] = Field(None, description="マッピング信頼度")
    error_message: Optional[str] = Field(None, description="エラーメッセージ")
    created_at: str = Field(..., description="作成日時")
    completed_at: Optional[str] = Field(None, description="完了日時")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="メタデータ"
    )


class TemplateInfo(BaseModel):
    """テンプレート情報"""

    template_id: str = Field(..., description="テンプレートID")
    name: str = Field(..., description="テンプレート名")
    description: Optional[str] = Field(None, description="説明")
    document_type: DocumentType = Field(..., description="ドキュメントタイプ")
    placeholders: List[str] = Field(..., description="プレースホルダー一覧")
    file_path: str = Field(..., description="テンプレートファイルパス")
    created_at: str = Field(..., description="作成日時")
    updated_at: str = Field(..., description="更新日時")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="メタデータ"
    )


class HealthCheckResponse(BaseModel):
    """ヘルスチェックレスポンス"""

    status: str = Field(..., description="ステータス")
    timestamp: str = Field(..., description="タイムスタンプ")
    version: str = Field(..., description="バージョン")
    services: Dict[str, str] = Field(..., description="サービスステータス")


class ErrorResponse(BaseModel):
    """エラーレスポンス"""

    error: str = Field(..., description="エラータイプ")
    message: str = Field(..., description="エラーメッセージ")
    details: Optional[Dict[str, Any]] = Field(None, description="エラー詳細")
    request_id: Optional[str] = Field(None, description="リクエストID")
    timestamp: str = Field(..., description="タイムスタンプ")
