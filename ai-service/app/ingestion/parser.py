from io import BytesIO

import fitz
from docx import Document as DocxDocument

DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def extract_pages(raw: bytes, filename: str, mime_type: str):
    """Extract text per page from a PDF or DOCX file.

    Returns a tuple (pages, page_count) where each page is {"page": n, "text": ...}.
    """
    name = filename.lower()

    if mime_type == "application/pdf" or name.endswith(".pdf"):
        return _extract_pdf_pages(raw)
    if mime_type == DOCX_MIME_TYPE or name.endswith(".docx"):
        return _extract_docx_pages(raw)

    raise ValueError("Unsupported file type. Upload PDF or DOCX.")


def _extract_pdf_pages(raw: bytes):
    pdf = fitz.open(stream=raw, filetype="pdf")
    pages = []
    for index, page in enumerate(pdf):
        text = page.get_text("text").strip()
        if text:
            pages.append({"page": index + 1, "text": text})
    return pages, len(pdf)


def _extract_docx_pages(raw: bytes):
    document = DocxDocument(BytesIO(raw))
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    text = "\n".join(paragraphs)
    # DOCX has no stable page boundaries, so the whole file is one logical page.
    return ([{"page": 1, "text": text}] if text else []), 1


def chunk_pages(pages, chunk_size=1100, overlap=180):
    """Split page text into fixed-size overlapping chunks, keeping page metadata."""
    chunks = []
    for page in pages:
        text = page["text"]
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunk = text[start:end].strip()
            if chunk:
                chunks.append({"text": chunk, "page": page["page"], "chunk_index": len(chunks)})
            if end == len(text):
                break
            start = max(0, end - overlap)
    return chunks

