"""
Deterministic Document Ingestion & Extraction Engine for SIH26023.
Supports PDF (digital & scanned), DOCX, CSV, XLSX, and Images.
Extracts structured text, tables, and creates page-grounded searchable chunks.
"""

import os
import re
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import pymupdf  # PyMuPDF
import docx
import pandas as pd
from PIL import Image
from services.ocr import ocr_service, extract_text_from_image, extract_text_from_pixmap

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Deterministic parser and chunker for multi-format mining documents."""

    def process_document(self, file_path: Path, original_filename: str) -> Dict[str, Any]:
        """
        Process uploaded file based on its extension.
        Returns dictionary with pages, full_text, tables, chunks, and metadata.
        """
        if not file_path.exists():
            return {
                "status": "FAILED",
                "error": f"File does not exist at {file_path}",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

        ext = file_path.suffix.lower().lstrip(".")
        
        try:
            if ext == "pdf":
                return self._process_pdf(file_path, original_filename)
            elif ext in ["docx", "doc"]:
                return self._process_docx(file_path, original_filename)
            elif ext == "csv":
                return self._process_csv(file_path, original_filename)
            elif ext in ["xlsx", "xls"]:
                return self._process_excel(file_path, original_filename)
            elif ext in ["png", "jpg", "jpeg"]:
                return self._process_image(file_path, original_filename)
            elif ext == "txt":
                return self._process_text(file_path, original_filename)
            else:
                return {
                    "status": "FAILED",
                    "error": f"Unsupported file extension: .{ext}",
                    "pages": [],
                    "full_text": "",
                    "chunks": [],
                    "page_count": 0
                }
        except Exception as e:
            logger.error(f"Failed to process document {original_filename}: {e}", exc_info=True)
            return {
                "status": "FAILED",
                "error": f"Document parsing error: {str(e)}",
                "pages": [],
                "full_text": "",
                "chunks": [],
                "page_count": 0
            }

    def _process_pdf(self, file_path: Path, filename: str) -> Dict[str, Any]:
        """Extract text and tables from PDF using PyMuPDF and modular OCR fallback."""
        doc = pymupdf.open(str(file_path))
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
                pix = page.get_pixmap(dpi=150)
                page_ocr_res = ocr_service.process_page(pix, page_number=page_num + 1, filename=filename)
                if page_ocr_res.text:
                    text = page_ocr_res.text
                ocr_meta = page_ocr_res.to_dict()
                ocr_performed = True

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
        doc = docx.Document(str(file_path))
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
        """Extract and structure CSV tabular data."""
        df = pd.read_csv(str(file_path))
        text_repr = df.to_string(index=False)
        summary_repr = f"CSV Dataset: {filename}\nColumns: {', '.join(df.columns)}\nTotal Rows: {len(df)}\n\n"
        
        # Row summaries
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
            "tables": [df.to_dict(orient="records")],
            "chunks": chunks
        }

    def _process_excel(self, file_path: Path, filename: str) -> Dict[str, Any]:
        """Extract and structure Excel sheets."""
        excel_file = pd.ExcelFile(str(file_path))
        pages_data = []
        full_text_parts = []
        tables = []

        for idx, sheet_name in enumerate(excel_file.sheet_names):
            df = excel_file.parse(sheet_name)
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

            # Detect possible section headers
            current_section = p_data.get("section", "General Content")

            # Break page into paragraphs or overlapping windows
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
                    # Sliding window for long paragraphs
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
