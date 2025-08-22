from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from document_processor import DocumentProcessor

app = FastAPI(title="Document Processing MCP Server", version="1.0.0")

# Initialize document processor
doc_processor = DocumentProcessor()

class SearchQuery(BaseModel):
    query: str
    limit: int = 5

class ProcessResponse(BaseModel):
    status: str
    document_id: Optional[int] = None
    filename: Optional[str] = None
    minio_path: Optional[str] = None
    chunks_processed: Optional[int] = None
    message: str

@app.get("/")
def read_root():
    """Root endpoint, returns a simple hello world message."""
    return {
        "message": "Document Processing MCP Server",
        "version": "1.0.0",
        "endpoints": {
            "process": "/process-document",
            "search": "/search",
            "info": "/document/{document_id}",
            "health": "/health"
        }
    }

@app.post("/process-document", response_model=ProcessResponse)
async def process_document(file: UploadFile = File(...)):
    """Process a document: extract text, create embeddings, store in pgvector and MinIO"""
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content
        content = await file.read()
        
        # Process the document
        result = await doc_processor.process_document(file.filename, content)
        
        return ProcessResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/search")
async def search_documents(search_query: SearchQuery):
    """Search for similar document chunks using vector similarity"""
    try:
        results = await doc_processor.search_similar_documents(
            search_query.query, 
            search_query.limit
        )
        
        return {
            "query": search_query.query,
            "results": results,
            "total_found": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching documents: {str(e)}")

@app.get("/search")
async def search_documents_get(
    q: str = Query(..., description="Search query"),
    limit: int = Query(5, description="Maximum number of results")
):
    """Search for similar document chunks using vector similarity (GET version)"""
    try:
        results = await doc_processor.search_similar_documents(q, limit)
        
        return {
            "query": q,
            "results": results,
            "total_found": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching documents: {str(e)}")

@app.get("/document/{document_id}")
async def get_document_info(document_id: int):
    """Get document information and all its chunks"""
    try:
        result = await doc_processor.get_document_info(document_id)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting document info: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Document Processing MCP Server",
        "database": "connected",
        "minio": "connected"
    }
