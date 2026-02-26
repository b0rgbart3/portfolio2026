import os
import uuid
from pathlib import Path
from typing import List, Dict

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import lancedb
from llama_index.core import (
    SimpleDirectoryReader,
    Settings,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding


# ==========================
# CONFIG
# ==========================

PDF_FOLDER = "documents"
LANCE_DB_PATH = "lancedb"
TABLE_NAME = "documents"

EMBED_MODEL_NAME = "BAAI/bge-small-en-v1.5"

DEFAULT_METADATA = {
    "doc_type": "project",
    "company": "Grid Dynamics",
    "role": "Senior Frontend Engineer",
    "skills": ["React", "Node.js", "AWS"],
    "time_period": "2007–present",
}


# ==========================
# SETUP LLAMAINDEX
# ==========================

Settings.embed_model = HuggingFaceEmbedding(
    model_name=EMBED_MODEL_NAME
)

splitter = SentenceSplitter(
    chunk_size=512,
    chunk_overlap=50,
)


# ==========================
# LOAD PDFS
# ==========================

def load_documents(folder_path: str):
    reader = SimpleDirectoryReader(
        input_dir=folder_path,
        required_exts=[".pdf"],
        recursive=True,
    )
    return reader.load_data()


# ==========================
# CREATE STRUCTURED CHUNKS
# ==========================

def build_chunks(documents) -> List[Dict]:
    nodes = splitter.get_nodes_from_documents(documents)

    structured_chunks = []

    for node in nodes:
        embedding = Settings.embed_model.get_text_embedding(node.text)

# future chunk meta-data to add:
#            "company": DEFAULT_METADATA["company"],
#            "role": DEFAULT_METADATA["role"],
#            "skills": DEFAULT_METADATA["skills"],
#            "time_period": DEFAULT_METADATA["time_period"],
            
        chunk = {
            "id": str(uuid.uuid4()),
            "vector": embedding,
            "doc_type": DEFAULT_METADATA["doc_type"],
            "text": node.text,
            "source_file": node.metadata.get("file_name"),
        }

        structured_chunks.append(chunk)

    return structured_chunks


# ==========================
# STORE IN LANCEDB
# ==========================

def store_in_lancedb(chunks: List[Dict]):
    db = lancedb.connect(LANCE_DB_PATH)

    if TABLE_NAME in db.table_names():
        table = db.open_table(TABLE_NAME)
    else:
        table = db.create_table(TABLE_NAME, data=chunks)

    table.add(chunks)
    print(f"Inserted {len(chunks)} chunks into LanceDB.")


# ==========================
# MAIN
# ==========================

def main():
    print("Loading PDFs...")
    documents = load_documents(PDF_FOLDER)

    print("Chunking + embedding...")
    chunks = build_chunks(documents)

    print("Storing in LanceDB...")
    store_in_lancedb(chunks)

    print("Done.")


if __name__ == "__main__":
    main()