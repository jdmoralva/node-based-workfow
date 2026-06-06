# LLM
EMBEDDING_MODEL = ["qwen3-embedding:0.6b", "nomic-embed-text"]
OLLAMA_MODEL = ["qwen2.5-coder:1.5b-instruct", "qwen3:0.6b"]
GEMINI_MODEL = "gemini-2.5-flash-lite"
OPENAI_MODEL = "gpt-5.4-mini"
DEFAULT_TEMP = 0.0

# Vector DB
CHROMA_DB_PATH = "./rag/data/chroma"

# Retriever
ENABLE_HYBRID_SEARCH = True
SIMILARITY_THRESHOLD = 0.70
MMR_DIVERSITY_LAMBDA = 0.7
SEARCH_TYPE = "mmr"
MMR_FETCH_K = 20
SEARCH_K = 10

