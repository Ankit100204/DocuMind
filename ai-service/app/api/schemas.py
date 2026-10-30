from pydantic import BaseModel, Field


class IngestRequest(BaseModel):
    document_id: str
    owner_id: str
    filename: str
    mime_type: str
    file_base64: str


class ChatRequest(BaseModel):
    owner_id: str
    document_ids: list[str] = Field(min_length=1)
    question: str = Field(min_length=1, max_length=5000)
    history: list[dict] = []


class SummaryRequest(BaseModel):
    owner_id: str
    document_id: str


class DeleteRequest(BaseModel):
    owner_id: str

