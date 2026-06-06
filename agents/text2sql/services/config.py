from sqlalchemy import create_engine
from text2sql.services.utils import get_db_schema_json
import os
 
# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///text2sql/data/Chinook.db")
ENGINE = create_engine(DATABASE_URL)
SCHEMA = get_db_schema_json(ENGINE)
 
# LLM
OLLAMA_MODEL = ["qwen2.5-coder:1.5b-instruct", "qwen3:0.6b"]
GEMINI_MODEL = "gemini-2.5-flash-lite"
OPENAI_MODEL = "gpt-5.4-mini"
DEFAULT_TEMP = 0.0

# Evaluation
MAX_CRITIC_ATTEMPTS = 5

