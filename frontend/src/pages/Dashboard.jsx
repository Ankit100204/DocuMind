import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Upload, Trash2, Sparkles, Loader2, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  const loadDocuments = useCallback(async () => {
    try {
      const { data } = await api.get('/documents');
      setDocuments(data.documents);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);

    try {
      await api.post('/documents/upload', form);
      fileInput.current.value = '';
      await loadDocuments();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function summarize(doc) {
    setBusyId(doc._id);
    setError('');
    try {
      await api.post(`/documents/${doc._id}/summarize`);
      await loadDocuments();
    } catch (e) {
      setError(e.response?.data?.message || 'Summarization failed');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(doc) {
    if (!confirm(`Delete "${doc.originalName}"? This cannot be undone.`)) return;
    setBusyId(doc._id);
    setError('');
    try {
      await api.delete(`/documents/${doc._id}`);
      setDocuments((docs) => docs.filter((d) => d._id !== doc._id));
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p className="muted">Upload PDF or DOCX files, then chat with them or generate a summary.</p>
        </div>
        <Link to="/chat" className="secondary-btn">
          <MessageSquare size={16} /> Open AI Assistant
        </Link>
      </div>

      <form className="upload-box" onSubmit={handleUpload}>
        <div className="upload-icon">
          <Upload size={22} />
        </div>
        <div className="upload-text">
          <strong>Add a document</strong>
          <span className="muted">PDF or DOCX, up to 20 MB</span>
        </div>
        <input ref={fileInput} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
        <button className="primary-btn" disabled={uploading}>
          {uploading ? <Loader2 className="spin" size={16} /> : <Upload size={16} />} Upload
        </button>
      </form>

      {error && <div className="error-text banner">{error}</div>}

      {loading ? (
        <div className="empty-state">
          <Loader2 className="spin" size={22} /> Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <FileText size={26} /> No documents yet — upload your first file above.
        </div>
      ) : (
        <div className="doc-list">
          {documents.map((doc) => (
            <article key={doc._id} className="doc-card">
              <div className="doc-icon">
                <FileText size={20} />
              </div>

              <div className="doc-meta">
                <strong>{doc.originalName}</strong>
                <span className="muted">
                  {new Date(doc.createdAt).toLocaleString()} · {doc.pageCount} pages · {doc.chunkCount} chunks
                </span>
                {doc.summary && <p className="doc-summary">{doc.summary}</p>}
              </div>

              <span className={`status-tag ${doc.status}`}>
                {doc.status === 'ready' && <CheckCircle2 size={13} />}
                {doc.status === 'failed' && <AlertCircle size={13} />}
                {doc.status}
              </span>

              <div className="doc-actions">
                <button className="ghost-btn" onClick={() => summarize(doc)} disabled={busyId === doc._id || doc.status !== 'ready'}>
                  {busyId === doc._id ? <Loader2 className="spin" size={15} /> : <Sparkles size={15} />} Summarize
                </button>
                <button className="danger-btn" onClick={() => remove(doc)} disabled={busyId === doc._id}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

