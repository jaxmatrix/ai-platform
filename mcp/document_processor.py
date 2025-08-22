import os
import asyncio
from typing import List, Dict, Any
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from unstructured.partition.auto import partition
import psycopg2
from psycopg2.extras import RealDictCursor
from minio import Minio
from minio.error import S3Error
import hashlib
from datetime import datetime
import json

load_dotenv()

class DocumentProcessor:
    def __init__(self):
        # Initialize sentence transformer model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Database connection
        self.db_config = {
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'database': os.getenv('POSTGRES_DB', 'platform_db'),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'password': os.getenv('POSTGRES_PASSWORD', 'password'),
            'port': 5432
        }
        
        # MinIO connection
        self.minio_client = Minio(
            f"{os.getenv('MINIO_ENDPOINT', 'localhost')}:{os.getenv('MINIO_PORT', '9000')}",
            access_key=os.getenv('MINIO_ROOT_USER', 'minioadmin'),
            secret_key=os.getenv('MINIO_ROOT_PASSWORD', 'minioadmin'),
            secure=False
        )
        
        self.bucket_name = "test-bucket"
        self._ensure_bucket_exists()
        self._init_database()
    
    def _ensure_bucket_exists(self):
        """Ensure the MinIO bucket exists"""
        try:
            if not self.minio_client.bucket_exists(self.bucket_name):
                self.minio_client.make_bucket(self.bucket_name)
                print(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            print(f"Error creating bucket: {e}")
    
    def _init_database(self):
        """Initialize database tables for storing embeddings"""
        try:
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor()
            
            # Create extension if not exists
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            
            # Create documents table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    file_hash VARCHAR(64) UNIQUE NOT NULL,
                    content_type VARCHAR(100),
                    file_size INTEGER,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    minio_path VARCHAR(500),
                    metadata JSONB
                );
            """)
            
            # Create embeddings table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS document_chunks (
                    id SERIAL PRIMARY KEY,
                    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                    chunk_text TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    embedding vector(384),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Create index for vector similarity search
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
                ON document_chunks USING ivfflat (embedding vector_cosine_ops);
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            print("Database initialized successfully")
            
        except Exception as e:
            print(f"Error initializing database: {e}")
    
    def _get_file_hash(self, content: bytes) -> str:
        """Generate SHA-256 hash for file content"""
        return hashlib.sha256(content).hexdigest()
    
    def _chunk_text(self, elements: List[Any], chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split document elements into overlapping chunks"""
        text_content = []
        for element in elements:
            if hasattr(element, 'text'):
                text_content.append(element.text)
        
        full_text = " ".join(text_content)
        
        if len(full_text) <= chunk_size:
            return [full_text]
        
        chunks = []
        start = 0
        while start < len(full_text):
            end = start + chunk_size
            chunk = full_text[start:end]
            
            # Find the last complete word in the chunk
            if end < len(full_text):
                last_space = chunk.rfind(' ')
                if last_space != -1:
                    chunk = chunk[:last_space]
                    end = start + last_space
            
            chunks.append(chunk.strip())
            start = end - overlap
            
            if start >= len(full_text):
                break
        
        return [chunk for chunk in chunks if chunk.strip()]
    
    async def process_document(self, file_path: str, content: bytes) -> Dict[str, Any]:
        """Process a document: extract text, create embeddings, store in DB and MinIO"""
        try:
            # Calculate file hash
            file_hash = self._get_file_hash(content)
            filename = os.path.basename(file_path)
            
            # Check if document already exists
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id FROM documents WHERE file_hash = %s", (file_hash,))
            existing = cur.fetchone()
            
            if existing:
                cur.close()
                conn.close()
                return {
                    "status": "already_exists",
                    "document_id": existing['id'],
                    "message": "Document already processed"
                }
            
            # Save file to MinIO
            minio_path = f"documents/{datetime.now().strftime('%Y/%m/%d')}/{filename}"
            
            # Create a temporary file to upload to MinIO
            temp_file_path = f"/tmp/{filename}"
            with open(temp_file_path, 'wb') as f:
                f.write(content)
            
            try:
                self.minio_client.fput_object(
                    self.bucket_name,
                    minio_path,
                    temp_file_path,
                )
                print(f"File uploaded to MinIO: {minio_path}")
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
            
            # Process document with unstructured
            elements = partition(file=temp_file_path) if os.path.exists(temp_file_path) else partition(content)
            
            # Create chunks
            chunks = self._chunk_text(elements)
            
            # Generate embeddings
            embeddings = self.embedding_model.encode(chunks)
            
            # Store document metadata
            cur.execute("""
                INSERT INTO documents (filename, file_hash, content_type, file_size, minio_path, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                filename,
                file_hash,
                "application/octet-stream",  # You can enhance this to detect actual content type
                len(content),
                minio_path,
                json.dumps({"chunks_count": len(chunks)})
            ))
            
            document_id = cur.fetchone()['id']
            
            # Store chunks and embeddings
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                cur.execute("""
                    INSERT INTO document_chunks (document_id, chunk_text, chunk_index, embedding)
                    VALUES (%s, %s, %s, %s)
                """, (
                    document_id,
                    chunk,
                    i,
                    embedding.tolist()  # Convert numpy array to list for storage
                ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                "status": "success",
                "document_id": document_id,
                "filename": filename,
                "minio_path": minio_path,
                "chunks_processed": len(chunks),
                "message": "Document processed successfully"
            }
            
        except Exception as e:
            print(f"Error processing document: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    async def search_similar_documents(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar document chunks using vector similarity"""
        try:
            # Generate embedding for query
            query_embedding = self.embedding_model.encode([query])[0]
            
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Search for similar chunks
            cur.execute("""
                SELECT 
                    dc.chunk_text,
                    dc.chunk_index,
                    d.filename,
                    d.minio_path,
                    1 - (dc.embedding <=> %s::vector) as similarity_score
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                ORDER BY dc.embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding.tolist(), query_embedding.tolist(), limit))
            
            results = cur.fetchall()
            cur.close()
            conn.close()
            
            return [dict(result) for result in results]
            
        except Exception as e:
            print(f"Error searching documents: {e}")
            return []
    
    async def get_document_info(self, document_id: int) -> Dict[str, Any]:
        """Get document information and all its chunks"""
        try:
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get document info
            cur.execute("SELECT * FROM documents WHERE id = %s", (document_id,))
            doc = cur.fetchone()
            
            if not doc:
                return {"error": "Document not found"}
            
            # Get all chunks
            cur.execute("""
                SELECT chunk_text, chunk_index 
                FROM document_chunks 
                WHERE document_id = %s 
                ORDER BY chunk_index
            """, (document_id,))
            
            chunks = cur.fetchall()
            cur.close()
            conn.close()
            
            return {
                "document": dict(doc),
                "chunks": [dict(chunk) for chunk in chunks]
            }
            
        except Exception as e:
            print(f"Error getting document info: {e}")
            return {"error": str(e)}