
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Gemini configuration
    gemini_api_key: str
    gemini_chat_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    gemini_embedding_dimension: int = 768

    # ChromaDB configuration
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    chroma_collection: str = "document_chunks_gemini_v1"

    # Internal API security
    internal_api_key: str

    # RAG configuration
    max_context_chunks: int = 8

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
