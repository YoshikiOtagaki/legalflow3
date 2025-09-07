"""
Custom Exceptions for Document Generation Service
"""


class DocumentGenerationError(Exception):
    """ドキュメント生成エラー"""

    pass


class PDFExtractionError(Exception):
    """PDF抽出エラー"""

    pass


class DataMappingError(Exception):
    """データマッピングエラー"""

    pass


class TemplateError(Exception):
    """テンプレートエラー"""

    pass


class GeminiAPIError(Exception):
    """Gemini APIエラー"""

    pass
