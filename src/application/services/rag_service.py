"""
RAG Service - STUB VERSION (No Heavy Dependencies)
This is a lightweight stub that satisfies imports but doesn't load PyTorch/ChromaDB.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from src.utilities.logger import get_logger

logger = get_logger(__name__)


class RAGService:
    """Stub RAG service - does nothing but prevents import errors"""
    
    def __init__(self, embedding_model_name: str = "all-MiniLM-L6-v2"):
        """Initialize stub (no heavy models loaded)"""
        self.embedding_model_name = embedding_model_name
        self.initialized = False
        logger.info("RAG Service initialized in STUB mode (no embeddings)")
    
    async def initialize(self):
        """Stub initialize - does nothing"""
        if self.initialized:
            return
        logger.info("RAG Service: Skipping initialization (stub mode)")
        self.initialized = True
    
    async def query_collection(
        self,
        query: str,
        collection_name: str,
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Stub query - returns empty list"""
        logger.debug(f"RAG query (stub): '{query}' in '{collection_name}' - returning empty")
        return []
    
    async def add_documents(
        self,
        documents: List[Dict[str, Any]],
        collection_name: str,
        batch_size: int = 100
    ) -> Dict[str, Any]:
        """Stub add - does nothing"""
        return {
            "total_documents": len(documents),
            "successful": 0,
            "failed": 0,
            "errors": ["RAG is disabled (stub mode)"],
            "collection": collection_name,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_collection_stats(self, collection_name: Optional[str] = None) -> Dict[str, Any]:
        """Stub stats"""
        return {
            "total_collections": 0,
            "collections": {},
            "timestamp": datetime.now().isoformat()
        }