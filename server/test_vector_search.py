
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import lancedb
import subprocess
import requests
import time
from pathlib import Path

from datasets import load_dataset

# LlamaIndex core components
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Document
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.ingestion import IngestionPipeline

# Embedding and vector store
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.lancedb import LanceDBVectorStore

# LLM integrations


# Async support for notebooks
import nest_asyncio
nest_asyncio.apply()

def setup_lancedb_store(table_name="documents"):
    """
    Initialize LanceDB and create/connect to a table
    """
    print("Setting up LanceDB connection...")
    
    # Create or connect to LanceDB
    db = lancedb.connect("lancedb")
    
    # LlamaIndex will handle table creation with proper schema
    print(f"Connected to LanceDB, table: {table_name}")
    
    return db, table_name

# Setup database connection
db, table_name = setup_lancedb_store()

def perform_vector_search(db, table_name, query_text, embed_model, top_k=5):
    """
    Perform direct vector search on LanceDB
    """
    # Get query embedding
    query_embedding = embed_model.get_text_embedding(query_text)
    
    # Open table and perform search
    table = db.open_table(table_name)
    results = table.search(query_embedding).limit(top_k).to_pandas()
    
    return results

def test_vector_search():
    """
    Test vector search functionality with sample queries
    """
    print("Testing Vector Search (No LLM needed)")
    print("=" * 50)
    
    # Test queries
    queries = [
        "UI expert",
        "technology and artificial intelligence expert",
        "teacher educator professor",
        "environment climate sustainability", 
        "art culture heritage creative"
    ]
    
    for query in queries:
        print(f"\nQuery: {query}")
        print("-" * 30)
        
        # Initialize embedding model
        embed_model = HuggingFaceEmbedding(
            model_name="BAAI/bge-small-en-v1.5"
        )
    
        # Perform search
        results = perform_vector_search(db, table_name, query, embed_model, top_k=3)
        
        for idx, row in results.iterrows():
            score = row.get('_distance', 'N/A')
            text = row.get('text', 'N/A')
            
            # Format score
            if isinstance(score, (int, float)):
                score_str = f"{score:.3f}"
            else:
                score_str = str(score)
            
            print(f"\nResult {idx + 1} (Score: {score_str}):")
            print(f"{text[:200]}...")

# Run vector search test
test_vector_search()