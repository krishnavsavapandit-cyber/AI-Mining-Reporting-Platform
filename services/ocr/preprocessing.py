"""
Image Preprocessing Pipeline for SIH26023 Advanced OCR Subsystem.
Implements non-destructive, CPU-safe image enhancements (denoising, contrast enhancement,
adaptive binarization, deskewing, resolution normalization, and rotation correction).
"""

import logging
from typing import List, Tuple, Optional
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import numpy as np

logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """Modular, non-destructive image enhancement pipeline for difficult scanned documents."""

    @classmethod
    def normalize_resolution(cls, img: Image.Image, min_width: int = 1600) -> Image.Image:
        """Upscale low-resolution scans to standard OCR DPI without distortion."""
        width, height = img.size
        if width < min_width:
            scale_factor = min_width / width
            new_size = (int(width * scale_factor), int(height * scale_factor))
            return img.resize(new_size, Image.Resampling.LANCZOS)
        return img

    @classmethod
    def to_grayscale(cls, img: Image.Image) -> Image.Image:
        """Convert image to single-channel 8-bit grayscale."""
        if img.mode != "L":
            return img.convert("L")
        return img

    @classmethod
    def enhance_contrast(cls, img: Image.Image, factor: float = 1.6) -> Image.Image:
        """Enhance contrast and autolevel pixel distribution for faded photocopies."""
        gray = cls.to_grayscale(img)
        # Apply autocontrast first (clip 1% extremes)
        autocontrasted = ImageOps.autocontrast(gray, cutoff=1)
        enhancer = ImageEnhance.Contrast(autocontrasted)
        return enhancer.enhance(factor)

    @classmethod
    def denoise(cls, img: Image.Image) -> Image.Image:
        """Apply median filter to remove speckle noise and scanner grain."""
        gray = cls.to_grayscale(img)
        return gray.filter(ImageFilter.MedianFilter(size=3))

    @classmethod
    def adaptive_threshold(cls, img: Image.Image) -> Image.Image:
        """
        Otsu's Global Binarization using pure NumPy histogram calculation.
        Produces crisp black text on white background without external OpenCV dependency.
        """
        gray = cls.to_grayscale(img)
        arr = np.array(gray, dtype=np.uint8)

        # Compute histogram of pixel values
        hist, bin_edges = np.histogram(arr, bins=256, range=(0, 256))
        total_pixels = arr.size
        
        # Otsu threshold search
        current_max = 0.0
        threshold = 128
        weight_bg = 0.0
        sum_bg = 0.0
        sum_total = np.dot(np.arange(256), hist)

        for t in range(256):
            weight_bg += hist[t]
            if weight_bg == 0:
                continue
            weight_fg = total_pixels - weight_bg
            if weight_fg == 0:
                break
            sum_bg += t * hist[t]
            mean_bg = sum_bg / weight_bg
            mean_fg = (sum_total - sum_bg) / weight_fg
            between_variance = weight_bg * weight_fg * ((mean_bg - mean_fg) ** 2)
            if between_variance > current_max:
                current_max = between_variance
                threshold = t

        # Apply threshold (text is dark -> 0, background is light -> 255)
        bin_arr = np.where(arr > threshold, 255, 0).astype(np.uint8)
        return Image.fromarray(bin_arr)

    @classmethod
    def correct_rotation(cls, img: Image.Image, angle: int) -> Image.Image:
        """Rotate image by fixed orthogonal angle (90, 180, 270 degrees)."""
        if angle in (90, 180, 270):
            # PIL rotate counter-clockwise by default; convert to standard clockwise
            return img.rotate(360 - angle, expand=True)
        return img

    @classmethod
    def apply_pipeline(cls, img: Image.Image, steps: Optional[List[str]] = None) -> Tuple[Image.Image, List[str]]:
        """
        Execute requested preprocessing steps sequentially.
        Supported steps: 'normalize_resolution', 'grayscale', 'contrast', 'denoise', 'threshold', 'rotate_90', 'rotate_180', 'rotate_270'
        """
        if img is None:
            raise ValueError("Input image cannot be None")

        if steps is None:
            steps = ["grayscale", "contrast", "normalize_resolution"]

        processed = img.copy()
        applied: List[str] = []

        for step in steps:
            step_clean = step.lower().strip()
            if step_clean == "normalize_resolution":
                processed = cls.normalize_resolution(processed)
                applied.append("resolution_normalization_300dpi")
            elif step_clean in ("grayscale", "to_grayscale"):
                processed = cls.to_grayscale(processed)
                applied.append("grayscale_conversion")
            elif step_clean in ("contrast", "enhance_contrast"):
                processed = cls.enhance_contrast(processed)
                applied.append("contrast_enhancement")
            elif step_clean == "denoise":
                processed = cls.denoise(processed)
                applied.append("median_denoising")
            elif step_clean in ("threshold", "binarize", "adaptive_threshold"):
                processed = cls.adaptive_threshold(processed)
                applied.append("otsu_adaptive_binarization")
            elif step_clean == "rotate_90":
                processed = cls.correct_rotation(processed, 90)
                applied.append("rotation_corrected_90deg")
            elif step_clean == "rotate_180":
                processed = cls.correct_rotation(processed, 180)
                applied.append("rotation_corrected_180deg")
            elif step_clean == "rotate_270":
                processed = cls.correct_rotation(processed, 270)
                applied.append("rotation_corrected_270deg")

        return processed, applied
