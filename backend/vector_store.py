import chromadb
from chromadb.config import Settings
import os
import uuid
from typing import List, Dict

# Persist data in a 'chroma_db' folder inside 'data'
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DEFAULT_CHROMA_DB_DIR = os.path.join(DATA_DIR, "chroma_db")

_client = None

def get_chroma_client(path: str = DEFAULT_CHROMA_DB_DIR):
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=path)
    return _client

def reset_client():
    global _client
    _client = None

def process_and_store_document(document_id: int, text: str, chunk_size: int = 1000, chunk_overlap: int = 200, db_path: str = None):
    """
    Splits the document text into chunks and stores them in the vector database.
    
    Args:
        document_id: The ID of the document (from SQL database).
        text: The full text content of the document.
        chunk_size: The number of characters per chunk.
        chunk_overlap: The number of characters extraction overlap between chunks.
        db_path: Optional path to ChromaDB (for testing).
    """
    client = get_chroma_client(path=db_path if db_path else DEFAULT_CHROMA_DB_DIR)
    collection = client.get_or_create_collection(name="documents")
    
    # Simple character-based chunking
    # In a real app, use a proper text splitter (RecursiveCharacterTextSplitter from langchain is good)
    chunks = []
    metadatas = []
    ids = []
    
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk_text = text[start:end]
        
        # Adjust end to not cut words in half (simple heuristic: find last space)
        if end < len(text) and " " in chunk_text:
             last_space = chunk_text.rfind(" ")
             if last_space > 0:
                 end = start + last_space
                 chunk_text = text[start:end]
        
        chunks.append(chunk_text)
        metadatas.append({"document_id": str(document_id)})
        ids.append(f"{document_id}_{start}") # Unique ID for the chunk
        
        start += chunk_size - chunk_overlap
        
    if chunks:
        collection.add(
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Stored {len(chunks)} chunks for document {document_id}")

def query_document(document_id: int, query_text: str, n_results: int = 5, db_path: str = None) -> List[str]:
    """
    Retrieves the most relevant chunks for a given query restricted to a specific document.
    """
    client = get_chroma_client(path=db_path if db_path else DEFAULT_CHROMA_DB_DIR)
    collection = client.get_or_create_collection(name="documents")
    
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results,
        where={"document_id": str(document_id)} # Filter by document ID
    )
    
    # results['documents'] is a list of lists (one list per query)
    if results['documents']:
        return results['documents'][0]
    return []
