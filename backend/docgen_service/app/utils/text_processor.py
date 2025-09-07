"""
Text Processing Utilities
"""

import re
from typing import List, Dict, Any


class TextProcessor:
    """テキスト処理ユーティリティ"""

    def clean_text(self, text: str) -> str:
        """テキストをクリーニング"""
        # 余分な空白を削除
        text = re.sub(r"\s+", " ", text)
        # 改行を正規化
        text = re.sub(r"\n+", "\n", text)
        return text.strip()

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """エンティティを抽出"""
        entities = {
            "dates": re.findall(r"\d{4}年\d{1,2}月\d{1,2}日", text),
            "amounts": re.findall(r"[\d,]+円", text),
            "phone_numbers": re.findall(r"\d{2,4}-\d{2,4}-\d{4}", text),
            "emails": re.findall(
                r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text
            ),
        }
        return entities
