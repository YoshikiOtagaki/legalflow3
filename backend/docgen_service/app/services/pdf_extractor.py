"""
PDF Text Extraction and OCR Service using Gemini API
"""

import os
import uuid
import tempfile
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
import asyncio
import aiofiles
import httpx

import google.generativeai as genai
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import fitz  # PyMuPDF

from ..models import PDFExtractionRequest, ProcessingStatus
from ..utils.exceptions import PDFExtractionError
from ..utils.gemini_client import GeminiClient
from ..utils.image_processor import ImageProcessor


class PDFExtractor:
    """PDFテキスト抽出・OCRサービス"""

    def __init__(self):
        self.gemini_client = GeminiClient()
        self.image_processor = ImageProcessor()
        self.temp_dir = Path(tempfile.gettempdir()) / "pdf_extraction"
        self.temp_dir.mkdir(parents=True, exist_ok=True)

        # Tesseractの設定
        self.tesseract_config = r"--oem 3 --psm 6 -l jpn+eng"

        # Gemini APIの設定
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise PDFExtractionError("GEMINI_API_KEY environment variable is required")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    async def extract_text(self, request: PDFExtractionRequest) -> Dict[str, Any]:
        """
        PDFからテキストを抽出

        Args:
            request: PDF抽出リクエスト

        Returns:
            抽出されたテキストの情報
        """
        try:
            # PDFファイルをダウンロード（URLの場合）
            if request.file_url:
                pdf_path = await self._download_pdf(request.file_url)
            else:
                pdf_path = Path(request.file_path)

            if not pdf_path.exists():
                raise PDFExtractionError(f"PDF file not found: {pdf_path}")

            result = {
                "extracted_text": "",
                "ocr_text": "",
                "confidence_scores": {},
                "metadata": {},
                "pages": [],
            }

            # 抽出タイプに応じて処理
            if request.extraction_type in ["text", "both"]:
                # 直接テキスト抽出
                text_result = await self._extract_direct_text(pdf_path)
                result["extracted_text"] = text_result["text"]
                result["confidence_scores"]["direct_text"] = text_result["confidence"]
                result["pages"] = text_result["pages"]

            if request.extraction_type in ["ocr", "both"]:
                # OCR抽出
                ocr_result = await self._extract_ocr_text(pdf_path, request.language)
                result["ocr_text"] = ocr_result["text"]
                result["confidence_scores"]["ocr"] = ocr_result["confidence"]

                # Gemini APIを使用したテキスト改善
                if result["ocr_text"]:
                    improved_text = await self._improve_text_with_gemini(
                        result["ocr_text"], request.options.get("improve_text", True)
                    )
                    result["improved_text"] = improved_text

            # メタデータを抽出
            result["metadata"] = await self._extract_metadata(pdf_path)

            # 一時ファイルを削除
            if request.file_url and pdf_path.exists():
                pdf_path.unlink()

            return result

        except Exception as e:
            raise PDFExtractionError(f"Failed to extract text from PDF: {str(e)}")

    async def _download_pdf(self, url: str) -> Path:
        """PDFファイルをダウンロード"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()

                # 一時ファイルに保存
                temp_file = self.temp_dir / f"{uuid.uuid4().hex}.pdf"
                async with aiofiles.open(temp_file, "wb") as f:
                    await f.write(response.content)

                return temp_file

        except Exception as e:
            raise PDFExtractionError(f"Failed to download PDF from URL: {str(e)}")

    async def _extract_direct_text(self, pdf_path: Path) -> Dict[str, Any]:
        """PyMuPDFを使用して直接テキストを抽出"""
        try:
            doc = fitz.open(str(pdf_path))
            text = ""
            pages = []
            total_confidence = 0
            page_count = 0

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text()

                if page_text.strip():
                    text += page_text + "\n"
                    pages.append(
                        {
                            "page_number": page_num + 1,
                            "text": page_text,
                            "char_count": len(page_text),
                        }
                    )
                    total_confidence += 0.9  # 直接抽出は高信頼度
                    page_count += 1

            doc.close()

            # 平均信頼度を計算
            confidence = total_confidence / page_count if page_count > 0 else 0

            return {"text": text.strip(), "confidence": confidence, "pages": pages}

        except Exception as e:
            raise PDFExtractionError(f"Failed to extract direct text: {str(e)}")

    async def _extract_ocr_text(
        self, pdf_path: Path, language: str = "jpn"
    ) -> Dict[str, Any]:
        """OCRを使用してテキストを抽出"""
        try:
            # PDFを画像に変換
            images = convert_from_path(
                str(pdf_path), dpi=300, first_page=1, last_page=None, fmt="jpeg"
            )

            text = ""
            total_confidence = 0
            page_count = 0

            for i, image in enumerate(images):
                # 画像を前処理
                processed_image = self.image_processor.preprocess_image(image)

                # OCRを実行
                ocr_data = pytesseract.image_to_data(
                    processed_image,
                    config=f"--oem 3 --psm 6 -l {language}",
                    output_type=pytesseract.Output.DICT,
                )

                # テキストを抽出
                page_text = ""
                page_confidence = 0
                word_count = 0

                for j in range(len(ocr_data["text"])):
                    if int(ocr_data["conf"][j]) > 0:
                        page_text += ocr_data["text"][j] + " "
                        page_confidence += int(ocr_data["conf"][j])
                        word_count += 1

                if word_count > 0:
                    page_confidence = page_confidence / word_count
                    text += page_text + "\n"
                    total_confidence += page_confidence
                    page_count += 1

            # 平均信頼度を計算
            confidence = total_confidence / page_count if page_count > 0 else 0

            return {
                "text": text.strip(),
                "confidence": confidence / 100,  # 0-1の範囲に正規化
            }

        except Exception as e:
            raise PDFExtractionError(f"Failed to extract OCR text: {str(e)}")

    async def _improve_text_with_gemini(self, text: str, improve: bool = True) -> str:
        """Gemini APIを使用してテキストを改善"""
        if not improve or not text.strip():
            return text

        try:
            prompt = f"""
            以下のOCRで抽出されたテキストを、法的文書として読みやすく改善してください。
            誤字脱字を修正し、適切な句読点を追加し、文の構造を整理してください。
            元の内容は保持しつつ、読みやすさを向上させてください。

            テキスト:
            {text}
            """

            response = await self.gemini_client.generate_text(prompt)
            return response.strip()

        except Exception as e:
            print(f"Warning: Failed to improve text with Gemini: {str(e)}")
            return text

    async def _extract_metadata(self, pdf_path: Path) -> Dict[str, Any]:
        """PDFのメタデータを抽出"""
        try:
            doc = fitz.open(str(pdf_path))
            metadata = doc.metadata

            result = {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "creation_date": metadata.get("creationDate", ""),
                "modification_date": metadata.get("modDate", ""),
                "page_count": len(doc),
                "file_size": pdf_path.stat().st_size,
            }

            doc.close()
            return result

        except Exception as e:
            print(f"Warning: Failed to extract metadata: {str(e)}")
            return {}

    async def extract_tables(self, pdf_path: Path) -> List[Dict[str, Any]]:
        """PDFから表を抽出"""
        try:
            doc = fitz.open(str(pdf_path))
            tables = []

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)

                # 表を検出
                table_rects = page.find_tables()

                for i, table_rect in enumerate(table_rects):
                    table = table_rect.extract()

                    if table:
                        tables.append(
                            {
                                "page_number": page_num + 1,
                                "table_index": i,
                                "data": table,
                                "row_count": len(table),
                                "col_count": len(table[0]) if table else 0,
                            }
                        )

            doc.close()
            return tables

        except Exception as e:
            raise PDFExtractionError(f"Failed to extract tables: {str(e)}")

    async def extract_images(self, pdf_path: Path) -> List[Dict[str, Any]]:
        """PDFから画像を抽出"""
        try:
            doc = fitz.open(str(pdf_path))
            images = []

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                image_list = page.get_images()

                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)

                    if pix.n - pix.alpha < 4:  # GRAY or RGB
                        img_data = pix.tobytes("png")

                        images.append(
                            {
                                "page_number": page_num + 1,
                                "image_index": img_index,
                                "width": pix.width,
                                "height": pix.height,
                                "data": img_data,
                                "format": "png",
                            }
                        )

                    pix = None

            doc.close()
            return images

        except Exception as e:
            raise PDFExtractionError(f"Failed to extract images: {str(e)}")

    async def analyze_document_structure(self, pdf_path: Path) -> Dict[str, Any]:
        """ドキュメントの構造を分析"""
        try:
            doc = fitz.open(str(pdf_path))
            structure = {
                "pages": [],
                "sections": [],
                "paragraphs": [],
                "tables": [],
                "images": [],
            }

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)

                # ページ情報
                page_info = {
                    "page_number": page_num + 1,
                    "width": page.rect.width,
                    "height": page.rect.height,
                    "text_blocks": [],
                }

                # テキストブロックを取得
                blocks = page.get_text("dict")
                for block in blocks["blocks"]:
                    if "lines" in block:
                        page_info["text_blocks"].append(
                            {
                                "bbox": block["bbox"],
                                "text": " ".join(
                                    [
                                        line["spans"][0]["text"]
                                        for line in block["lines"]
                                    ]
                                ),
                            }
                        )

                structure["pages"].append(page_info)

            doc.close()
            return structure

        except Exception as e:
            raise PDFExtractionError(f"Failed to analyze document structure: {str(e)}")

    async def extract_with_gemini_analysis(self, pdf_path: Path) -> Dict[str, Any]:
        """Gemini APIを使用してPDFを分析・抽出"""
        try:
            # まず画像に変換
            images = convert_from_path(str(pdf_path), dpi=200)

            results = []
            for i, image in enumerate(images):
                # 画像をGeminiに送信
                prompt = """
                この画像は法的文書のページです。以下の情報を抽出してください：
                1. 文書の種類（契約書、判決書、訴状など）
                2. 主要な内容の要約
                3. 重要な日付
                4. 当事者名
                5. 金額や数値
                6. その他の重要な情報

                日本語で回答してください。
                """

                response = await self.gemini_client.analyze_image(image, prompt)
                results.append({"page_number": i + 1, "analysis": response})

            return {"gemini_analysis": results, "extraction_method": "gemini_vision"}

        except Exception as e:
            raise PDFExtractionError(
                f"Failed to extract with Gemini analysis: {str(e)}"
            )

    async def batch_extract(self, pdf_paths: List[Path]) -> List[Dict[str, Any]]:
        """複数のPDFを一括抽出"""
        try:
            tasks = []
            for pdf_path in pdf_paths:
                task = self.extract_text(
                    PDFExtractionRequest(
                        file_path=str(pdf_path), extraction_type="both"
                    )
                )
                tasks.append(task)

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # エラーを処理
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    processed_results.append(
                        {
                            "file_path": str(pdf_paths[i]),
                            "error": str(result),
                            "success": False,
                        }
                    )
                else:
                    processed_results.append(
                        {
                            "file_path": str(pdf_paths[i]),
                            "result": result,
                            "success": True,
                        }
                    )

            return processed_results

        except Exception as e:
            raise PDFExtractionError(f"Failed to batch extract PDFs: {str(e)}")
