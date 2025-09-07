"""
Data Mapping Service for Placeholder Replacement
"""

import re
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple, Union
import json
import difflib
from pathlib import Path

import google.generativeai as genai
from fuzzywuzzy import fuzz, process

from ..models import DataMappingRequest, ProcessingStatus
from ..utils.exceptions import DataMappingError
from ..utils.gemini_client import GeminiClient
from ..utils.text_processor import TextProcessor


class DataMapper:
    """データマッピングサービス"""

    def __init__(self):
        self.gemini_client = GeminiClient()
        self.text_processor = TextProcessor()
        self.mapping_rules = {}
        self.field_patterns = {}

        # 一般的なフィールドパターンを定義
        self._initialize_field_patterns()

        # マッピングルールを読み込み
        self._load_mapping_rules()

    def _initialize_field_patterns(self) -> None:
        """フィールドパターンを初期化"""
        self.field_patterns = {
            # 個人情報
            "name": [
                r"名前",
                r"氏名",
                r"姓名",
                r"フルネーム",
                r"name",
                r"full_name",
                r"当事者名",
                r"原告名",
                r"被告名",
                r"申請者名",
            ],
            "address": [
                r"住所",
                r"所在地",
                r"住居",
                r"address",
                r"location",
                r"本籍地",
                r"現住所",
                r"連絡先住所",
            ],
            "phone": [
                r"電話",
                r"tel",
                r"phone",
                r"連絡先",
                r"電話番号",
                r"携帯",
                r"mobile",
                r"fax",
                r"ファックス",
            ],
            "email": [
                r"メール",
                r"email",
                r"e-mail",
                r"電子メール",
                r"連絡先メール",
                r"contact_email",
            ],
            "birth_date": [
                r"生年月日",
                r"誕生日",
                r"birth",
                r"birthday",
                r"生年月",
                r"年齢",
                r"age",
            ],
            # 法的情報
            "case_number": [
                r"事件番号",
                r"case_number",
                r"事件名",
                r"case_name",
                r"事件ID",
                r"case_id",
                r"事件記号",
            ],
            "court": [
                r"裁判所",
                r"court",
                r"法廷",
                r"tribunal",
                r"地方裁判所",
                r"高等裁判所",
                r"最高裁判所",
            ],
            "judge": [
                r"裁判官",
                r"judge",
                r"担当裁判官",
                r"presiding_judge",
                r"主審",
                r"陪席裁判官",
            ],
            "lawyer": [
                r"弁護士",
                r"lawyer",
                r"attorney",
                r"代理人",
                r"弁護人",
                r"法律家",
                r"法務",
            ],
            "law_firm": [
                r"弁護士法人",
                r"law_firm",
                r"法律事務所",
                r"legal_office",
                r"事務所名",
                r"firm_name",
            ],
            # 日付・時間
            "date": [
                r"日付",
                r"date",
                r"年月日",
                r"日時",
                r"datetime",
                r"作成日",
                r"提出日",
                r"期限",
                r"deadline",
            ],
            "time": [
                r"時間",
                r"time",
                r"時刻",
                r"開始時間",
                r"終了時間",
                r"開廷時間",
                r"hearing_time",
            ],
            # 金額・数値
            "amount": [
                r"金額",
                r"amount",
                r"価格",
                r"price",
                r"費用",
                r"cost",
                r"損害",
                r"damages",
                r"賠償",
                r"compensation",
            ],
            "number": [
                r"番号",
                r"number",
                r"ID",
                r"識別番号",
                r"reference",
                r"登録番号",
                r"許可番号",
                r"認可番号",
            ],
            # 文書情報
            "title": [
                r"タイトル",
                r"title",
                r"件名",
                r"subject",
                r"題名",
                r"文書名",
                r"document_title",
            ],
            "description": [
                r"説明",
                r"description",
                r"内容",
                r"content",
                r"詳細",
                r"概要",
                r"summary",
                r"要約",
            ],
            "category": [
                r"カテゴリ",
                r"category",
                r"分類",
                r"type",
                r"種類",
                r"文書種別",
                r"document_type",
            ],
        }

    def _load_mapping_rules(self) -> None:
        """マッピングルールを読み込み"""
        # デフォルトのマッピングルール
        self.mapping_rules = {
            "default": {
                "name": ["name", "full_name", "氏名", "名前"],
                "address": ["address", "住所", "所在地"],
                "phone": ["phone", "tel", "電話", "連絡先"],
                "email": ["email", "メール", "電子メール"],
                "case_number": ["case_number", "事件番号", "事件名"],
                "court": ["court", "裁判所", "法廷"],
                "date": ["date", "日付", "年月日"],
                "amount": ["amount", "金額", "価格"],
            }
        }

    async def map_data(self, request: DataMappingRequest) -> Dict[str, Any]:
        """
        データをマッピング

        Args:
            request: データマッピングリクエスト

        Returns:
            マッピングされたデータ
        """
        try:
            # マッピング戦略を決定
            strategy = self._determine_mapping_strategy(request)

            # マッピングを実行
            if strategy == "exact":
                mapped_data = await self._exact_mapping(request)
            elif strategy == "fuzzy":
                mapped_data = await self._fuzzy_mapping(request)
            elif strategy == "ai":
                mapped_data = await self._ai_mapping(request)
            else:
                mapped_data = await self._hybrid_mapping(request)

            # マッピングされなかったプレースホルダーを特定
            unmapped_placeholders = self._find_unmapped_placeholders(
                request.template_placeholders, mapped_data
            )

            # マッピング信頼度を計算
            confidence = self._calculate_mapping_confidence(
                request.template_placeholders, mapped_data
            )

            return {
                "mapped_data": mapped_data,
                "unmapped_placeholders": unmapped_placeholders,
                "mapping_confidence": confidence,
                "strategy_used": strategy,
                "mapping_rules": request.mapping_rules,
            }

        except Exception as e:
            raise DataMappingError(f"Failed to map data: {str(e)}")

    def _determine_mapping_strategy(self, request: DataMappingRequest) -> str:
        """マッピング戦略を決定"""
        # カスタムマッピングルールがある場合はAIマッピングを使用
        if request.mapping_rules:
            return "ai"

        # データの複雑さに基づいて戦略を決定
        data_complexity = self._assess_data_complexity(request.source_data)

        if data_complexity < 0.3:
            return "exact"
        elif data_complexity < 0.7:
            return "fuzzy"
        else:
            return "hybrid"

    def _assess_data_complexity(self, data: Dict[str, Any]) -> float:
        """データの複雑さを評価"""
        if not data:
            return 0.0

        # データの種類と構造を分析
        complexity_score = 0.0

        # ネストされたデータの存在
        nested_count = sum(1 for v in data.values() if isinstance(v, (dict, list)))
        complexity_score += nested_count / len(data) * 0.3

        # 文字列の長さと複雑さ
        text_complexity = 0.0
        for v in data.values():
            if isinstance(v, str):
                # 日本語文字の割合
                japanese_chars = len(re.findall(r"[ひらがなカタカナ漢字]", v))
                total_chars = len(v)
                if total_chars > 0:
                    text_complexity += japanese_chars / total_chars

        if data:
            complexity_score += text_complexity / len(data) * 0.4

        # 数値データの存在
        numeric_count = sum(1 for v in data.values() if isinstance(v, (int, float)))
        complexity_score += numeric_count / len(data) * 0.3

        return min(complexity_score, 1.0)

    async def _exact_mapping(self, request: DataMappingRequest) -> Dict[str, Any]:
        """完全一致マッピング"""
        mapped_data = {}

        for placeholder in request.template_placeholders:
            # 完全一致を探す
            if placeholder in request.source_data:
                mapped_data[placeholder] = request.source_data[placeholder]
            else:
                # 大文字小文字を無視して検索
                for key, value in request.source_data.items():
                    if key.lower() == placeholder.lower():
                        mapped_data[placeholder] = value
                        break

        return mapped_data

    async def _fuzzy_mapping(self, request: DataMappingRequest) -> Dict[str, Any]:
        """ファジーマッチング"""
        mapped_data = {}

        for placeholder in request.template_placeholders:
            best_match = None
            best_score = 0

            for key, value in request.source_data.items():
                # 文字列の類似度を計算
                score = fuzz.ratio(placeholder.lower(), key.lower())

                if score > best_score and score > 60:  # 60%以上の類似度
                    best_match = (key, value)
                    best_score = score

            if best_match:
                mapped_data[placeholder] = best_match[1]

        return mapped_data

    async def _ai_mapping(self, request: DataMappingRequest) -> Dict[str, Any]:
        """AIを使用したマッピング"""
        try:
            # Gemini APIを使用してマッピングを実行
            prompt = self._create_mapping_prompt(request)

            response = await self.gemini_client.generate_text(prompt)

            # レスポンスをパース
            mapped_data = self._parse_ai_response(
                response, request.template_placeholders
            )

            return mapped_data

        except Exception as e:
            print(f"AI mapping failed, falling back to fuzzy mapping: {str(e)}")
            return await self._fuzzy_mapping(request)

    async def _hybrid_mapping(self, request: DataMappingRequest) -> Dict[str, Any]:
        """ハイブリッドマッピング（複数戦略の組み合わせ）"""
        # まず完全一致を試す
        exact_mapped = await self._exact_mapping(request)

        # 残りのプレースホルダーに対してファジーマッチング
        remaining_placeholders = [
            p for p in request.template_placeholders if p not in exact_mapped
        ]

        if remaining_placeholders:
            fuzzy_request = DataMappingRequest(
                source_data=request.source_data,
                template_placeholders=remaining_placeholders,
                mapping_rules=request.mapping_rules,
                case_id=request.case_id,
                user_id=request.user_id,
                options=request.options,
            )

            fuzzy_mapped = await self._fuzzy_mapping(fuzzy_request)
            exact_mapped.update(fuzzy_mapped)

        return exact_mapped

    def _create_mapping_prompt(self, request: DataMappingRequest) -> str:
        """AIマッピング用のプロンプトを作成"""
        source_data_str = json.dumps(request.source_data, ensure_ascii=False, indent=2)
        placeholders_str = ", ".join(request.template_placeholders)

        prompt = f"""
        以下のソースデータから、指定されたプレースホルダーに対応する値を抽出してください。

        ソースデータ:
        {source_data_str}

        プレースホルダー:
        {placeholders_str}

        マッピングルール:
        {json.dumps(request.mapping_rules, ensure_ascii=False, indent=2) if request.mapping_rules else "なし"}

        以下の形式でJSONレスポンスを返してください:
        {{
            "mapped_data": {{
                "placeholder1": "対応する値1",
                "placeholder2": "対応する値2"
            }},
            "confidence": 0.85,
            "reasoning": "マッピングの理由"
        }}

        注意事項:
        - 日本語の法的文書の文脈を考慮してください
        - 類似するフィールドがある場合は、最も適切なものを選択してください
        - 値が見つからない場合は、nullを返してください
        - 信頼度は0.0から1.0の範囲で評価してください
        """

        return prompt

    def _parse_ai_response(
        self, response: str, placeholders: List[str]
    ) -> Dict[str, Any]:
        """AIレスポンスをパース"""
        try:
            # JSONレスポンスを抽出
            json_match = re.search(r"\{.*\}", response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed = json.loads(json_str)
                return parsed.get("mapped_data", {})
            else:
                # JSONが見つからない場合は空の辞書を返す
                return {}

        except json.JSONDecodeError:
            print(f"Failed to parse AI response as JSON: {response}")
            return {}

    def _find_unmapped_placeholders(
        self, placeholders: List[str], mapped_data: Dict[str, Any]
    ) -> List[str]:
        """マッピングされなかったプレースホルダーを特定"""
        return [p for p in placeholders if p not in mapped_data]

    def _calculate_mapping_confidence(
        self, placeholders: List[str], mapped_data: Dict[str, Any]
    ) -> float:
        """マッピング信頼度を計算"""
        if not placeholders:
            return 1.0

        mapped_count = len([p for p in placeholders if p in mapped_data])
        return mapped_count / len(placeholders)

    async def suggest_mapping_rules(
        self, source_data: Dict[str, Any], placeholders: List[str]
    ) -> Dict[str, List[str]]:
        """マッピングルールの提案"""
        suggestions = {}

        for placeholder in placeholders:
            # フィールドパターンに基づいて候補を生成
            candidates = []

            for field_type, patterns in self.field_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, placeholder, re.IGNORECASE):
                        candidates.extend(patterns)

            # ソースデータから類似するキーを検索
            for key in source_data.keys():
                similarity = fuzz.ratio(placeholder.lower(), key.lower())
                if similarity > 50:
                    candidates.append(key)

            # 重複を削除
            suggestions[placeholder] = list(set(candidates))

        return suggestions

    async def validate_mapping(
        self, mapped_data: Dict[str, Any], placeholders: List[str]
    ) -> Dict[str, Any]:
        """マッピングの妥当性を検証"""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "suggestions": [],
        }

        # 必須プレースホルダーのチェック
        missing_placeholders = [p for p in placeholders if p not in mapped_data]
        if missing_placeholders:
            validation_result["errors"].append(
                f"Missing required placeholders: {missing_placeholders}"
            )
            validation_result["is_valid"] = False

        # データ型のチェック
        for placeholder, value in mapped_data.items():
            if value is None:
                validation_result["warnings"].append(
                    f"Placeholder '{placeholder}' has null value"
                )
            elif isinstance(value, str) and not value.strip():
                validation_result["warnings"].append(
                    f"Placeholder '{placeholder}' has empty string value"
                )

        # 日付フォーマットのチェック
        date_placeholders = [p for p in placeholders if "date" in p.lower()]
        for placeholder in date_placeholders:
            if placeholder in mapped_data:
                value = mapped_data[placeholder]
                if not self._is_valid_date(value):
                    validation_result["warnings"].append(
                        f"Placeholder '{placeholder}' may not be a valid date: {value}"
                    )

        return validation_result

    def _is_valid_date(self, value: Any) -> bool:
        """日付の妥当性をチェック"""
        if not isinstance(value, str):
            return False

        # 一般的な日付パターンをチェック
        date_patterns = [
            r"\d{4}年\d{1,2}月\d{1,2}日",
            r"\d{4}/\d{1,2}/\d{1,2}",
            r"\d{4}-\d{1,2}-\d{1,2}",
            r"\d{1,2}/\d{1,2}/\d{4}",
            r"\d{1,2}-\d{1,2}-\d{4}",
        ]

        for pattern in date_patterns:
            if re.search(pattern, value):
                return True

        return False

    async def batch_map_data(
        self, requests: List[DataMappingRequest]
    ) -> List[Dict[str, Any]]:
        """複数のデータマッピングを一括実行"""
        results = []

        for request in requests:
            try:
                result = await self.map_data(request)
                results.append(
                    {"request_id": str(uuid.uuid4()), "success": True, "result": result}
                )
            except Exception as e:
                results.append(
                    {"request_id": str(uuid.uuid4()), "success": False, "error": str(e)}
                )

        return results

    def export_mapping_rules(self, rules: Dict[str, Any]) -> str:
        """マッピングルールをエクスポート"""
        return json.dumps(rules, ensure_ascii=False, indent=2)

    def import_mapping_rules(self, rules_json: str) -> Dict[str, Any]:
        """マッピングルールをインポート"""
        try:
            return json.loads(rules_json)
        except json.JSONDecodeError as e:
            raise DataMappingError(f"Invalid mapping rules JSON: {str(e)}")

    async def learn_from_feedback(
        self, mapping_result: Dict[str, Any], feedback: Dict[str, Any]
    ) -> None:
        """フィードバックから学習してマッピングルールを改善"""
        # フィードバックに基づいてマッピングルールを更新
        if "corrected_mappings" in feedback:
            for placeholder, correct_value in feedback["corrected_mappings"].items():
                # ルールを更新
                if placeholder not in self.mapping_rules["default"]:
                    self.mapping_rules["default"][placeholder] = []

                # 新しいパターンを追加
                if correct_value not in self.mapping_rules["default"][placeholder]:
                    self.mapping_rules["default"][placeholder].append(correct_value)

        # ルールを保存（実際の実装では、データベースやファイルに保存）
        self._save_mapping_rules()

    def _save_mapping_rules(self) -> None:
        """マッピングルールを保存"""
        # 実際の実装では、データベースやファイルに保存
        pass
