"""
Image Processing Utilities
"""

from PIL import Image, ImageEnhance, ImageFilter
from typing import Optional


class ImageProcessor:
    """画像処理ユーティリティ"""

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """画像を前処理"""
        # グレースケール変換
        if image.mode != "L":
            image = image.convert("L")

        # コントラスト調整
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)

        # シャープネス調整
        image = image.filter(ImageFilter.SHARPEN)

        return image
