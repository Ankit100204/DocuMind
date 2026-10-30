import base64
from fastapi import APIRouter, Depends, HTTPException
from app.api.schemas import ChatRequest, DeleteRequest, IngestRequest, SummaryRequest
from app.core.config import settings
from app.core.security import verify_internal_key
from app.ingestion.parser import chunk_pages, extract_pages
from app.retrieval.vector_store import delete_document, get_collection, search_chunks, upsert_chunks
from app.services.llm import (
    answer_question,
    embed_texts,
    embed_query,
    summarize_text,
)
router = APIRouter(prefix="/api/v1", dependencies=[Depends(verify_internal_key)])

# OpenAI embeddings are created in batches to keep request payloads small.
EMBED_BATCH_SIZE = 64

@router.post('/ingest')
def ingest(payload: IngestRequest):
    try:
        raw = base64.b64decode(payload.file_base64, validate=True)
        pages, page_count = extract_pages(raw, payload.filename, payload.mime_type)
        if not pages:
            raise ValueError(
                "No readable text found. This PDF may be scanned; OCR support will be added in the next iteration."
            )

        chunks = chunk_pages(pages)
        embeddings = []
        for start in range(0, len(chunks), EMBED_BATCH_SIZE):
            batch = chunks[start : start + EMBED_BATCH_SIZE]
            embeddings.extend(embed_texts([chunk["text"] for chunk in batch]))

        upsert_chunks(payload.owner_id, payload.document_id, chunks, embeddings)
        return {"status": "ready", "page_count": page_count, "chunk_count": len(chunks)}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post('/chat')
def chat(payload: ChatRequest):
    try:
        # Generate Gemini query embedding
        query_vector = embed_query(payload.question)

        # Retrieve relevant document chunks
        chunks = search_chunks(
            payload.owner_id,
            payload.document_ids,
            query_vector,
            settings.max_context_chunks
        )

        # Generate answer using Gemini
        answer = answer_question(
            payload.question,
            chunks,
            payload.history
        )

        # One citation per document/page combination
        citations = []

        for chunk in chunks:
            key = (chunk["document_id"], chunk["page"])

            if not any(
                (item["document_id"], item["page"]) == key
                for item in citations
            ):
                citations.append({
                    "document_id": chunk["document_id"],
                    "page": chunk["page"],
                    "snippet": chunk["text"][:260]
                })

        return {
            "answer": answer,
            "citations": citations
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
@router.post('/summarize')
def summarize(payload: SummaryRequest):
    try:
        collection = get_collection()
        result = collection.get(
            where={"$and": [{"owner_id": payload.owner_id}, {"document_id": payload.document_id}]},
            include=["documents", "metadatas"],
        )
        if not result.get("documents"):
            raise HTTPException(status_code=404, detail="Document vectors not found")

        ordered = sorted(
            zip(result["metadatas"], result["documents"]),
            key=lambda item: (item[0].get("page", 0), item[0].get("chunk_index", 0)),
        )
        text='\n\n'.join(x[1] for x in ordered)
        return {"summary": summarize_text(text)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.delete('/documents/{document_id}')
def remove_document(document_id: str, payload: DeleteRequest):
    try:
        delete_document(payload.owner_id, document_id)
        return {"message": "Vectors deleted"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
