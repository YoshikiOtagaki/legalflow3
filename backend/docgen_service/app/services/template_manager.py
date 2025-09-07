"""
Template Management Service
"""

from typing import List, Optional, Dict, Any
from pathlib import Path
import os

from ..models import TemplateInfo, DocumentType


class TemplateManager:
    """テンプレート管理サービス"""

    def __init__(self):
        self.template_dir = Path(os.getenv("TEMPLATE_DIR", "templates"))
        self.template_dir.mkdir(parents=True, exist_ok=True)

    async def get_templates(
        self, document_type: Optional[DocumentType] = None
    ) -> List[TemplateInfo]:
        """テンプレート一覧を取得"""
        templates = []

        for template_file in self.template_dir.glob("*.docx"):
            template_info = TemplateInfo(
                template_id=template_file.stem,
                name=template_file.stem,
                description=f"Template for {template_file.stem}",
                document_type=DocumentType.OTHER,
                placeholders=[],
                file_path=str(template_file),
                created_at="2024-01-01T00:00:00Z",
                updated_at="2024-01-01T00:00:00Z",
            )
            templates.append(template_info)

        return templates

    async def get_template(self, template_id: str) -> Optional[TemplateInfo]:
        """テンプレート詳細を取得"""
        template_file = self.template_dir / f"{template_id}.docx"

        if not template_file.exists():
            return None

        return TemplateInfo(
            template_id=template_id,
            name=template_id,
            description=f"Template for {template_id}",
            document_type=DocumentType.OTHER,
            placeholders=[],
            file_path=str(template_file),
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        )
