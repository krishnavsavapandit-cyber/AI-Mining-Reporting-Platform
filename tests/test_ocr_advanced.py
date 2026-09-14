"""
Advanced OCR Subsystem Test Suite for SIH26023.
Verifies modular OCR engine routing, preprocessing filters, quality heuristics,
fallback chains, low-confidence flagging, provenance preservation, and API endpoints.
"""

import os
import unittest
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

from app import create_app
from database.db import get_db, init_db
from services.ocr.models import OCREngineType, OCRQualityLevel, PageOCRResult, QualityAssessment
from services.ocr.quality import QualityDetector
from services.ocr.preprocessing import ImagePreprocessor
from services.ocr.tesseract_engine import TesseractEngine
from services.ocr.advanced_engine import AdvancedOCREngine
from services.ocr.ocr_service import OCRService, ocr_service
from services.document_processor import document_processor

class TestAdvancedOCR(unittest.TestCase):
    """Comprehensive test suite for Advanced OCR subsystem."""

    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.test_img_dir = Path("sample_data/ocr_test_assets")
        self.test_img_dir.mkdir(parents=True, exist_ok=True)

        # Create synthetic test images
        self._create_synthetic_test_images()

    def _create_synthetic_test_images(self):
        """Generate test images for normal, low-contrast, noisy, and rotated conditions."""
        # Helper to safely save
        def _safe_save(img, path):
            try:
                img.save(path)
            except PermissionError:
                pass

        # 1. Clear Normal Image
        self.normal_path = self.test_img_dir / "test_normal.png"
        if not self.normal_path.exists():
            img_normal = Image.new("RGB", (800, 300), color=(255, 255, 255))
            d_normal = ImageDraw.Draw(img_normal)
            d_normal.text((40, 80), "ECL RAJMAHAL COAL PRODUCTION: 3.42 MT", fill=(0, 0, 0))
            _safe_save(img_normal, self.normal_path)

        # 2. Low Contrast Faded Image
        self.faded_path = self.test_img_dir / "test_faded.png"
        if not self.faded_path.exists():
            img_faded = Image.new("RGB", (800, 300), color=(220, 220, 220))
            d_faded = ImageDraw.Draw(img_faded)
            d_faded.text((40, 80), "ECL OVERBURDEN REMOVAL: 8.15 M.Cu.M", fill=(190, 190, 190))
            _safe_save(img_faded, self.faded_path)

        # 3. Noisy Scan Image
        self.noisy_path = self.test_img_dir / "test_noisy.png"
        if not self.noisy_path.exists():
            arr = np.random.randint(180, 255, (300, 800), dtype=np.uint8)
            img_noisy = Image.fromarray(arr).convert("RGB")
            d_noisy = ImageDraw.Draw(img_noisy)
            d_noisy.text((40, 80), "SECL GEVRA OCP PRODUCTION: 12.50 MT", fill=(0, 0, 0))
            _safe_save(img_noisy, self.noisy_path)

        # 4. Rotated Image (90 degrees)
        self.rotated_path = self.test_img_dir / "test_rotated.png"
        if not self.rotated_path.exists():
            img_normal = Image.new("RGB", (800, 300), color=(255, 255, 255))
            d_normal = ImageDraw.Draw(img_normal)
            d_normal.text((40, 80), "ECL RAJMAHAL COAL PRODUCTION: 3.42 MT", fill=(0, 0, 0))
            img_rot = img_normal.rotate(90, expand=True)
            _safe_save(img_rot, self.rotated_path)

    def test_image_preprocessor_grayscale_and_contrast(self):
        """Verify ImagePreprocessor applies grayscale conversion and contrast enhancement without errors."""
        img = Image.open(self.faded_path)
        processed_img, steps = ImagePreprocessor.apply_pipeline(img, ["grayscale", "contrast", "normalize_resolution"])
        
        self.assertEqual(processed_img.mode, "L")
        self.assertIn("grayscale_conversion", steps)
        self.assertIn("contrast_enhancement", steps)
        self.assertIn("resolution_normalization_300dpi", steps)
        self.assertGreaterEqual(processed_img.width, 1600)

    def test_image_preprocessor_otsu_binarization(self):
        """Verify pure NumPy Otsu adaptive binarization converts image to high-contrast binary map."""
        img = Image.open(self.normal_path)
        bin_img = ImagePreprocessor.adaptive_threshold(img)
        arr = np.array(bin_img)
        
        # Binary image should only contain 0 and 255
        unique_vals = set(np.unique(arr))
        self.assertTrue(unique_vals.issubset({0, 255}))

    def test_image_preprocessor_rotation_correction(self):
        """Verify rotation correction rotates image back to upright orientation."""
        img = Image.open(self.rotated_path)
        w_orig, h_orig = img.size  # Tall since rotated 90 deg
        self.assertGreater(h_orig, w_orig)

        corrected = ImagePreprocessor.correct_rotation(img, 90)
        w_corr, h_corr = corrected.size
        self.assertGreater(w_corr, h_corr)

    def test_quality_detector_heuristics(self):
        """Verify QualityDetector accurately evaluates contrast, noise, and recommended engine."""
        # Normal image
        img_normal = Image.open(self.normal_path)
        qa_normal = QualityDetector.assess_image(img_normal)
        self.assertTrue(qa_normal.ocr_required)
        self.assertIn(qa_normal.quality_level, [OCRQualityLevel.HIGH.value, OCRQualityLevel.MEDIUM.value])

        # Blank image
        img_blank = Image.new("RGB", (400, 300), color=(255, 255, 255))
        qa_blank = QualityDetector.assess_image(img_blank)
        self.assertFalse(qa_blank.ocr_required)
        self.assertEqual(qa_blank.quality_level, OCRQualityLevel.NOT_REQUIRED.value)

    def test_engine_selection_strategy(self):
        """Verify OCRService dynamically selects Tesseract vs Advanced engine based on quality assessment."""
        service = OCRService()
        
        # High quality -> Tesseract
        qa_high = QualityAssessment(ocr_required=True, quality_level=OCRQualityLevel.HIGH.value)
        engine_high = service.select_ocr_engine(qa_high, requested_mode="AUTO")
        self.assertEqual(engine_high.name, "TesseractEngine")

        # Mock advanced engine availability for deterministic routing test
        orig_adv_avail = service.advanced_engine.is_available
        try:
            service.advanced_engine.is_available = lambda: True
            
            # Low quality / noisy scan -> Advanced Engine (when available)
            qa_low = QualityAssessment(ocr_required=True, quality_level=OCRQualityLevel.LOW.value)
            engine_low = service.select_ocr_engine(qa_low, requested_mode="AUTO")
            self.assertEqual(engine_low.name, "AdvancedOCREngine")

            # Explicit mode overrides
            engine_forced = service.select_ocr_engine(qa_high, requested_mode="ADVANCED")
            self.assertEqual(engine_forced.name, "AdvancedOCREngine")

            # When advanced is unavailable -> falls back to Tesseract
            service.advanced_engine.is_available = lambda: False
            engine_fallback = service.select_ocr_engine(qa_low, requested_mode="AUTO")
            self.assertEqual(engine_fallback.name, "TesseractEngine")
        finally:
            service.advanced_engine.is_available = orig_adv_avail


    def test_advanced_engine_execution_and_provenance(self):
        """Verify AdvancedOCREngine runs multi-pass extraction and returns confidence & warnings."""
        adv_engine = AdvancedOCREngine()
        if not adv_engine.is_available():
            self.skipTest("OCR engine backend not available in current test environment.")

        img = Image.open(self.normal_path)
        text, conf, warnings = adv_engine.extract_text_and_confidence(img)
        self.assertIsInstance(text, str)
        self.assertIsInstance(conf, float)
        self.assertIsInstance(warnings, list)
        self.assertGreater(conf, 0.0)

    def test_ocr_service_fallback_when_advanced_fails(self):
        """Verify OCRService gracefully falls back to Tesseract if AdvancedOCREngine encounters an error."""
        service = OCRService()
        
        # Mock advanced engine failure
        original_extract = service.advanced_engine.extract_text_and_confidence
        try:
            service.advanced_engine.extract_text_and_confidence = lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("Simulated Advanced OCR Memory Crash"))
            
            img = Image.open(self.normal_path)
            res = service.process_page(img, page_number=1, filename="mock_scan.pdf", engine_mode="ADVANCED")
            
            self.assertIsInstance(res, PageOCRResult)
            # Should have fallen back to Tesseract or recorded failure cleanly without raising exception
            if service.tesseract_engine.is_available():
                self.assertIn("TesseractEngine", res.engine_used)
                self.assertTrue(any("fallback" in w.lower() for w in res.warnings) or "Fallback" in res.engine_used)
        finally:
            service.advanced_engine.extract_text_and_confidence = original_extract

    def test_complete_ocr_failure_routes_to_human_review(self):
        """Verify that when all OCR engines fail or image is corrupt, result flags human_review_required=True."""
        service = OCRService()
        original_tess_avail = service.tesseract_engine.is_available
        original_adv_avail = service.advanced_engine.is_available

        try:
            service.tesseract_engine.is_available = lambda: False
            service.advanced_engine.is_available = lambda: False

            img = Image.open(self.normal_path)
            res = service.process_page(img, page_number=1, filename="corrupt_page.pdf")
            
            self.assertIsInstance(res, PageOCRResult)
            self.assertEqual(res.quality_level, OCRQualityLevel.FAILED.value)
            self.assertTrue(res.human_review_required)
            self.assertEqual(res.confidence, 0.0)
        finally:
            service.tesseract_engine.is_available = original_tess_avail
            service.advanced_engine.is_available = original_adv_avail

    def test_document_processor_image_chunk_provenance(self):
        """Verify DocumentProcessor embeds OCR engine and quality in chunk metadata for image files."""
        result = document_processor.process_document(self.normal_path, "test_normal.png")
        self.assertEqual(result.get("status"), "SUCCESS")
        self.assertTrue(result.get("ocr_performed"))
        
        chunks = result.get("chunks", [])
        if chunks:
            first_chunk = chunks[0]
            self.assertIn("ocr_engine", first_chunk)
            self.assertIn("ocr_quality", first_chunk)
            self.assertIn("ocr_confidence", first_chunk)
            self.assertIn("warnings", first_chunk)

    def test_ocr_status_api_endpoint(self):
        """Verify GET /api/documents/<id>/ocr-status returns structured JSON status."""
        # Query existing document (e.g. ID 1) or verify 404 for non-existent
        res_404 = self.client.get("/api/documents/99999/ocr-status")
        self.assertEqual(res_404.status_code, 404)

        # Check list of docs to find a valid ID
        list_res = self.client.get("/api/documents")
        docs = list_res.get_json().get("documents", [])
        if docs:
            doc_id = docs[0]["id"]
            res = self.client.get(f"/api/documents/{doc_id}/ocr-status")
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get("status"), "success")
            self.assertIn("ocr_status", data)
            ocr_meta = data["ocr_status"]
            self.assertIn("ocr_performed", ocr_meta)
            self.assertIn("quality", ocr_meta)

    def test_database_schema_and_startup_compatibility(self):
        """Verify database initialization and metadata storage execute without errors."""
        init_db()
        with get_db() as conn:
            # Confirm documents table has doc_metadata_json column
            cols = [col["name"] for col in conn.execute("PRAGMA table_info(documents)").fetchall()]
            self.assertIn("doc_metadata_json", cols)

if __name__ == "__main__":
    unittest.main()
