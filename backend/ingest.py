import os
import shutil
from langchain_community.document_loaders import PyPDFLoader, CSVLoader
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_DIR, "..", "datasets")
VECTORSTORE_DIR = os.path.join(BASE_DIR, "vectorstores")

# File Paths
DIAGNOSTIC_PDF = os.path.join(DATASETS_DIR, "DIAGNOSTIC.pdf")
MASC_CSV = os.path.join(DATASETS_DIR, "MASC.csv")

# Ensure vectorstore directory exists
os.makedirs(VECTORSTORE_DIR, exist_ok=True)

def create_vectorstore(name, documents):
    print(f"Creating vectorstore for {name}...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    # Split documents
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)
    
    print(f"Split {name} into {len(texts)} chunks.")
    
    # Create VectorStore
    vectorstore = FAISS.from_documents(texts, embeddings)
    save_path = os.path.join(VECTORSTORE_DIR, name)
    vectorstore.save_local(save_path)
    print(f"Saved {name} vectorstore to {save_path}")

def ingest_diagnostic():
    if not os.path.exists(DIAGNOSTIC_PDF):
        print(f"Error: {DIAGNOSTIC_PDF} not found")
        return
    
    print("Loading Diagnostic PDF...")
    loader = PyPDFLoader(DIAGNOSTIC_PDF)
    documents = loader.load()
    create_vectorstore("diagnostic", documents)

def ingest_masc():
    if not os.path.exists(MASC_CSV):
        print(f"Error: {MASC_CSV} not found")
        return

    print("Loading MASC CSV...")
    # Using 'utf-8' encoding for CSV
    loader = CSVLoader(MASC_CSV, encoding='utf-8')
    documents = loader.load()
    create_vectorstore("masc", documents)

if __name__ == "__main__":
    print("Starting Ingestion...")
    ingest_diagnostic()
    ingest_masc()
    print("Ingestion Complete.")
