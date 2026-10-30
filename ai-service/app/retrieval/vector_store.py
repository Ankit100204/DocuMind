
import os
import chromadb

from app.core.config import settings

_client = None

# Keep Gemini vectors separate from the old OpenAI collection.
COLLECTION_NAME = settings.chroma_collection


def get_collection():
    """Return the shared Gemini ChromaDB collection."""
    global _client

    if _client is None:
        _client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port
        )

    return _client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )


def upsert_chunks(owner_id, document_id, chunks, embeddings):
    """Store Gemini embeddings and document metadata in ChromaDB."""

    if len(chunks) != len(embeddings):
        raise ValueError(
            "Number of chunks and embeddings must be equal"
        )

    if not chunks:
        return

    col = get_collection()

    ids = [
        f"{document_id}:{chunk['chunk_index']}"
        for chunk in chunks
    ]

    metadatas = [
        {
            "owner_id": str(owner_id),
            "document_id": str(document_id),
            "page": int(chunk["page"]),
            "chunk_index": int(chunk["chunk_index"]),
        }
        for chunk in chunks
    ]

    col.upsert(
        ids=ids,
        documents=[chunk["text"] for chunk in chunks],
        embeddings=embeddings,
        metadatas=metadatas,
    )


def search_chunks(owner_id, document_ids, embedding, limit):
    """Retrieve relevant chunks belonging to the requested owner/documents."""

    if not document_ids:
        return []

    col = get_collection()

    result = col.query(
        query_embeddings=[embedding],
        n_results=limit,
        where={
            "$and": [
                {"owner_id": str(owner_id)},
                {"document_id": {"$in": [str(x) for x in document_ids]}}
            ]
        },
        include=["documents", "metadatas", "distances"],
    )

    found = []

    if result.get("documents") and result["documents"][0]:
        for index, text in enumerate(result["documents"][0]):
            metadata = result["metadatas"][0][index]

            distance = (
                result["distances"][0][index]
                if result.get("distances")
                else None
            )

            found.append({
                "text": text,
                "document_id": metadata["document_id"],
                "page": metadata["page"],
                "chunk_index": metadata["chunk_index"],
                "distance": distance,
            })

    return found


def delete_document(owner_id, document_id):
    """Delete only the specified owner's document vectors."""

    get_collection().delete(
        where={
            "$and": [
                {"owner_id": str(owner_id)},
                {"document_id": str(document_id)}
            ]
        }
    )
