"""
Automated Unit and Integration Tests for Topic Discovery & Word Cloud Engine in SIH26023.
Verifies topic clustering, term frequency calculation, stopword filtering,
subsidiary/scope filtering, and REST API endpoints.
"""

import unittest
from flask import json
from app import create_app
from database.db import get_db, init_db
from services.topic_service import topic_service

class TestTopicDiscoveryAndWordCloud(unittest.TestCase):
    """Test suite for TopicService and topic REST routes."""

    @classmethod
    def setUpClass(cls):
        """Set up Flask test client and ensure test database has sample chunks."""
        cls.app = create_app()
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            init_db()
            with get_db() as conn:
                # Insert test document for BCCL
                conn.execute(
                    """
                    INSERT INTO documents (id, filename, original_name, file_type, file_size, file_path, subsidiary, reporting_period, status)
                    VALUES (901, 'bccl_test.pdf', 'BCCL_Q3_Report.pdf', 'pdf', 1024, 'dummy_path_1', 'BCCL', 'Q3 FY25', 'PROCESSED')
                    ON CONFLICT (id) DO UPDATE SET subsidiary='BCCL', status='PROCESSED'
                    """
                )
                conn.execute(
                    """
                    INSERT INTO document_chunks (document_id, chunk_index, page_number, content, section_title)
                    VALUES (901, 0, 1, 'BCCL reported coal production dispatch target achievement of 14.5 MT and significant overburden excavation in Jharia.', 'Production Summary')
                    """
                )
                # Insert test document for ECL
                conn.execute(
                    """
                    INSERT INTO documents (id, filename, original_name, file_type, file_size, file_path, subsidiary, reporting_period, status)
                    VALUES (902, 'ecl_test.pdf', 'ECL_Geology_Report.pdf', 'pdf', 2048, 'dummy_path_2', 'ECL', 'Q3 FY25', 'PROCESSED')
                    ON CONFLICT (id) DO UPDATE SET subsidiary='ECL', status='PROCESSED'
                    """
                )
                conn.execute(
                    """
                    INSERT INTO document_chunks (document_id, chunk_index, page_number, content, section_title)
                    VALUES (902, 0, 1, 'ECL Rajmahal exploration identified borehole seam drilling reserves with high moisture and ash strata grade.', 'Geological Exploration')
                    """
                )
                conn.commit()

    def test_discover_topics_unfiltered(self):
        """Verify discover_topics discovers multiple clusters from chunks."""
        with self.app.app_context():
            topics = topic_service.discover_topics()
            self.assertIsInstance(topics, list)
            self.assertGreater(len(topics), 0)
            
            # Check topic structure
            first_topic = topics[0]
            self.assertIn("topic_name", first_topic)
            self.assertIn("frequency", first_topic)
            self.assertIn("keywords", first_topic)
            self.assertIn("related_documents", first_topic)
            self.assertIn("coherence_score", first_topic)

    def test_discover_topics_filtered_by_subsidiary(self):
        """Verify discover_topics strictly filters source documents when subsidiary is provided."""
        with self.app.app_context():
            bccl_topics = topic_service.discover_topics(subsidiary="BCCL")
            with get_db() as conn:
                bccl_doc_names = {
                    r["original_name"] for r in conn.execute("SELECT original_name FROM documents WHERE subsidiary = 'BCCL'").fetchall()
                }
                for t in bccl_topics:
                    for doc in t["related_documents"]:
                        self.assertIn(doc, bccl_doc_names)

    def test_get_word_cloud_data_metadata_and_structure(self):
        """Verify word cloud calculation returns structured metadata and collision-ready sizes."""
        with self.app.app_context():
            words = topic_service.get_word_cloud_data(max_terms=20)
            self.assertIsInstance(words, list)
            self.assertGreater(len(words), 0)

            first_word = words[0]
            self.assertIn("text", first_word)
            self.assertIn("weight", first_word)
            self.assertIn("size", first_word)
            self.assertIn("topic", first_word)
            self.assertIn("documents", first_word)
            self.assertIn("document_ids", first_word)
            self.assertGreaterEqual(first_word["size"], 13)
            self.assertLessEqual(first_word["size"], 34)

    def test_get_word_cloud_filtered_by_subsidiary(self):
        """Verify word cloud returns only words from the filtered subsidiary."""
        with self.app.app_context():
            bccl_words = topic_service.get_word_cloud_data(subsidiary="BCCL")
            with get_db() as conn:
                bccl_doc_names = {
                    r["original_name"] for r in conn.execute("SELECT original_name FROM documents WHERE subsidiary = 'BCCL'").fetchall()
                }
                bccl_docs = {d for w in bccl_words for d in w["documents"]}
                for doc in bccl_docs:
                    self.assertIn(doc, bccl_doc_names)

    def test_empty_filter_graceful_handling(self):
        """Verify topic discovery and word cloud return empty lists for non-existent subsidiary."""
        with self.app.app_context():
            non_existent_topics = topic_service.discover_topics(subsidiary="NON_EXISTENT_SUB")
            self.assertEqual(non_existent_topics, [])

            non_existent_words = topic_service.get_word_cloud_data(subsidiary="NON_EXISTENT_SUB")
            self.assertEqual(non_existent_words, [])

    def test_api_topics_endpoint(self):
        """Verify GET /api/topics endpoint returns valid JSON with filter support."""
        res = self.client.get("/api/topics?subsidiary=BCCL")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "success")
        self.assertIn("topics", data)
        self.assertIn("count", data)

    def test_api_wordcloud_endpoint(self):
        """Verify GET /api/topics/wordcloud endpoint returns valid JSON."""
        res = self.client.get("/api/topics/wordcloud?subsidiary=BCCL")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "success")
        self.assertIn("words", data)
        self.assertIn("count", data)

if __name__ == "__main__":
    unittest.main()
