"""
Gemini API Client
"""

import os
import google.generativeai as genai
from typing import Optional, Dict, Any
from PIL import Image
import base64
import io

from .exceptions import GeminiAPIError


class GeminiClient:
    """Gemini APIクライアント"""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise GeminiAPIError("GEMINI_API_KEY environment variable is required")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    async def generate_text(self, prompt: str) -> str:
        """テキスト生成"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise GeminiAPIError(f"Failed to generate text: {str(e)}")

    async def analyze_image(self, image: Image.Image, prompt: str) -> str:
        """画像分析"""
        try:
            response = self.model.generate_content([prompt, image])
            return response.text
        except Exception as e:
            raise GeminiAPIError(f"Failed to analyze image: {str(e)}")

    async def generate_content(self, content: Any) -> str:
        """コンテンツ生成"""
        try:
            response = self.model.generate_content(content)
            return response.text
        except Exception as e:
            raise GeminiAPIError(f"Failed to generate content: {str(e)}")
