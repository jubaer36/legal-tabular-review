import pytest
import os
import shutil
import tempfile
from vector_store import process_and_store_document, query_document, reset_client

@pytest.fixture
def test_db_path():
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    # Teardown
    reset_client()
    try:
        shutil.rmtree(temp_dir)
    except Exception as e:
        print(f"Could not delete temp dir {temp_dir}: {e}")

def test_vector_store_workflow(test_db_path):
    doc_id = 123
    text = "This is a sample contract. The parties are Alice and Bob. The effective date is January 1st, 2024."
    
    # Increase chunk size slightly or handle splits
    process_and_store_document(doc_id, text, chunk_size=100, chunk_overlap=10, db_path=test_db_path)
    
    # Query
    results = query_document(doc_id, "Who are the parties?", n_results=2, db_path=test_db_path)
    
    assert len(results) > 0
    # Combine results to check for content if it was split
    combined_results = " ".join(results)
    assert "Alice" in combined_results
    assert "Bob" in combined_results
    
def test_query_filtering(test_db_path):
    doc_id_1 = 1
    doc_id_2 = 2
    text_1 = "Document 1 content about apples."
    text_2 = "Document 2 content about bananas."
    
    process_and_store_document(doc_id_1, text_1, db_path=test_db_path)
    process_and_store_document(doc_id_2, text_2, db_path=test_db_path)
    
    # Query for "bananas" but restricted to doc 1
    results_1 = query_document(doc_id_1, "bananas", db_path=test_db_path)
    
    for r in results_1:
        assert "bananas" not in r
        
    # Query for "bananas" restricted to doc 2
    results_2 = query_document(doc_id_2, "bananas", db_path=test_db_path)
    assert any("bananas" in r for r in results_2)
