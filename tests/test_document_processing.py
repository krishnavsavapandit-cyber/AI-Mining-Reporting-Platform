"""
Unit tests for deterministic document processing and extraction (PDF, DOCX, CSV, XLSX).
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from services.document_processor import document_processor
from services.extraction_service import extraction_service
from config.settings import SAMPLE_DATA_DIR

class TestDocumentProcessing(unittest.TestCase):

    def test_pdf_extraction(self):
        pdf_path = SAMPLE_DATA_DIR / "ECL_Rajmahal_Monthly_Production_May_2025.pdf"
        if not pdf_path.exists():
            from sample_data.generator import generate_sample_documents
            generate_sample_documents()

        res = document_processor.process_document(pdf_path, pdf_path.name)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertGreater(res["page_count"], 0)
        self.assertIn("Rajmahal", res["full_text"])
        self.assertGreater(len(res["chunks"]), 0)

        meta_res = extraction_service.extract_metadata_and_records(res["full_text"], res["pages"])
        self.assertEqual(meta_res["subsidiary"], "ECL")
        self.assertEqual(meta_res["mine"], "Rajmahal")
        self.assertEqual(meta_res["reporting_period"], "May 2025")
        
        # Verify production record extracted
        prod_records = [r for r in meta_res["records"] if r["field_name"] == "Coal Production"]
        self.assertGreater(len(prod_records), 0)
        self.assertAlmostEqual(prod_records[0]["numeric_value"], 1.32, places=2)

    def test_docx_extraction(self):
        docx_path = SAMPLE_DATA_DIR / "BCCL_Jharia_Coalfield_Geological_Survey_Report_2025.docx"
        res = document_processor.process_document(docx_path, docx_path.name)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertIn("Jharia", res["full_text"])

        meta_res = extraction_service.extract_metadata_and_records(res["full_text"], res["pages"])
        self.assertEqual(meta_res["subsidiary"], "BCCL")

    def test_csv_extraction(self):
        csv_path = SAMPLE_DATA_DIR / "CMPDI_Drilling_and_Seam_Exploration_Talcher_Block.csv"
        res = document_processor.process_document(csv_path, csv_path.name)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertIn("Borehole_ID", res["full_text"])

    def test_xlsx_extraction(self):
        xlsx_path = SAMPLE_DATA_DIR / "SECL_Korba_Operational_HEMM_Performance_Q1.xlsx"
        res = document_processor.process_document(xlsx_path, xlsx_path.name)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertIn("Gevra", res["full_text"])

    def test_corrupt_file_graceful_handling(self):
        corrupt_path = SAMPLE_DATA_DIR / "corrupt_dummy.pdf"
        with open(corrupt_path, "wb") as f:
            f.write(b"NOT_A_REAL_PDF_DATA_GARBAGE")

        res = document_processor.process_document(corrupt_path, "corrupt_dummy.pdf")
        self.assertEqual(res["status"], "FAILED")
        self.assertIn("error", res)

        # Cleanup
        if corrupt_path.exists():
            corrupt_path.unlink()

if __name__ == "__main__":
    unittest.main()
