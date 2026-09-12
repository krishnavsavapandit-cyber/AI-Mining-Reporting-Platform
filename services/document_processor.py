"""
Deterministic Document Ingestion & Extraction Engine for SIH26023.
Supports PDF (digital & scanned), DOCX, CSV, XLSX, and Images.
Extracts structured text, tables, computes SHA-256 fingerprint checksums,
and creates page-grounded searchable chunks.
"""

import os
import re
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import pymupdf  # PyMuPDF
import docx
import pandas as pd
from PIL import Image
from services.ocr import ocr_service, extract_text_from_image, extract_text_from_pixmap

logger = logging.getLogger(__name__)

def compute_file_sha256(file_path: Path) -> str:
    """Calculate SHA-256 fingerprint for document deduplication."""
    if not file_path.exists():
        return ""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

class DocumentProcessor:
    """Deterministic parser and chunker for multi-format mining documents."""

    def process_document(self, file_path: Path, original_filename: str) -> Dict[str, Any]:
        """
        Process uploaded file based on its extension.
        Returns dictionary with pages, full_text, tables, chunks, metadata, and SHA-256 checksum.
        """
        if not file_path.exists():
            return {
                "status": "FAILED",
                "error": f"File does not exist at {file_path}",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0,
                "checksum": ""
            }

        checksum = compute_file_sha256(file_path)
        ext = file_path.suffix.lower().lstrip(".")
        
        try:
            if ext == "pdf":
                res = self._process_pdf(file_path, original_filename)
            elif ext in ["docx", "doc"]:
                res = self._process_docx(file_path, original_filename)
            elif ext == "csv":
                res = self._process_csv(file_path, original_filename)
            elif ext in ["xlsx", "xls"]:
                res = self._process_excel(file_path, original_filename)
            elif ext in ["png", "jpg", "jpeg"]:
                res = self._process_image(file_path, original_filename)
            elif ext == "txt":
                res = self._process_text(file_path, original_filename)
            else:
                return {
                    "status": "FAILED",
                    "error": f"Unsupported file extension: .{ext}",
                    "pages": [],
                    "full_text": "",
                    "chunks": [],
                    "page_count": 0,
                    "checksum": checksum
                }

            res["checksum"] = checksum
            return res
        except Exception as e:
            logger.error(f"Failed to process document {original_filename}: {e}", exc_info=True)
            return {
                "status": "FAILED",
                "error": f"Document parsing error: {str(e)}",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0,
                "checksum": checksum
            }

    def _process_pdf(self, file_path: Path, filename: str) -> Dict[str, Any]:
        """Extract text and tables from PDF using PyMuPDF and modular OCR fallback."""
        if file_path.stat().st_size == 0:
            return {
                "status": "FAILED",
                "error": "PDF file is empty (0 bytes).",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        try:
            doc = pymupdf.open(str(file_path))
        except Exception as e:
            return {
                "status": "FAILED",
                "error": f"Malformed or corrupted PDF file: {str(e)}",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        if getattr(doc, "is_encrypted", False):
            doc.close()
            return {
                "status": "FAILED",
                "error": "Encrypted or password-protected PDF cannot be processed without authorization.",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        if len(doc) == 0:
            doc.close()
            return {
                "status": "FAILED",
                "error": "PDF document contains 0 pages.",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        pages_data = []
        full_text_parts = []
        tables_data = []
        ocr_performed = False

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text").strip()
            ocr_meta = None
            
            # OCR fallback for scanned pages with minimal or no digital text
            if len(text) < 40:
                try:
                    pix = page.get_pixmap(dpi=150)
                    page_ocr_res = ocr_service.process_page(pix, page_number=page_num + 1, filename=filename)
                    if page_ocr_res.text:
                        text = page_ocr_res.text
                    ocr_meta = page_ocr_res.to_dict()
                    ocr_performed = True
                except Exception as ocr_err:
                    logger.warning(f"OCR processing fallback failed on page {page_num + 1}: {ocr_err}")

            # Try extracting tables
            try:
                tabs = page.find_tables()
                for t_idx, tab in enumerate(tabs.tables):
                    df = tab.extract()
                    if df:
                        tables_data.append({
                            "page": page_num + 1,
                            "table_index": t_idx + 1,
                            "data": df
                        })
            except Exception:
                pass

            page_entry = {
                "page_number": page_num + 1,
                "text": text
            }
            if ocr_meta:
                page_entry["ocr_metadata"] = ocr_meta

            pages_data.append(page_entry)
            full_text_parts.append(text)

        doc.close()
        full_text = "\n\n".join(full_text_parts)
        chunks = self._create_chunks(pages_data, filename)

        return {
            "status": "SUCCESS",
            "page_count": len(pages_data),
            "pages": pages_data,
            "full_text": full_text,
            "tables": tables_data,
            "chunks": chunks,
            "ocr_performed": ocr_performed
        }

    def _process_docx(self, file_path: Path, filename: str) -> Dict[str, Any]:
        """Extract text and tables from DOCX using python-docx."""
        if file_path.stat().st_size == 0:
            return {
                "status": "FAILED",
                "error": "DOCX file is empty (0 bytes).",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        try:
            doc = docx.Document(str(file_path))
        except Exception as e:
            return {
                "status": "FAILED",
                "error": f"Malformed or corrupted DOCX file: {str(e)}",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        
        tables_text = []
        for t_idx, table in enumerate(doc.tables):
            rows_data = []
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                if any(cells):
                    rows_data.append(" | ".join(cells))
            if rows_data:
                tables_text.append(f"[Table {t_idx+1}]\n" + "\n".join(rows_data))

        all_text = "\n\n".join(paragraphs + tables_text)
        
        # Approximate page segmentation (approx 2000 chars per page)
        pages_data = []
        page_size = 2000
        for i in range(0, max(len(all_text), 1), page_size):
            page_text = all_text[i:i + page_size]
            pages_data.append({
                "page_number": (i // page_size) + 1,
                "text": page_text
            })

        chunks = self._create_chunks(pages_data, filename)
        return {
            "status": "SUCCESS",
            "page_count": len(pages_data),
            "pages": pages_data,
            "full_text": all_text,
            "tables": tables_text,
            "chunks": chunks
        }

    def _process_csv(self, file_path: Path, filename: str) -> Dict[str, Any]:
        """Extract and structure CSV tabular data supporting multiple delimiters and encodings."""
        if file_path.stat().st_size == 0:
            return {
                "status": "FAILED",
                "error": "CSV file is empty (0 bytes).",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        df = None
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
        delimiters = [None, ',', ';', '\t', '|']

        for enc in encodings:
            for sep in delimiters:
                try:
                    if sep is None:
                        df = pd.read_csv(str(file_path), encoding=enc, sep=sep, engine='python', on_bad_lines='skip')
                    else:
                        df = pd.read_csv(str(file_path), encoding=enc, sep=sep, on_bad_lines='skip')
                    if df is not None and not df.empty:
                        break
                except Exception:
                    continue
            if df is not None and not df.empty:
                break

        if df is None or df.empty:
            # Try plain text read if dataframe parsing returned empty
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    raw_lines = [line.strip() for line in f if line.strip()]
                if not raw_lines:
                    return {
                        "status": "FAILED",
                        "error": "CSV file contains no readable data rows.",
                        "pages": [],
                        "full_text": "",
                        "chunks": [],
                        "page_count": 0
                    }
                df = pd.DataFrame({"Content": raw_lines})
            except Exception as e:
                return {
                    "status": "FAILED",
                    "error": f"Unable to parse CSV file: {str(e)}",
                    "pages": [],
                    "full_text": "",
                    "chunks": [],
                    "page_count": 0
                }

        summary_repr = f"CSV Dataset: {filename}\nColumns: {', '.join([str(c) for c in df.columns])}\nTotal Rows: {len(df)}\n\n"
        
        row_summaries = []
        for idx, row in df.head(100).iterrows():
            row_items = [f"{col}: {val}" for col, val in row.items() if pd.notna(val)]
            row_summaries.append(f"Row {idx+1}: {', '.join(row_items)}")
        
        full_text = summary_repr + "\n".join(row_summaries)
        pages_data = [{"page_number": 1, "text": full_text}]
        chunks = self._create_chunks(pages_data, filename)

        return {
            "status": "SUCCESS",
            "page_count": 1,
            "pages": pages_data,
            "full_text": full_text,
            "tables": [df.head(50).to_dict(orient="records")],
            "chunks": chunks
        }

    def _process_excel(self, file_path: Path, filename: str) -> Dict[str, Any]:
        """Extract and structure Excel sheets with multi-sheet and empty-sheet safeguards."""
        if file_path.stat().st_size == 0:
            return {
                "status": "FAILED",
                "error": "Excel file is empty (0 bytes).",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        try:
            excel_file = pd.ExcelFile(str(file_path))
        except Exception as e:
            return {
                "status": "FAILED",
                "error": f"Malformed or corrupted Excel workbook: {str(e)}",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        pages_data = []
        full_text_parts = []
        tables = []

        if not excel_file.sheet_names:
            return {
                "status": "FAILED",
                "error": "Excel workbook contains no sheets.",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        for idx, sheet_name in enumerate(excel_file.sheet_names):
            try:
                df = excel_file.parse(sheet_name)
            except Exception as parse_err:
                logger.warning(f"Failed to parse sheet '{sheet_name}' in {filename}: {parse_err}")
                continue

            sheet_text = f"Sheet: {sheet_name}\nColumns: {', '.join([str(c) for c in df.columns])}\nRows: {len(df)}\n\n"
            
            row_summaries = []
            for r_idx, row in df.head(100).iterrows():
                row_items = [f"{col}: {val}" for col, val in row.items() if pd.notna(val)]
                row_summaries.append(f"Row {r_idx+1}: {', '.join(row_items)}")
            
            content = sheet_text + "\n".join(row_summaries)
            pages_data.append({
                "page_number": idx + 1,
                "text": content,
                "section": sheet_name
            })
            full_text_parts.append(content)
            tables.append({"sheet": sheet_name, "records": df.head(50).to_dict(orient="records")})

        if not pages_data:
            pages_data = [{"page_number": 1, "text": f"Excel file {filename} parsed with no readable content."}]

        full_text = "\n\n".join(full_text_parts)
        chunks = self._create_chunks(pages_data, filename)

        return {
            "status": "SUCCESS",
            "page_count": len(pages_data),
            "pages": pages_data,
            "full_text": full_text,
            "tables": tables,
            "chunks": chunks
        }

    def _process_image(self, file_path: Path, filename: str) -> Dict[str, Any]:
        """Process image with modular OCR pipeline."""
        page_ocr_res = ocr_service.process_image_file(file_path)
        text = page_ocr_res.text
        pages_data = [{
            "page_number": 1,
            "text": text,
            "ocr_metadata": page_ocr_res.to_dict()
        }]
        chunks = self._create_chunks(pages_data, filename)

        return {
            "status": "SUCCESS",
            "page_count": 1,
            "pages": pages_data,
            "full_text": text,
            "tables": [],
            "chunks": chunks,
            "ocr_performed": True,
            "ocr_metadata": page_ocr_res.to_dict()
        }

    def _process_text(self, file_path: Path, filename: str) -> Dict[str, Any]:
        """Process raw text file."""
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            full_text = f.read()

        pages_data = [{"page_number": 1, "text": full_text}]
        chunks = self._create_chunks(pages_data, filename)

        return {
            "status": "SUCCESS",
            "page_count": 1,
            "pages": pages_data,
            "full_text": full_text,
            "tables": [],
            "chunks": chunks
        }

    def _create_chunks(self, pages_data: List[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
        """
        Create overlapping text chunks with strict page and section provenance.
        Preserves OCR engine, quality, and warning metadata where applicable.
        Chunk size ~500 chars, overlap ~100 chars.
        """
        chunks = []
        chunk_idx = 0

        for p_data in pages_data:
            page_num = p_data.get("page_number", 1)
            text = p_data.get("text", "")
            ocr_meta = p_data.get("ocr_metadata", {})
            if not text.strip():
                continue

            current_section = p_data.get("section", "General Content")
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            
            for para in paragraphs:
                if len(para) < 40 and any(kw in para.lower() for kw in ["production", "geology", "safety", "equipment", "subsidiary", "summary", "monthly", "target"]):
                    current_section = para

                if len(para) <= 600:
                    chunk_item = {
                        "chunk_index": chunk_idx,
                        "page_number": page_num,
                        "section_title": current_section,
                        "content": para,
                        "char_start": 0,
                        "char_end": len(para),
                        "token_count": len(para.split())
                    }
                    if ocr_meta:
                        chunk_item["ocr_engine"] = ocr_meta.get("engine_used")
                        chunk_item["ocr_quality"] = ocr_meta.get("ocr_quality")
                        chunk_item["ocr_confidence"] = ocr_meta.get("confidence")
                        chunk_item["warnings"] = ocr_meta.get("warnings", [])

                    chunks.append(chunk_item)
                    chunk_idx += 1
                else:
                    step = 450
                    for i in range(0, len(para), step):
                        window = para[i:i + 550]
                        chunk_item = {
                            "chunk_index": chunk_idx,
                            "page_number": page_num,
                            "section_title": current_section,
                            "content": window,
                            "char_start": i,
                            "char_end": i + len(window),
                            "token_count": len(window.split())
                        }
                        if ocr_meta:
                            chunk_item["ocr_engine"] = ocr_meta.get("engine_used")
                            chunk_item["ocr_quality"] = ocr_meta.get("ocr_quality")
                            chunk_item["ocr_confidence"] = ocr_meta.get("confidence")
                            chunk_item["warnings"] = ocr_meta.get("warnings", [])

                        chunks.append(chunk_item)
                        chunk_idx += 1

        return chunks

# Global DocumentProcessor instance
document_processor = DocumentProcessor()
