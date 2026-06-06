from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_community.document_loaders import PyPDFDirectoryLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rag.services.config import *

# --------------------------------------------------------------------------------------------
# Create database

loader = PyPDFDirectoryLoader("./rag/data/knowledge")
documents = loader.load()
len(documents)

for doc in documents:
    doc.metadata["loaded"] = "batch-1"

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=4000,
    chunk_overlap=50
)

chunks = text_splitter.split_documents(documents)
len(chunks)

# Database
vectorstore = Chroma.from_documents(
    chunks,
    embedding=OllamaEmbeddings(model=EMBEDDING_MODEL[0]),
    persist_directory=CHROMA_DB_PATH
)

# --------------------------------------------------------------------------------------------

# Query
prompt = "¿Cómo se realiza un análisis de matriz de transición?"
response = vectorstore.similarity_search(prompt, k=5)

for i, doc in enumerate(response):
    print(f"\nContenido {i+1}: \n{doc.page_content}")
    # print(f"Metadatos: {doc.metadata}")


# --------------------------------------------------------------------------------------------
# Add more documents

# loader = PyPDFLoader("./rag/data/knowledge/1. Análisis de Cosechas Crediticias.pdf")
# pages = loader.load()
# len(pages)

# for page in pages:
#     page.metadata["batch"] = "batch-2"

# # full_text = ""
# # for page in pages:
# #     full_text += page.page_content + "\n"

# # Load existing DB
# vectorstore = Chroma(
#     persist_directory=CHROMA_DB_PATH,
#     embedding_function=OllamaEmbeddings(model=EMBEDDING_MODEL[0])
# )

# # Split
# text_splitter = RecursiveCharacterTextSplitter(
#     chunk_size=4000,
#     chunk_overlap=50
# )

# chunks = text_splitter.split_documents(pages)

# # Add to DB
# vectorstore.add_documents(chunks)


