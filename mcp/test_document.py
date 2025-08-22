#!/usr/bin/env python3
"""
Test script to demonstrate document processing functionality
"""

import asyncio
import tempfile
import os
from document_processor import DocumentProcessor

async def test_document_processing():
    """Test the document processing pipeline"""
    processor = DocumentProcessor()
    
    # Create a sample document
    sample_content = """
    This is a test document to demonstrate the document processing capabilities.
    
    The system can process various types of documents including:
    - PDF files
    - Text documents
    - Word documents
    - And many other formats
    
    Key Features:
    1. Text extraction using unstructured.io
    2. Embedding generation using sentence transformers
    3. Vector storage in pgvector database
    4. File storage in MinIO object storage
    
    The embeddings allow for semantic search across documents, enabling
    users to find relevant content even when exact keywords don't match.
    """
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(sample_content)
        temp_path = f.name
    
    try:
        # Read the file content
        with open(temp_path, 'rb') as f:
            content = f.read()
        
        print("Processing sample document...")
        result = await processor.process_document("sample_document.txt", content)
        print("Processing result:", result)
        
        if result['status'] == 'success':
            document_id = result['document_id']
            
            # Test similarity search
            print("\nTesting similarity search...")
            search_queries = [
                "text extraction",
                "vector database",
                "object storage",
                "semantic search capabilities"
            ]
            
            for query in search_queries:
                print(f"\nSearching for: '{query}'")
                search_results = await processor.search_similar_documents(query, limit=3)
                for i, result in enumerate(search_results, 1):
                    print(f"{i}. Similarity: {result['similarity_score']:.3f}")
                    print(f"   Text: {result['chunk_text'][:100]}...")
                    print(f"   File: {result['filename']}")
            
            # Get document info
            print(f"\nGetting document info for ID: {document_id}")
            doc_info = await processor.get_document_info(document_id)
            print(f"Document: {doc_info['document']['filename']}")
            print(f"Chunks: {len(doc_info['chunks'])}")
            print(f"File path in MinIO: {doc_info['document']['minio_path']}")
    
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.unlink(temp_path)

if __name__ == "__main__":
    print("Starting document processing test...")
    asyncio.run(test_document_processing())
    print("Test completed!")