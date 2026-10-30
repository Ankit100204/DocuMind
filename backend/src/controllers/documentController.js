import Document from '../models/Document.js';
import ai from '../services/aiClient.js';

export async function listDocuments(req, res, next) {
  try {
    const docs = await Document.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ documents: docs });
  } catch (e) {
    next(e);
  }
}

export async function uploadDocument(req, res, next) {
  let doc;
  try {
    if (!req.file) return res.status(400).json({ message: 'Select a PDF or DOCX file' });

    doc = await Document.create({
      owner: req.user.id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'processing',
    });

    const result = await ai.post('/api/v1/ingest', {
      document_id: String(doc._id),
      owner_id: String(req.user.id),
      filename: req.file.originalname,
      mime_type: req.file.mimetype,
      file_base64: req.file.buffer.toString('base64'),
    });

    doc.status = 'ready';
    doc.pageCount = result.data.page_count;
    doc.chunkCount = result.data.chunk_count;
    await doc.save();

    res.status(201).json({ document: doc });
  } catch (e) {
    console.error("DOCUMENT PROCESSING ERROR:", {
        message: e.message,
        status: e.response?.status,
        details: e.response?.data
    });

    if (doc) {
        doc.status = 'failed';
        doc.error =
            e.response?.data?.detail ||
            e.message;

        await doc.save().catch(console.error);
    }

    const status = e.response?.status || 500;

    return res.status(status).json({
        success: false,
        message: "Document processing failed",
        details: e.response?.data?.detail || e.message
    });
}
}

export async function deleteDocument(req, res, next) {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user.id });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    await ai
      .delete(`/api/v1/documents/${doc._id}`, { data: { owner_id: String(req.user.id) } })
      .catch((e) => console.error('Vector cleanup failed:', e.message));

    await doc.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (e) {
    next(e);
  }
}

export async function summarizeDocument(req, res, next) {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user.id, status: 'ready' });
    if (!doc) return res.status(404).json({ message: 'Ready document not found' });

    const result = await ai.post('/api/v1/summarize', {
      owner_id: String(req.user.id),
      document_id: String(doc._id),
    });

    doc.summary = result.data.summary;
    await doc.save();
    res.json({ summary: doc.summary });
  } catch (e) {
    next(e);
  }
}

